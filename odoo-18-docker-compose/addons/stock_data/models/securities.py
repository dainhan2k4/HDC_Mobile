from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging
from ssi_fc_data import model, fc_md_client
from ..utils.fund_sync import sync_fund_on_write, sync_fund_on_create

_logger = logging.getLogger(__name__)


class Securities(models.Model):
    """Securities/Market Data from SSI API"""
    _name = 'ssi.securities'
    _description = 'Securities'
    _order = 'symbol asc'
    _rec_name = 'symbol'

    symbol = fields.Char('Symbol', required=True, index=True)
    market = fields.Selection([
        ('HOSE', 'HOSE'),
        ('HNX', 'HNX'),
        ('UPCOM', 'UPCOM')
    ], string='Market', required=True, index=True)
    
    floor_code = fields.Char('Floor Code')
    security_type = fields.Char('Security Type')
    stock_name_vn = fields.Char('StockName (VN)')
    stock_name_en = fields.Char('StockEnName (EN)')
    
    # Price Information
    reference_price = fields.Float('Reference Price (Tham chiếu)', digits=(12, 3))
    ceiling_price = fields.Float('Ceiling Price (Trần)', digits=(12, 3))
    floor_price = fields.Float('Floor Price (Sàn)', digits=(12, 3))
    last_trading_date = fields.Date('Last Trading Date')
    
    # Current Price Data (from daily_stock_price API and Daily OHLC)
    current_price = fields.Float('Current Price', digits=(12, 3))
    high_price = fields.Float('High Price', digits=(12, 3))
    low_price = fields.Float('Low Price', digits=(12, 3))
    volume = fields.Float('Volume')
    total_value = fields.Float('Total Value', digits=(20, 3), compute='_compute_price_fields', store=True, readonly=True)
    change = fields.Float('Change', digits=(12, 3), compute='_compute_price_fields', store=True, readonly=True)
    change_percent = fields.Float('Change (%)', digits=(12, 3), compute='_compute_price_fields', store=True, readonly=True)
    last_price = fields.Float('Last Price', digits=(12, 3))
    
    # Status
    is_active = fields.Boolean('Is Active', default=True)
    last_update = fields.Datetime('Last Update', default=fields.Datetime.now)
    
    # Currency
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.ref('base.VND'))
    
    # Bỏ field name; dùng _rec_name = symbol

    @api.depends('current_price', 'volume', 'reference_price')
    def _compute_price_fields(self):
        """Compute Total Value, Change, and Change Percent based on current_price, volume, and reference_price"""
        for rec in self:
            # Total Value = current_price * volume
            rec.total_value = (rec.current_price or 0.0) * (rec.volume or 0.0)
            
            # Change = current_price - reference_price
            rec.change = (rec.current_price or 0.0) - (rec.reference_price or 0.0)
            
            # Change (%) = (Change / reference_price) * 100, nếu reference_price > 0
            if rec.reference_price and rec.reference_price > 0:
                rec.change_percent = (rec.change / rec.reference_price) * 100.0
            else:
                rec.change_percent = 0.0

    # Relations
    daily_ohlc_ids = fields.One2many('ssi.daily.ohlc', 'security_id', string='Daily OHLC Data')
    intraday_ohlc_ids = fields.One2many('ssi.intraday.ohlc', 'security_id', string='Intraday OHLC Data')
    
    # Securities Details & Backtest Data
    securities_details_raw = fields.Text(
        string='Securities Details Raw',
        readonly=True,
        help='Raw JSON response từ API securities_details'
    )
    securities_details_fetch_date = fields.Datetime(
        string='Details Fetch Date',
        readonly=True
    )
    
    backtest_raw = fields.Text(
        string='Backtest Raw',
        readonly=True,
        help='Raw JSON response từ API backtest'
    )
    backtest_selected_date = fields.Date(
        string='Backtest Selected Date',
        readonly=True
    )
    backtest_fetch_date = fields.Datetime(
        string='Backtest Fetch Date',
        readonly=True
    )
    
    _sql_constraints = [
        ('symbol_market_unique', 'unique(symbol, market)', 'Symbol and Market combination must be unique!')
    ]
    
    def action_open_daily_ohlc(self):
        """Open daily OHLC data for this security"""
        return {
            'name': _('Daily OHLC Data - %s') % self.symbol,
            'type': 'ir.actions.act_window',
            'res_model': 'ssi.daily.ohlc',
            'view_mode': 'list,graph,pivot',
            'domain': [('security_id', '=', self.id)],
            'context': {'default_security_id': self.id}
        }
    
    def action_fetch_latest_price(self):
        """Fetch latest price and board prices (TC/Trần/Sàn) using daily_stock_price"""
        try:
            import ssi_fc_data
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)

            to_date = fields.Date.today()
            from_date = to_date

            req = model.daily_stock_price(
                symbol=self.symbol,
                fromDate=from_date.strftime('%d/%m/%Y'),
                toDate=to_date.strftime('%d/%m/%Y'),
                pageIndex=1,
                pageSize=1,
                market=self.market
            )
            response = client.daily_stock_price(sdk_config, req)

            if response.get('status') == 'Success' and response.get('data'):
                items = response['data'] if isinstance(response['data'], list) else []
                if items:
                    p = items[0]
                    # Resolve board prices from payload with graceful fallback to provider variants
                    def _val(payload, *keys, default=0.0):
                        for k in keys:
                            if k in payload:
                                return payload.get(k)
                        return default
                    ref_price = _val(p, 'ReferencePrice', 'TC', default=self.reference_price)
                    ceil_price = _val(p, 'CeilingPrice', 'Trần', default=self.ceiling_price)
                    floor_price = _val(p, 'FloorPrice', 'Sàn', default=self.floor_price)
                    # Only update board prices (reference/ceiling/floor) from daily_stock_price API
                    # Let Daily OHLC propagate handle current_price, high_price, low_price, etc.
                    self.write({
                        'reference_price': ref_price,
                        'ceiling_price': ceil_price,
                        'floor_price': floor_price,
                        'last_update': fields.Datetime.now()
                    })
                    return {
                        'type': 'ir.actions.client',
                        'tag': 'display_notification',
                        'params': {
                            'title': _('Success'),
                            'message': _('Board prices updated for %s') % self.symbol,
                            'type': 'success',
                        }
                    }

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Warning'),
                    'message': _('No stock price data found for %s') % self.symbol,
                    'type': 'warning',
                }
            }
        except ImportError:
            raise UserError(_("SSI SDK not installed. Please install it first."))
        except Exception as e:
            raise UserError(_("Error fetching stock price: %s") % str(e))
    
    def action_fetch_securities_details(self):
        """Lấy chi tiết chứng khoán từ API securities_details"""
        self.ensure_one()
        try:
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)
            
            req = model.securities_details(
                market=self.market,
                symbol=self.symbol,
                pageIndex='1',
                pageSize='100'
            )
            
            response = client.securities_details(sdk_config, req)
            
            if response.get('status') == 'Success' and response.get('data'):
                import json
                self.write({
                    'securities_details_raw': json.dumps(response, indent=2, ensure_ascii=False),
                    'securities_details_fetch_date': fields.Datetime.now(),
                })
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Success'),
                        'message': _('Đã lấy chi tiết chứng khoán thành công'),
                        'type': 'success',
                    }
                }
            else:
                raise UserError(_("Failed to fetch securities details: %s") % response.get('message', 'Unknown error'))
        except Exception as e:
            _logger.error(f'Error fetching securities details: {e}')
            raise UserError(_("Error fetching securities details: %s") % str(e))
    
    def action_fetch_backtest(self):
        """Lấy dữ liệu backtest từ API backtest (ngày hôm nay)"""
        self.ensure_one()
        try:
            selected_date = fields.Date.today()
            
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)
            
            req = model.backtest(
                symbol=self.symbol,
                selectedDate=selected_date.strftime('%d/%m/%Y')
            )
            
            response = client.backtest(sdk_config, req)
            
            if response.get('status') == 'Success' and response.get('data'):
                import json
                self.write({
                    'backtest_raw': json.dumps(response, indent=2, ensure_ascii=False),
                    'backtest_selected_date': selected_date,
                    'backtest_fetch_date': fields.Datetime.now(),
                })
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Success'),
                        'message': _('Đã lấy dữ liệu backtest thành công'),
                        'type': 'success',
                    }
                }
            else:
                raise UserError(_("Failed to fetch backtest: %s") % response.get('message', 'Unknown error'))
        except Exception as e:
            _logger.error(f'Error fetching backtest: {e}')
            raise UserError(_("Error fetching backtest: %s") % str(e))

    @api.model
    def cron_sync_all_prices(self):
        """Cron job to sync prices for all securities every minute"""
        try:
            import ssi_fc_data
            from datetime import timedelta
            
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            
            client = fc_md_client.MarketDataClient(sdk_config)
            
            # Get all active securities
            securities = self.search([('is_active', '=', True)], limit=100)  # Limit 100 để tránh timeout
            to_date = fields.Date.today()
            from_date = to_date - timedelta(days=1)
            
            updated_count = 0
            error_count = 0
            
            _logger.info("Starting sync for %d securities", len(securities))
            
            for security in securities:
                try:
                    req = model.daily_stock_price(
                        symbol=security.symbol,
                        fromDate=from_date.strftime('%d/%m/%Y'),
                        toDate=to_date.strftime('%d/%m/%Y'),
                        pageIndex=1,
                        pageSize=1,
                        market=security.market
                    )
                    
                    response = client.daily_stock_price(sdk_config, req)
                    
                    if response.get('status') == 'Success' and response.get('data'):
                        items = response['data'] if isinstance(response['data'], list) else []
                        if items:
                            latest_price = items[0]
                            def _val(payload, *keys, default=0.0):
                                for k in keys:
                                    if k in payload:
                                        return payload.get(k)
                                return default
                            ref_price = _val(latest_price, 'ReferencePrice', 'TC', default=security.reference_price)
                            ceil_price = _val(latest_price, 'CeilingPrice', 'Trần', default=security.ceiling_price)
                            floor_price = _val(latest_price, 'FloorPrice', 'Sàn', default=security.floor_price)
                            # Only update board prices (reference/ceiling/floor) from daily_stock_price API
                            # Let Daily OHLC propagate handle current_price, high_price, low_price, etc.
                            security.write({
                                'reference_price': ref_price,
                                'ceiling_price': ceil_price,
                                'floor_price': floor_price,
                                'last_update': fields.Datetime.now()
                            })
                            updated_count += 1
                            _logger.debug("Updated price for %s", security.symbol)
                    
                    # Tự động lấy securities_details (mỗi lần sync)
                    try:
                        details_req = model.securities_details(
                            market=security.market,
                            symbol=security.symbol,
                            pageIndex='1',
                            pageSize='100'
                        )
                        details_response = client.securities_details(sdk_config, details_req)
                        if details_response.get('status') == 'Success' and details_response.get('data'):
                            import json
                            security.write({
                                'securities_details_raw': json.dumps(details_response, indent=2, ensure_ascii=False),
                                'securities_details_fetch_date': fields.Datetime.now(),
                            })
                    except Exception as e:
                        _logger.debug("Skip securities_details for %s: %s", security.symbol, str(e))
                        
                except Exception as e:
                    error_count += 1
                    _logger.error("Error syncing price for %s: %s", security.symbol, str(e))
            
            # Update config
            try:
                cfg = self.env['ssi.api.config'].get_config()
                if cfg:
                    cfg.sudo().write({
                        'last_sync_date': fields.Datetime.now(),
                        'last_sync_status': 'success' if error_count == 0 else 'partial'
                    })
            except Exception:
                _logger.debug("Skip config write in cron_sync_all_prices", exc_info=True)
            
            _logger.info("Sync completed: %d updated, %d errors", updated_count, error_count)
            
        except ImportError:
            _logger.error("SSI SDK not installed")
        except Exception as e:
            _logger.error("Error in cron_sync_all_prices: %s", str(e))
    
    def action_fetch_daily_ohlc_all_funds(self, days_back=365):
        """
        Lấy Daily OHLC cho tất cả các symbol chứng chỉ quỹ một cách đầy đủ
        
        Args:
            days_back: Số ngày lùi lại từ hôm nay để fetch (mặc định: 365 ngày = 1 năm)
        
        Returns:
            dict: Thông báo kết quả
        """
        try:
            import ssi_fc_data
            from datetime import timedelta
            from datetime import datetime as dt
            
            # Kiểm tra module fund.certificate có tồn tại không
            if 'fund.certificate' not in self.env:
                raise UserError(_("Module fund.certificate chưa được cài đặt. Vui lòng kiểm tra lại."))
            
            # Lấy danh sách tất cả chứng chỉ quỹ
            fund_cert_model = self.env['fund.certificate']
            fund_certs = fund_cert_model.search([])
            
            if not fund_certs:
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Warning'),
                        'message': _('Không tìm thấy chứng chỉ quỹ nào trong hệ thống.'),
                        'type': 'warning',
                    }
                }
            
            # Lấy SDK config và client
            sdk_config = self.env['ssi.sdk.config.builder'].build()
            client = fc_md_client.MarketDataClient(sdk_config)
            
            # Lấy security records tương ứng với các fund certificates
            securities = self.env['ssi.securities']
            daily_ohlc_model = self.env['ssi.daily.ohlc']
            
            to_date = fields.Date.today()
            from_date = to_date - timedelta(days=days_back)
            
            total_funds = len(fund_certs)
            success_count = 0
            error_count = 0
            total_records = 0
            
            _logger.info("Bắt đầu fetch Daily OHLC cho %d chứng chỉ quỹ (từ %s đến %s)", 
                        total_funds, from_date.strftime('%d/%m/%Y'), to_date.strftime('%d/%m/%Y'))
            
            for fund_cert in fund_certs:
                if not fund_cert.symbol or not fund_cert.market:
                    error_count += 1
                    _logger.warning("Fund certificate bỏ qua: symbol=%s, market=%s", fund_cert.symbol, fund_cert.market)
                    continue
                
                try:
                    # Tìm security record tương ứng
                    security = securities.search([
                        ('symbol', '=', fund_cert.symbol),
                        ('market', '=', fund_cert.market)
                    ], limit=1)
                    
                    if not security:
                        # Tạo security record nếu chưa có
                        security = securities.create({
                            'symbol': fund_cert.symbol,
                            'market': fund_cert.market,
                            'stock_name_vn': fund_cert.short_name_vn or '',
                            'stock_name_en': fund_cert.short_name_en or '',
                            'is_active': True,
                        })
                        _logger.info("Đã tạo security record mới cho %s (%s)", fund_cert.symbol, fund_cert.market)
                    
                    # Fetch Daily OHLC với pagination để lấy tất cả dữ liệu
                    current_page = 1
                    page_size = 100  # Lấy 100 records mỗi lần
                    page_success = 0
                    
                    while True:
                        daily_req = model.daily_ohlc(
                            symbol=security.symbol,
                            fromDate=from_date.strftime('%d/%m/%Y'),
                            toDate=to_date.strftime('%d/%m/%Y'),
                            pageIndex=current_page,
                            pageSize=page_size,
                            ascending=True
                        )
                        
                        daily_response = client.daily_ohlc(sdk_config, daily_req)
                        
                        if daily_response.get('status') != 'Success' or not daily_response.get('data'):
                            break
                        
                        daily_items = daily_response['data'] if isinstance(daily_response['data'], list) else []
                        if not daily_items:
                            break
                        
                        # Lưu hoặc cập nhật Daily OHLC records
                        for item in daily_items:
                            date_str = item.get('Date', '')
                            if date_str:
                                try:
                                    date_obj = dt.strptime(date_str, '%Y-%m-%d').date()
                                except Exception:
                                    try:
                                        date_obj = dt.strptime(date_str, '%d/%m/%Y').date()
                                    except Exception:
                                        _logger.warning("Không parse được date: %s cho symbol %s", date_str, security.symbol)
                                        continue
                            else:
                                continue
                            
                            # Kiểm tra xem đã có record chưa
                            existing = daily_ohlc_model.search([
                                ('security_id', '=', security.id),
                                ('date', '=', date_obj)
                            ], limit=1)
                            
                            values = {
                                'security_id': security.id,
                                'date': date_obj,
                                'open_price': item.get('Open', 0.0) or 0.0,
                                'high_price': item.get('High', 0.0) or 0.0,
                                'low_price': item.get('Low', 0.0) or 0.0,
                                'close_price': item.get('Close', 0.0) or 0.0,
                                'volume': item.get('Volume', 0.0) or 0.0,
                                'value': item.get('TotalValue', 0.0) or 0.0,
                                'change': item.get('Change', 0.0) or 0.0,
                                'change_percent': item.get('ChangePercent', 0.0) or 0.0,
                                'previous_close': item.get('PreviousClose', 0.0) or 0.0,
                                'last_update': fields.Datetime.now(),
                            }
                            
                            if existing:
                                existing.write(values)
                            else:
                                daily_ohlc_model.create(values)
                            
                            page_success += 1
                            total_records += 1
                        
                        # Nếu số records trả về ít hơn page_size, có thể đã hết dữ liệu
                        if len(daily_items) < page_size:
                            break
                        
                        current_page += 1
                        
                        # Commit sau mỗi page để tránh transaction quá lớn
                        try:
                            self.env.cr.commit()
                        except Exception:
                            pass
                    
                    if page_success > 0:
                        success_count += 1
                        _logger.info("Đã fetch Daily OHLC cho %s (%s): %d records", 
                                   security.symbol, security.market, page_success)
                    
                except Exception as e:
                    error_count += 1
                    _logger.error("Lỗi khi fetch Daily OHLC cho %s (%s): %s", 
                                fund_cert.symbol, fund_cert.market, str(e))
            
            # Commit cuối cùng
            try:
                self.env.cr.commit()
            except Exception:
                pass
            
            _logger.info("Hoàn thành fetch Daily OHLC: %d/%d chứng chỉ quỹ thành công, %d lỗi, tổng %d records", 
                        success_count, total_funds, error_count, total_records)
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Hoàn thành'),
                    'message': _('Đã lấy Daily OHLC cho %d/%d chứng chỉ quỹ thành công. Tổng cộng %d records.\nLỗi: %d') % 
                              (success_count, total_funds, total_records, error_count),
                    'type': 'success' if error_count == 0 else 'warning',
                    'sticky': True,
                }
            }
            
        except ImportError:
            raise UserError(_("SSI SDK chưa được cài đặt. Vui lòng cài đặt ssi_fc_data."))
        except Exception as e:
            _logger.exception("Lỗi khi fetch Daily OHLC cho tất cả chứng chỉ quỹ: %s", str(e))
            raise UserError(_("Lỗi khi lấy Daily OHLC cho tất cả chứng chỉ quỹ: %s") % str(e))
    
    def write(self, vals):
        result = super().write(vals)
        sync_fund_on_write(self, vals)
        return result
    
    @api.model
    def create(self, vals):
        result = super().create(vals)
        sync_fund_on_create(result)
        return result



