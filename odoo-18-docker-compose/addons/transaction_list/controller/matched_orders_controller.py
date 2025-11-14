from odoo import http, fields
from odoo.http import request
import json


class MatchedOrdersController(http.Controller):
    """Controller quản lý các cặp lệnh đã khớp"""

    @http.route('/api/transaction-list/get-matched-orders', type='json', auth='user')
    def get_matched_orders(self, limit=1000, fund_id=None, date_from=None, date_to=None, ticker=None, **kwargs):
        """Trả về danh sách cặp lệnh đã khớp từ transaction.matched.orders"""
        try:
            # Ưu tiên tham số trong body JSON nếu có
            if kwargs:
                limit = kwargs.get('limit', limit)
                fund_id = kwargs.get('fund_id', fund_id)
                date_from = kwargs.get('date_from', date_from)
                date_to = kwargs.get('date_to', date_to)
                ticker = kwargs.get('ticker', ticker)

            return self._list_matched_orders(limit=limit, fund_id=fund_id, date_from=date_from, date_to=date_to, ticker=ticker)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Không thể tải danh sách lệnh khớp thỏa thuận'
            }

    @http.route('/api/transaction-list/persist-matched-pairs', type='json', auth='user', methods=['POST'], csrf=False)
    def persist_matched_pairs(self, **kwargs):
        """Nhận danh sách cặp lệnh từ frontend và lưu vào transaction.matched.orders"""
        try:
            pairs = kwargs.get('pairs') or []
            if not isinstance(pairs, list) or not pairs:
                return {
                    'success': False,
                    'message': 'Không có cặp lệnh để lưu'
                }

            created = 0
            errors = []
            Model = request.env['transaction.matched.orders'].sudo()
            Tx = request.env['portfolio.transaction'].sudo()

            for p in pairs:
                try:
                    buy_id = int(p.get('buy_id'))
                    sell_id = int(p.get('sell_id'))
                    qty = float(p.get('matched_quantity') or p.get('matched_ccq') or 0)
                    price = float(p.get('matched_price') or 0)
                    
                    if not buy_id or not sell_id or qty <= 0 or price <= 0:
                        errors.append(f"Thiếu dữ liệu hợp lệ: {p}")
                        continue

                    buy_tx = Tx.browse(buy_id)
                    sell_tx = Tx.browse(sell_id)
                    if not buy_tx.exists() or not sell_tx.exists():
                        errors.append(f"Không tìm thấy giao dịch {buy_id}-{sell_id}")
                        continue

                    # Tạo matched order: status 'done' nếu cả 2 đã completed, ngược lại 'confirmed'
                    mo_status = 'done' if (buy_tx.status == 'completed' and sell_tx.status == 'completed') else 'confirmed'
                    # Mã cặp duy nhất
                    code = f"MO-{(buy_tx.fund_id.id if buy_tx.fund_id else 'X')}-{fields.Datetime.now().strftime('%Y%m%d%H%M%S%f')}-{buy_tx.id}-{sell_tx.id}"
                    Model.create({
                        'name': code,
                        'buy_order_id': buy_tx.id,
                        'sell_order_id': sell_tx.id,
                        'matched_quantity': qty,
                        'matched_price': price,
                        'status': mo_status
                    })
                    created += 1
                except Exception as cerr:
                    errors.append(str(cerr))
                    continue

            # Cập nhật tồn kho cho các quỹ liên quan
            self._update_inventory_for_touched_funds(pairs)

            return {
                'success': created > 0,
                'created': created,
                'failed': len(errors),
                'errors': errors
            }
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

    def _list_matched_orders(self, limit=1000, fund_id=None, date_from=None, date_to=None, ticker=None):
        """Trả về danh sách cặp lệnh khớp từ model transaction.matched.orders"""
        try:
            Model = request.env['transaction.matched.orders'].sudo()
            domain = self._build_search_domain(fund_id, date_from, date_to, ticker)
            
            records = Model.search(domain, order='match_date desc', limit=int(limit) if limit else 1000)
            data = [self._format_matched_order_record(rec) for rec in records]

            return {
                'success': True,
                'data': data,
                'total': len(data)
            }
        except Exception as e:
            return {
                'success': False,
                'message': str(e),
                'data': []
            }

    def _build_search_domain(self, fund_id, date_from, date_to, ticker):
        """Xây dựng domain tìm kiếm"""
        domain = []
        
            # Default to today if no date filter provided
        if not date_from and not date_to:
            today = fields.Date.context_today(request.env.user)
            date_from = f"{today} 00:00:00"
            date_to = f"{today} 23:59:59"
        
        if fund_id:
            try:
                fund_id = int(fund_id)
                domain.append(('fund_id', '=', fund_id))
            except Exception:
                pass
        
        if ticker:
            domain.append(('fund_id.ticker', '=', ticker))
        
        if date_from:
            domain.append(('match_date', '>=', date_from))
        
        if date_to:
            domain.append(('match_date', '<=', date_to))

        return domain

    def _format_matched_order_record(self, rec):
        """Định dạng bản ghi matched order"""
        buy_tx = rec.buy_order_id
        sell_tx = rec.sell_order_id

        return {
            'id': rec.id,
            'reference': rec.name,
            'fund_id': rec.fund_id.id if rec.fund_id else (buy_tx.fund_id.id if buy_tx and buy_tx.fund_id else False),
            'fund_name': rec.fund_id.name if rec.fund_id else (buy_tx.fund_id.name if buy_tx and buy_tx.fund_id else ''),
            'buy_investor': self._get_investor_name(buy_tx) if buy_tx else 'N/A',
            'sell_investor': self._get_investor_name(sell_tx) if sell_tx else 'N/A',
            'buy_units': getattr(rec, 'buy_units', 0) or (buy_tx.units if buy_tx else 0),
            'sell_units': getattr(rec, 'sell_units', 0) or (sell_tx.units if sell_tx else 0),
            # Ưu tiên giá đặt trong transaction (price), fallback current_nav và các trường trong rec
            'buy_price': (buy_tx.price if buy_tx and getattr(buy_tx, 'price', 0) else None) or getattr(rec, 'buy_price', 0) or (buy_tx.current_nav if buy_tx else 0),
            'sell_price': (sell_tx.price if sell_tx and getattr(sell_tx, 'price', 0) else None) or getattr(rec, 'sell_price', 0) or (sell_tx.current_nav if sell_tx else 0),
            'matched_quantity': rec.matched_quantity,
            'matched_ccq': rec.matched_quantity,
            'matched_price': rec.matched_price,
            'total_value': rec.total_value,
            'match_date': rec.match_date.strftime('%Y-%m-%d %H:%M:%S') if rec.match_date else '',
            'status': rec.status,
            'buy_user_type': rec.buy_user_type,
            'sell_user_type': rec.sell_user_type,
            'fund_ticker': rec.fund_id.ticker if rec.fund_id and hasattr(rec.fund_id, 'ticker') else '',
            # IDs để gửi lên sàn
            'buy_id': buy_tx.id if buy_tx else None,
            'sell_id': sell_tx.id if sell_tx else None,
            # Remaining
            'buy_remaining_units': getattr(buy_tx, 'remaining_units', 0) if buy_tx else 0,
            'sell_remaining_units': getattr(sell_tx, 'remaining_units', 0) if sell_tx else 0,
            # Sources
            'buy_source': getattr(buy_tx, 'source', '') if buy_tx else '',
            'sell_source': getattr(sell_tx, 'source', '') if sell_tx else '',
            # Times from computed fields (if any)
            'buy_in_time': rec.buy_in_time.strftime('%Y-%m-%d %H:%M:%S') if getattr(rec, 'buy_in_time', False) else (buy_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if buy_tx and buy_tx.create_date else ''),
            'sell_in_time': rec.sell_in_time.strftime('%Y-%m-%d %H:%M:%S') if getattr(rec, 'sell_in_time', False) else (sell_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if sell_tx and sell_tx.create_date else ''),
            'buy_out_time': rec.buy_out_time.strftime('%Y-%m-%d %H:%M:%S') if getattr(rec, 'buy_out_time', False) else '',
            'sell_out_time': rec.sell_out_time.strftime('%Y-%m-%d %H:%M:%S') if getattr(rec, 'sell_out_time', False) else '',
            # Trạng thái gửi lên sàn
            'sent_to_exchange': getattr(rec, 'sent_to_exchange', False),
            'sent_to_exchange_at': rec.sent_to_exchange_at.strftime('%Y-%m-%d %H:%M:%S') if getattr(rec, 'sent_to_exchange_at', False) else '',
            # Fallback: kiểm tra từ buy/sell order
            'buy_sent_to_exchange': getattr(buy_tx, 'sent_to_exchange', False) if buy_tx else False,
            'sell_sent_to_exchange': getattr(sell_tx, 'sent_to_exchange', False) if sell_tx else False,
        }

    def _get_investor_name(self, tx):
        """Lấy tên nhà đầu tư từ transaction"""
        try:
            if hasattr(tx, 'investor_name') and tx.investor_name:
                return tx.investor_name
            
            # Kiểm tra nếu là Market Maker transaction
            if hasattr(tx, 'source') and tx.source == 'market_maker':
                return 'Market Maker'
            
            # Kiểm tra nếu user là internal user (Market Maker)
            if tx.user_id and tx.user_id.has_group('base.group_system'):
                return 'Market Maker'
            
            # Kiểm tra nếu user là internal user (Market Maker) - kiểm tra thêm
            if tx.user_id and tx.user_id.has_group('base.group_user'):
                return 'Market Maker'
            
            # Lấy tên từ partner hoặc user
            if tx.user_id and tx.user_id.partner_id:
                partner_name = tx.user_id.partner_id.name
                if partner_name and partner_name != 'N/A' and partner_name.strip():
                    return partner_name
            
            if tx.user_id:
                user_name = tx.user_id.name
                if user_name and user_name != 'N/A' and user_name.strip():
                    return user_name
                    
            # Fallback: sử dụng reference hoặc ID
            if hasattr(tx, 'reference') and tx.reference:
                return f"User #{tx.id}"
                
        except Exception as e:
            pass
        return f"User #{tx.id if hasattr(tx, 'id') else 'N/A'}"

    def _update_inventory_for_touched_funds(self, pairs):
        """Cập nhật tồn kho cho các quỹ liên quan"""
        try:
            touched_funds = set()
            Tx = request.env['portfolio.transaction'].sudo()
            
            for p in pairs:
                try:
                    b = int(p.get('buy_id')) if p.get('buy_id') else None
                    s = int(p.get('sell_id')) if p.get('sell_id') else None
                    if b:
                        txb = Tx.browse(b)
                        if txb and txb.exists() and txb.fund_id:
                            touched_funds.add(txb.fund_id.id)
                    if s:
                        txs = Tx.browse(s)
                        if txs and txs.exists() and txs.fund_id:
                            touched_funds.add(txs.fund_id.id)
                except Exception:
                    continue
            
            Inventory = request.env['nav.daily.inventory']
            today = fields.Date.context_today(request.env.user)
            for fid in touched_funds:
                inv = Inventory.search([('fund_id', '=', fid), ('inventory_date', '=', today)], limit=1)
                if not inv:
                    inv = Inventory.create_daily_inventory_for_fund(fid, today)
                inv.action_calculate_daily_inventory()
        except Exception:
            # Không chặn quy trình lưu nếu cập nhật tồn kho gặp lỗi
            pass

    # ==== API phục vụ tab Market Maker trong nav_transaction_widget ====
    @http.route('/api/transaction-list/matched-pairs', type='http', auth='user', methods=['POST'], csrf=False)
    def get_matched_pairs_http(self, **kwargs):
        """Trả về danh sách cặp lệnh đã khớp (hỗ trợ lọc theo source_type)."""
        try:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
            except Exception:
                payload = {}
            limit = int(payload.get('limit') or 500)
            fund_id = payload.get('fund_id')
            date_from = payload.get('date_from')
            date_to = payload.get('date_to')
            source_type = (payload.get('source_type') or '').strip().lower()

            Model = request.env['transaction.matched.orders'].sudo()
            domain = [('status', 'in', ['confirmed', 'done'])]
            if fund_id:
                try:
                    domain.append(('fund_id', '=', int(fund_id)))
                except Exception:
                    pass
            if date_from:
                domain.append(('match_date', '>=', date_from))
            if date_to:
                domain.append(('match_date', '<=', date_to))
            # source_type = 'market_maker' => ít nhất một bên là market maker
            if source_type == 'market_maker':
                domain += ['|', ('buy_user_type', '=', 'market_maker'), ('sell_user_type', '=', 'market_maker')]

            recs = Model.search(domain, order='match_date desc', limit=limit)
            data = [self._format_matched_order_record(r) for r in recs]

            return request.make_response(
                json.dumps({
                    'success': True,
                    'matched_pairs': data,
                    'total': len(data)
                }, ensure_ascii=False),
                headers=[('Content-Type', 'application/json')]
            )
        except Exception as e:
            return request.make_response(
                json.dumps({'success': False, 'message': str(e), 'matched_pairs': [], 'total': 0}, ensure_ascii=False),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    # Alias JSON-RPC để tương thích các nơi gọi cũ: /api/transaction-list/get-matched-pairs
    @http.route('/api/transaction-list/get-matched-pairs', type='json', auth='user', methods=['POST'], csrf=False)
    def get_matched_pairs_json(self, limit=500, fund_id=None, date_from=None, date_to=None, source_type=None, **kwargs):
        """Alias JSON trả về cùng dữ liệu như endpoint HTTP ở trên, tránh 404 từ frontend cũ."""
        try:
            # Ưu tiên tham số trong body JSON-RPC
            params = None
            try:
                params = request.jsonrequest.get('params') if request.jsonrequest else None
            except Exception:
                params = None
            if params:
                limit = int(params.get('limit') or limit or 500)
                fund_id = params.get('fund_id', fund_id)
                date_from = params.get('date_from', date_from)
                date_to = params.get('date_to', date_to)
                source_type = (params.get('source_type') or source_type or '').strip().lower()
            else:
                # fallback với kwargs
                limit = int(kwargs.get('limit') or limit or 500)
                fund_id = kwargs.get('fund_id', fund_id)
                date_from = kwargs.get('date_from', date_from)
                date_to = kwargs.get('date_to', date_to)
                source_type = (kwargs.get('source_type') or source_type or '').strip().lower()

            Model = request.env['transaction.matched.orders'].sudo()
            domain = [('status', 'in', ['confirmed', 'done'])]
            if fund_id:
                try:
                    domain.append(('fund_id', '=', int(fund_id)))
                except Exception:
                    pass
            if date_from:
                domain.append(('match_date', '>=', date_from))
            if date_to:
                domain.append(('match_date', '<=', date_to))
            if source_type == 'market_maker':
                domain += ['|', ('buy_user_type', '=', 'market_maker'), ('sell_user_type', '=', 'market_maker')]

            recs = Model.search(domain, order='match_date desc', limit=int(limit) if limit else 500)
            data = [self._format_matched_order_record(r) for r in recs]
            return {
                'success': True,
                'matched_pairs': data,
                'total': len(data)
            }
        except Exception as e:
            return {'success': False, 'message': str(e), 'matched_pairs': [], 'total': 0}

    @http.route('/api/transaction-list/market-maker/handle-one', type='http', auth='user', methods=['POST'], csrf=False)
    def market_maker_handle_one(self, **kwargs):
        """Xử lý 1 giao dịch cho Nhà tạo lập:
        - Nếu giao dịch là SELL (investor bán): NTL mua lại ở giá của investor (tx.price)
        - Nếu giao dịch là PURCHASE/BUY (investor mua): NTL bán lại ở giá (opening_avg_price + capital_cost_amount)
        - Tạo lệnh đối ứng (portfolio.transaction) gắn user hiện tại (internal user) và ghi nhận matched pair.
        - Không cần kiểm tra lãi, xử lý tất cả giao dịch hợp lệ.
        """
        try:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
            except Exception:
                payload = {}
            tx_id = payload.get('transaction_id') or kwargs.get('transaction_id')
            if not tx_id:
                return request.make_response(json.dumps({'success': False, 'message': 'Thiếu transaction_id'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])

            Tx = request.env['portfolio.transaction'].sudo()
            tx = Tx.browse(int(tx_id))
            if not tx.exists():
                return request.make_response(json.dumps({'success': False, 'message': 'Không tìm thấy giao dịch'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])

            # Guard: chỉ xử lý khi còn remaining > 0
            units = float(getattr(tx, 'units', 0.0) or 0.0)
            matched = float(getattr(tx, 'matched_units', 0.0) or 0.0)
            remaining = float(getattr(tx, 'remaining_units', units - matched) or (units - matched))
            if remaining <= 0:
                return request.make_response(json.dumps({'success': False, 'message': 'Giao dịch đã khớp hết.'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])

            # Tính giá NTL tham chiếu: opening_avg_price hôm nay + capital cost từ fund.certificate
            mm_ref = self._get_mm_reference_price(tx.fund_id.id if tx.fund_id else None)
            if not mm_ref.get('success'):
                return request.make_response(json.dumps({'success': False, 'message': mm_ref.get('message') or 'Không lấy được giá tham chiếu NTL'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])
            opening_price = float(mm_ref.get('opening_avg_price') or 0.0)
            opening_with_cap = float(mm_ref.get('opening_price_with_capital_cost') or opening_price)

            tx_price = float(getattr(tx, 'price', 0.0) or (getattr(tx, 'current_nav', 0.0) or 0.0))
            side = (tx.transaction_type or '').lower().strip()

            created_tx = None
            matched_price = None
            # Bỏ kiểm tra lãi - xử lý tất cả giao dịch hợp lệ

            if side == 'sell':
                # NTL mua ở giá investor đang bán
                created_tx = self._create_mm_counter_tx(tx, 'purchase', remaining, tx_price)
                matched_price = tx_price  # theo quy tắc matched lấy giá bên sell (investor)
            elif side in ('buy', 'purchase'):
                # NTL bán ở giá opening_with_cap
                created_tx = self._create_mm_counter_tx(tx, 'sell', remaining, opening_with_cap)
                matched_price = opening_with_cap  # matched price là giá bên sell (NTL)
            else:
                return request.make_response(json.dumps({'success': False, 'message': 'Loại giao dịch không hỗ trợ'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])

            if not created_tx:
                return request.make_response(json.dumps({'success': False, 'message': 'Không thể tạo lệnh đối ứng'}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])

            # Ghi nhận matched pair và cập nhật matched_units/status cho cả hai (đặt đúng vai trò BUY/SELL)
            if side == 'sell':
                # Investor SELL ↔ NTL BUY
                pair = self._persist_pair_and_update(created_tx, tx, remaining, matched_price)
            else:
                # Investor BUY ↔ NTL SELL
                pair = self._persist_pair_and_update(tx, created_tx, remaining, matched_price)

            handled = {'buys': [tx.id]} if side in ('buy', 'purchase') else {'sells': [tx.id]}
            return request.make_response(json.dumps({'success': True, 'handled': handled, 'matched_pairs': [pair] if pair else []}, ensure_ascii=False), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'success': False, 'message': str(e)}, ensure_ascii=False), headers=[('Content-Type', 'application/json')], status=500)

    @http.route('/api/transaction-list/market-maker/handle-remaining', type='http', auth='user', methods=['POST'], csrf=False)
    def market_maker_handle_remaining(self, **kwargs):
        """Xử lý hàng loạt cho Nhà tạo lập:
        - Với remaining_sells: xem như investor bán → NTL mua ở tx.price
        - Với remaining_buys: investor mua → NTL bán ở opening_with_cap
        - Tạo lệnh đối ứng, matched pair, cập nhật matched_units/status.
        - Không cần kiểm tra lãi, xử lý tất cả giao dịch hợp lệ.
        """
        try:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
            except Exception:
                payload = {}
            remaining_buys = payload.get('remaining_buys') or []
            remaining_sells = payload.get('remaining_sells') or []

            # Chuẩn hóa kiểu dữ liệu về int, bỏ phần tử không hợp lệ
            def _to_int_list(arr):
                out = []
                for x in (arr or []):
                    try:
                        out.append(int(x))
                    except Exception:
                        continue
                return out

            remaining_buys = _to_int_list(remaining_buys)
            remaining_sells = _to_int_list(remaining_sells)

            Tx = request.env['portfolio.transaction'].sudo()
            user = request.env.user
            matched_pairs = []
            handled_buys = []
            handled_sells = []

            # Gom theo fund để lấy opening price 1 lần
            fund_to_ref = {}

            def get_mm_ref(fund_id):
                if not fund_id:
                    return {'success': False, 'message': 'Thiếu fund_id'}
                if fund_id not in fund_to_ref:
                    fund_to_ref[fund_id] = self._get_mm_reference_price(fund_id)
                return fund_to_ref[fund_id]

            # Xử lý SELL (investor bán) → NTL mua
            for sid in remaining_sells:
                try:
                    tx = Tx.browse(int(sid))
                    if not tx or not tx.exists():
                        continue
                    # Kiểm tra remaining
                    units = float(getattr(tx, 'units', 0.0) or 0.0)
                    matched = float(getattr(tx, 'matched_units', 0.0) or 0.0)
                    remaining = float(getattr(tx, 'remaining_units', units - matched) or (units - matched))
                    if remaining <= 0 or (tx.transaction_type or '').lower() != 'sell':
                        continue
                    ref = get_mm_ref(tx.fund_id.id if tx.fund_id else None)
                    if not ref.get('success'):
                        continue
                    opening_with_cap = float(ref.get('opening_price_with_capital_cost') or ref.get('opening_avg_price') or 0.0)
                    tx_price = float(getattr(tx, 'price', 0.0) or (tx.current_nav or 0.0))
                    # Bỏ kiểm tra lãi - xử lý tất cả giao dịch hợp lệ
                    counter = self._create_mm_counter_tx(tx, 'purchase', remaining, tx_price)
                    # Investor SELL ↔ NTL BUY: buy_tx là counter (NTL), sell_tx là investor tx
                    pair = self._persist_pair_and_update(counter, tx, remaining, tx_price)
                    if pair:
                        matched_pairs.append(pair)
                        handled_sells.append(tx.id)
                except Exception:
                    continue

            # Xử lý BUY (investor mua) → NTL bán
            for bid in remaining_buys:
                try:
                    tx = Tx.browse(int(bid))
                    if not tx or not tx.exists():
                        continue
                    units = float(getattr(tx, 'units', 0.0) or 0.0)
                    matched = float(getattr(tx, 'matched_units', 0.0) or 0.0)
                    remaining = float(getattr(tx, 'remaining_units', units - matched) or (units - matched))
                    if remaining <= 0 or (tx.transaction_type or '').lower() not in ('buy', 'purchase'):
                        continue
                    ref = get_mm_ref(tx.fund_id.id if tx.fund_id else None)
                    if not ref.get('success'):
                        continue
                    opening_with_cap = float(ref.get('opening_price_with_capital_cost') or ref.get('opening_avg_price') or 0.0)
                    tx_price = float(getattr(tx, 'price', 0.0) or (tx.current_nav or 0.0))
                    # Bỏ kiểm tra lãi - xử lý tất cả giao dịch hợp lệ
                    counter = self._create_mm_counter_tx(tx, 'sell', remaining, opening_with_cap)
                    # Investor BUY ↔ NTL SELL: buy_tx là investor tx, sell_tx là counter
                    pair = self._persist_pair_and_update(tx, counter, remaining, opening_with_cap)
                    if pair:
                        matched_pairs.append(pair)
                        handled_buys.append(tx.id)
                except Exception:
                    continue

            response = {
                'success': True,
                'handled': {
                    'buys': handled_buys,
                    'sells': handled_sells,
                },
                'matched_pairs': matched_pairs,
                'message': 'Đã xử lý Nhà tạo lập (xử lý tất cả giao dịch hợp lệ)'
            }
            return request.make_response(json.dumps(response, ensure_ascii=False), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'success': False, 'message': str(e)}, ensure_ascii=False), headers=[('Content-Type', 'application/json')], status=500)

    # ===== Helpers =====
    def _get_mm_reference_price(self, fund_id):
        """Lấy opening_avg_price hôm nay và opening_with_capital_cost = opening + opening*capital_cost%.
        Ưu tiên đọc trực tiếp từ models để tránh round-trip HTTP.
        """
        try:
            if not fund_id:
                return {'success': False, 'message': 'Thiếu fund_id'}
            today = fields.Date.context_today(request.env.user)
            Inventory = request.env['nav.daily.inventory'].sudo()
            inv = Inventory.search([('fund_id', '=', fund_id), ('inventory_date', '=', today)], limit=1)
            if not inv:
                inv = Inventory.create_daily_inventory_for_fund(fund_id, today)
                if inv:
                    inv._auto_calculate_inventory()
            opening = float(inv.opening_avg_price or 0.0) if inv else 0.0
            fund = request.env['portfolio.fund'].sudo().browse(int(fund_id))
            cert = fund.certificate_id if fund else None
            cap_percent = float(cert.capital_cost) if cert else 0.0
            cap_amount = opening * cap_percent / 100.0
            opening_with_cap = opening + cap_amount
            return {
                'success': True,
                'opening_avg_price': opening,
                'capital_cost_percent': cap_percent,
                'capital_cost_amount': cap_amount,
                'opening_price_with_capital_cost': opening_with_cap,
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}


    def _create_mm_counter_tx(self, base_tx, tx_type, units, price):
        """Tạo lệnh đối ứng của Nhà tạo lập (user hiện tại, source='sale') theo fund/term/interest hiện có."""
        vals = {
            'user_id': request.env.user.id,
            'fund_id': base_tx.fund_id.id if base_tx.fund_id else False,
            'transaction_type': tx_type,
            'status': 'pending',  # duy trì pending để phù hợp flow cập nhật
            'units': float(units),
            'remaining_units': float(units),
            'matched_units': 0.0,
            'is_matched': False,
            'amount': float(units) * float(price),
            'price': float(price),
            'current_nav': float(price),
            'term_months': getattr(base_tx, 'term_months', 12) or 12,
            'interest_rate': float(getattr(base_tx, 'interest_rate', 0.0) or 0.0),
            'currency_id': request.env.company.currency_id.id,
            'investment_type': 'fund_certificate',
            'source': 'sale',
            'description': f'Market Maker counter order for TX #{base_tx.id}',
        }
        return request.env['portfolio.transaction'].sudo().create(vals)

    def _persist_pair_and_update(self, buy_tx, sell_tx, qty, matched_price):
        """Ghi nhận cặp matched và cập nhật matched_units/remaining/status cho 2 lệnh.
        buy_tx: record bên mua, sell_tx: record bên bán
        """
        try:
            qty_f = float(qty or 0.0)
            if qty_f <= 0:
                return None
            # Cập nhật BUY
            new_buy_matched = (buy_tx.matched_units or 0.0) + qty_f
            buy_remaining = max(0.0, (buy_tx.units or 0.0) - new_buy_matched)
            buy_vals = {
                'matched_units': new_buy_matched,
                'remaining_units': buy_remaining,
                'status': 'completed' if buy_remaining <= 0 else 'pending',
            }
            (buy_tx.sudo().write(buy_vals) if buy_remaining <= 0 else buy_tx.with_context(bypass_investment_update=True).sudo().write(buy_vals))

            # Cập nhật SELL
            new_sell_matched = (sell_tx.matched_units or 0.0) + qty_f
            sell_remaining = max(0.0, (sell_tx.units or 0.0) - new_sell_matched)
            sell_vals = {
                'matched_units': new_sell_matched,
                'remaining_units': sell_remaining,
                'status': 'completed' if sell_remaining <= 0 else 'pending',
            }
            (sell_tx.sudo().write(sell_vals) if sell_remaining <= 0 else sell_tx.with_context(bypass_investment_update=True).sudo().write(sell_vals))

            # Lưu matched order
            mo_status = 'done' if (buy_vals['status'] == 'completed' and sell_vals['status'] == 'completed') else 'confirmed'
            unique_code = f"MO-{buy_tx.fund_id.id if buy_tx.fund_id else 'X'}-{fields.Datetime.now().strftime('%Y%m%d%H%M%S%f')}-{buy_tx.id}-{sell_tx.id}"
            # Xác định loại người dùng hai phía để hỗ trợ filter Market Maker ở frontend
            def _detect_user_type(tx_rec):
                try:
                    # Lệnh NTL do chúng ta tạo có source='sale'
                    if getattr(tx_rec, 'source', '') == 'sale':
                        return 'market_maker'
                    # Fallback: nội bộ (base.group_user) xem như market_maker, còn lại investor
                    if tx_rec.user_id and tx_rec.user_id.has_group('base.group_user'):
                        return 'market_maker'
                except Exception:
                    pass
                return 'investor'

            buy_type = _detect_user_type(buy_tx)
            sell_type = _detect_user_type(sell_tx)

            mo = request.env['transaction.matched.orders'].sudo().create({
                'name': unique_code,
                'buy_order_id': buy_tx.id,
                'sell_order_id': sell_tx.id,
                'matched_quantity': qty_f,
                'matched_price': float(matched_price or 0.0),
                'fund_id': (buy_tx.fund_id.id if buy_tx.fund_id else (sell_tx.fund_id.id if sell_tx.fund_id else False)),
                'status': mo_status,
                'buy_user_type': buy_type,
                'sell_user_type': sell_type,
            })

            # Trả dữ liệu pair theo format frontend đang dùng
            return {
                'buy_id': buy_tx.id,
                'buy_nav': float(buy_tx.price or buy_tx.current_nav or 0.0),
                'buy_amount': float(buy_tx.amount or 0.0),
                'buy_units': float(buy_tx.units or 0.0),
                'buy_in_time': (buy_tx.created_at.strftime('%Y-%m-%d %H:%M:%S') if getattr(buy_tx, 'created_at', False) else (buy_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if buy_tx.create_date else '')),
                'sell_id': sell_tx.id,
                'sell_nav': float(sell_tx.price or sell_tx.current_nav or 0.0),
                'sell_amount': float(sell_tx.amount or 0.0),
                'sell_units': float(sell_tx.units or 0.0),
                'sell_in_time': (sell_tx.created_at.strftime('%Y-%m-%d %H:%M:%S') if getattr(sell_tx, 'created_at', False) else (sell_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if sell_tx.create_date else '')),
                'matched_price': float(matched_price or 0.0),
                'matched_volume': qty_f,
                'matched_ccq': qty_f,
                'match_time': fields.Datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'algorithm_used': 'Market Maker',
                'fund_name': buy_tx.fund_id.name if buy_tx.fund_id else (sell_tx.fund_id.name if sell_tx.fund_id else 'N/A'),
            }
        except Exception:
            return None