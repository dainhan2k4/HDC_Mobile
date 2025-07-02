from odoo import http
from odoo.http import request, Response
import json  # Dùng thư viện json tiêu chuẩn


class MyController(http.Controller):

    @http.route('/data_fund', type='http', auth='public', cors='*')
    def get_holdings(self):
        holdings = request.env['portfolio.fund'].sudo().search([])

        result = [
            {
                "id": h.id, 
                "ticker" : h.ticker,
                'name': h.name,
                'description': h.description,
                'current_ytd':h.current_ytd,
                'current_nav':h.current_nav,
                'investment_type':h.investment_type

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