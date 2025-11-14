from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class SSIApiConfig(models.Model):
    """Configuration for SSI FastConnect Data API"""
    _name = 'ssi.api.config'
    _description = 'SSI API Configuration'
    _rec_name = 'name'

    name = fields.Char('Configuration Name', required=True, default='Default Configuration')
    
    # API Credentials
    consumer_id = fields.Char('Consumer ID', required=True)
    consumer_secret = fields.Char('Consumer Secret', required=True)
    
    # API URL
    api_url = fields.Char('API URL', required=True, default='https://fc-data.ssi.com.vn/')
    
    # Status
    is_active = fields.Boolean('Is Active', default=True)
    last_sync_date = fields.Datetime('Last Sync Date', readonly=True)
    last_sync_status = fields.Selection([
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('not_synced', 'Not Synced')
    ], string='Last Sync Status', default='not_synced', readonly=True)

    # Streaming features removed

    @api.model
    def get_config(self):
        """Get active configuration"""
        config = self.search([('is_active', '=', True)], limit=1)
        return config

    # Realtime/streaming actions removed




