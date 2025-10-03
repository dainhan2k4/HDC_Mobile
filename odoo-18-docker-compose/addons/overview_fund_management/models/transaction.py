from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import json
from datetime import datetime


class Transaction(models.Model):
    _name = "portfolio.transaction"
    _description = "Transaction"
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(string="Name", compute='_compute_name', store=True, tracking=True)
    user_id = fields.Many2one("res.users", string="User", required=True, default=lambda self: self.env.user, tracking=True)
    fund_id = fields.Many2one("portfolio.fund", string="Fund", required=True, tracking=True)
    transaction_type = fields.Selection([
        ('purchase', 'Purchase'),
        ('sell', 'Sell'),
        ('exchange', 'Exchange')
    ], string="Transaction Type", required=True, tracking=True)
    units = fields.Float(string="Units", required=True, tracking=True)
    price = fields.Monetary(string="Price per Unit", required=True, tracking=True, help="Price per unit for this transaction")
    destination_fund_id = fields.Many2one('portfolio.fund', string='Destination Fund', tracking=True)
    destination_units = fields.Float(string="Destination Units", tracking=True)
    destination_price = fields.Monetary(string="Destination Price per Unit", tracking=True, help="Price per unit for destination fund in exchange transaction")
    amount = fields.Monetary(string="Total Amount", compute='_compute_amount', store=True, tracking=True, help="Total amount (units * price)")
    fee = fields.Monetary(string="Phí mua", default=0.0, help="Phí mua cho giao dịch này", currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', string='Currency', required=True, default=lambda self: self.env.company.currency_id, tracking=True)
    created_at = fields.Datetime(string="Created At", required=True, default=fields.Datetime.now, tracking=True)
    date_end = fields.Datetime(string="Date End At", tracking=True)
    contract_pdf_path = fields.Char(string="Contract PDF Path")
    current_nav = fields.Float(string="NAV at transaction time", help="NAV value when transaction was made")
    status = fields.Selection([
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string="Status", default='pending', required=True, tracking=True)
    investment_type = fields.Selection([
        ('stock', 'Stock'),
        ('bond', 'Bond'),
        ('real_estate', 'Real Estate'),
        ('crypto', 'Cryptocurrency'),
        ('fund_certificate', 'Fund Certificate'),
        ('deposit', 'Deposit'),
        ('etf', 'ETF'),
        ('other', 'Other')
    ], string="Investment Type", required=True, default='fund_certificate', tracking=True)
    transaction_date = fields.Date(string="Transaction Date", default=fields.Date.today, tracking=True)
    description = fields.Text(string="Description", tracking=True)
    reference = fields.Char(string="Reference", tracking=True)
    calculated_amount = fields.Monetary(string="Calculated Amount", compute='_compute_calculated_amount', store=True, currency_field='currency_id')

    # Added fields for NAV Management integration (ensure related fields exist)
    term_months = fields.Integer(string="Kỳ hạn (tháng)", default=12)
    interest_rate = fields.Float(string="Lãi suất (%)", digits=(16, 2))

    # Source field for transaction origin
    source = fields.Selection([
        ('portal', 'Portal'),
        ('sale', 'Sale Portal'),
        ('portfolio', 'Portfolio')
    ], string="Source", default='portfolio', tracking=True)

    @api.depends('units', 'price')
    def _compute_amount(self):
        """Tính toán tổng số tiền từ units * price"""
        for record in self:
            if record.units and record.price:
                record.amount = record.units * record.price
            else:
                record.amount = 0.0

    @api.depends('created_at')
    def _compute_transaction_time(self):
        for record in self:
            if record.created_at:
                record.transaction_time = record.created_at.strftime('%H:%M')
            else:
                record.transaction_time = ''

    @api.constrains('units', 'price')
    def _check_values(self):
        for record in self:
            if record.units <= 0:
                raise ValidationError(_('Units must be greater than zero'))
            if record.price <= 0:
                raise ValidationError(_('Price must be greater than zero'))

    def action_complete(self):
        for trans in self:
            if trans.status != 'pending':
                raise ValidationError(_("Only pending transactions can be completed."))
            trans.status = 'completed'
            trans._update_investment()

    def action_cancel(self):
        for trans in self:
            if trans.status == 'completed':
                trans._revert_investment_update()
            trans.status = 'cancelled'

    def _update_investment(self):
        self.ensure_one()
        Investment = self.env['portfolio.investment']
        investment = Investment.search([
            ('user_id', '=', self.user_id.id),
            ('fund_id', '=', self.fund_id.id),
        ], limit=1)

        if self.transaction_type == 'purchase':
            if investment:
                investment.write({
                    'units': investment.units + self.units,
                    'amount': investment.amount + self.amount,
                    'status': 'active'
                })
            else:
                Investment.with_context(from_transaction=True).create({
                    'user_id': self.user_id.id,
                    'fund_id': self.fund_id.id,
                    'units': self.units,
                    'amount': self.amount,
                    'currency_id': self.currency_id.id,
                    'investment_type': self.investment_type,
                })
        elif self.transaction_type == 'sell':
            if not investment or investment.units < self.units:
                raise ValidationError(_("Not enough units to sell for user %s in fund %s.", self.user_id.name, self.fund_id.name))
            
            proportional_amount = (investment.amount / investment.units) * self.units if investment.units else 0
            
            new_units = investment.units - self.units
            investment.write({
                'units': new_units,
                'amount': investment.amount - proportional_amount,
                'status': 'closed' if new_units == 0 else 'active'
            })
        elif self.transaction_type == 'exchange':
            # Sale from source fund
            investment_source = Investment.search([
                ('user_id', '=', self.user_id.id),
                ('fund_id', '=', self.fund_id.id),
            ], limit=1)
            if not investment_source or investment_source.units < self.units:
                raise ValidationError(_("Not enough units to exchange from fund %s.", self.fund_id.name))
            
            proportional_amount_sold = (investment_source.amount / investment_source.units) * self.units if investment_source.units else 0
            new_source_units = investment_source.units - self.units
            investment_source.write({
                'units': new_source_units,
                'amount': investment_source.amount - proportional_amount_sold,
                'status': 'closed' if new_source_units == 0 else 'active'
            })

            # Purchase into destination fund
            if not self.destination_fund_id:
                raise ValidationError(_("Destination fund is required for exchange transaction."))
            
            investment_dest = Investment.search([
                ('user_id', '=', self.user_id.id),
                ('fund_id', '=', self.destination_fund_id.id),
            ], limit=1)

            if investment_dest:
                investment_dest.write({
                    'units': investment_dest.units + self.destination_units,
                    'amount': investment_dest.amount + self.amount,
                    'status': 'active'
                })
            else:
                Investment.with_context(from_transaction=True).create({
                    'user_id': self.user_id.id,
                    'fund_id': self.destination_fund_id.id,
                    'units': self.destination_units,
                    'amount': self.amount,
                    'currency_id': self.currency_id.id,
                    'investment_type': self.investment_type,
                })

    def _revert_investment_update(self):
        self.ensure_one()
        Investment = self.env['portfolio.investment']
        investment = Investment.search([
            ('user_id', '=', self.user_id.id),
            ('fund_id', '=', self.fund_id.id),
        ], limit=1)

        if not investment:
            return

        if self.transaction_type == 'purchase':
            new_units = investment.units - self.units
            investment.write({
                'units': new_units,
                'amount': investment.amount - self.amount,
                'status': 'closed' if new_units <= 0 else 'active'
            })
        elif self.transaction_type == 'sell':
            proportional_amount = (investment.amount / (investment.units if investment.units else 1)) * self.units
            investment.write({
                'units': investment.units + self.units,
                'amount': investment.amount + proportional_amount,
                'status': 'active'
            })
        elif self.transaction_type == 'exchange':
            # Revert sale from source
            investment_source = Investment.search([
                ('user_id', '=', self.user_id.id),
                ('fund_id', '=', self.fund_id.id),
            ], limit=1)
            if investment_source:
                 proportional_amount_sold = (investment_source.amount / (investment_source.units if investment_source.units else 1)) * self.units
                 investment_source.write({
                    'units': investment_source.units + self.units,
                    'amount': investment_source.amount + proportional_amount_sold,
                    'status': 'active'
                })
            
            # Revert purchase from destination
            if not self.destination_fund_id:
                return
            
            investment_dest = Investment.search([
                ('user_id', '=', self.user_id.id),
                ('fund_id', '=', self.destination_fund_id.id),
            ], limit=1)

            if investment_dest:
                new_dest_units = investment_dest.units - self.destination_units
                investment_dest.write({
                    'units': new_dest_units,
                    'amount': investment_dest.amount - self.amount,
                    'status': 'closed' if new_dest_units <= 0 else 'active'
                })

    def _update_fund_units(self):
        self.ensure_one()
        if self.transaction_type == 'purchase':
            self.fund_id.total_units += self.units
        elif self.transaction_type == 'sell':
            self.fund_id.total_units -= self.units
        elif self.transaction_type == 'exchange':
            self.fund_id.total_units -= self.units
            self.destination_fund_id.total_units += self.destination_units

    @api.depends('units', 'amount', 'investment_type')
    def _compute_calculated_amount(self):
        for record in self:
            # Sử dụng giá trị thực tế từ form thay vì current_nav
            if record.investment_type == 'fund_certificate' and record.units > 0:
                # Tính từ amount thực tế thay vì current_nav
                record.calculated_amount = record.amount
            else:
                record.calculated_amount = record.amount

    @api.depends('fund_id', 'transaction_type', 'units', 'transaction_date')
    def _compute_name(self):
        for record in self:
            if record.fund_id and record.transaction_type and record.units and record.transaction_date:
                if record.transaction_type == 'exchange':
                    record.name = f"{record.transaction_type.upper()} - {record.fund_id.name} to {record.destination_fund_id.name} - {record.units} units - {record.transaction_date}"
                else:
                    record.name = f"{record.transaction_type.upper()} - {record.fund_id.name} - {record.units} units - {record.transaction_date}"
            else:
                record.name = "New Transaction"
