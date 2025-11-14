from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging
from ssi_fc_data import model, fc_md_client
from datetime import datetime

_logger = logging.getLogger(__name__)


class DailyOHLC(models.Model):
    """Daily OHLC (Open, High, Low, Close) Data"""
    _name = 'ssi.daily.ohlc'
    _description = 'Daily OHLC Data'
    _order = 'date desc'
    _rec_name = 'date'

    security_id = fields.Many2one('ssi.securities', string='Security', required=True, ondelete='cascade')
    symbol = fields.Char(related='security_id.symbol', store=True, readonly=True)
    currency_id = fields.Many2one(related='security_id.currency_id', store=True, readonly=True)

    date = fields.Date('Date', required=True, index=True)
    
    # Relation to Intraday OHLC for the same date and security
    intraday_ohlc_ids = fields.One2many(
        'ssi.intraday.ohlc', 
        'security_id', 
        string='Intraday OHLC Data'
    )
    intraday_ohlc_count = fields.Integer(
        string='Intraday OHLC Count',
        compute='_compute_intraday_ohlc_count',
        store=False
    )
    open_price = fields.Float('Open Price')
    high_price = fields.Float('High Price')
    low_price = fields.Float('Low Price')
    close_price = fields.Float('Close Price')
    volume = fields.Float('Volume')
    value = fields.Float('Total Value')
    change = fields.Float('Change')
    change_percent = fields.Float('Change (%)')
    previous_close = fields.Float('Previous Close')
    last_update = fields.Datetime('Last Update', default=fields.Datetime.now)

    _sql_constraints = [
        ('date_symbol_unique', 'unique(date, security_id)', 'Date and Security combination must be unique!')
    ]

    def _propagate_to_security(self):
        """Update parent security summary fields using the latest daily OHLC record.
        Always propagate from the newest date for each security to ensure consistency.
        """
        # Group by security_id to process each security once
        security_ids = set(self.mapped('security_id').ids)
        daily_ohlc_model = self.env['ssi.daily.ohlc']
        
        for sec_id in security_ids:
            if not sec_id:
                continue
            # Always get the newest Daily OHLC for this security from entire table
            newest_ohlc = daily_ohlc_model.search([
                ('security_id', '=', sec_id)
            ], order='date desc', limit=1)
            
            if not newest_ohlc:
                continue
                
            sec = newest_ohlc.security_id
            vals = {
                'last_trading_date': newest_ohlc.date,
                'current_price': newest_ohlc.close_price if newest_ohlc.close_price else sec.current_price,
                'high_price': newest_ohlc.high_price if newest_ohlc.high_price else sec.high_price,
                'low_price': newest_ohlc.low_price if newest_ohlc.low_price else sec.low_price,
                'last_price': newest_ohlc.close_price if newest_ohlc.close_price else sec.last_price,
                'volume': newest_ohlc.volume if newest_ohlc.volume else sec.volume,
                # total_value, change, change_percent are computed fields - don't set directly
                'last_update': fields.Datetime.now(),
            }
            # Nếu có previous_close từ OHLC mới nhất, dùng làm reference_price (tham chiếu)
            # để tính Change/Change% chuẩn theo thị trường (Close - Previous Close)
            if newest_ohlc.previous_close and newest_ohlc.previous_close > 0:
                vals['reference_price'] = newest_ohlc.previous_close
            try:
                sec.sudo().write(vals)
            except Exception:
                # Ignore write errors to avoid blocking OHLC ingestion
                pass

    def _auto_fetch_intraday_ohlc(self):
        """Tự động lấy Intraday OHLC cho record này (chỉ cho ngày hôm nay)"""
        try:
            # Chỉ tự động fetch cho ngày hôm nay để tránh quá tải
            if self.date != fields.Date.today():
                return
            
            if not self.security_id:
                return
            
            # Kiểm tra xem đã có Intraday OHLC chưa
            intraday_count = self.env['ssi.intraday.ohlc'].search_count([
                ('security_id', '=', self.security_id.id),
                ('date', '=', self.date)
            ])
            
            # Nếu đã có dữ liệu Intraday, không fetch lại
            if intraday_count > 0:
                return
            
            # Gọi method fetch intraday OHLC (chỉ fetch data, không trả về notification)
            self._fetch_intraday_ohlc_silent()
        except Exception as e:
            # Log lỗi nhưng không block việc tạo/cập nhật Daily OHLC
            _logger.debug("Lỗi khi tự động fetch Intraday OHLC cho %s ngày %s: %s", 
                         self.symbol, self.date, str(e))
            pass

    def _fetch_intraday_ohlc_silent(self):
        """Lấy Intraday OHLC từ Securities (không trả về notification, dùng cho auto fetch)"""
        try:
            import ssi_fc_data
            from datetime import timedelta
            
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)
            
            if not self.security_id:
                return
            
            security = self.security_id
            target_date = self.date
            
            # Fetch Intraday OHLC cho ngày này
            intraday_model = self.env['ssi.intraday.ohlc']
            current_page = 1
            page_size = 500
            total_records = 0
            
            _logger.info("Tự động fetch Intraday OHLC cho %s ngày %s", 
                        security.symbol, target_date.strftime('%d/%m/%Y'))
            
            while True:
                try:
                    intraday_req = model.intraday_ohlc(
                        symbol=security.symbol,
                        fromDate=target_date.strftime('%d/%m/%Y'),
                        toDate=target_date.strftime('%d/%m/%Y'),
                        pageIndex=current_page,
                        pageSize=page_size,
                        ascending=True,
                        resolution=1
                    )
                    
                    intraday_response = client.intraday_ohlc(sdk_config, intraday_req)
                    
                    if intraday_response.get('status') != 'Success' or not intraday_response.get('data'):
                        break
                    
                    intraday_items = intraday_response['data'] if isinstance(intraday_response['data'], list) else []
                    if not intraday_items:
                        break
                    
                    # Lưu hoặc cập nhật Intraday OHLC records
                    for item in intraday_items:
                        time_str = item.get('Time', '') or item.get('time', '')
                        if not time_str:
                            continue
                        
                        # Kiểm tra xem đã có record chưa
                        existing = intraday_model.search([
                            ('security_id', '=', security.id),
                            ('date', '=', target_date),
                            ('time', '=', time_str)
                        ], limit=1)
                        
                        values = {
                            'security_id': security.id,
                            'date': target_date,
                            'time': time_str,
                            'open_price': item.get('Open', 0.0) or item.get('open', 0.0) or 0.0,
                            'high_price': item.get('High', 0.0) or item.get('high', 0.0) or 0.0,
                            'low_price': item.get('Low', 0.0) or item.get('low', 0.0) or 0.0,
                            'close_price': item.get('Close', 0.0) or item.get('close', 0.0) or 0.0,
                            'volume': item.get('Volume', 0.0) or item.get('volume', 0.0) or 0.0,
                            'total_value': item.get('TotalValue', 0.0) or item.get('totalValue', 0.0) or 0.0,
                            'resolution': item.get('Resolution', 1) or item.get('resolution', 1) or 1,
                        }
                        
                        if existing:
                            existing.write(values)
                        else:
                            intraday_model.create(values)
                        
                        total_records += 1
                    
                    # Nếu số records trả về ít hơn page_size, có thể đã hết dữ liệu
                    if len(intraday_items) < page_size:
                        break
                    
                    current_page += 1
                    
                    # Commit sau mỗi page để tránh transaction quá lớn
                    try:
                        self.env.cr.commit()
                    except Exception:
                        pass
                
                except Exception as e:
                    _logger.error("Lỗi khi fetch Intraday OHLC page %d: %s", current_page, str(e))
                    break
            
            _logger.info("Hoàn thành tự động fetch Intraday OHLC: %d records cho %s ngày %s", 
                        total_records, security.symbol, target_date.strftime('%d/%m/%Y'))
            
        except ImportError:
            _logger.warning("SSI SDK chưa được cài đặt. Không thể fetch Intraday OHLC.")
        except Exception as e:
            _logger.exception("Lỗi khi fetch Intraday OHLC: %s", str(e))

    @api.model
    def create(self, vals):
        rec = super().create(vals)
        rec._propagate_to_security()
        # Tự động fetch Intraday OHLC cho ngày hôm nay
        rec._auto_fetch_intraday_ohlc()
        return rec

    def write(self, vals):
        res = super().write(vals)
        self._propagate_to_security()
        # Tự động fetch Intraday OHLC cho ngày hôm nay nếu date được cập nhật hoặc chưa có intraday data
        if 'date' in vals:
            # Nếu date được cập nhật, check lại
            self._auto_fetch_intraday_ohlc()
        else:
            # Nếu date không thay đổi, check xem có intraday data chưa
            if self.date == fields.Date.today():
                intraday_count = self.env['ssi.intraday.ohlc'].search_count([
                    ('security_id', '=', self.security_id.id),
                    ('date', '=', self.date)
                ])
                if intraday_count == 0:
                    self._auto_fetch_intraday_ohlc()
        return res

    @api.depends('security_id', 'date', 'intraday_ohlc_ids')
    def _compute_intraday_ohlc_count(self):
        """Compute số lượng Intraday OHLC records cho ngày này"""
        for rec in self:
            if rec.security_id and rec.date:
                # Đếm trực tiếp từ One2many field để đảm bảo tính chính xác
                count = len(rec.intraday_ohlc_ids.filtered(lambda r: r.date == rec.date))
                rec.intraday_ohlc_count = count
            else:
                rec.intraday_ohlc_count = 0

    def action_fetch_intraday_ohlc(self):
        """Lấy Intraday OHLC từ Securities cho ngày của Daily OHLC record này"""
        self.ensure_one()
        try:
            import ssi_fc_data
            from datetime import timedelta
            
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)
            
            if not self.security_id:
                raise UserError(_("Không tìm thấy Security liên quan."))
            
            security = self.security_id
            target_date = self.date
            
            # Fetch Intraday OHLC cho ngày này
            intraday_model = self.env['ssi.intraday.ohlc']
            current_page = 1
            page_size = 500
            total_records = 0
            
            _logger.info("Bắt đầu fetch Intraday OHLC cho %s ngày %s", 
                        security.symbol, target_date.strftime('%d/%m/%Y'))
            
            while True:
                try:
                    intraday_req = model.intraday_ohlc(
                        symbol=security.symbol,
                        fromDate=target_date.strftime('%d/%m/%Y'),
                        toDate=target_date.strftime('%d/%m/%Y'),
                        pageIndex=current_page,
                        pageSize=page_size,
                        ascending=True,
                        resolution=1
                    )
                    
                    intraday_response = client.intraday_ohlc(sdk_config, intraday_req)
                    
                    if intraday_response.get('status') != 'Success' or not intraday_response.get('data'):
                        break
                    
                    intraday_items = intraday_response['data'] if isinstance(intraday_response['data'], list) else []
                    if not intraday_items:
                        break
                    
                    # Lưu hoặc cập nhật Intraday OHLC records
                    for item in intraday_items:
                        time_str = item.get('Time', '') or item.get('time', '')
                        if not time_str:
                            continue
                        
                        # Kiểm tra xem đã có record chưa
                        existing = intraday_model.search([
                            ('security_id', '=', security.id),
                            ('date', '=', target_date),
                            ('time', '=', time_str)
                        ], limit=1)
                        
                        values = {
                            'security_id': security.id,
                            'date': target_date,
                            'time': time_str,
                            'open_price': item.get('Open', 0.0) or item.get('open', 0.0) or 0.0,
                            'high_price': item.get('High', 0.0) or item.get('high', 0.0) or 0.0,
                            'low_price': item.get('Low', 0.0) or item.get('low', 0.0) or 0.0,
                            'close_price': item.get('Close', 0.0) or item.get('close', 0.0) or 0.0,
                            'volume': item.get('Volume', 0.0) or item.get('volume', 0.0) or 0.0,
                            'total_value': item.get('TotalValue', 0.0) or item.get('totalValue', 0.0) or 0.0,
                            'resolution': item.get('Resolution', 1) or item.get('resolution', 1) or 1,
                        }
                        
                        if existing:
                            existing.write(values)
                        else:
                            intraday_model.create(values)
                        
                        total_records += 1
                    
                    # Nếu số records trả về ít hơn page_size, có thể đã hết dữ liệu
                    if len(intraday_items) < page_size:
                        break
                    
                    current_page += 1
                    
                    # Commit sau mỗi page để tránh transaction quá lớn
                    try:
                        self.env.cr.commit()
                    except Exception:
                        pass
                
                except Exception as e:
                    _logger.error("Lỗi khi fetch Intraday OHLC page %d: %s", current_page, str(e))
                    break
            
            _logger.info("Hoàn thành fetch Intraday OHLC: %d records cho %s ngày %s", 
                        total_records, security.symbol, target_date.strftime('%d/%m/%Y'))
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Hoàn thành'),
                    'message': _('Đã lấy %d Intraday OHLC records cho %s ngày %s') % 
                              (total_records, security.symbol, target_date.strftime('%d/%m/%Y')),
                    'type': 'success',
                    'sticky': False,
                }
            }
            
        except ImportError:
            raise UserError(_("SSI SDK chưa được cài đặt. Vui lòng cài đặt ssi_fc_data."))
        except Exception as e:
            _logger.exception("Lỗi khi fetch Intraday OHLC: %s", str(e))
            raise UserError(_("Lỗi khi lấy Intraday OHLC: %s") % str(e))


