from odoo import http
from odoo.http import request
import json
from datetime import datetime

class TransactionsPendingController(http.Controller):

    @http.route('/transaction_management/pending', type='http', auth='user', website=True)
    def transaction_management_page(self, **kw):
        # Lấy dữ liệu thật từ model portfolio.transaction - chỉ lấy các giao dịch pending
        transactions = request.env['portfolio.transaction'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'pending')
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
            buy_date = ''
            holding_days = ''
            sell_fee = ''
            # Chỉ tính cho lệnh bán
            if transaction.transaction_type == 'sale':
                buy_order = request.env['portfolio.transaction'].search([
                    ('user_id', '=', transaction.user_id.id),
                    ('fund_id', '=', transaction.fund_id.id),
                    ('transaction_type', '=', 'purchase'),
                    ('transaction_date', '<=', transaction.transaction_date)
                ], order='transaction_date desc', limit=1)
                if buy_order:
                    buy_date = buy_order.transaction_date.strftime('%d/%m/%Y')
                    holding_days = (transaction.transaction_date - buy_order.transaction_date).days
                amount = transaction.amount
                if amount < 10000000:
                    sell_fee = int(amount * 0.003)
                elif amount < 20000000:
                    sell_fee = int(amount * 0.002)
                else:
                    sell_fee = int(amount * 0.001)

            orders.append({
                'account_number': transaction.user_id.name,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M'),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{transaction.fund_id.current_nav:,.0f}đ" if transaction.fund_id.current_nav else "N/A",
                'amount': f"{transaction.amount:,.0f}",
                'session_date': transaction.transaction_date.strftime('%d/%m/%Y') if transaction.transaction_date else "N/A",
                'status': get_status_display(transaction.status),
                'status_detail': transaction.description or 'Chờ xác nhận tiền',
                'transaction_type': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'fund_ticker': transaction.fund_id.ticker or '',
                'currency': transaction.currency_id.symbol or 'đ',
                'buy_date': buy_date,
                'holding_days': holding_days,
                'sell_fee': sell_fee,
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_management_page', {
            'orders_json': orders_json,
        })
