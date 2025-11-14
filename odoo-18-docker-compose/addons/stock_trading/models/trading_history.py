# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging
import json

_logger = logging.getLogger(__name__)


class TradingOrderHistory(models.Model):
    """Lịch sử lệnh"""
    _name = 'trading.order.history'
    _description = 'Order History'
    _order = 'create_date desc'

    name = fields.Char(
        string='Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New')
    )
    
    config_id = fields.Many2one(
        'trading.config',
        string='API Configuration',
        required=True,
        ondelete='restrict'
    )
    
    account = fields.Char(
        string='Account',
        required=True
    )
    
    start_date = fields.Date(
        string='Start Date',
        required=True
    )
    
    end_date = fields.Date(
        string='End Date',
        required=True
    )
    
    raw_response = fields.Text(
        string='Raw Response',
        readonly=True
    )
    
    last_sync = fields.Datetime(
        string='Last Sync',
        readonly=True
    )

    def action_sync_history(self):
        """Sync lịch sử lệnh"""
        self.ensure_one()
        
        try:
            client = self.config_id.get_api_client()
            
            # Format date: DD/MM/YYYY
            start_date_str = self.start_date.strftime('%d/%m/%Y')
            end_date_str = self.end_date.strftime('%d/%m/%Y')
            
            result = client.get_order_history(self.account, start_date_str, end_date_str)
            
            self.write({
                'raw_response': json.dumps(result, indent=2),
                'last_sync': fields.Datetime.now(),
            })
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Đã sync lịch sử lệnh thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error syncing order history: {e}')
            raise UserError(_('Không thể sync lịch sử lệnh: %s') % str(e))


class TradingOrderBook(models.Model):
    """Sổ lệnh"""
    _name = 'trading.order.book'
    _description = 'Order Book'
    _order = 'create_date desc'

    name = fields.Char(
        string='Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New')
    )
    
    config_id = fields.Many2one(
        'trading.config',
        string='API Configuration',
        required=True,
        ondelete='restrict'
    )
    
    account = fields.Char(
        string='Account',
        required=True
    )
    
    book_type = fields.Selection([
        ('normal', 'Order Book'),
        ('audit', 'Audit Order Book'),
    ], string='Book Type', required=True, default='normal',
       help='Loại sổ lệnh: normal hoặc audit (có lỗi)')
    
    raw_response = fields.Text(
        string='Raw Response',
        readonly=True
    )
    
    last_sync = fields.Datetime(
        string='Last Sync',
        readonly=True
    )

    def action_sync_order_book(self):
        """Sync sổ lệnh"""
        self.ensure_one()
        
        try:
            client = self.config_id.get_api_client()
            
            if self.book_type == 'normal':
                result = client.get_order_book(self.account)
            else:
                result = client.get_audit_order_book(self.account)
            
            self.write({
                'raw_response': json.dumps(result, indent=2),
                'last_sync': fields.Datetime.now(),
            })
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Đã sync sổ lệnh thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error syncing order book: {e}')
            raise UserError(_('Không thể sync sổ lệnh: %s') % str(e))


class TradingRateLimit(models.Model):
    """Rate Limit"""
    _name = 'trading.rate.limit'
    _description = 'Rate Limit'
    _order = 'create_date desc'

    name = fields.Char(
        string='Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New')
    )
    
    config_id = fields.Many2one(
        'trading.config',
        string='API Configuration',
        required=True,
        ondelete='restrict'
    )
    
    raw_response = fields.Text(
        string='Raw Response',
        readonly=True
    )
    
    last_sync = fields.Datetime(
        string='Last Sync',
        readonly=True
    )

    def action_get_rate_limit(self):
        """Lấy rate limit"""
        self.ensure_one()
        
        try:
            client = self.config_id.get_api_client()
            result = client.get_rate_limit()
            
            self.write({
                'raw_response': json.dumps(result, indent=2),
                'last_sync': fields.Datetime.now(),
            })
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Đã lấy rate limit thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error getting rate limit: {e}')
            raise UserError(_('Không thể lấy rate limit: %s') % str(e))

