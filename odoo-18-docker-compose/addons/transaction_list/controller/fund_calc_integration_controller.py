# pyright: reportMissingImports=false
from odoo import http, fields
from odoo.http import request
from ..utils import mround
import json
from datetime import datetime
from pytz import timezone, UTC


class OrderMatchingEngine:
    """Engine khớp lệnh theo chuẩn Stock Exchange - Price-Time Priority"""
    
    def __init__(self, env):
        self.env = env
    
    def match_orders(self, buy_orders, sell_orders, use_time_priority=True):
        """
        Khớp lệnh theo thuật toán Price-Time Priority (FIFO)
        
        Quy tắc:
        1. Buy orders: Giá cao nhất trước, cùng giá thì thời gian sớm nhất trước
        2. Sell orders: Giá thấp nhất trước, cùng giá thì thời gian sớm nhất trước  
        3. Khớp khi: buy_price >= sell_price
        4. Giá khớp: Luôn lấy giá của sell order
        
        Args:
            buy_orders: List các lệnh mua (portfolio.transaction records)
            sell_orders: List các lệnh bán (portfolio.transaction records)
            use_time_priority: True = Price-Time Priority (FIFO), False = Best Price Only
        
        Returns:
            dict: {
                'matched_pairs': list,
                'remaining_buys': list,
                'remaining_sells': list,
                'algorithm_used': str
            }
        """
        try:
            # Sắp xếp orders theo Price-Time Priority
            buy_book = self._build_priority_queue(buy_orders, 'buy')
            sell_book = self._build_priority_queue(sell_orders, 'sell')
            
            matched_pairs = []
            
            # Khớp lệnh theo thuật toán chuẩn
            while buy_book and sell_book:
                # Lấy lệnh tốt nhất từ mỗi bên
                best_buy = buy_book[0] if buy_book else None
                best_sell = sell_book[0] if sell_book else None
                
                if not best_buy or not best_sell:
                    break
                
                # Kiểm tra điều kiện khớp: buy_price >= sell_price
                if best_buy['price'] < best_sell['price']:
                    break
                
                # Không khớp lệnh cùng 1 nhà đầu tư hoặc khác quỹ
                if not self._can_match(best_buy, best_sell):
                    # Tiến tới lệnh tiếp theo: bỏ lệnh có thời gian muộn hơn để giữ đúng FIFO
                    try:
                        if best_buy['time_int'] <= best_sell['time_int']:
                            # Bỏ sell để thử sell tiếp theo
                            sell_book.pop(0)
                        else:
                            # Bỏ buy để thử buy tiếp theo
                            buy_book.pop(0)
                    except Exception:
                        # Fallback an toàn
                        sell_book.pop(0)
                    continue
                
                # Khớp lệnh
                matched_quantity = min(best_buy['remaining'], best_sell['remaining'])
                if matched_quantity <= 0:
                    break
                
                # Tạo cặp khớp
                pair = self._create_matched_pair(best_buy, best_sell, matched_quantity)
                matched_pairs.append(pair)
                
                # Cập nhật database
                self._update_transaction_status(best_buy, best_sell, matched_quantity)
                
                # Cập nhật remaining quantities
                best_buy['remaining'] -= matched_quantity
                best_sell['remaining'] -= matched_quantity
                
                # Loại bỏ orders đã hết
                if best_buy['remaining'] <= 0:
                    buy_book.pop(0)
                if best_sell['remaining'] <= 0:
                    sell_book.pop(0)
            
            return {
                "matched_pairs": matched_pairs,
                "remaining_buys": [item['rec'] for item in buy_book],
                "remaining_sells": [item['rec'] for item in sell_book],
                "algorithm_used": "Price-Time Priority (FIFO)"
            }
            
        except Exception as e:
            pass
            return {
                "matched_pairs": [],
                "remaining_buys": buy_orders,
                "remaining_sells": sell_orders,
                "algorithm_used": "Price-Time Priority (FIFO)"
            }
    
    def _build_priority_queue(self, orders, order_type):
        """
        Xây dựng priority queue theo Price-Time Priority
        
        Args:
            orders: List các orders
            order_type: 'buy' hoặc 'sell'
        
        Returns:
            List đã sắp xếp theo priority
        """
        book = []
        for order in orders:
            # Ưu tiên remaining_units; fallback: units - matched_units
            rem_field = getattr(order, 'remaining_units', None)
            if rem_field is not None:
                try:
                    remaining = float(rem_field or 0)
                except Exception:
                    remaining = 0.0
            else:
                try:
                    units = float(getattr(order, 'units', 0) or 0)
                    matched = float(getattr(order, 'matched_units', 0) or 0)
                    remaining = max(0.0, units - matched)
                except Exception:
                    remaining = float(getattr(order, 'units', 0) or 0)
            if remaining > 0:
                book.append({
                    'rec': order,
                    'remaining': remaining,
                    'price': self._get_order_price(order),
                    'time': self._get_order_time(order),
                    'time_int': self._time_to_int(self._get_order_time(order))
                })
        
        # Sắp xếp theo Price-Time Priority
        if order_type == 'buy':
            # Buy: Giá cao nhất trước, cùng giá thì thời gian sớm nhất trước
            book.sort(key=lambda x: (-x['price'], x['time_int']))
        else:  # sell
            # Sell: Giá thấp nhất trước, cùng giá thì thời gian sớm nhất trước
            book.sort(key=lambda x: (x['price'], x['time_int']))
        
        return book
    
    def _get_order_price(self, order):
        """Lấy giá của lệnh"""
        if hasattr(order, 'price') and order.price:
            return float(order.price)
        elif hasattr(order, 'current_nav') and order.current_nav:
            return float(order.current_nav)
        return 0.0
    
    def _get_order_time(self, order):
        """Lấy thời gian đặt lệnh"""
        time_fields = ['create_date', 'created_at', 'order_time', 'in_time']
        
        for field in time_fields:
            if hasattr(order, field):
                time_value = getattr(order, field)
                if time_value:
                    try:
                        # Ưu tiên trả về dạng ISO đầy đủ để so sánh theo thời điểm tuyệt đối
                        if hasattr(time_value, 'strftime'):
                            return time_value.strftime('%Y-%m-%d %H:%M:%S')
                        # Một số field có thể đã là string
                        return str(time_value)
                    except Exception:
                        return str(time_value)
        
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    def _time_to_int(self, time_str):
        """Chuyển thời gian sang epoch seconds để FIFO theo thời điểm tạo lệnh.
        Hỗ trợ: 'YYYY-MM-DD HH:MM:SS', 'YYYY-MM-DDTHH:MM:SS', và fallback HH:MM:SS.
        """
        try:
            s = (time_str or '').strip()
            # Thử parse full datetime
            try:
                if 'T' in s:
                    # ISO-like
                    dt = datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S')
                elif ' ' in s:
                    dt = datetime.strptime(s[:19], '%Y-%m-%d %H:%M:%S')
                else:
                    dt = None
                if dt is not None:
                    return int(dt.timestamp())
            except Exception:
                pass

            # Fallback: HH:MM:SS trong ngày
            if ':' in s:
                parts = s.split(':')
                hour = int(parts[0]) if len(parts) > 0 else 0
                minute = int(parts[1]) if len(parts) > 1 else 0
                second = int(parts[2]) if len(parts) > 2 else 0
                return hour * 3600 + minute * 60 + second
            return 0
        except Exception:
            return 0
    
    def _can_match(self, buy_item, sell_item):
        """Kiểm tra có thể khớp lệnh không"""
        buy = buy_item['rec']
        sell = sell_item['rec']
        
        # Kiểm tra cùng fund
        if (getattr(buy, 'fund_id', False) and getattr(sell, 'fund_id', False) and 
            buy.fund_id.id != sell.fund_id.id):
            return False
        
        # Kiểm tra không cùng user
        if (buy.user_id and sell.user_id and 
            buy.user_id.id == sell.user_id.id):
            return False
        
        # Kiểm tra điều kiện giá: buy_price >= sell_price
        buy_price = buy_item['price'] or 0
        sell_price = sell_item['price'] or 0
        
        return buy_price >= sell_price
    
    def _create_matched_pair(self, buy_item, sell_item, matched_quantity):
        """Tạo cặp lệnh khớp theo chuẩn Stock Exchange"""
        buy = buy_item['rec']
        sell = sell_item['rec']
        
        # Xác định loại user
        buy_user_type = self._get_user_type(buy)
        sell_user_type = self._get_user_type(sell)
        
        # Giá khớp luôn là giá của sell order (theo chuẩn Stock Exchange)
        matched_price = sell_item['price']
        
        return {
                    "buy_id": buy.id,
            "buy_nav": buy_item['price'],
                    "buy_amount": getattr(buy, 'amount', 0) or 0,
                    "buy_units": getattr(buy, 'units', 0) or 0,
            "buy_in_time": buy_item['time'],
            "buy_source": getattr(buy, 'source', 'portal'),
                    "sell_id": sell.id,
            "sell_nav": sell_item['price'],
                    "sell_amount": getattr(sell, 'amount', 0) or 0,
                    "sell_units": getattr(sell, 'units', 0) or 0,
            "sell_in_time": sell_item['time'],
            "sell_source": getattr(sell, 'source', 'portal'),
            "matched_price": matched_price,
            "matched_volume": matched_quantity,
            "matched_ccq": matched_quantity,
                    "match_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "algorithm_used": "Price-Time Priority (FIFO)",
            "_pairType": f"{buy_user_type}_{sell_user_type}",
                    "_buyUserType": buy_user_type,
                    "_sellUserType": sell_user_type,
                    "fund_name": buy.fund_id.name if buy.fund_id else 'N/A',
                    "buy_investor": buy.user_id.partner_id.name if buy.user_id and buy.user_id.partner_id else 'N/A',
                    "sell_investor": sell.user_id.partner_id.name if sell.user_id and sell.user_id.partner_id else 'N/A',
                    "interest_rate": getattr(buy, 'interest_rate', 0) or 0,
            "term_months": getattr(buy, 'term_months', 0) or 0,
        }
    
    def _get_user_type(self, transaction):
        """Xác định loại user"""
        if not transaction.user_id:
            return 'investor'
        
        if transaction.user_id.has_group('base.group_user'):
            return 'market_maker'
        
        if hasattr(transaction, 'source') and transaction.source == 'sale':
            return 'market_maker'
        
        return 'investor'
    
    def _update_transaction_status(self, buy_item, sell_item, matched_quantity):
        """Cập nhật trạng thái giao dịch trong database"""
        try:
            buy_order = self.env['portfolio.transaction'].browse(buy_item['rec'].id)
            sell_order = self.env['portfolio.transaction'].browse(sell_item['rec'].id)

            # Tính toán remaining và matched units
            buy_remaining = max(0, buy_item['remaining'] - matched_quantity)
            sell_remaining = max(0, sell_item['remaining'] - matched_quantity)

            buy_matched = (buy_order.matched_units or 0) + matched_quantity
            sell_matched = (sell_order.matched_units or 0) + matched_quantity

            # BUY update
            if buy_remaining > 0:
                buy_order.with_context(bypass_investment_update=True).sudo().write({
                    'matched_units': buy_matched,
                    'remaining_units': buy_remaining,
                    'ccq_remaining_to_match': buy_remaining,
                    'is_matched': False,
                    'status': 'pending',
                })
            else:
                vals = {
                    'matched_units': buy_matched,
                    'remaining_units': 0,
                    'ccq_remaining_to_match': 0,
                    'is_matched': True,
                    'status': 'completed',
                }
                if 'approved_by' in buy_order._fields:
                    vals['approved_by'] = request.env.user.id
                if 'approved_at' in buy_order._fields:
                    vals['approved_at'] = fields.Datetime.now()
                buy_order.sudo().write(vals)

            # SELL update
            if sell_remaining > 0:
                sell_order.with_context(bypass_investment_update=True).sudo().write({
                    'matched_units': sell_matched,
                    'remaining_units': sell_remaining,
                    'ccq_remaining_to_match': sell_remaining,
                    'is_matched': False,
                    'status': 'pending',
                })
            else:
                vals = {
                    'matched_units': sell_matched,
                    'remaining_units': 0,
                    'ccq_remaining_to_match': 0,
                    'is_matched': True,
                    'status': 'completed',
                }
                if 'approved_by' in sell_order._fields:
                    vals['approved_by'] = request.env.user.id
                if 'approved_at' in sell_order._fields:
                    vals['approved_at'] = fields.Datetime.now()
                sell_order.sudo().write(vals)
        except Exception as e:
            pass


