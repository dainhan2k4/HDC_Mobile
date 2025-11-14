# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging
import json
from ssi_fc_data import model, fc_md_client

_logger = logging.getLogger(__name__)


class SecuritiesDetails(models.Model):
    """Chi tiết chứng khoán từ SSI API"""
    _name = 'ssi.securities.details'
    _description = 'Securities Details'
    _order = 'fetch_date desc, symbol asc'

    name = fields.Char(
        string='Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New')
    )
    
    security_id = fields.Many2one(
        'ssi.securities',
        string='Security',
        ondelete='cascade',
        index=True
    )
    
    symbol = fields.Char(
        string='Symbol',
        required=True,
        index=True,
        help='Mã chứng khoán'
    )
    
    market = fields.Selection([
        ('HOSE', 'HOSE'),
        ('HNX', 'HNX'),
        ('UPCOM', 'UPCOM')
    ], string='Market', required=True, index=True)
    
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
            # Tạo name từ symbol và market
            symbol = vals.get('symbol', '')
            market = vals.get('market', '')
            if symbol and market:
                vals['name'] = f"{symbol}-{market}"
            else:
                vals['name'] = _('New')
        return super().create(vals)
    
    def action_fetch_details(self):
        """Lấy chi tiết chứng khoán từ API"""
        self.ensure_one()
        
        if not self.symbol:
            raise UserError(_('Vui lòng nhập Symbol'))
        
        if not self.market:
            raise UserError(_('Vui lòng chọn Market'))
        
        try:
            from ..utils.utils import SdkConfigBuilder
            
            config = self.env['ssi.api.config'].get_config()
            if not config:
                raise UserError(_('Chưa cấu hình API. Vui lòng cấu hình API trước.'))
            
            sdk_config = SdkConfigBuilder.build_config(config)
            client = fc_md_client.MarketDataClient(sdk_config)
            
            req = model.securities_details(
                market=self.market,
                symbol=self.symbol,
                pageIndex='1',
                pageSize='100'
            )
            
            response = client.securities_details(sdk_config, req)
            
            self.write({
                'raw_response': json.dumps(response, indent=2, ensure_ascii=False),
                'fetch_date': fields.Datetime.now(),
            })
            
            # Parse và cập nhật security nếu có
            if response.get('status') == 'Success' and response.get('data'):
                data = response['data']
                
                # Tìm hoặc tạo security record
                security = self.env['ssi.securities'].search([
                    ('symbol', '=', self.symbol),
                    ('market', '=', self.market)
                ], limit=1)
                
                if security:
                    self.security_id = security.id
                elif isinstance(data, dict):
                    # Tạo security record mới nếu chưa có
                    security = self.env['ssi.securities'].create({
                        'symbol': self.symbol,
                        'market': self.market,
                        'stock_name_vn': data.get('StockName', ''),
                        'stock_name_en': data.get('StockEnName', ''),
                        'floor_code': data.get('FloorCode', ''),
                        'security_type': data.get('SecurityType', ''),
                    })
                    self.security_id = security.id
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Đã lấy chi tiết chứng khoán thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error fetching securities details: {e}')
            raise UserError(_('Không thể lấy chi tiết chứng khoán: %s') % str(e))

