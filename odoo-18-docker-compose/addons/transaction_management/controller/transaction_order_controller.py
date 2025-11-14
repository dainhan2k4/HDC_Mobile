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

        # Hàm chuyển đổi loại giao dịch (đồng bộ với widget: buy/sell/exchange)
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

        # Không cần kiểm tra field cũ nữa vì đã chuyển sang fund.signed.contract

        # Helper: lấy NAV giống @nav_management
        def get_nav_value(tx):
            try:
                if getattr(tx, 'current_nav', False):
                    return float(tx.current_nav)
                fund = tx.fund_id
                cert = fund.certificate_id if fund else None
                if cert and getattr(cert, 'initial_certificate_price', False):
                    return float(cert.initial_certificate_price)
            except Exception:
                pass
            return 0.0

        orders = []
        for transaction in transactions:
            partner = request.env.user.partner_id
            so_tk = ''
            if partner:
                status_info = request.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                so_tk = status_info.so_tk if status_info else ''

            # Hợp đồng - nếu có file thì cung cấp route ổn định để xem/tải và gửi kèm tên/filename
            has_contract = bool(getattr(transaction, 'contract_file', False))
            contract_url = f"/transaction_management/contract/{transaction.id}" if has_contract else ''
            contract_download_url = f"/transaction_management/contract/{transaction.id}?download=1" if has_contract else ''
            contract_name = ''
            contract_filename = ''
            if has_contract:
                try:
                    Investment = request.env['portfolio.investment'].sudo()
                    candidate_inv = Investment.search([
                        ('user_id', '=', transaction.user_id.id if transaction.user_id else 0),
                        ('fund_id', '=', transaction.fund_id.id if transaction.fund_id else 0),
                    ], limit=1, order='id desc')
                    domain = []
                    if candidate_inv:
                        domain = [('investment_id', '=', candidate_inv.id)]
                    else:
                        partner = transaction.user_id.partner_id if transaction.user_id else None
                        if partner:
                            domain = [('partner_id', '=', partner.id)]
                    signed_contract = request.env['fund.signed.contract'].sudo().search(domain, limit=1, order='id desc') if domain else False
                    if signed_contract:
                        contract_name = signed_contract.name or ''
                        contract_filename = signed_contract.filename or (transaction.name and f"{transaction.name}.pdf") or ''
                except Exception:
                    pass
            nav_value = get_nav_value(transaction)
            # Xác định session_date: ưu tiên date_end (thời gian khớp), sau đó created_at (thời gian vào), cuối cùng create_date
            session_date_obj = (transaction.date_end if hasattr(transaction, 'date_end') and transaction.date_end else None) or (transaction.created_at if hasattr(transaction, 'created_at') and transaction.created_at else None) or transaction.create_date
            session_date_str = session_date_obj.strftime('%d/%m/%Y') if session_date_obj else "N/A"
            orders.append({
                'id': transaction.id,
                'account_number': so_tk,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M') if getattr(transaction, 'created_at', False) else (transaction.create_date.strftime('%d/%m/%Y, %H:%M') if transaction.create_date else ''),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{nav_value:,.0f}đ" if nav_value else "N/A",
                'amount': f"{max(transaction.amount - getattr(transaction, 'fee', 0.0), 0.0):,.0f}",
                'session_date': session_date_str,
                'status': get_status_display(transaction.status),
                'status_detail': transaction.description or 'Hoàn thành',
                'transaction_type': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'fund_ticker': transaction.fund_id.ticker or '',
                'currency': transaction.currency_id.symbol or 'đ',
                'has_contract': has_contract,
                'contract_url': contract_url,
                'contract_download_url': contract_download_url,
                'contract_name': contract_name,
                'contract_filename': contract_filename,
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_order_page', {
            'orders_json': orders_json,
        }) 

    @http.route('/transaction_management/contract/<int:tx_id>', type='http', auth='user')
    def transaction_contract(self, tx_id, download=False, **kw):
        # Tìm transaction
        transaction = request.env['portfolio.transaction'].sudo().browse(tx_id)
        if not transaction or not transaction.exists():
            return request.not_found()

        # Suy ra investment: cùng user + fund, bản ghi mới nhất
        Investment = request.env['portfolio.investment'].sudo()
        candidate_inv = Investment.search([
            ('user_id', '=', transaction.user_id.id if transaction.user_id else 0),
            ('fund_id', '=', transaction.fund_id.id if transaction.fund_id else 0),
        ], limit=1, order='id desc')

        domain = []
        if candidate_inv:
            domain = [('investment_id', '=', candidate_inv.id)]
        else:
            partner = transaction.user_id.partner_id if transaction.user_id else None
            if partner:
                domain = [('partner_id', '=', partner.id)]

        signed_contract = request.env['fund.signed.contract'].sudo().search(domain, limit=1, order='id desc') if domain else False

        if not signed_contract or not signed_contract.exists() or not signed_contract.file_data:
            return request.not_found()

        headers = [
            ('Content-Type', 'application/pdf'),
            ('X-Content-Type-Options', 'nosniff'),
        ]

        filename = signed_contract.filename or f"contract_{tx_id}.pdf"
        if str(download).lower() in ('1', 'true', 'yes'):
            headers.append(('Content-Disposition', f'attachment; filename="{filename}"'))
        else:
            headers.append(('Content-Disposition', f'inline; filename="{filename}"'))

        try:
            data = base64.b64decode(signed_contract.file_data)
            return request.make_response(data, headers=headers)
        except Exception:
            return request.not_found()