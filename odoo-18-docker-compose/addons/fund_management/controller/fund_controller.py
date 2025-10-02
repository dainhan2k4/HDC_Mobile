from odoo import http
from odoo.http import request, Response
import json  # Dùng thư viện json tiêu chuẩn


class MyController(http.Controller):

    @http.route('/data_fund', type='http', auth='public', cors='*')
    def get_holdings(self):
        holdings = request.env['portfolio.fund'].sudo().search([])

        result = [
            {
                "id": h.id,  # ✅ Thêm dòng này
                "ticker" : h.ticker,
                'name': h.name,
                'description': h.description,
                'current_ytd':h.current_ytd,
                'current_nav':h.current_nav,
                'investment_type':h.investment_type,
                'nav_history_json':h.nav_history_json
            }
            for h in holdings
        ]

        return Response(
            json.dumps(result),
            content_type='application/json'
        )

    @http.route('/fund_widget', type='http', auth='public', website=True)
    def fund_widget_page(self, **kwargs):
        """Route để hiển thị trang stock widget"""
        return request.render('fund_management.assets_fund_widget_page')

    @http.route('/fund_compare', type='http', auth='public', website=True)
    def fund_compare_page(self, **kwargs):
        """Route để hiển thị trang stock widget"""
        return request.render('fund_management.assets_fund_compare')

    @http.route('/fund_buy', type='http', auth='public', website=True)
    def fund_buy_page(self, **kwargs):
        return request.render('fund_management.fund_buy')

    @http.route('/fund_confirm', type='http', auth='public', website=True)
    def fund_confirm_page(self, **kwargs):
        return request.render('fund_management.fund_confirm')

    @http.route('/fund_result', type='http', auth='public', website=True)
    def fund_result_page(self, **kwargs):
        return request.render('fund_management.fund_result')

    @http.route('/fund_sell', type='http', auth='public', website=True)
    def fund_sell_page(self, **kwargs):
        return request.render('fund_management.fund_sell')

    @http.route('/fund_sell_confirm', type='http', auth='public', website=True)
    def fund_sell_confirm(self, **kwargs):
        return request.render('fund_management.fund_sell_confirm')

    @http.route('/api/fund/calc', type='http', auth='user', methods=['GET'], csrf=False)
    def fund_calc(self):
        """API để tính toán và ẩn/hiện kỳ hạn dựa trên logic nghiệp vụ"""
        try:
            # Lấy tất cả kỳ hạn từ nav_management
            term_rates = request.env['nav.term.rate'].sudo().search([
                ('active', '=', True)
            ], order='term_months asc')
            
            result = []
            for rate in term_rates:
                # Logic ẩn/hiện kỳ hạn (có thể thêm logic nghiệp vụ ở đây)
                hide = False  # Mặc định hiển thị tất cả
                difference = 0  # Có thể tính toán difference dựa trên logic nghiệp vụ
                
                result.append({
                    'month': rate.term_months,
                    'interest_rate2': rate.interest_rate,
                    'hide': hide,
                    'difference': difference
                })
            
            return Response(
                json.dumps(result),
                content_type='application/json'
            )
        except Exception as e:
            return Response(
                json.dumps({'error': str(e)}),
                content_type='application/json',
                status=500
            )

