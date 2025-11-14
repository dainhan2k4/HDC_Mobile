from odoo import models, fields


class IntradayOHLC(models.Model):
    """Intraday OHLC Data"""
    _name = 'ssi.intraday.ohlc'
    _description = 'Intraday OHLC Data'
    _order = 'date desc, time desc'

    security_id = fields.Many2one('ssi.securities', string='Security', required=True, ondelete='cascade')
    symbol = fields.Char(related='security_id.symbol', store=True, readonly=True)
    currency_id = fields.Many2one(related='security_id.currency_id', store=True, readonly=True)

    date = fields.Date('Date', required=True, index=True)
    time = fields.Char('Time', required=True)
    open_price = fields.Float('Open Price')
    high_price = fields.Float('High Price')
    low_price = fields.Float('Low Price')
    close_price = fields.Float('Close Price')
    volume = fields.Float('Volume')
    resolution = fields.Integer('Resolution (minutes)')
    total_value = fields.Float('Total Value')


