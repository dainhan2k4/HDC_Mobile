from odoo import http
from odoo.http import request, Response
import json  # Dùng thư viện json tiêu chuẩn


class AccountBalanceController(http.Controller):

    @http.route('/account_balance', type='http', auth='public', website=True)
    def fund_widget_page(self, **kwargs):
        """Route để hiển thị trang stock widget"""
        return request.render('fund_management.assets_account_balance')
