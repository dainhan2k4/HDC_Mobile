from odoo import http
from odoo.http import request, Response
import json  # Dùng thư viện json tiêu chuẩn
from odoo import fields


class TransactionController(http.Controller):

    @http.route('/portfolio_widget', type='http', auth='public', website=True)
    def transaction_page(self, **kwargs):
        """Route để hiển thị trang stock widget"""
        return request.render('fund_management.assets_portfolio')
