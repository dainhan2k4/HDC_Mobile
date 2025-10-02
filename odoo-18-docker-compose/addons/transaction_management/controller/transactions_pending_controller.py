from odoo import http
from odoo.http import request
import json
from datetime import datetime

class TransactionsPendingController(http.Controller):

    @http.route('/transaction_management/pending', type='http', auth='user', website=True)
    def transaction_management_page(self, **kw):
        # Lấy dữ liệu thật từ model portfolio.transaction của user hiện tại - chỉ lấy các giao dịch pending
        transactions = request.env['portfolio.transaction'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'pending'),
            ('user_id', '=', request.env.user.id)
        ], order='create_date desc')

        # Hàm chuyển đổi loại giao dịch
        def get_transaction_type_display(type):
            type_map = {
                'purchase': 'buy',
                'sell': 'sell',
                'exchange': 'exchange'
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

        TransactionModel = request.env['portfolio.transaction']
        has_contract_field = 'contract_pdf_path' in TransactionModel._fields

        orders = []
        for transaction in transactions:
            buy_date = ''
            holding_days = ''
            sell_fee = ''
            # Chỉ tính cho lệnh bán
            if transaction.transaction_type == 'sell':
                buy_order = request.env['portfolio.transaction'].search([
                    ('user_id', '=', request.env.user.id),
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

            partner = request.env.user.partner_id
            so_tk = ''
            if partner:
                status_info = request.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                so_tk = status_info.so_tk if status_info else ''
            # Hợp đồng
            has_contract = False
            contract_url = ''
            contract_download_url = ''
            if has_contract_field:
                value = transaction.contract_pdf_path
                has_contract = bool(value)
                if has_contract:
                    contract_url = f"/transaction_management/contract/{transaction.id}"
                    contract_download_url = f"/transaction_management/contract/{transaction.id}?download=1"

            orders.append({
                'id': transaction.id,
                'account_number': so_tk,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M'),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{transaction.amount:,.0f}đ" if transaction.amount else "N/A",
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
                'has_contract': has_contract,
                'contract_url': contract_url,
                'contract_download_url': contract_download_url,
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_management_page', {
            'orders_json': orders_json,
        })
