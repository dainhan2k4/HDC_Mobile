from odoo import api, fields, models

from ..utils import constants, investment_utils


class Investment(models.Model):
    _name = "portfolio.investment"
    _description = "Investment"

    name = fields.Char(string="Name", compute='_compute_name', store=True)
    # Đồng bộ kiểu dữ liệu với các module khác: dùng res.users để có field partner_id
    user_id = fields.Many2one("res.users", string="User", required=True)
    fund_id = fields.Many2one("portfolio.fund", string="Fund", required=True)
    investment_type = fields.Selection(
        constants.INVESTMENT_TYPES,
        string="Investment Type",
        default=constants.DEFAULT_INVESTMENT_TYPE
    )
    units = fields.Float(string="Units")
    amount = fields.Float(string="Amount")
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)
    current_value = fields.Float(string="Current Value", default=0.0)
    profit_loss = fields.Float(string="Profit/Loss", default=0.0)
    profit_loss_percentage = fields.Float(string="Profit/Loss %", default=0.0)
    status = fields.Selection(
        constants.INVESTMENT_STATUSES,
        string='Status',
        default=constants.DEFAULT_INVESTMENT_STATUS
    )

    @api.depends('user_id', 'fund_id', 'units')
    def _compute_name(self):
        for rec in self:
            parts = []
            if rec.user_id:
                parts.append(rec.user_id.name)
            if rec.fund_id:
                parts.append(rec.fund_id.name)
            if rec.units:
                parts.append(f"{rec.units} units")
            rec.name = " - ".join(parts) if parts else "Investment"

    # ===== Basic calculation methods =====
    def _compute_days(self, term_months=None, days=None):
        """Calculate days from term_months or days"""
        return investment_utils.InvestmentHelper.compute_days(term_months, days)

    def compute_sell_value(self, order_value, interest_rate_percent, term_months=None, days=None):
        """Calculate sell value based on interest rate and term"""
        return investment_utils.InvestmentHelper.compute_sell_value(
            order_value, interest_rate_percent, term_months, days
        )
