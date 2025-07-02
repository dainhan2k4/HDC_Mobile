from odoo import http
from odoo.http import request
import json

class TransactionOrderController(http.Controller):

    @http.route('/transaction_management/order', type='http', auth='user', website=True)
    def transaction_order_page(self, **kw):
        # Lấy dữ liệu thật từ model portfolio.transaction
        transactions = request.env['portfolio.transaction'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'completed')
        ], order='create_date desc')

        # Hàm chuyển đổi loại giao dịch
        def get_transaction_type_display(type):
            type_map = {
                'purchase': 'Mua',
                'sale': 'Bán',
                'exchange': 'Hoán đổi'
            }
            return type_map.get(type, type)

        # Hàm chuyển đổi trạng thái
        def get_status_display(status):
            status_map = {
                'pending': 'Chờ khớp lệnh',
                'completed': 'Đã khớp lệnh',
                'cancelled': 'Đã hủy'
            }
            return status_map.get(status, status)

        orders = []
        for transaction in transactions:
            orders.append({
                'account_number': transaction.user_id.name,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M'),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{transaction.fund_id.current_nav:,.0f}đ" if transaction.fund_id.current_nav else "N/A",
                'amount': f"{transaction.amount:,.0f}",
                'session_date': transaction.transaction_date.strftime('%d/%m/%Y') if transaction.transaction_date else "N/A",
                'status': get_status_display(transaction.status),
                'status_detail': transaction.description or 'Hoàn thành',
                'transaction_type': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'fund_ticker': transaction.fund_id.ticker or '',
                'currency': transaction.currency_id.symbol or 'đ'
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_order_page', {
            'orders_json': orders_json,
        }) 