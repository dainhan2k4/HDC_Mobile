from odoo import api, fields, models

class Fund(models.Model):
    _name = "portfolio.fund"
    _description = "Fund"

    name = fields.Char(string="Name", required=True)
    ticker = fields.Char(string="Ticker", required=True)
    description = fields.Text(string="Description")
    inception_date = fields.Date(string="Inception Date", required=True)
    current_ytd = fields.Float(string="Current YTD", required=True)
    current_nav = fields.Float(string="Current NAV", required=True)
    investment_type = fields.Selection([
        ('Income', 'Income'),
        ('Growth', 'Growth'),
        ('Income & Growth', 'Income & Growth'),
        ('Capital Growth', 'Capital Growth')
    ], string="Investment Type", required=True)
    is_shariah = fields.Boolean(string="Is Shariah")
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('closed', 'Closed'),
    ], string="Status", default='active', required=True)
    ytd_history = fields.Text(string="YTD History (JSON)")
    nav_history = fields.Text(string="NAV History (JSON)")
    launch_price = fields.Float(string="Launch Price", required=True)