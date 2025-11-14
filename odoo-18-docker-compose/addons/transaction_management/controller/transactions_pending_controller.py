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

        # Hàm chuyển đổi loại giao dịch đồng bộ với widget
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
            buy_date = ''
            holding_days = ''
            sell_fee = ''
            # Chỉ tính cho lệnh bán
            if transaction.transaction_type == 'sell':
                # Lấy ngày giao dịch từ created_at hoặc create_date
                tx_date = transaction.created_at if getattr(transaction, 'created_at', False) else transaction.create_date
                if tx_date:
                    # Tìm lệnh mua gần nhất trước ngày bán
                    domain = [
                        ('user_id', '=', request.env.user.id),
                        ('fund_id', '=', transaction.fund_id.id),
                        ('transaction_type', '=', 'purchase'),
                    ]
                    # Thêm điều kiện ngày: ưu tiên created_at, nếu không có thì dùng create_date
                    if getattr(transaction, 'created_at', False):
                        domain.append(('created_at', '<=', tx_date))
                    else:
                        domain.append(('create_date', '<=', tx_date))
                    
                    buy_order = request.env['portfolio.transaction'].search(
                        domain,
                        order='created_at desc, create_date desc',
                        limit=1
                    )
                    if buy_order:
                        buy_order_date = buy_order.created_at if getattr(buy_order, 'created_at', False) else buy_order.create_date
                        if buy_order_date:
                            buy_date = buy_order_date.strftime('%d/%m/%Y')
                            # Tính số ngày giữa hai ngày
                            tx_date_only = tx_date.date() if hasattr(tx_date, 'date') else tx_date
                            buy_date_only = buy_order_date.date() if hasattr(buy_order_date, 'date') else buy_order_date
                            holding_days = (tx_date_only - buy_date_only).days
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
            # Hợp đồng - nếu có file thì cung cấp route ổn định để xem/tải
            has_contract = bool(getattr(transaction, 'contract_file', False))
            # Contract route lấy theo transaction -> investment (user+fund) -> fund.signed.contract
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
            orders.append({
                'id': transaction.id,
                'account_number': so_tk,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M') if getattr(transaction, 'created_at', False) else (transaction.create_date.strftime('%d/%m/%Y, %H:%M') if transaction.create_date else ''),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{nav_value:,.0f}đ" if nav_value else "N/A",
                'amount': f"{max(transaction.amount - getattr(transaction, 'fee', 0.0), 0.0):,.0f}",
                'session_date': (transaction.created_at.strftime('%d/%m/%Y') if getattr(transaction, 'created_at', False) else (transaction.create_date.strftime('%d/%m/%Y') if transaction.create_date else "N/A")),
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
                'contract_name': contract_name,
                'contract_filename': contract_filename,
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_management_page', {
            'orders_json': orders_json,
        })