class FundCalcIntegrationController(http.Controller):
    """Controller tích hợp với Fund Calculation Engine"""
    
    def _is_market_maker(self, transaction):
        """Kiểm tra xem transaction có phải là market maker không"""
        try:
            if not transaction.user_id:
                return False
            
            # Kiểm tra user có phải là internal user
            if transaction.user_id.has_group('base.group_user'):
                return True
            
            # Kiểm tra source có phải là 'sale' không
            if hasattr(transaction, 'source') and transaction.source == 'sale':
                return True
            
            return False
        except Exception:
            return False
    

    # ==== API KHỚP LỆNH CORE ====
    @http.route('/api/transaction-list/match-orders', type='http', auth='user', methods=['POST'], csrf=False)
    def match_transactions(self, **kwargs):
        """Khớp lệnh giao dịch sử dụng engine riêng"""
        try:
            Transaction = request.env['portfolio.transaction'].sudo()
            # Đọc tham số từ JSON body
            try:
                # Với type='http', ưu tiên đọc từ raw body để tránh case request.jsonrequest None
                raw = (request.httprequest.data or b'').decode('utf-8')
                data = json.loads(raw) if raw else {}
            except Exception:
                # Fallback sang jsonrequest nếu có
                try:
                    data = request.jsonrequest or {}
                except Exception:
                    data = {}
            
            status_mode = (data.get('status_mode') or 'pending').strip().lower()
            use_time_priority = data.get('use_time_priority', False)
            fund_id = data.get('fund_id')
            match_type = data.get('match_type', 'all')

            # Advisory lock để tránh chạy song song gây abort transaction
            locked = False
            try:
                request.env.cr.execute("SELECT pg_try_advisory_lock(hashtext(%s))", ('transaction_matching_lock',))
                res = request.env.cr.fetchone()
                locked = bool(res and res[0])
            except Exception:
                locked = True
            if not locked:
                return request.make_response(
                    json.dumps({
                        "success": True,
                        "message": "Matching đang chạy ở tiến trình khác",
                        "summary": {"total_matched": 0}
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Xây dựng domain theo chế độ trạng thái
            def _build_domains(mode):
                # Hỗ trợ 2 chế độ: pending (mặc định) và completed
                if (mode or 'pending') == 'completed':
                    buy_domain = [('transaction_type', 'in', ['buy', 'purchase']), ('status', '=', 'completed'), ('ccq_remaining_to_match', '>', 0)]
                    sell_domain = [('transaction_type', '=', 'sell'), ('status', '=', 'completed'), ('ccq_remaining_to_match', '>', 0)]
                else:  # pending
                    buy_domain = [('transaction_type', 'in', ['buy', 'purchase']), ('status', '=', 'pending')]
                    sell_domain = [('transaction_type', '=', 'sell'), ('status', '=', 'pending')]
                # Lọc theo fund nếu có
                try:
                    if fund_id:
                        fid = int(fund_id)
                        buy_domain.append(('fund_id', '=', fid))
                        sell_domain.append(('fund_id', '=', fid))
                except Exception:
                    pass
                return buy_domain, sell_domain
            
            buy_domain, sell_domain = _build_domains(status_mode)
            pending_purchases = Transaction.search(buy_domain)
            pending_sells = Transaction.search(sell_domain)
            
            # Cho phép một lệnh được khớp nhiều lần (1-n), không loại trừ các lệnh đã có bản ghi matched trước đó
            
            # Lọc theo loại khớp lệnh
            if match_type == 'investor_investor':
                pending_purchases = pending_purchases.filtered(lambda t: not self._is_market_maker(t))
                pending_sells = pending_sells.filtered(lambda t: not self._is_market_maker(t))
            elif match_type == 'market_maker_investor':
                pending_purchases = pending_purchases.filtered(lambda t: self._is_market_maker(t))
                pending_sells = pending_sells.filtered(lambda t: not self._is_market_maker(t))
            
            if not pending_purchases or not pending_sells:
                # Trả success=True để UI/worker không coi là lỗi
                return request.make_response(
                    json.dumps({
                        "success": True,
                        "message": f"Không có lệnh mua/bán phù hợp để khớp (loại: {match_type})",
                        "matched_pairs": [],
                        "remaining": {"buys": [b.id for b in (pending_purchases or [])], "sells": [s.id for s in (pending_sells or [])]},
                        "summary": {"total_matched": 0, "total_buy_orders": len(pending_purchases), "total_sell_orders": len(pending_sells)}
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            matching_engine = OrderMatchingEngine(request.env)
            # Nhóm theo fund để tăng tỷ lệ khớp (tránh loại do khác quỹ)
            def _group_by_fund(recs):
                groups = {}
                for r in recs:
                    fid = r.fund_id.id if r.fund_id else 0
                    groups.setdefault(fid, []).append(r)
                return groups

            buy_groups = _group_by_fund(pending_purchases)
            sell_groups = _group_by_fund(pending_sells)

            matched_pairs = []
            remaining_buys = []
            remaining_sells = []
            algorithm_used = 'Best Price First'  # Default algorithm

            for fid, buys in buy_groups.items():
                sells = sell_groups.get(fid, [])
                if not buys or not sells:
                    # Gom các lệnh còn lại vào remaining
                    remaining_buys.extend(buys or [])
                    remaining_sells.extend(sells or [])
                    continue
                result = matching_engine.match_orders(buys, sells, use_time_priority)
                matched_pairs.extend(result.get('matched_pairs', []))
                remaining_buys.extend(result.get('remaining_buys', []))
                remaining_sells.extend(result.get('remaining_sells', []))
                # Lưu algorithm từ result cuối cùng
                algorithm_used = result.get('algorithm_used', algorithm_used)

            # Lưu cặp lệnh an toàn với savepoint (engine đã cập nhật matched/remaining/status)
            for pair in matched_pairs:
                try:
                    buy_id = pair.get('buy_id')
                    sell_id = pair.get('sell_id')
                    if not buy_id or not sell_id:
                        continue
                    with request.env.cr.savepoint():
                        buy_tx = Transaction.browse(int(buy_id))
                        sell_tx = Transaction.browse(int(sell_id))
                        if not buy_tx.exists() or not sell_tx.exists():
                            continue
                        # Không ghi nhận cặp nếu cùng 1 nhà đầu tư
                        try:
                            if buy_tx.user_id and sell_tx.user_id and buy_tx.user_id.id == sell_tx.user_id.id:
                                continue
                        except Exception:
                            pass
                        # Tạo matched order record (engine đã cập nhật quantities/status)
                        matched_units = pair.get('matched_ccq') or pair.get('matched_volume')
                        if not matched_units:
                            # Fallback: dùng chênh lệch trước/sau nếu cần, hoặc tối thiểu còn lại
                            matched_units = min(
                                max(0.0, (buy_tx.units or 0.0) - (buy_tx.remaining_units or 0.0)),
                                max(0.0, (sell_tx.units or 0.0) - (sell_tx.remaining_units or 0.0))
                            ) or 0.0
                        matched_price = pair.get('matched_price')
                        if matched_price is None:
                            matched_price = sell_tx.current_nav or (sell_tx.fund_id.current_nav if sell_tx.fund_id else 0)

                        # Trạng thái matched order: done nếu cả 2 đã completed, ngược lại confirmed
                        mo_status = 'done' if (getattr(buy_tx, 'status', '') == 'completed' and getattr(sell_tx, 'status', '') == 'completed') else 'confirmed'
                        # Tạo mã duy nhất cho cặp (để dễ theo dõi)
                        unique_code = f"MO-{buy_tx.fund_id.id if buy_tx.fund_id else 'X'}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}-{buy_tx.id}-{sell_tx.id}"
                        request.env['transaction.matched.orders'].sudo().create({
                            'name': unique_code,
                            'buy_order_id': buy_tx.id,
                            'sell_order_id': sell_tx.id,
                            'matched_quantity': matched_units,
                            'matched_price': matched_price,
                            'fund_id': (buy_tx.fund_id.id if buy_tx.fund_id else (sell_tx.fund_id.id if sell_tx.fund_id else False)),
                            'status': mo_status,
                        })
                except Exception as perr:
                    pass
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": f"Đã khớp {len(matched_pairs)} cặp lệnh",
                    "algorithm_used": algorithm_used,
                    "match_type": match_type,
                    "matched_pairs": matched_pairs,
                    "remaining": {
                        "buys": [{"id": b.id, "nav": b.current_nav or (b.fund_id.current_nav if b.fund_id else 0), "amount": b.amount or 0, "units": b.units or 0, "in_time": b.create_date.strftime('%Y-%m-%d %H:%M:%S') if b.create_date else None} for b in remaining_buys],
                        "sells": [{"id": s.id, "nav": s.current_nav or (s.fund_id.current_nav if s.fund_id else 0), "amount": s.amount or 0, "units": s.units or 0, "in_time": s.create_date.strftime('%Y-%m-%d %H:%M:%S') if s.create_date else None} for s in remaining_sells]
                    },
                    "summary": {
                        "total_matched": len(matched_pairs),
                        "total_buy_orders": len(pending_purchases),
                        "total_sell_orders": len(pending_sells),
                        "remaining_buys": len(remaining_buys),
                        "remaining_sells": len(remaining_sells),
                        "matching_rate": len(matched_pairs) / max(len(pending_purchases), len(pending_sells)) * 100 if max(len(pending_purchases), len(pending_sells)) > 0 else 0
                    }
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
        except Exception as e:
            pass
            return request.make_response(
                json.dumps({
                    "success": False,
                    "message": f"Lỗi khi khớp lệnh: {str(e)}",
                    "matched_pairs": [],
                    "remaining": {"buys": [], "sells": []},
                    "summary": {"total_matched": 0, "total_buy_orders": 0, "total_sell_orders": 0, "remaining_buys": 0, "remaining_sells": 0, "matching_rate": 0}
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )
        finally:
            # Giải phóng advisory lock nếu đã khóa thành công
            try:
                if 'locked' in locals() and locked:
                    request.env.cr.execute("SELECT pg_advisory_unlock(hashtext(%s))", ('transaction_matching_lock',))
            except Exception:
                pass

    @http.route('/api/transaction-list/create-random', type='http', auth='user', methods=['POST'], csrf=False)
    def create_random_transactions(self, **kwargs):
        """Tạo 5 lệnh mua và 5 lệnh bán random để test khớp lệnh"""
        try:
            # Lấy dữ liệu từ request
            data = json.loads(request.httprequest.data) if request.httprequest.data else {}
            
            # Lấy danh sách funds
            funds = request.env['portfolio.fund'].sudo().search([], limit=5)
            if not funds:
                return request.make_response(
                    json.dumps({"success": False, "message": "Không tìm thấy quỹ nào"}),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )
            
            # Lấy danh sách portal users (không phải internal users)
            portal_users = request.env['res.users'].sudo().search([
                ('active', '=', True),
                ('groups_id', 'in', request.env.ref('base.group_portal').id)
            ], limit=10)
            
            if not portal_users:
                return request.make_response(
                    json.dumps({"success": False, "message": "Không tìm thấy portal user nào"}),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            # Tạo 5 cặp BUY/SELL cùng quỹ và khác user để đảm bảo có thể khớp
            created_transactions = []
            with request.env.cr.savepoint():
                import random
                
                # Lấy giá tồn kho đầu ngày làm base price
                base_price = 0.0
                try:
                    today = fields.Date.today()
                    Inventory = request.env['nav.daily.inventory'].sudo()
                    # Lấy giá từ quỹ đầu tiên làm base
                    fund = funds[0]
                    inv = Inventory.search([('fund_id', '=', fund.id), ('inventory_date', '=', today)], limit=1)
                    if not inv:
                        inv = Inventory.create_daily_inventory_for_fund(fund.id, today)
                        if inv:
                            inv._auto_calculate_inventory()
                    if inv and inv.opening_avg_price:
                        base_price = float(inv.opening_avg_price)
                    elif fund.certificate_id and fund.certificate_id.initial_certificate_price:
                        base_price = float(fund.certificate_id.initial_certificate_price)
                except Exception:
                    base_price = float(fund.current_nav or 10000)

                # Thời gian theo múi giờ Việt Nam
                try:
                    vn_tz = timezone('Asia/Ho_Chi_Minh')
                except Exception:
                    vn_tz = timezone('UTC')
                now_vn = datetime.now(vn_tz)
                now_utc_naive = now_vn.astimezone(UTC).replace(tzinfo=None)

                # Lấy kỳ hạn/lãi suất thực tế
                term_months = 12
                interest_rate = 0.0
                try:
                    TermRate = request.env['nav.term.rate'].sudo()
                    current_rates = TermRate.get_all_current_rates()
                    if current_rates:
                        chosen = random.choice(current_rates)
                        term_months = int(getattr(chosen, 'term_months', 12) or 12)
                        interest_rate = float(getattr(chosen, 'interest_rate', 0.0) or 0.0)
                except Exception:
                    term_months = 12
                    interest_rate = 0.0

                # Chọn tối đa 5 quỹ để tạo cặp; nếu quỹ < 5 thì sẽ lặp lại ngẫu nhiên
                chosen_funds = []
                if len(funds) >= 5:
                    # Chọn 5 quỹ bất kỳ không trùng
                    idxs = list(range(len(funds)))
                    random.shuffle(idxs)
                    chosen_funds = [funds[i] for i in idxs[:5]]
                else:
                    # Lặp lại quỹ để đủ 5 cặp
                    for i in range(5):
                        chosen_funds.append(funds[i % len(funds)])

                for i in range(5):
                    fund = chosen_funds[i]
                    # Chọn 2 user portal khác nhau cho BUY và SELL
                    if len(portal_users) >= 2:
                        u_idxs = list(range(len(portal_users)))
                        random.shuffle(u_idxs)
                        buy_user = portal_users[u_idxs[0]]
                        sell_user = portal_users[u_idxs[1]]
                    else:
                        # Fallback: nếu chỉ có 1 user, tạo khác reference để vẫn khác record; engine sẽ không khớp cùng user
                        buy_user = portal_users[0]
                        sell_user = portal_users[0]

                    # Giá BUY: đúng NAV hiện tại
                    try:
                        buy_price = float(fund.current_nav or 0.0)
                        if buy_price <= 0:
                            buy_price = float(base_price or 10000.0)
                    except Exception:
                        buy_price = float(base_price or 10000.0)

                    # Giá SELL: thấp hơn BUY trong khoảng 0%..10%
                    sell_price_delta = random.uniform(0.0, 0.10)
                    sell_price = max(1.0, round(buy_price * (1.0 - sell_price_delta)))

                    # Units BUY (bội số 50)
                    k_buy = random.randint(1, 10)
                    buy_units = float(k_buy * 50)
                    buy_amount = mround(buy_units * buy_price, 50)

                    # Units SELL (bội số 50) — có thể khác để test partial
                    k_sell = random.randint(1, 10)
                    sell_units = float(k_sell * 50)
                    sell_amount = mround(sell_units * sell_price, 50)

                    # Tạo BUY
                    buy_vals = {
                        'user_id': buy_user.id,
                        'fund_id': fund.id,
                        'transaction_type': 'purchase',
                        'status': 'pending',
                        'units': buy_units,
                        'remaining_units': buy_units,
                        'matched_units': 0,
                        'is_matched': False,
                        'amount': buy_amount,
                        'price': buy_price,
                        'current_nav': buy_price,
                        'term_months': term_months,
                        'interest_rate': interest_rate,
                        'currency_id': request.env.company.currency_id.id,
                        'investment_type': 'fund_certificate',
                        'source': 'portal',
                        'description': f'Random BUY transaction for testing (User: {buy_user.name})',
                        'created_at': now_utc_naive,
                        'reference': f"RAND_BUY_{now_vn.strftime('%Y%m%d%H%M%S')}_{i}_{buy_user.id}",
                    }
                    buy_tx = request.env['portfolio.transaction'].sudo().create(buy_vals)
                    created_transactions.append({
                        "id": buy_tx.id,
                        "user_id": buy_user.id,
                        "fund_id": fund.id,
                        "transaction_type": "purchase",
                        "units": buy_units,
                        "amount": buy_amount,
                        "price": buy_price
                    })

                    # Tạo SELL
                    sell_vals = {
                        'user_id': sell_user.id,
                        'fund_id': fund.id,
                        'transaction_type': 'sell',
                        'status': 'pending',
                        'units': sell_units,
                        'remaining_units': sell_units,
                        'matched_units': 0,
                        'is_matched': False,
                        'amount': sell_amount,
                        'price': sell_price,
                        'current_nav': sell_price,
                        'term_months': term_months,
                        'interest_rate': interest_rate,
                        'currency_id': request.env.company.currency_id.id,
                        'investment_type': 'fund_certificate',
                        'source': 'portal',
                        'description': f'Random SELL transaction for testing (User: {sell_user.name})',
                        'created_at': now_utc_naive,
                        'reference': f"RAND_SELL_{now_vn.strftime('%Y%m%d%H%M%S')}_{i}_{sell_user.id}",
                    }
                    sell_tx = request.env['portfolio.transaction'].sudo().create(sell_vals)
                    created_transactions.append({
                        "id": sell_tx.id,
                        "user_id": sell_user.id,
                        "fund_id": fund.id,
                        "transaction_type": "sell",
                        "units": sell_units,
                        "amount": sell_amount,
                        "price": sell_price
                    })

            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": f"Đã tạo {len(created_transactions)} giao dịch (5 mua giá CCQ + 5 bán thấp hơn tối đa 10%)",
                    "created_count": len(created_transactions),
                    "transactions": created_transactions,
                    "note": "Buy dùng đúng giá CCQ (fund.current_nav). Sell thấp hơn buy tối đa 10%."
                }),
                headers=[("Content-Type", "application/json")]
            )
        except Exception as e:
            pass
            return request.make_response(
                json.dumps({
                    "success": False,
                    "message": f"Lỗi tạo random: {str(e)}"
                }),
                headers=[("Content-Type", "application/json")],
                status=500
            )