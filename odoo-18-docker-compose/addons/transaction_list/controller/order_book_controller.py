# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
import json


class OrderBookController(http.Controller):
    """Controller cho trang sổ lệnh giao dịch"""

    @http.route('/order-book', type='http', auth='user', website=True)
    def order_book_page(self, **kwargs):
        """Trang sổ lệnh giao dịch"""
        return request.render('transaction_list.order_book_page', {
            'title': 'Sổ lệnh giao dịch',
            'page_name': 'order_book'
        })

    @http.route('/completed-orders', type='http', auth='user', website=True)
    def completed_orders_page(self, **kwargs):
        return request.render('transaction_list.completed_orders_page', {
            'title': 'Khoản đầu tư đã khớp',
            'page_name': 'completed_orders'
        })

    @http.route('/negotiated-orders', type='http', auth='user', website=True)
    def negotiated_orders_page(self, **kwargs):
        return request.render('transaction_list.negotiated_orders_page', {
            'title': 'Khoản đầu tư khớp theo thỏa thuận',
            'page_name': 'negotiated_orders'
        })

    # ==== API SỔ LỆNH GIAO DỊCH ====
    @http.route('/api/transaction-list/order-book', type='http', auth='public', methods=['POST'], csrf=False)
    def get_order_book(self, **kwargs):
        """Lấy dữ liệu sổ lệnh giao dịch"""
        
        try:
            # Lấy fund_id từ request body
            import json
            request_data = json.loads(request.httprequest.data.decode('utf-8'))
            fund_id = request_data.get('fund_id')
            
            if not fund_id:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Thiếu fund_id"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            Transaction = request.env['portfolio.transaction'].sudo()
            Fund = request.env['portfolio.fund'].sudo()
            
            # Lấy thông tin fund
            fund = Fund.browse(int(fund_id))
            if not fund.exists():
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Không tìm thấy fund"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Lấy lệnh mua (buy/purchase) chỉ trạng thái pending
            # Sắp xếp theo Price-Time Priority: Giá cao nhất trước, cùng giá thì thời gian sớm nhất trước
            # Chỉ hiển thị lệnh chờ xử lý CHƯA khớp phần nào (ẩn các lệnh đã khớp một phần)
            buy_orders = Transaction.search([
                ('fund_id', '=', int(fund_id)),
                ('transaction_type', 'in', ['buy', 'purchase']),
                ('status', '=', 'pending'),
                '|', ('matched_units', '=', 0), ('matched_units', '=', False),
            ], order='price desc, create_date asc')
            
            # Lấy lệnh bán (sell) chỉ trạng thái pending
            # Sắp xếp theo Price-Time Priority: Giá thấp nhất trước, cùng giá thì thời gian sớm nhất trước
            sell_orders = Transaction.search([
                ('fund_id', '=', int(fund_id)),
                ('transaction_type', '=', 'sell'),
                ('status', '=', 'pending'),
                '|', ('matched_units', '=', 0), ('matched_units', '=', False),
            ], order='price asc, create_date asc')
            
            # Tính thống kê
            total_buy_value = sum(order.price * order.units for order in buy_orders)
            total_sell_value = sum(order.price * order.units for order in sell_orders)
            total_ccq = sum(order.units for order in buy_orders) - sum(order.units for order in sell_orders)
            
            # Tính biến động giá (so với giá trước đó)
            price_change = 0
            price_change_percent = 0
            try:
                # Lấy giá trước đó từ NAV history hoặc fund config
                prev_price = fund.current_nav or 10000
                current_price = fund.current_nav or 10000
                price_change = current_price - prev_price
                if prev_price > 0:
                    price_change_percent = (price_change / prev_price) * 100
            except Exception:
                pass
            
            # Lấy các lệnh mua và lệnh bán chưa khớp đủ (còn remaining_units > 0) từ portfolio.transaction
            partial_orders = []
            try:
                # Lấy lệnh mua chưa khớp đủ (đã khớp một phần nhưng còn remaining > 0)
                partial_buy_orders = Transaction.search([
                    ('fund_id', '=', int(fund_id)),
                    ('transaction_type', 'in', ['buy', 'purchase']),
                    ('status', '=', 'pending'),
                    ('matched_units', '>', 0),
                    ('remaining_units', '>', 0),
                ], order='created_at asc')
                
                # Lấy lệnh bán chưa khớp đủ (đã khớp một phần nhưng còn remaining > 0)
                partial_sell_orders = Transaction.search([
                    ('fund_id', '=', int(fund_id)),
                    ('transaction_type', '=', 'sell'),
                    ('status', '=', 'pending'),
                    ('matched_units', '>', 0),
                    ('remaining_units', '>', 0),
                ], order='created_at asc')
                
                # Format dữ liệu lệnh mua chưa khớp đủ
                for order in partial_buy_orders:
                    partial_orders.append({
                        "id": order.id,
                        "user_name": order.user_id.name if order.user_id else "N/A",
                        "transaction_type": order.transaction_type,
                        "price": float(getattr(order, 'price', 0) or 0),
                        "units": float(getattr(order, 'units', 0) or 0),
                        "matched_units": float(getattr(order, 'matched_units', 0) or 0),
                        "remaining_units": float(getattr(order, 'remaining_units', 0) or 0),
                        "amount": float(getattr(order, 'amount', 0) or 0),
                        "status": getattr(order, 'status', 'pending'),
                        "created_at": order.created_at.isoformat() if order.created_at else None,
                        "ccq_remaining": getattr(order, 'ccq_remaining_to_match', 0),
                    })
                
                # Format dữ liệu lệnh bán chưa khớp đủ
                for order in partial_sell_orders:
                    partial_orders.append({
                        "id": order.id,
                        "user_name": order.user_id.name if order.user_id else "N/A",
                        "transaction_type": order.transaction_type,
                        "price": float(getattr(order, 'price', 0) or 0),
                        "units": float(getattr(order, 'units', 0) or 0),
                        "matched_units": float(getattr(order, 'matched_units', 0) or 0),
                        "remaining_units": float(getattr(order, 'remaining_units', 0) or 0),
                        "amount": float(getattr(order, 'amount', 0) or 0),
                        "status": getattr(order, 'status', 'pending'),
                        "created_at": order.created_at.isoformat() if order.created_at else None,
                        "ccq_remaining": getattr(order, 'ccq_remaining_to_match', 0),
                    })
            except Exception as e:
                # Log lỗi nhưng không dừng quy trình
                import logging
                _logger = logging.getLogger(__name__)
                _logger.warning(f"Error loading partial orders: {str(e)}")

            # Format dữ liệu theo Price-Time Priority
            buy_orders_data = []
            for order in buy_orders:
                buy_orders_data.append({
                    "id": order.id,
                    "user_name": order.user_id.name if order.user_id else "N/A",
                    "price": order.price,
                    "units": order.units,
                    "amount": order.amount,
                    "status": order.status,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                    "ccq_remaining": getattr(order, 'ccq_remaining_to_match', 0),
                    "matched_units": getattr(order, 'matched_units', 0.0),
                    "remaining_units": getattr(order, 'remaining_units', 0.0),
                    "priority_score": self._calculate_priority_score(order, 'buy')
                })
            
            sell_orders_data = []
            for order in sell_orders:
                sell_orders_data.append({
                    "id": order.id,
                    "user_name": order.user_id.name if order.user_id else "N/A",
                    "price": order.price,
                    "units": order.units,
                    "amount": order.amount,
                    "status": order.status,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                    "ccq_remaining": getattr(order, 'ccq_remaining_to_match', 0),
                    "matched_units": getattr(order, 'matched_units', 0.0),
                    "remaining_units": getattr(order, 'remaining_units', 0.0),
                    "priority_score": self._calculate_priority_score(order, 'sell')
                })
            
            fund_info = {
                "id": fund.id,
                "name": fund.name,
                "ticker": fund.ticker,
                "current_nav": fund.current_nav,
                "total_buy_value": total_buy_value,
                "total_sell_value": total_sell_value,
                "total_ccq": total_ccq
            }
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "fund_info": fund_info,
                    "buy_orders": buy_orders_data,
                    "sell_orders": sell_orders_data,
                    "partial_orders": partial_orders,
                    "price_change": price_change,
                    "price_change_percent": price_change_percent,
                    "total_buy_orders": len(buy_orders_data),
                    "total_sell_orders": len(sell_orders_data),
                    "total_partial_orders": len(partial_orders)
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
            
        except Exception as e:
            pass
            return request.make_response(
                json.dumps({
                    "success": False,
                    "message": str(e)
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )

    @http.route('/api/transaction-list/funds', type='http', auth='public', methods=['POST'], csrf=False)
    def get_funds(self, **kwargs):
        """Lấy danh sách funds cho dropdown"""
        
        try:
            Fund = request.env['portfolio.fund'].sudo()
            # Tìm tất cả funds, không filter theo status
            funds = Fund.search([])
            
            funds_data = []
            for fund in funds:
                funds_data.append({
                    "id": fund.id,
                    "name": fund.name,
                    "ticker": fund.ticker,
                    "current_nav": fund.current_nav
                })
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "funds": funds_data
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
            
        except Exception as e:
            pass
            return request.make_response(
                json.dumps({
                    "success": False,
                    "message": str(e)
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )

    # ==== API COMPLETED TRANSACTIONS ====
    @http.route('/api/transaction-list/completed', type='http', auth='user', methods=['POST'], csrf=False)
    def get_completed_transactions(self, **kwargs):
        """Trả về danh sách giao dịch đã khớp (status=completed) theo fund."""
        try:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
            except Exception:
                payload = {}
            fund_id = payload.get('fund_id')
            limit = int(payload.get('limit') or 500)
            if not fund_id:
                return request.make_response(json.dumps({"success": False, "message": "Thiếu fund_id"}, ensure_ascii=False), headers=[("Content-Type", "application/json")])
            Tx = request.env['portfolio.transaction'].sudo()
            domain = [
                ('fund_id', '=', int(fund_id)),
                ('status', '=', 'completed'),
            ]
            recs = Tx.search(domain, order='created_at desc', limit=limit)
            data = [{
                'id': r.id,
                'user_name': r.user_id.name if r.user_id else 'N/A',
                'type': r.transaction_type,
                'price': r.price,
                'units': r.units,
                'amount': r.amount,
                'created_at': r.created_at.strftime('%Y-%m-%d %H:%M:%S') if r.created_at else '',
            } for r in recs]
            return request.make_response(json.dumps({"success": True, "data": data, "total": len(data)}, ensure_ascii=False), headers=[("Content-Type", "application/json")])
        except Exception as e:
            return request.make_response(json.dumps({"success": False, "message": str(e), "data": []}, ensure_ascii=False), headers=[("Content-Type", "application/json")], status=500)

    # ==== API NEGOTIATED (MARKET MAKER) MATCHED ORDERS ====
    @http.route('/api/transaction-list/negotiated', type='http', auth='user', methods=['POST'], csrf=False)
    def get_negotiated_orders(self, **kwargs):
        """Các giao dịch được nhà tạo lập mua/bán lại (lọc từ transaction.matched.orders theo user_type)."""
        try:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
            except Exception:
                payload = {}
            limit = int(payload.get('limit') or 500)
            fund_id = payload.get('fund_id')
            Model = request.env['transaction.matched.orders'].sudo()
            domain = [('status', 'in', ['confirmed', 'done'])]
            if fund_id:
                domain.append(('fund_id', '=', int(fund_id)))
            domain += ['|', ('buy_user_type', '=', 'market_maker'), ('sell_user_type', '=', 'market_maker')]
            recs = Model.search(domain, order='match_date desc', limit=limit)
            data = [{
                'id': r.id,
                'fund_name': r.fund_id.name if r.fund_id else '',
                'matched_quantity': r.matched_quantity,
                'matched_price': r.matched_price,
                'total_value': r.total_value,
                'match_date': r.match_date.strftime('%Y-%m-%d %H:%M:%S') if r.match_date else '',
                'buy_user_type': r.buy_user_type,
                'sell_user_type': r.sell_user_type,
            } for r in recs]
            return request.make_response(json.dumps({"success": True, "data": data, "total": len(data)}, ensure_ascii=False), headers=[("Content-Type", "application/json")])
        except Exception as e:
            return request.make_response(json.dumps({"success": False, "message": str(e), "data": []}, ensure_ascii=False), headers=[("Content-Type", "application/json")], status=500)

    def _calculate_priority_score(self, order, order_type):
        """Tính điểm ưu tiên theo Price-Time Priority"""
        try:
            price = float(order.price or 0)
            # Chuyển đổi thời gian thành số để so sánh
            if order.created_at:
                time_int = order.created_at.hour * 3600 + order.created_at.minute * 60 + order.created_at.second
            else:
                time_int = 0
            
            if order_type == 'buy':
                # Buy: Giá cao nhất trước, cùng giá thì thời gian sớm nhất trước
                return (price * 1000000) - time_int  # Giá cao hơn = điểm cao hơn, thời gian sớm hơn = điểm cao hơn
            else:  # sell
                # Sell: Giá thấp nhất trước, cùng giá thì thời gian sớm nhất trước
                return (1000000 - price * 1000000) - time_int  # Giá thấp hơn = điểm cao hơn, thời gian sớm hơn = điểm cao hơn
        except Exception:
            return 0
