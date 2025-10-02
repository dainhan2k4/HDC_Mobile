from odoo import http
from odoo.http import request
import json
import base64
import os

class TransactionOrderController(http.Controller):

    @http.route('/transaction_management/order', type='http', auth='user', website=True)
    def transaction_order_page(self, **kw):
        # Lấy dữ liệu thật từ model portfolio.transaction của user hiện tại
        transactions = request.env['portfolio.transaction'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'completed'),
            ('user_id', '=', request.env.user.id)
        ], order='create_date desc')

        # Hàm chuyển đổi loại giao dịch
        def get_transaction_type_display(type):
            type_map = {
                'purchase': 'Mua',
                'sell': 'Bán',
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

        TransactionModel = request.env['portfolio.transaction']
        has_contract_field = 'contract_pdf_path' in TransactionModel._fields

        orders = []
        for transaction in transactions:
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
                'status_detail': transaction.description or 'Hoàn thành',
                'transaction_type': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'fund_ticker': transaction.fund_id.ticker or '',
                'currency': transaction.currency_id.symbol or 'đ',
                'has_contract': has_contract,
                'contract_url': contract_url,
                'contract_download_url': contract_download_url,
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_order_page', {
            'orders_json': orders_json,
        }) 

    @http.route('/transaction_management/contract/<int:tx_id>', type='http', auth='user')
    def transaction_contract(self, tx_id, download=False, **kw):
        tx = request.env['portfolio.transaction'].sudo().browse(tx_id)
        if not tx or not tx.exists():
            return request.not_found()

        field = tx._fields.get('contract_pdf_path')
        if not field:
            return request.not_found()

        headers = [
            ('Content-Type', 'application/pdf'),
            ('X-Content-Type-Options', 'nosniff'),
        ]

        filename = f"contract_{tx_id}.pdf"
        if str(download).lower() in ('1', 'true', 'yes'):
            headers.append(('Content-Disposition', f'attachment; filename="{filename}"'))
        else:
            headers.append(('Content-Disposition', f'inline; filename="{filename}"'))

        try:
            if field.type == 'binary':
                if not tx.contract_pdf_path:
                    return request.not_found()
                data = base64.b64decode(tx.contract_pdf_path)
                return request.make_response(data, headers=headers)
            else:
                path = tx.contract_pdf_path
                if not path or not os.path.isfile(path):
                    return request.not_found()
                with open(path, 'rb') as f:
                    data = f.read()
                return request.make_response(data, headers=headers)
        except Exception:
            return request.not_found()