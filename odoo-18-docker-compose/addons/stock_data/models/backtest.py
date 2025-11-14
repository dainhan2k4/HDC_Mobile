# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging
import json
from ssi_fc_data import model, fc_md_client

_logger = logging.getLogger(__name__)


class Backtest(models.Model):
    """Dữ liệu Backtest từ SSI API"""
    _name = 'ssi.backtest'
    _description = 'Backtest Data'
    _order = 'selected_date desc, symbol asc'

    name = fields.Char(
        string='Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New')
    )
    
    security_id = fields.Many2one(
        'ssi.securities',
        string='Security',
        ondelete='set null',
        index=True
    )
    
    symbol = fields.Char(
        string='Symbol',
        required=True,
        index=True,
        help='Mã chứng khoán'
    )
    
    selected_date = fields.Date(
        string='Selected Date',
        required=True,
        index=True,
        help='Ngày được chọn cho backtest'
    )
    
    fetch_date = fields.Datetime(
        string='Fetch Date',
        default=fields.Datetime.now,
        readonly=True,
        index=True
    )
    
    # Raw response from API
    raw_response = fields.Text(
        string='Raw Response',
        readonly=True,
        help='Raw JSON response từ API'
    )
    
    # Parsed fields (có thể parse từ JSON nếu cần)
    # Các field này sẽ được parse từ raw_response theo cấu trúc API
    
    notes = fields.Text(string='Notes')

    @api.model
    def create(self, vals):
        """Override create để tự động tạo name"""
        if vals.get('name', _('New')) == _('New'):
            # Tạo name từ symbol và selected_date
            symbol = vals.get('symbol', '')
            selected_date = vals.get('selected_date')
            if symbol and selected_date:
                from datetime import datetime
                if isinstance(selected_date, str):
                    date_str = selected_date
                else:
                    date_str = selected_date.strftime('%Y-%m-%d') if hasattr(selected_date, 'strftime') else str(selected_date)
                vals['name'] = f"{symbol}-{date_str}"
            else:
                vals['name'] = _('New')
        return super().create(vals)
    
    def action_fetch_backtest(self):
        """Lấy dữ liệu backtest từ API"""
        self.ensure_one()
        
        if not self.symbol:
            raise UserError(_('Vui lòng nhập Symbol'))
        
        if not self.selected_date:
            raise UserError(_('Vui lòng chọn Selected Date'))
        
        try:
            from ..utils.utils import SdkConfigBuilder
            
            config = self.env['ssi.api.config'].get_config()
            if not config:
                raise UserError(_('Chưa cấu hình API. Vui lòng cấu hình API trước.'))
            
            sdk_config = SdkConfigBuilder.build_config(config)
            client = fc_md_client.MarketDataClient(sdk_config)
            
            req = model.backtest(
                symbol=self.symbol,
                selectedDate=self.selected_date.strftime('%d/%m/%Y')
            )
            
            response = client.backtest(sdk_config, req)
            
            self.write({
                'raw_response': json.dumps(response, indent=2, ensure_ascii=False),
                'fetch_date': fields.Datetime.now(),
            })
            
            # Parse và cập nhật security nếu có
            if response.get('status') == 'Success' and response.get('data'):
                # Tìm security record
                security = self.env['ssi.securities'].search([
                    ('symbol', '=', self.symbol)
                ], limit=1)
                
                if security:
                    self.security_id = security.id
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Đã lấy dữ liệu backtest thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error fetching backtest data: {e}')
            raise UserError(_('Không thể lấy dữ liệu backtest: %s') % str(e))

