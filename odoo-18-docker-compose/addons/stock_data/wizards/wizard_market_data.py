from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime, timedelta
import logging
from ..utils.utils import SdkConfigBuilder, normalize_market
from ssi_fc_data import model, fc_md_client
from .securities_wizard import (
    fetch_securities_all as _wiz_fetch_securities_all,
    fetch_securities as _wiz_fetch_securities,
    fetch_securities_details_all as _wiz_fetch_securities_details_all,
)
from .index_wizard import (
    fetch_index_all as _wiz_fetch_index_all,
    fetch_index_list as _wiz_fetch_index_list,
    fetch_index_components_all as _wiz_fetch_index_components_all,
)
from .ohlc_wizard import (
    fetch_all_ohlc as _wiz_fetch_all_ohlc,
)
from .daily_index_wizard import (
    fetch_daily_index as _wiz_fetch_daily_index,
)
from .backtest_wizard import (
    fetch_backtest as _wiz_fetch_backtest,
)

_logger = logging.getLogger(__name__)

class WizardFetchMarketData(models.TransientModel):
    _name = 'wizard.fetch.market.data'
    _description = 'Fetch Market Data Wizard'

    action_type = fields.Selection([
        ('securities_all', 'Fetch All Securities Data'),
        ('index_all', 'Fetch All Index Data'),
        ('fetch_all_ohlc', 'Fetch OHLC for All Securities'),
        ('daily_index', 'Fetch Daily Index'),
        ('backtest', 'BackTest'),
    ], string='Action Type', required=True, default='securities_all')

    market = fields.Selection([
        ('ALL', 'All Markets'),
        ('HOSE', 'HOSE'),
        ('HNX', 'HNX'),
        ('UPCOM', 'UPCOM')
    ], string='Market', default='ALL')

    symbol = fields.Char('Symbol', help='Leave empty to fetch all securities/indices')

    from_date = fields.Date('From Date', default=fields.Date.today)
    to_date = fields.Date('To Date', default=fields.Date.today)

    page_index = fields.Integer('Page Index', default=1)
    page_size = fields.Integer('Page Size', default=100)

    result_message = fields.Html('Result', readonly=True)
    last_count = fields.Integer('Last Fetched Records', readonly=True)

    # Batch processing constants
    _BATCH_SECURITIES_KEY = 'ssi.securities.batch_size'
    _BATCH_INDEX_KEY = 'ssi.index.batch_size'
    _BATCH_OHLC_KEY = 'ssi.ohlc.batch_size'
    _BATCH_DAILY_INDEX_KEY = 'ssi.daily_index.batch_size'
    _DEFAULT_BATCH = 50

    # --- Lock helpers to avoid overlapping runs ---
    _LOCK_KEY = 'ssi.market.fetch.lock'
    _LOCK_TTL_SEC = 300  # 5 minutes

    def _push_notice(self, title, message, level='info'):
        try:
            payload = {
                'type': 'fetch_notice',
                'title': str(title or ''),
                'message': str(message or ''),
                'level': str(level or 'info'),
                'timestamp': fields.Datetime.now().isoformat()
            }
            self.env['bus.bus']._sendone('ssi.marketdata', payload)
        except Exception as e:
            _logger.debug('Push notice failed: %s', e)

    def _acquire_lock(self, lock_key=None, ttl_sec=None):
        ICP = self.env['ir.config_parameter'].sudo()
        key = lock_key or self._LOCK_KEY
        ttl = ttl_sec or self._LOCK_TTL_SEC
        import time
        now = int(time.time())
        raw = ICP.get_param(key)
        if raw:
            try:
                ts = int(raw)
                if now - ts < ttl:
                    return False
            except Exception:
                pass
        ICP.set_param(key, str(now))
        return True

    def _release_lock(self, lock_key=None):
        ICP = self.env['ir.config_parameter'].sudo()
        key = lock_key or self._LOCK_KEY
        try:
            ICP.set_param(key, '')
        except Exception:
            pass

    def action_fetch_data(self):
        self.ensure_one()
        
        config = self.env['ssi.api.config'].get_config()
        if not config:
            raise UserError(_("Please configure SSI API settings first."))

        sdk_config = SdkConfigBuilder.build_config(config)

        try:
            client = fc_md_client.MarketDataClient(sdk_config)

            if self.action_type == 'securities_all':
                self._fetch_securities_all(client, sdk_config)
            elif self.action_type == 'index_all':
                self._fetch_index_all(client, sdk_config)
            elif self.action_type == 'fetch_all_ohlc':
                self._fetch_all_ohlc(client, sdk_config)
            elif self.action_type == 'daily_index':
                self._fetch_daily_index(client, sdk_config)
            elif self.action_type == 'backtest':
                self._fetch_backtest(client, sdk_config)

            if config:
                try:
                    config.sudo().write({
                        'last_sync_date': fields.Datetime.now(),
                        'last_sync_status': 'success'
                    })
                except Exception:
                    _logger.debug("Skip config write(success) due to access/txn", exc_info=True)

        except Exception as e:
            _logger.exception("Error fetching data: %s", str(e))
            if config:
                try:
                    config.sudo().write({
                        'last_sync_date': fields.Datetime.now(),
                        'last_sync_status': 'failed'
                    })
                except Exception:
                    _logger.debug("Skip config write(failed) due to access/txn", exc_info=True)
            raise UserError(_("Error fetching data: %s") % str(e))
        
        count_msg = _('%s records') % (self.last_count or 0)
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Fetch Completed'),
                'message': _('Market data fetched successfully: %s') % count_msg,
                'type': 'success',
                'sticky': False,
            }
        }

    def _fetch_securities_all(self, client, sdk_config):
        """Delegate to securities wizard module"""
        _wiz_fetch_securities_all(self, client, sdk_config)

    def _fetch_securities(self, client, sdk_config):
        _wiz_fetch_securities(self, client, sdk_config)

    def _fetch_securities_details_all(self, client, sdk_config):
        _wiz_fetch_securities_details_all(self, client, sdk_config)

    def _fetch_index_all(self, client, sdk_config):
        _wiz_fetch_index_all(self, client, sdk_config)

    def _fetch_index_list(self, client, sdk_config):
        _wiz_fetch_index_list(self, client, sdk_config)

    def _fetch_index_components_all(self, client, sdk_config):
        _wiz_fetch_index_components_all(self, client, sdk_config)

    def _fetch_all_ohlc(self, client, sdk_config):
        _wiz_fetch_all_ohlc(self, client, sdk_config)

    def _fetch_daily_index(self, client, sdk_config):
        _wiz_fetch_daily_index(self, client, sdk_config)

    def _fetch_backtest(self, client, sdk_config):
        _wiz_fetch_backtest(self, client, sdk_config)

    # Helper methods
    def _get_batch_size(self, key, default):
        try:
            return int(self.env['ir.config_parameter'].sudo().get_param(key, default=str(default)) or str(default))
        except Exception:
            return default

    def _run_wizard(self, action_type, page_size=None):
        wizard = self.create({
            'action_type': action_type,
            'market': 'ALL',  # Luôn fetch tất cả market trong cron
            'page_size': page_size or self.page_size,
            'from_date': self.from_date,
            'to_date': self.to_date,
        })
        wizard.action_fetch_data()
        return wizard

    # Cron methods
    @api.model
    def cron_fetch_securities_all(self):
        try:
            # Ưu tiên page_size lớn để giảm số lần gọi API -> nhanh hơn
            batch_size = self._get_batch_size(self._BATCH_SECURITIES_KEY, 1000)
            wiz = self._run_wizard('securities_all', page_size=batch_size)
            self._push_notice('Auto Fetch', _('Securities fetched: %s') % (wiz.last_count or 0), 'success')
        except Exception as e:
            _logger.exception("cron_fetch_securities_all failed: %s", e)

    @api.model
    def cron_fetch_index_all(self):
        try:
            # Index list ít thay đổi, nhưng nên dùng page_size lớn để tối ưu
            batch_size = self._get_batch_size(self._BATCH_INDEX_KEY, 500)
            wiz = self._run_wizard('index_all', page_size=batch_size)
            self._push_notice('Auto Fetch', _('Index fetched: %s') % (wiz.last_count or 0), 'success')
        except Exception as e:
            _logger.exception("cron_fetch_index_all failed: %s", e)

    @api.model
    def cron_fetch_all_ohlc(self):
        try:
            # OHLC cần nhanh -> giới hạn tập symbol hợp lý, page_size không ảnh hưởng nhiều
            batch_size = self._get_batch_size(self._BATCH_OHLC_KEY, 50)
            wiz = self._run_wizard('fetch_all_ohlc', page_size=batch_size)
            self._push_notice('Auto Fetch', _('OHLC fetched for %s symbols') % (wiz.last_count or 0), 'success')
        except Exception as e:
            _logger.exception("cron_fetch_all_ohlc failed: %s", e)

    @api.model
    def cron_fetch_daily_index(self):
        try:
            # Daily index: tăng batch để đi nhanh qua danh mục chỉ số
            batch_size = self._get_batch_size(self._BATCH_DAILY_INDEX_KEY, 200)
            wiz = self._run_wizard('daily_index', page_size=batch_size)
            self._push_notice('Auto Fetch', _('Daily index fetched: %s') % (wiz.last_count or 0), 'success')
        except Exception as e:
            _logger.exception("cron_fetch_daily_index failed: %s", e)

    @api.model
    def auto_fetch_all_data(self, batch_size=None):
        """
        Auto fetch tất cả market data một cách tự động
        Args:
            batch_size: Kích thước batch (optional, sẽ dùng default nếu không có)
        Returns:
            dict: Kết quả của từng loại fetch
        """
        try:
            _logger.info("Starting auto_fetch_all_data...")
            results = {}
            
            # Lấy batch size từ config hoặc dùng default
            # Tối ưu default theo nghiệp vụ từng nhóm để nhanh hơn
            default_batch = batch_size or 100
            
            # 1. Fetch Securities (tất cả market)
            try:
                _logger.info("Fetching securities data...")
                securities_batch = self._get_batch_size(self._BATCH_SECURITIES_KEY, 1000)
                self._run_wizard('securities_all', page_size=securities_batch)
                results['securities'] = 'success'
                _logger.info("Securities fetch completed")
            except Exception as e:
                results['securities'] = f'error: {str(e)}'
                _logger.error("Securities fetch failed: %s", e)
            
            # 2. Fetch Index Data
            try:
                _logger.info("Fetching index data...")
                index_batch = self._get_batch_size(self._BATCH_INDEX_KEY, 500)
                self._run_wizard('index_all', page_size=index_batch)
                results['index'] = 'success'
                _logger.info("Index fetch completed")
            except Exception as e:
                results['index'] = f'error: {str(e)}'
                _logger.error("Index fetch failed: %s", e)
            
            # 3. Fetch OHLC Data
            try:
                _logger.info("Fetching OHLC data...")
                ohlc_batch = self._get_batch_size(self._BATCH_OHLC_KEY, 50)
                self._run_wizard('fetch_all_ohlc', page_size=ohlc_batch)
                results['ohlc'] = 'success'
                _logger.info("OHLC fetch completed")
            except Exception as e:
                results['ohlc'] = f'error: {str(e)}'
                _logger.error("OHLC fetch failed: %s", e)
            
            # 4. Fetch Daily Index
            try:
                _logger.info("Fetching daily index data...")
                daily_index_batch = self._get_batch_size(self._BATCH_DAILY_INDEX_KEY, 200)
                self._run_wizard('daily_index', page_size=daily_index_batch)
                results['daily_index'] = 'success'
                _logger.info("Daily index fetch completed")
            except Exception as e:
                results['daily_index'] = f'error: {str(e)}'
                _logger.error("Daily index fetch failed: %s", e)
            
            _logger.info("Auto fetch all data completed: %s", results)
            return results
            
        except Exception as e:
            _logger.exception("auto_fetch_all_data failed: %s", e)
            return {'error': str(e)}

    @api.model
    def auto_fetch_realtime_data(self, limit=20):
        """
        Auto fetch realtime data cho active securities
        Args:
            limit: Số lượng securities tối đa để fetch (default: 20)
        Returns:
            int: Số lượng securities đã cập nhật
        """
        try:
            _logger.info("Starting auto_fetch_realtime_data...")
            
            # Chỉ fetch cho các symbol cụ thể: HDB, ACB, FPT, AAM
            target_symbols = ['HDB', 'ACB', 'FPT', 'AAM']
            securities_model = self.env['ssi.securities']
            active_securities = securities_model.search([
                ('symbol', 'in', target_symbols),
                ('is_active', '=', True),
                ('last_update', '>=', fields.Datetime.now() - timedelta(minutes=5))
            ], limit=limit)
            
            if not active_securities:
                _logger.info("No active securities found for realtime fetch")
                return 0
            
            config = self.env['ssi.api.config'].get_config()
            if not config:
                _logger.error("No SSI API config found")
                return 0
                
            sdk_config = SdkConfigBuilder.build_config(config)
            client = fc_md_client.MarketDataClient(sdk_config)
            
            updated_count = 0
            for security in active_securities:
                try:
                    # Fetch intraday OHLC (last 1 hour)
                    req = model.intraday_ohlc(
                        symbol=security.symbol,
                        fromDate=(fields.Datetime.now() - timedelta(hours=1)).strftime('%d/%m/%Y'),
                        toDate=fields.Datetime.now().strftime('%d/%m/%Y'),
                        pageIndex=1,
                        pageSize=1,
                        ascending=False,
                        resolution=1
                    )
                    
                    response = client.intraday_ohlc(sdk_config, req)
                    if response.get('status') == 'Success' and response.get('data'):
                        items = response['data'] if isinstance(response['data'], list) else []
                        if items:
                            latest_item = items[0]
                            security.write({
                                'current_price': latest_item.get('Close') or latest_item.get('close', 0.0),
                                'high_price': latest_item.get('High') or latest_item.get('high', 0.0),
                                'low_price': latest_item.get('Low') or latest_item.get('low', 0.0),
                                'volume': latest_item.get('Volume') or latest_item.get('volume', 0.0),
                                'total_value': latest_item.get('TotalValue') or latest_item.get('totalValue', 0.0),
                                'change': latest_item.get('Change') or latest_item.get('change', 0.0),
                                'change_percent': latest_item.get('ChangePercent') or latest_item.get('changePercent', 0.0),
                                'last_price': latest_item.get('Close') or latest_item.get('close', 0.0),
                                'last_update': fields.Datetime.now()
                            })
                            updated_count += 1
                except Exception as e:
                    _logger.debug("Skip realtime OHLC for %s: %s", security.symbol, str(e))
            
            _logger.info("Completed auto_fetch_realtime_data: updated %d securities", updated_count)
            return updated_count
            
        except Exception as e:
            _logger.exception("auto_fetch_realtime_data failed: %s", e)
            return 0

    @api.model
    def start_auto_sync(self, batch_size=None, include_realtime=True):
        """
        Bắt đầu auto sync tất cả market data
        Args:
            batch_size: Kích thước batch (optional)
            include_realtime: Có fetch realtime data không (default: True)
        Returns:
            dict: Kết quả tổng hợp
        """
        try:
            _logger.info("Starting auto sync with batch_size=%s, include_realtime=%s", 
                       batch_size, include_realtime)
            
            # Fetch tất cả data
            results = self.auto_fetch_all_data(batch_size)
            
            # Fetch realtime data nếu được yêu cầu
            if include_realtime:
                realtime_count = self.auto_fetch_realtime_data()
                results['realtime'] = f'updated {realtime_count} securities'
            
            _logger.info("Auto sync completed: %s", results)
            return results
            
        except Exception as e:
            _logger.exception("start_auto_sync failed: %s", e)
            return {'error': str(e)}

    @api.model
    def cron_realtime_ohlc(self):
        """Ultra-fast OHLC fetch for realtime data (every 10 seconds)"""
        try:
            # Chỉ fetch OHLC cho các symbol cụ thể: HDB, ACB, FPT, AAM
            target_symbols = ['HDB', 'ACB', 'FPT', 'AAM']
            securities_model = self.env['ssi.securities']
            active_securities = securities_model.search([
                ('symbol', 'in', target_symbols),
                ('is_active', '=', True),
                ('last_update', '>=', fields.Datetime.now() - timedelta(minutes=5))
            ], limit=20)  # Limit to 20 most active securities
            
            if not active_securities:
                return
            
            config = self.env['ssi.api.config'].get_config()
            if not config:
                return
                
            sdk_config = SdkConfigBuilder.build_config(config)
            client = fc_md_client.MarketDataClient(sdk_config)
            
            # Fetch latest OHLC for active securities
            for security in active_securities:
                try:
                    # Fetch intraday OHLC (last 1 hour)
                    req = model.intraday_ohlc(
                        symbol=security.symbol,
                        fromDate=(fields.Datetime.now() - timedelta(hours=1)).strftime('%d/%m/%Y'),
                        toDate=fields.Datetime.now().strftime('%d/%m/%Y'),
                        pageIndex=1,
                        pageSize=1,
                        ascending=False,
                        resolution=1
                    )
                    
                    response = client.intraday_ohlc(sdk_config, req)
                    if response.get('status') == 'Success' and response.get('data'):
                        items = response['data'] if isinstance(response['data'], list) else []
                        if items:
                            latest_item = items[0]
                            _logger.info("Realtime updating security %s with data: %s", security.symbol, latest_item)
                            # Update security with latest data (intraday OHLC có đầy đủ thông tin)
                            security.write({
                                'current_price': latest_item.get('Close') or latest_item.get('close', 0.0),
                                'high_price': latest_item.get('High') or latest_item.get('high', 0.0),
                                'low_price': latest_item.get('Low') or latest_item.get('low', 0.0),
                                'volume': latest_item.get('Volume') or latest_item.get('volume', 0.0),
                                'total_value': latest_item.get('TotalValue') or latest_item.get('totalValue', 0.0),
                                'change': latest_item.get('Change') or latest_item.get('change', 0.0),
                                'change_percent': latest_item.get('ChangePercent') or latest_item.get('changePercent', 0.0),
                                'last_price': latest_item.get('Close') or latest_item.get('close', 0.0),
                                'last_update': fields.Datetime.now()
                            })
                except Exception as e:
                    _logger.debug("Skip realtime OHLC for %s: %s", security.symbol, str(e))
                    
        except Exception as e:
            _logger.exception("cron_realtime_ohlc failed: %s", e)
