from odoo import http, fields
from odoo.http import request

class MatchedOrdersController(http.Controller):

    @http.route(['/api/transaction-list/get-matched-orders', '/api/transaction-list/get-matched-pairs'], type='json', auth='user')

    def get_matched_orders(self, limit=1000, fund_id=None, date_from=None, date_to=None, ticker=None, **kwargs):
        """Trả về danh sách cặp lệnh đã khớp từ transaction.matched.orders (không còn suy luận động).
        Hỗ trợ lọc theo fund_id, ticker, ngày (mặc định hôm nay) và giới hạn số lượng.
        """
        try:
            # Ưu tiên tham số trong body JSON nếu có
            if kwargs:
                limit = kwargs.get('limit', limit)
                fund_id = kwargs.get('fund_id', fund_id)
                date_from = kwargs.get('date_from', date_from)
                date_to = kwargs.get('date_to', date_to)
                ticker = kwargs.get('ticker', ticker)

            return self.list_matched_orders(limit=limit, fund_id=fund_id, date_from=date_from, date_to=date_to, ticker=ticker)
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

            # Chuẩn bị cache danh sách giao dịch pending_remaining có lãi theo fund để tránh gọi lặp
            profitable_ids_by_fund = {}

            def _load_profitable_tx_ids(fund_id, from_date=None, to_date=None):
                """Tính danh sách transaction id có lãi theo chặn trên/dưới hiện hành.
                Reuse logic: đọc cap từ nav.transaction model helper, dữ liệu từ portfolio qua helper.
                """
                if not fund_id:
                    return set()
                key = (int(fund_id), from_date or '', to_date or '')
                if key in profitable_ids_by_fund:
                    return profitable_ids_by_fund[key]

                # Đọc cấu hình chặn trên/dưới
                cap_cfg = request.env['nav.transaction'].sudo().get_active_cap_config()
                if not cap_cfg.get('success'):
                    profitable_ids_by_fund[key] = set()
                    return profitable_ids_by_fund[key]
                cap_upper = float(cap_cfg.get('cap_upper') or 0.0)
                cap_lower = float(cap_cfg.get('cap_lower') or 0.0)

                # Lấy danh sách lệnh pending_remaining qua helper (không tự viết lại domain)
                raw_list = request.env['nav.transaction'].sudo().get_nav_transactions_via_portfolio(
                    fund_id=fund_id,
                    from_date=from_date,
                    to_date=to_date,
                    status_filter='pending_remaining',
                )

                prof_ids = set()
                # Import mround util tại chỗ để tránh phụ thuộc ngoài phạm vi
                from ..utils import mround
                for item in raw_list:
                    try:
                        nav_value = float(item.get('nav_value') or 0)
                        rate = float(item.get('interest_rate') or 0)
                        remaining_units = float(item.get('remaining_units') or 0)
                        if remaining_units <= 0 or nav_value <= 0:
                            continue
                        # Tính theo công thức Excel như nav_management
                        # Số ngày: ưu tiên item['days'], nếu không suy ra từ kỳ hạn tháng
                        from datetime import datetime
                        term_months = float(item.get('term_months', 12))
                        days = int(item.get('days') or 0)
                        if days <= 0:
                            today = datetime.now().date()
                            maturity_date = today
                            for _ in range(int(term_months)):
                                if maturity_date.month == 12:
                                    maturity_date = maturity_date.replace(year=maturity_date.year + 1, month=1)
                                else:
                                    maturity_date = maturity_date.replace(month=maturity_date.month + 1)
                            days = max(1, (maturity_date - today).days)

                        # Giá trị lệnh
                        order_value = float(item.get('trade_price') or item.get('amount') or 0)
                        if order_value <= 0:
                            units = float(item.get('units') or 0)
                            order_value = units * nav_value

                        # Giá trị mua/bán; Giá 1; Giá 2
                        sell_value = order_value * (rate / 100.0) / 365.0 * days + order_value
                        price1 = round(sell_value / remaining_units) if remaining_units > 0 else 0.0
                        price2 = mround(price1, 50)
                        r_new = (price2 / nav_value - 1.0) * 365.0 / days * 100.0
                        delta = r_new - rate
                        # Có lãi khi cap_lower <= delta <= cap_upper
                        if delta >= cap_lower and delta <= cap_upper:
                            tx_id = int(item.get('id')) if item.get('id') is not None else None
                            if tx_id:
                                prof_ids.add(tx_id)
                    except Exception:
                        continue

                profitable_ids_by_fund[key] = prof_ids
                return prof_ids

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

                    # Chỉ cho phép khớp nếu đáp ứng điều kiện có lãi theo cấu hình hiện hành
                    # Xác định fund và khoản thời gian (mặc định theo ngày tạo/transaction_date của cặp)
                    fund_id = (buy_tx.fund_id.id or sell_tx.fund_id.id) if (buy_tx.fund_id or sell_tx.fund_id) else None
                    # Khoảng ngày: ưu tiên transaction_date của 2 lệnh
                    date_from = None
                    date_to = None
                    try:
                        # Dùng ngày giao dịch của hai lệnh nếu có, fallback hôm nay
                        dates = []
                        if getattr(buy_tx, 'transaction_date', False):
                            dates.append(str(buy_tx.transaction_date))
                        if getattr(sell_tx, 'transaction_date', False):
                            dates.append(str(sell_tx.transaction_date))
                        if dates:
                            date_from = min(dates)
                            date_to = max(dates)
                    except Exception:
                        pass
                    profitable_ids = _load_profitable_tx_ids(fund_id, date_from, date_to)
                    if (buy_id not in profitable_ids) and (sell_id not in profitable_ids):
                        errors.append(f"Cặp {buy_id}-{sell_id} không thỏa điều kiện lãi theo cấu hình hiện hành")
                        continue

                    Model.create({
                        'buy_order_id': buy_tx.id,
                        'sell_order_id': sell_tx.id,
                        'matched_quantity': qty,
                        'matched_price': price,
                        'status': 'confirmed'
                    })
                    created += 1
                except Exception as cerr:
                    errors.append(str(cerr))
                    continue

            # Sau khi lưu, tính lại tồn kho cuối ngày cho các quỹ liên quan để statcard cập nhật đúng
            try:
                touched_funds = set()
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
                # Không chặn quy trình lưu nếu cập nhật tồn kho gặp lỗi; log nhẹ nhàng
                pass

            # Sau khi lưu thành công, kiểm tra và tiếp tục khớp các lệnh còn lại
            if created > 0:
                try:
                    # Gọi method để tiếp tục khớp các lệnh còn lại
                    MatchedOrders = request.env['transaction.matched.orders']
                    continue_result = MatchedOrders.check_and_continue_matching()
                    
                    if continue_result.get('success') and continue_result.get('matched_pairs'):
                        print(f"[DEBUG] Continued matching: {len(continue_result['matched_pairs'])} additional pairs")
                        # Cập nhật số lượng created
                        created += len(continue_result['matched_pairs'])
                except Exception as e:
                    print(f"[WARNING] Error in continue matching: {str(e)}")

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

    @http.route('/api/transaction-list/matched-orders', type='json', auth='user')
    def list_matched_orders(self, limit=1000, fund_id=None, date_from=None, date_to=None, ticker=None, **kwargs):
        """Trả về danh sách cặp lệnh khớp từ model transaction.matched.orders"""
        try:
            Model = request.env['transaction.matched.orders'].sudo()
            # Build domain from filters
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
            # Optional: filter by fund ticker if provided
            if ticker:
                domain.append(('fund_id.ticker', '=', ticker))
            if date_from:
                domain.append(('match_date', '>=', date_from))
            if date_to:
                domain.append(('match_date', '<=', date_to))

            records = Model.search(domain, order='match_date desc', limit=int(limit) if limit else 1000)

            data = []
            for rec in records:
                # Lấy tên nhà đầu tư từ transaction nếu có, fallback user/partner
                def _investor_name(tx):
                    try:
                        if hasattr(tx, 'investor_name') and tx.investor_name:
                            return tx.investor_name
                        if tx.user_id and tx.user_id.partner_id:
                            return tx.user_id.partner_id.name or (tx.user_id.name or 'N/A')
                        if tx.user_id:
                            return tx.user_id.name or 'N/A'
                    except Exception:
                        pass
                    return 'N/A'

                buy_tx = rec.buy_order_id
                sell_tx = rec.sell_order_id

                data.append({
                    'id': rec.id,
                    'reference': rec.name,
                    'fund_id': rec.fund_id.id if rec.fund_id else (buy_tx.fund_id.id if buy_tx and buy_tx.fund_id else False),
                    'fund_name': rec.fund_id.name if rec.fund_id else (buy_tx.fund_id.name if buy_tx and buy_tx.fund_id else ''),
                    'buy_fund_id': buy_tx.fund_id.id if buy_tx and buy_tx.fund_id else False,
                    'buy_fund_name': buy_tx.fund_id.name if buy_tx and buy_tx.fund_id else '',
                    'sell_fund_id': sell_tx.fund_id.id if sell_tx and sell_tx.fund_id else False,
                    'sell_fund_name': sell_tx.fund_id.name if sell_tx and sell_tx.fund_id else '',
                    'buy_investor': _investor_name(buy_tx) if buy_tx else 'N/A',
                    'sell_investor': _investor_name(sell_tx) if sell_tx else 'N/A',
                    # Quantities & prices per side
                    'buy_units': getattr(rec, 'buy_units', 0) or (buy_tx.units if buy_tx else 0),
                    'sell_units': getattr(rec, 'sell_units', 0) or (sell_tx.units if sell_tx else 0),
                    'buy_price': getattr(rec, 'buy_price', 0) or (buy_tx.current_nav if buy_tx else 0),
                    'sell_price': getattr(rec, 'sell_price', 0) or (sell_tx.current_nav if sell_tx else 0),
                    'buy_remaining_units': getattr(rec, 'buy_remaining_units', 0) or (buy_tx.remaining_units if buy_tx else 0),
                    'sell_remaining_units': getattr(rec, 'sell_remaining_units', 0) or (sell_tx.remaining_units if sell_tx else 0),
                    'matched_quantity': rec.matched_quantity,
                    'matched_price': rec.matched_price,
                    'total_value': rec.total_value,
                    'match_date': rec.match_date.strftime('%Y-%m-%d %H:%M:%S') if rec.match_date else '',
                    'status': rec.status,
                    'buy_user_type': rec.buy_user_type,
                    'sell_user_type': rec.sell_user_type,
                    'fund_ticker': rec.fund_id.ticker if rec.fund_id and hasattr(rec.fund_id, 'ticker') else '',
                    'buy_fund_ticker': buy_tx.fund_id.ticker if buy_tx and buy_tx.fund_id and hasattr(buy_tx.fund_id, 'ticker') else '',
                    'sell_fund_ticker': sell_tx.fund_id.ticker if sell_tx and sell_tx.fund_id and hasattr(sell_tx.fund_id, 'ticker') else '',
                    # Optional details
                    'buy_in_time': rec.buy_in_time.strftime('%Y-%m-%d %H:%M:%S') if rec.buy_in_time else '',
                    'sell_in_time': rec.sell_in_time.strftime('%Y-%m-%d %H:%M:%S') if rec.sell_in_time else '',
                    'buy_out_time': rec.buy_out_time.strftime('%Y-%m-%d %H:%M:%S') if rec.buy_out_time else '',
                    'sell_out_time': rec.sell_out_time.strftime('%Y-%m-%d %H:%M:%S') if rec.sell_out_time else '',
                    'buy_interest_rate': rec.buy_interest_rate,
                    'sell_interest_rate': rec.sell_interest_rate,
                    'buy_term_months': rec.buy_term_months,
                    'sell_term_months': rec.sell_term_months,
                        })

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

    @http.route('/api/transaction-list/remaining-orders', type='json', auth='user')
    def get_remaining_orders(self, **kwargs):
        """API lấy thông tin các lệnh còn lại chưa khớp"""
        try:
            MatchedOrders = request.env['transaction.matched.orders']
            result = MatchedOrders.get_remaining_orders_summary()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

    @http.route('/api/transaction-list/continue-matching', type='json', auth='user', methods=['POST'])
    def continue_matching(self, **kwargs):
        """API tiếp tục khớp các lệnh còn lại"""
        try:
            MatchedOrders = request.env['transaction.matched.orders']
            result = MatchedOrders.check_and_continue_matching()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

    @http.route('/api/transaction-list/fix-remaining-units', type='json', auth='user', methods=['POST'])
    def fix_remaining_units(self, **kwargs):
        """API sửa lại tính toán remaining_units cho tất cả lệnh pending"""
        try:
            MatchedOrders = request.env['transaction.matched.orders']
            result = MatchedOrders.fix_remaining_units_calculation()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

    @http.route('/api/transaction-list/validate-data-integrity', type='json', auth='user', methods=['POST'])
    def validate_data_integrity(self, **kwargs):
        """API kiểm tra tính hợp lệ của dữ liệu lệnh"""
        try:
            MatchedOrders = request.env['transaction.matched.orders']
            result = MatchedOrders.validate_order_data_integrity()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }