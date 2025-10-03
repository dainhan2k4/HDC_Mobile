from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 16

class Fund(models.Model):
    _name = "portfolio.fund"
    _description = "Fund"
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    name = fields.Char(string="Name", required=True, tracking=True)
    ticker = fields.Char(string="Ticker", required=True, tracking=True)
    description = fields.Text(string="Description", tracking=True)
    inception_date = fields.Date(string="Inception Date", required=True, tracking=True)
    current_ytd = fields.Float(string="Current YTD", required=True, tracking=True)
    current_nav = fields.Float(string="Current NAV", required=True, tracking=True)
    investment_type = fields.Selection([
        ('equity', 'Equity'),
        ('fixed_income', 'Fixed Income'),
        ('balanced', 'Balanced'),
        ('money_market', 'Money Market'),
        ('real_estate', 'Real Estate'),
        ('commodity', 'Commodity'),
        ('crypto', 'Cryptocurrency'),
        ('multi_asset', 'Multi-Asset'),
        ('alternative', 'Alternative'),
    ], string="Investment Type", required=True, tracking=True)
    is_shariah = fields.Boolean(string="Is Shariah", tracking=True)
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('closed', 'Closed'),
    ], string="Status", default='active', required=True, tracking=True)
    ytd_history_json = fields.Text(string="YTD History (JSON)", tracking=True)
    nav_history_json = fields.Text(string="NAV History (JSON)", tracking=True)
    launch_price = fields.Float(string="Launch Price", required=True, tracking=True)
    currency_id = fields.Many2one('res.currency', string='Currency', required=True, tracking=True, default=lambda self: self.env.company.currency_id)
    
    # Thêm trường One2many để liên kết với Investments
    investment_ids = fields.One2many('portfolio.investment', 'fund_id', string='Investments')

    # Thêm các trường mới
    total_units = fields.Float(string="Total Units", compute='_compute_total_units', store=True)
    total_investment = fields.Float(string="Total Investment", compute='_compute_total_investment', store=True)
    current_value = fields.Float(string="Current Value", compute='_compute_current_value', store=True)
    profit_loss = fields.Float(string="Profit/Loss", compute='_compute_profit_loss', store=True)
    profit_loss_percentage = fields.Float(string="Profit/Loss %", compute='_compute_profit_loss_percentage', store=True)
    flex_sip_percentage = fields.Float(string="Flex/SIP %", default=0.0)
    color = fields.Selection([
        ('#2B4BFF', 'Blue'),
        ('#FF5733', 'Orange'),
        ('#33FF57', 'Green'),
        ('#FF33EE', 'Pink'),
        ('#33B5FF', 'Light Blue'),
        ('#FFD700', 'Gold'),
        ('#8A2BE2', 'Blue Violet'),
        ('#DC143C', 'Crimson'),
        ('#00CED1', 'Dark Cyan'),
        ('#FF8C00', 'Dark Orange'),
    ], string="Color", tracking=True)
    previous_nav = fields.Float(string="Previous NAV", required=True, tracking=True)
    flex_units = fields.Float(string="Flex Units", compute='_compute_flex_units', store=True)
    sip_units = fields.Float(string="SIP Units", compute='_compute_sip_units', store=True)
    last_update = fields.Date(string="Last Update", default=fields.Date.today, tracking=True)

    # Thêm trường để theo dõi số lượng đầu tư
    investment_count = fields.Integer(string="Investment Count", compute='_compute_investment_count', store=True)
    
    @api.model
    def _get_next_available_color(self):
        all_colors = [c[0] for c in self._fields['color'].selection]
        used_colors = self.search([]).mapped('color')
        available_colors = [c for c in all_colors if c not in used_colors]

        if available_colors:
            return available_colors[0]
        else:
            # If all colors are used, cycle through them
            return all_colors[len(used_colors) % len(all_colors)]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('color'):
                vals['color'] = self._get_next_available_color()
        records = super().create(vals_list)
        records._recompute_all_dependent_fields()
        return records

    def write(self, vals):
        res = super(Fund, self).write(vals)
        if any(field in vals for field in ['current_nav', 'previous_nav', 'current_ytd']):
            self._recompute_all_dependent_fields()
        return res

    @api.depends('current_nav', 'investment_ids.units')
    def _compute_current_value(self):
        for record in self:
            try:
                nav = Decimal(str(record.current_nav or 0))
                total_units = Decimal(str(record.total_units or 0))
                value = (nav * total_units).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                record.current_value = float(value)
            except Exception:
                record.current_value = 0.0

    @api.depends('investment_ids.amount')
    def _compute_total_investment(self):
        for record in self:
            try:
                total = sum([Decimal(str(i.amount)) for i in record.investment_ids])
                record.total_investment = float(Decimal(total).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            except Exception:
                record.total_investment = 0.0

    @api.depends('investment_ids.units')
    def _compute_total_units(self):
        for record in self:
            try:
                total = sum([Decimal(str(i.units)) for i in record.investment_ids])
                record.total_units = float(Decimal(total).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            except Exception:
                record.total_units = 0.0

    @api.depends('investment_ids.units', 'investment_ids.investment_type')
    def _compute_flex_units(self):
        for record in self:
            flex_investments = record.investment_ids.filtered(lambda i: i.investment_type == 'stock')
            record.flex_units = sum(flex_investments.mapped('units'))

    @api.depends('investment_ids.units', 'investment_ids.investment_type')
    def _compute_sip_units(self):
        for record in self:
            sip_investments = record.investment_ids.filtered(lambda i: i.investment_type == 'bond')
            record.sip_units = sum(sip_investments.mapped('units'))

    @api.depends('total_investment', 'current_value')
    def _compute_profit_loss(self):
        for record in self:
            try:
                current_value = Decimal(str(record.current_value))
                total_investment = Decimal(str(record.total_investment))
                pl = (current_value - total_investment).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                record.profit_loss = float(pl)
            except Exception:
                record.profit_loss = 0.0

    @api.depends('total_investment', 'profit_loss')
    def _compute_profit_loss_percentage(self):
        for record in self:
            try:
                total_investment = Decimal(str(record.total_investment))
                profit_loss = Decimal(str(record.profit_loss))
                if total_investment:
                    percent = ((profit_loss / total_investment) * Decimal('100')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                else:
                    percent = Decimal('0.00')
                record.profit_loss_percentage = float(percent)
            except Exception:
                record.profit_loss_percentage = 0.0

    @api.constrains('current_nav', 'previous_nav', 'current_ytd')
    def _check_nav_values(self):
        for record in self:
            if record.current_nav < 0:
                raise ValidationError(_('Current NAV cannot be negative'))
            if record.previous_nav < 0:
                raise ValidationError(_('Previous NAV cannot be negative'))
            if record.current_ytd < 0:
                raise ValidationError(_('Current YTD cannot be negative'))

    def action_update_nav(self):
        self.ensure_one()
        # Update previous NAV
        self.previous_nav = self.current_nav
        # Update last update time
        self.last_update = fields.Date.today()
        # Update YTD history
        self._update_ytd_history()
        # Update NAV history
        self._update_nav_history()

    def _update_ytd_history(self):
        self.ensure_one()
        history = []
        if self.ytd_history_json:
            try:
                history = json.loads(self.ytd_history_json)
            except json.JSONDecodeError:
                history = []
        
        history.append({
            'date': fields.Date.today().isoformat(),
            'value': self.current_ytd
        })
        
        self.ytd_history_json = json.dumps(history)

    def _update_nav_history(self):
        self.ensure_one()
        history = []
        if self.nav_history_json:
            try:
                history = json.loads(self.nav_history_json)
            except json.JSONDecodeError:
                history = []
        
        history.append({
            'date': fields.Date.today().isoformat(),
            'value': self.current_nav
        })
        
        self.nav_history_json = json.dumps(history)

    @api.depends('investment_ids')
    def _compute_investment_count(self):
        for record in self:
            record.investment_count = len(record.investment_ids)

    def _recompute_all_dependent_fields(self):
        """Force recompute all computed fields"""
        self._compute_total_units()
        self._compute_total_investment()
        self._compute_current_value()
        self._compute_profit_loss()
        self._compute_profit_loss_percentage()
        self._compute_flex_units()
        self._compute_sip_units()
        self._compute_investment_count()