from odoo import http
from odoo.http import request, Response
import json
import logging

_logger = logging.getLogger(__name__)


class AccountBalanceController(http.Controller):
    """Controller for account balance pages"""

    @http.route('/account_balance', type='http', auth='user', website=True)
    def account_balance_page(self, **kwargs):
        """Route để hiển thị trang account balance"""
        try:
            user_id = request.env.user.id
            AccountBalance = request.env['portfolio.account_balance'].sudo()
            BalanceHistory = request.env['portfolio.balance_history'].sudo()
            
            # Get account balance
            account_balance = AccountBalance.search([
                ('user_id', '=', user_id)
            ], limit=1, order='id desc')
            
            # Get balance history
            balance_history = BalanceHistory.search([
                ('user_id', '=', user_id)
            ], order='created_at desc', limit=10)
            
            values = {
                'balance': account_balance.balance if account_balance else 0.0,
                'balance_history': balance_history,
            }
            
            return request.render('fund_management.assets_account_balance', values)
        except Exception as e:
            _logger.error(f"Error in account_balance_page: {e}", exc_info=True)
            return request.render('fund_management.assets_account_balance', {
                'balance': 0.0,
                'balance_history': []
            })
