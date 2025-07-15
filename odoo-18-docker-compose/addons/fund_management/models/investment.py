from odoo import api, fields, models


class Investment(models.Model):
    _name = "portfolio.investment"
    _description = "Investment"

    user_id = fields.Many2one("auth.user", string="User", required=True)
    fund_id = fields.Many2one("portfolio.fund", string="Fund", required=True)
    units = fields.Float(string="Units")
    amount = fields.Float(string="Amount")

    # _sql_constraints = [
    #     ('investment_user_fund_uniq', 'unique(user_id, fund_id)', 'User and Fund combination must be unique.')
    # ]
