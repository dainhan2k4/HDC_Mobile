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
    created_at = fields.Datetime(string="Created At", required=True)

    @api.model
    def create_transaction(self, user_id, fund_id, transaction_type, units, amount):
        return self.sudo().create({
            'user_id': user_id,
            'fund_id': fund_id,
            'transaction_type': transaction_type,
            'units': units,
            'amount': amount,
            'created_at': fields.Datetime.now()
        })