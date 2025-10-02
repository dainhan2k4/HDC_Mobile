from odoo import http
from odoo.http import request
import json
from datetime import datetime, timedelta

class TransactionPeriodicController(http.Controller):

    @http.route('/transaction_management/periodic', type='http', auth='user', website=True)
    def transaction_periodic_page(self, **kw):
        # Lấy dữ liệu thật từ model portfolio.transaction của user hiện tại - chỉ lấy các giao dịch completed
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

        orders = []
        for transaction in transactions:
            partner = request.env.user.partner_id
            so_tk = ''
            if partner:
                status_info = request.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                so_tk = status_info.so_tk if status_info else ''
            
            # Tính toán thông tin kỳ hạn cho lệnh mua
            term_info = {}
            if transaction.transaction_type == 'purchase':
                # Lấy thông tin kỳ hạn từ fund_management
                try:
                    # Gọi API fund calc để lấy thông tin kỳ hạn
                    fund_calc_url = f"{request.httprequest.host_url.rstrip('/')}/api/fund/calc"
                    import requests
                    response = requests.get(fund_calc_url, timeout=5)
                    if response.status_code == 200:
                        terms_data = response.json()
                        # Tìm kỳ hạn phù hợp dựa trên amount và units
                        transaction_amount_per_unit = transaction.amount / transaction.units if transaction.units > 0 else 0
                        
                        # Tìm kỳ hạn có lãi suất phù hợp
                        best_term = None
                        min_diff = float('inf')
                        
                        for term in terms_data:
                            if not term.get('hide', False):  # Chỉ xem kỳ hạn không bị ẩn
                                # Tính toán lãi suất dựa trên giá mua thực tế
                                base_value = 13697  # Giá trị cơ bản từ fund_calc
                                days = term['month'] * 30
                                expected_price = base_value * (1 + (term['rate'] / 100) / 365 * days)
                                
                                # So sánh với giá mua thực tế
                                diff = abs(expected_price - transaction_amount_per_unit)
                                if diff < min_diff:
                                    min_diff = diff
                                    best_term = term
                        
                        if best_term:
                            term_info = {
                                'tenor_months': best_term['month'],
                                'interest_rate': best_term['rate'],
                                'maturity_date': self._calculate_maturity_date(transaction.created_at, best_term['month']),
                                'days_to_maturity': self._calculate_days(transaction.created_at, self._calculate_maturity_date(transaction.created_at, best_term['month']))
                            }
                except Exception as e:
                    print(f"Lỗi khi lấy thông tin kỳ hạn: {str(e)}")
                    # Fallback: tính toán đơn giản dựa trên amount
                    if transaction.amount > 0 and transaction.units > 0:
                        amount_per_unit = transaction.amount / transaction.units
                        # Ước tính kỳ hạn dựa trên giá trị
                        if amount_per_unit <= 14000:
                            estimated_term = 1
                        elif amount_per_unit <= 14500:
                            estimated_term = 3
                        elif amount_per_unit <= 15000:
                            estimated_term = 6
                        else:
                            estimated_term = 12
                        
                        term_info = {
                            'tenor_months': estimated_term,
                            'interest_rate': 'N/A',
                            'maturity_date': self._calculate_maturity_date(transaction.created_at, estimated_term),
                            'days_to_maturity': self._calculate_days(transaction.created_at, self._calculate_maturity_date(transaction.created_at, estimated_term))
                        }
            
            orders.append({
                'account_number': so_tk,
                'fund_name': transaction.fund_id.name,
                'order_date': transaction.created_at.strftime('%d/%m/%Y, %H:%M'),
                'order_code': transaction.name or f"TX{transaction.id:06d}",
                'nav': f"{transaction.amount:,.0f}đ" if transaction.amount else "N/A",
                'amount': f"{transaction.amount:,.0f}",
                'session_date': transaction.transaction_date.strftime('%d/%m/%Y') if transaction.transaction_date else "N/A",
                'status': 'Định kỳ',
                'status_detail': transaction.description or 'Tự động',
                'transaction_type': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'fund_ticker': transaction.fund_id.ticker or '',
                'currency': transaction.currency_id.symbol or 'đ',
                # Thông tin kỳ hạn
                'tenor_months': term_info.get('tenor_months', 'N/A'),
                'interest_rate': f"{term_info.get('interest_rate', 'N/A')}%" if term_info.get('interest_rate') != 'N/A' else 'N/A',
                'maturity_date': term_info.get('maturity_date', 'N/A').strftime('%d/%m/%Y') if term_info.get('maturity_date') else 'N/A',
                'days_to_maturity': term_info.get('days_to_maturity', 'N/A')
            })

        orders_json = json.dumps(orders, ensure_ascii=False)
        return request.render('transaction_management.transaction_periodic_page', {
            'orders_json': orders_json,
        })
    
    def _calculate_maturity_date(self, purchase_date, tenor_months):
        """Tính ngày đáo hạn từ ngày mua + số kỳ hạn"""
        if isinstance(purchase_date, str):
            purchase_date = datetime.strptime(purchase_date, '%Y-%m-%d %H:%M:%S')
        
        end_date = purchase_date + timedelta(days=tenor_months * 30)
        
        # Bỏ qua thứ 7 và chủ nhật
        while end_date.weekday() in (5, 6):  # 5=Thứ 7, 6=CN
            end_date += timedelta(days=1)
        
        return end_date
    
    def _calculate_days(self, purchase_date, maturity_date):
        """Tính số ngày giữa ngày mua và ngày đáo hạn"""
        if isinstance(purchase_date, str):
            purchase_date = datetime.strptime(purchase_date, '%Y-%m-%d %H:%M:%S')
        
        return (maturity_date - purchase_date).days 