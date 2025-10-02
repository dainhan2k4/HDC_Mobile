from odoo import api, fields, models


class Transaction(models.Model):
    _name = "portfolio.transaction"
    _description = "Transaction"

    user_id = fields.Many2one("auth.user", string="User", required=True)
    fund_id = fields.Many2one("portfolio.fund", string="Fund", required=True)
    transaction_type = fields.Selection([
        ('purchase', 'Purchase'),
        ('sell', 'Sell')
    ], string="Transaction Type", required=True)
    units = fields.Float(string="Units", required=True)
    amount = fields.Float(string="Amount", required=True)
    fee = fields.Float(string="Phí mua", default=0.0, help="Phí mua cho giao dịch này")
    created_at = fields.Datetime(string="Created At", required=True)
    date_end = fields.Datetime(string="Date End At")
    contract_pdf_path = fields.Char(string="Contract PDF Path")
    current_nav = fields.Float(string="NAV")
    price = fields.Monetary(string="Giá đơn vị", required=True, tracking=True, help="Giá đơn vị cho giao dịch này", currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)
    status = fields.Selection([
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string="Status", default='pending', tracking=True)

    # Added fields for NAV Management integration
    term_months = fields.Integer(string="Kỳ hạn (tháng)", default=12)
    interest_rate = fields.Float(string="Lãi suất (%)", digits=(16, 2))
    
    # Source field for transaction origin
    source = fields.Selection([
        ('portal', 'Portal'),
        ('sale', 'Sale Portal'),
        ('portfolio', 'Portfolio')
    ], string="Source", default='portfolio', tracking=True)

    @api.onchange('term_months')
    def _onchange_term_months_set_interest(self):
        """Auto-set interest_rate from nav.term.rate (active). Fallback giữ giá trị cũ nếu không tìm thấy."""
        for rec in self:
            try:
                if not rec.term_months:
                    continue
                TermRate = self.env['nav.term.rate'].sudo()
                rate = TermRate.search([('active', '=', True), ('term_months', '=', int(rec.term_months))], limit=1)
                if rate:
                    rec.interest_rate = rate.interest_rate
                else:
                    rec.interest_rate = rec.interest_rate or 0.0
            except Exception:
                rec.interest_rate = rec.interest_rate or 0.0