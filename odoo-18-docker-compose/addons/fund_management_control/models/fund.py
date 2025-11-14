from odoo import models, fields, api
from odoo.exceptions import UserError
import json
import logging
import requests

_logger = logging.getLogger(__name__)

# Chứng chỉ quỹ
class FundCertificate(models.Model):
    _name = 'fund.certificate'
    _description = 'Fund Certificate'
    _order = 'symbol asc'
    _rec_name = 'symbol'

    # === Stock Data Fields (Primary) ===
    symbol = fields.Char(string="Mã chứng khoán", required=True, index=True)
    market = fields.Selection([
        ('HOSE', 'HOSE'),
        ('HNX', 'HNX'),
        ('UPCOM', 'UPCOM')
    ], string='Sàn giao dịch', required=True, index=True)
    # Bổ sung các trường được sử dụng trong đồng bộ/auto-creation
    floor_code = fields.Char(string='Mã sàn', default='')
    security_type = fields.Char(string='Loại chứng khoán', default='')
    
    short_name_vn = fields.Char(string='Tên viết tắt (VN)')
    short_name_en = fields.Char(string='Tên viết tắt (EN)')
    
    # Price Information
    reference_price = fields.Float(string='Giá tham chiếu', digits=(12, 0))
    ceiling_price = fields.Float(string='Giá trần', digits=(12, 0))
    floor_price = fields.Float(string='Giá sàn', digits=(12, 0))
    last_trading_date = fields.Date(string='Ngày giao dịch cuối')
    
    # Current Price Data
    current_price = fields.Float(string='Giá hiện tại', digits=(12, 0))
    high_price = fields.Float(string='Giá cao nhất', digits=(12, 0))
    low_price = fields.Float(string='Giá thấp nhất', digits=(12, 0))
    # Bỏ field volume trực tiếp, thay bằng mapping từ số lượng tồn kho ban đầu
    volume = fields.Float(string='Khối lượng', compute='_compute_volume', store=True, readonly=True)
    total_value = fields.Float(string='Tổng giá trị', digits=(20, 0))
    change = fields.Float(string='Thay đổi', digits=(12, 0))
    change_percent = fields.Float(string='Thay đổi (%)', digits=(12, 2))
    last_price = fields.Float(string='Giá cuối', digits=(12, 0))
    
    # Status
    is_active = fields.Boolean(string='Đang hoạt động', default=True)
    last_update = fields.Datetime(string='Cập nhật lần cuối', default=fields.Datetime.now)
    # Currency (để hiển thị định dạng tiền tệ ở list/form views)
    currency_id = fields.Many2one('res.currency', string='Tiền tệ', default=lambda self: self.env.company.currency_id)
    
    # === Fund Management Fields ===
    fund_color = fields.Char(string="Màu quỹ", default='#4A90E2')
    inception_date = fields.Datetime(string="Thời gian đóng sổ lệnh")
    closure_date = fields.Date(string="Ngày đóng sổ lệnh")
    receive_money_time = fields.Datetime(string="Thời điểm ghi nhận tiền vào quỹ")
    payment_deadline = fields.Integer(string="Thời hạn thanh toán bán (ngày)", default=3)
    redemption_time = fields.Integer(string="Thời gian ghi nhận lệnh Mua hoán đổi (ngày)", default=2)
    report_website = fields.Char(string="Website báo cáo quỹ")
    fund_type = fields.Selection([
        ('equity', 'Quỹ Cổ phiếu'),
        ('bond', 'Quỹ Trái phiếu'),
        ('mixed', 'Quỹ Hỗn hợp'),
    ], string='Chọn loại quỹ', default='equity')
    risk_level = fields.Selection([
        ('1', '1 - Thấp nhất'),
        ('2', '2 - Thấp'),
        ('3', '3 - Trung bình'),
        ('4', '4 - Cao'),
        ('5', '5 - Rất cao'),
    ], string='Mức độ rủi ro', default='3')
    product_type = fields.Selection([
        ('open_ended', 'Quỹ mở'),
        ('close_ended', 'Quỹ đóng'),
    ], string="Loại sản phẩm", default='open_ended')
    product_status = fields.Selection([
        ('active', 'Đang hoạt động'),
        ('inactive', 'Ngừng hoạt động')
    ], string="Trạng thái sản phẩm", default='active')
    fund_description = fields.Text(string="Mô tả quỹ")
    fund_image = fields.Binary(string="Hình ảnh của Quỹ")
    
    # Trường cho quỹ đóng
    initial_certificate_quantity = fields.Integer(string="Số lượng tồn kho ban đầu", default=0)
    initial_certificate_price = fields.Float(string="Giá tồn kho ban đầu", default=0.0)
    capital_cost = fields.Float(string="Chi phí vốn (%)", default=1.09, digits=(5, 2))

    # Trading Days
    monday = fields.Boolean(string="Thứ hai", default=True)
    tuesday = fields.Boolean(string="Thứ ba", default=True)
    wednesday = fields.Boolean(string="Thứ tư", default=True)
    thursday = fields.Boolean(string="Thứ năm", default=True)
    friday = fields.Boolean(string="Thứ sáu", default=True)
    saturday = fields.Boolean(string="Thứ bảy")
    sunday = fields.Boolean(string="Chủ nhật")

    # Tham chiếu chứng khoán từ stock_data để áp dữ liệu nhanh
    security_ref_id = fields.Many2one(
        'ssi.securities',
        string='Chọn chứng khoán (có Daily OHLC)',
        domain="[('daily_ohlc_ids','!=',False)]",
        help='Chọn từ danh sách chứng khoán đã có Daily OHLC để tự động áp dữ liệu.'
    )

    def _get_latest_close_price_from_ohlc(self, security):
        """Lấy close_price từ Daily OHLC mới nhất của security"""
        if not security:
            return 0.0
        try:
            daily_ohlc_model = self.env['ssi.daily.ohlc'].sudo()
            latest_ohlc = daily_ohlc_model.search([
                ('security_id', '=', security.id)
            ], order='date desc', limit=1)
            if latest_ohlc and latest_ohlc.close_price:
                return latest_ohlc.close_price
        except Exception:
            pass
        return 0.0

    @api.onchange('security_ref_id')
    def _onchange_security_ref_id(self):
        for rec in self:
            sec = rec.security_ref_id
            if not sec:
                continue
            # Áp các trường chính từ securities - lấy trực tiếp, không fallback
            rec.symbol = sec.symbol
            rec.market = sec.market
            rec.floor_code = sec.floor_code
            rec.security_type = sec.security_type
            rec.short_name_vn = sec.stock_name_vn
            rec.short_name_en = sec.stock_name_en
            rec.reference_price = sec.reference_price
            rec.ceiling_price = sec.ceiling_price
            rec.floor_price = sec.floor_price
            rec.last_trading_date = sec.last_trading_date
            rec.current_price = sec.current_price
            rec.high_price = sec.high_price
            rec.low_price = sec.low_price
            # Map volume từ securities sang số lượng tồn kho ban đầu
            rec.initial_certificate_quantity = int(sec.volume) if sec.volume else 0
            rec.total_value = sec.total_value
            rec.change = sec.change
            rec.change_percent = sec.change_percent
            rec.last_price = sec.last_price
            rec.last_update = fields.Datetime.now()
            rec.is_active = True
            rec.product_status = 'active'
            # Mô tả
            if not rec.fund_description:
                rec.fund_description = f"{rec.symbol} - {rec.market}"

            # Lấy giá tồn kho ban đầu từ close_price của Daily OHLC mới nhất
            close_price = rec._get_latest_close_price_from_ohlc(sec)
            if close_price > 0:
                rec.initial_certificate_price = close_price

    @api.depends('initial_certificate_quantity')
    def _compute_volume(self):
        for rec in self:
            rec.volume = float(rec.initial_certificate_quantity) if rec.initial_certificate_quantity is not None else 0.0

    # ==== Propagate changes to portfolio.fund (fund_management) ====
    def _build_portfolio_vals(self):
        """Map current certificate fields to portfolio.fund values.
        ticker = symbol; name = stockname (short_name_vn/en); current_nav = current_price.
        Also sync low/high/open price fields if available.
        """
        self.ensure_one()
        name_val = self.short_name_vn if self.short_name_vn else (self.short_name_en if self.short_name_en else self.symbol)
        return {
            'ticker': self.symbol,
            'name': name_val,
            'current_nav': self.current_price if self.current_price is not None else 0.0,
            # extended fields used by frontend
            'low_price': self.low_price if self.low_price is not None else 0.0,
            'high_price': self.high_price if self.high_price is not None else 0.0,
            'open_price': self.initial_certificate_price if self.initial_certificate_price else (self.reference_price if self.reference_price else 0.0),
            'last_update': fields.Datetime.now(),
        }

    def _propagate_to_portfolio_fund(self):
        PortfolioFund = self.env['portfolio.fund'].sudo()
        for rec in self:
            try:
                vals = rec._build_portfolio_vals()
                # Prefer link by certificate_id, fallback by ticker (symbol)
                funds = PortfolioFund.search(['|', ('certificate_id', '=', rec.id), ('ticker', '=', rec.symbol)])
                for fund in funds:
                    wvals = dict(vals)
                    if not fund.certificate_id:
                        wvals['certificate_id'] = rec.id
                    fund.write(wvals)
            except Exception:
                # Do not block certificate write on propagation errors
                _logger.debug('Skip fund propagation for %s', rec.symbol, exc_info=True)

    @api.model
    def create(self, vals):
        rec = super().create(vals)
        try:
            rec._propagate_to_portfolio_fund()
        except Exception:
            _logger.debug('Skip portfolio fund propagation on create', exc_info=True)
        return rec

    def write(self, vals):
        res = super().write(vals)
        try:
            self._propagate_to_portfolio_fund()
        except Exception:
            _logger.debug('Skip portfolio fund propagation on write', exc_info=True)
        return res

    _sql_constraints = [
        ('symbol_market_unique', 'unique(symbol, market)', 'Sự kết hợp Mã chứng khoán và Sàn giao dịch phải duy nhất!')
    ]
    
    @api.model
    def sync_from_stock_data(self, market=None, page_size=200):
        """Lấy dữ liệu chứng khoán từ controller stock_data và cập nhật/chèn vào chứng chỉ quỹ.
        CHỈ đồng bộ các symbol đã có Daily OHLC data.
        Sử dụng các tham số hệ thống:
          - web.base.url: URL cơ sở
          - stock_data.api.secret: shared secret cho X-Api-Key
        """
        _logger = logging.getLogger(__name__)
        icp = self.env['ir.config_parameter'].sudo()
        base_url = icp.get_param('web.base.url', default='')
        api_secret = icp.get_param('stock_data.api.secret', default='')
        
        if not base_url:
            error_msg = "Thiếu web.base.url trong tham số hệ thống. Vui lòng cấu hình trong Settings > Technical > Parameters > System Parameters."
            _logger.error(error_msg)
            raise UserError(error_msg)
        
        if not api_secret:
            error_msg = "Thiếu stock_data.api.secret trong tham số hệ thống. Vui lòng cấu hình trong Settings > Technical > Parameters > System Parameters."
            _logger.error(error_msg)
            raise UserError(error_msg)

        # Lấy danh sách symbol và market đã có Daily OHLC
        # Query trực tiếp từ daily_ohlc model và lấy security_id từ đó
        daily_ohlc_model = self.env['ssi.daily.ohlc'].sudo()
        daily_ohlc_records = daily_ohlc_model.search([])
        
        _logger.info("Tổng số Daily OHLC records trong DB: %d", len(daily_ohlc_records))
        
        # Tạo set các tuple (symbol, market) đã có Daily OHLC
        symbols_with_ohlc = set()
        processed_security_ids = set()
        
        for ohlc in daily_ohlc_records:
            if ohlc.security_id and ohlc.security_id.id not in processed_security_ids:
                processed_security_ids.add(ohlc.security_id.id)
                if ohlc.security_id.symbol and ohlc.security_id.market:
                    symbols_with_ohlc.add((ohlc.security_id.symbol, ohlc.security_id.market))
        
        if not symbols_with_ohlc:
            _logger.warning("Không tìm thấy symbol nào có Daily OHLC data.")
            _logger.info("Sẽ đồng bộ TẤT CẢ symbols từ API để test (không filter Daily OHLC)")
            # Tạm thời bỏ qua filter để test API
            symbols_with_ohlc = None  # None = sync tất cả
        else:
            _logger.info("Tìm thấy %d symbol(s) có Daily OHLC data. Chỉ đồng bộ các symbol này.", len(symbols_with_ohlc))
            _logger.info("Danh sách symbols cần sync (10 đầu tiên): %s", list(symbols_with_ohlc)[:10])

        # Nếu đã có danh sách symbols có Daily OHLC, đồng bộ trực tiếp từ ssi.securities để đảm bảo có dữ liệu
        if symbols_with_ohlc is not None:
            _logger.info("Thực hiện đồng bộ nội bộ từ ssi.securities cho %d symbol(s)", len(symbols_with_ohlc))
            total_created = 0
            total_updated = 0
            total_skipped = 0
            
            Securities = self.env['ssi.securities'].sudo()
            daily_ohlc_model = self.env['ssi.daily.ohlc'].sudo()
            processed = 0
            for (sym, mkt) in symbols_with_ohlc:
                processed += 1
                rec = Securities.search([('symbol', '=', sym), ('market', '=', mkt)], limit=1)
                if not rec:
                    total_skipped += 1
                    if total_skipped <= 3:
                        _logger.debug("Bỏ qua %s (%s): không tìm thấy trong ssi.securities", sym, mkt)
                    continue
                
                # Lấy close_price từ Daily OHLC mới nhất
                latest_ohlc = daily_ohlc_model.search([
                    ('security_id', '=', rec.id)
                ], order='date desc', limit=1)
                initial_price = latest_ohlc.close_price if latest_ohlc and latest_ohlc.close_price else 0.0
                
                vals = {
                    'symbol': rec.symbol,
                    'market': rec.market,
                    'floor_code': rec.floor_code,
                    'security_type': rec.security_type,
                    'short_name_vn': rec.stock_name_vn,
                    'short_name_en': rec.stock_name_en,
                    'reference_price': rec.reference_price,
                    'ceiling_price': rec.ceiling_price,
                    'floor_price': rec.floor_price,
                    'last_trading_date': rec.last_trading_date,
                    'current_price': rec.current_price,
                    'high_price': rec.high_price,
                    'low_price': rec.low_price,
                    'initial_certificate_quantity': int(rec.volume) if rec.volume else 0,
                    'initial_certificate_price': initial_price,
                    'total_value': rec.total_value,
                    'change': rec.change,
                    'change_percent': rec.change_percent,
                    'last_price': rec.last_price,
                    'is_active': True,
                    'last_update': fields.Datetime.now(),
                    'product_status': 'active',
                    'fund_description': f"{rec.symbol} - {rec.security_type} - {rec.market}",
                }
                existing = self.search([('symbol', '=', rec.symbol), ('market', '=', rec.market)], limit=1)
                if existing:
                    existing.with_context(skip_fund_sync=True).write(vals)
                    total_updated += 1
                else:
                    self.with_context(skip_fund_sync=True).create(vals)
                    total_created += 1
                
                # Commit theo đợt để giảm lock
                if processed % 200 == 0:
                    try:
                        self.env.cr.commit()
                    except Exception:
                        pass
            
            _logger.info("Đồng bộ nội bộ hoàn thành: %d tạo mới, %d cập nhật, %d bỏ qua", total_created, total_updated, total_skipped)
            return {'created': total_created, 'updated': total_updated, 'skipped': total_skipped}

    # Deprecated sync methods removed in favor of selecting securities via security_ref_id

    @api.model
    def cron_sync_from_stock_data(self):
        """Cron job để tự động đồng bộ chứng khoán từ module stock_data.
        CHỈ đồng bộ các symbol đã có Daily OHLC data.
        Chạy mỗi 5 phút để giữ chứng chỉ quỹ luôn được cập nhật với dữ liệu thị trường real-time.
        """
        _logger = logging.getLogger(__name__)
        try:
            # Pre-fetch from stock_data if needed
            sec_model = self.env['ssi.securities'].sudo()
            ohlc_model = self.env['ssi.daily.ohlc'].sudo()
            sec_count = sec_model.search_count([])
            ohlc_count = ohlc_model.search_count([])
            if sec_count == 0:
                try:
                    self.env['wizard.fetch.market.data'].sudo().cron_fetch_securities_all()
                except Exception:
                    pass
            if ohlc_count == 0:
                try:
                    self.env['wizard.fetch.market.data'].sudo().cron_fetch_all_ohlc()
                except Exception:
                    pass
        except Exception:
            # ignore prefetch errors
            pass

        # Đồng bộ tất cả các sàn
            markets = ['HOSE', 'HNX', 'UPCOM']
            total_created = 0
            total_updated = 0
            total_skipped = 0
            
            for market in markets:
                try:
                    result = self.sync_from_stock_data(market=market, page_size=500)
                    total_created += result.get('created', 0)
                    total_updated += result.get('updated', 0)
                    total_skipped += result.get('skipped', 0)
                except Exception as e:
                    _logger.error("Lỗi khi đồng bộ sàn %s: %s", market, str(e), exc_info=True)
            
            result_summary = {
                'created': total_created,
                'updated': total_updated,
                'skipped': total_skipped,
                'markets': markets
            }
            _logger.info("Cron đồng bộ hoàn thành: %d đã tạo, %d đã cập nhật, %d đã bỏ qua (không có Daily OHLC)", 
                         total_created, total_updated, total_skipped)
            return result_summary
        except Exception as e:
            _logger.error("Lỗi trong cron_sync_from_stock_data: %s", str(e), exc_info=True)
            return {'created': 0, 'updated': 0, 'skipped': 0, 'error': str(e)}

    @api.model
    def action_sync_from_stock_data(self):
        """Button action để đồng bộ từ Stock Data.
        Hiển thị thông báo kết quả cho user.
        """
        try:
            result = self.cron_sync_from_stock_data()
            if not result:
                result = {}
            created = int(result.get('created')) if result.get('created') is not None else 0
            updated = int(result.get('updated')) if result.get('updated') is not None else 0
            skipped = int(result.get('skipped')) if result.get('skipped') is not None else 0
            
            message = f"Đồng bộ hoàn thành!\n" \
                     f"• Đã tạo mới: {created} bản ghi\n" \
                     f"• Đã cập nhật: {updated} bản ghi\n" \
                     f"• Đã bỏ qua: {skipped} bản ghi (không có Daily OHLC)"
            
            if result.get('error'):
                message += f"\n\nLỗi: {result.get('error')}"
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': 'Đồng bộ hoàn thành (có lỗi)',
                        'message': message,
                        'type': 'warning',
                        'sticky': False,
                    }
                }
            else:
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': 'Đồng bộ thành công',
                        'message': message,
                        'type': 'success',
                        'sticky': False,
                    }
                }
        except Exception as e:
            _logger.error("Lỗi khi đồng bộ từ button: %s", str(e), exc_info=True)
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Lỗi đồng bộ',
                    'message': f'Đã xảy ra lỗi khi đồng bộ: {str(e)}',
                    'type': 'danger',
                    'sticky': True,
                }
            }

    # --- Đồng bộ sang portfolio.fund (fund_management) ---
    def _map_to_portfolio_fund_vals(self):
        self.ensure_one()
        vals = {}
        # Tên / Ticker / Mô tả
        if self.short_name_vn:
            vals['name'] = self.short_name_vn
        elif self.symbol:
            vals['name'] = self.symbol
            
        if self.symbol:
            vals['ticker'] = self.symbol
            
        if self.fund_description:
            vals['description'] = self.fund_description
        elif self.security_type:
            vals['description'] = f"{self.symbol} - {self.security_type} - {self.market}"

        # Ánh xạ ngày: inception_date (Datetime) -> Date, nếu không thì dùng closure_date
        if self.inception_date:
            vals['inception_date'] = fields.Date.to_date(self.inception_date)
        elif self.closure_date:
            vals['inception_date'] = self.closure_date

        # NAV / Giá phát hành
        if self.current_price is not None:
            vals['current_nav'] = self.current_price
        elif self.reference_price is not None:
            vals['current_nav'] = self.reference_price
            
        if self.initial_certificate_price is not None:
            vals['launch_price'] = self.initial_certificate_price

        # Ánh xạ loại đầu tư
        mapping = {
            'equity': 'Growth',
            'bond': 'Income',
            'mixed': 'Income & Growth',
        }
        if self.fund_type:
            vals['investment_type'] = mapping.get(self.fund_type)

        # Ánh xạ trạng thái
        if self.product_status in ('active', 'inactive'):
            vals['status'] = self.product_status
        elif self.is_active:
            vals['status'] = 'active'
        else:
            vals['status'] = 'inactive'

        return vals

    def _sync_linked_portfolio_funds(self):
        PortfolioFund = self.env['portfolio.fund'].sudo()
        for cert in self:
            funds = PortfolioFund.search([('certificate_id', '=', cert.id)])
            if not funds:
                continue
            vals = cert._map_to_portfolio_fund_vals()
            if vals:
                funds.write(vals)
            # Đồng bộ sang nav.fund.config (nếu có cấu hình) các trường: initial_quantity, initial_price, capital_cost
            try:
                NavFundConfig = self.env['nav.fund.config'].sudo()
                for fund in funds:
                    nav_cfg = NavFundConfig.search([('fund_id', '=', fund.id)], limit=1)
                    if not nav_cfg:
                        continue
                    cfg_vals = {}
                    # Số lượng CCQ đóng ban đầu
                    if cert.initial_certificate_quantity is not None:
                        cfg_vals['initial_ccq_quantity'] = cert.initial_certificate_quantity
                    # Giá CCQ ban đầu
                    if cert.initial_certificate_price is not None:
                        cfg_vals['initial_nav_price'] = cert.initial_certificate_price
                    # Chi phí vốn (%)
                    if cert.capital_cost is not None:
                        cfg_vals['capital_cost_percent'] = float(cert.capital_cost)
                    if cfg_vals:
                        nav_cfg.with_context(skip_certificate_sync=True).write(cfg_vals)
            except Exception:
                # Không chặn nếu nav module không cài hoặc lỗi
                pass

    def write(self, vals):
        res = super().write(vals)
        # Đồng bộ ngay sau khi cập nhật master
        try:
            if not self.env.context.get('skip_fund_sync'):
                self._sync_linked_portfolio_funds()
                # Đồng bộ với nav.fund.config khi có thay đổi 3 field quan trọng
                if any(field in vals for field in ['initial_certificate_quantity', 'initial_certificate_price', 'capital_cost']):
                    self._sync_to_nav_fund_config()
                    # Đồng bộ với tồn kho CCQ hàng ngày
                    self._sync_to_daily_inventory()
        except Exception:
            # Fail-fast nhưng không chặn transaction chính
            pass
        return res

    @api.model
    def create(self, vals):
        rec = super().create(vals)
        try:
            if not self.env.context.get('skip_fund_sync'):
                rec._sync_linked_portfolio_funds()
                # Đồng bộ với nav.fund.config khi tạo mới
                if any(field in vals for field in ['initial_certificate_quantity', 'initial_certificate_price', 'capital_cost']):
                    rec._sync_to_nav_fund_config()
                    # Đồng bộ với tồn kho CCQ hàng ngày
                    rec._sync_to_daily_inventory()
        except Exception:
            pass
        return rec
    
    def _sync_to_nav_fund_config(self):
        """Đồng bộ 3 field quan trọng từ fund.certificate sang nav.fund.config"""
        for cert in self:
            try:
                print(f"DEBUG: Bắt đầu đồng bộ cho fund.certificate {cert.id} ({cert.symbol})")
                
                # Tìm portfolio.fund tương ứng
                portfolio_fund = self.env['portfolio.fund'].search([
                    ('certificate_id', '=', cert.id)
                ], limit=1)
                
                if not portfolio_fund:
                    print(f"DEBUG: Không tìm thấy portfolio.fund cho certificate {cert.id}")
                    continue
                
                print(f"DEBUG: Tìm thấy portfolio.fund {portfolio_fund.id} cho certificate {cert.id}")
                
                # Tìm hoặc tạo nav.fund.config
                nav_config = self.env['nav.fund.config'].search([
                    ('fund_id', '=', portfolio_fund.id)
                ], limit=1)
                
                if not nav_config:
                    # Tạo mới nav.fund.config
                    new_config = self.env['nav.fund.config'].create({
                        'fund_id': portfolio_fund.id,
                        'initial_nav_price': cert.initial_certificate_price if cert.initial_certificate_price is not None else 0.0,
                        'initial_ccq_quantity': cert.initial_certificate_quantity if cert.initial_certificate_quantity is not None else 0.0,
                        'capital_cost_percent': cert.capital_cost if cert.capital_cost is not None else 0.0,
                        'description': f"Tự động đồng bộ từ {cert.symbol}",
                        'active': True
                    })
                    print(f"DEBUG: Đã tạo nav.fund.config mới {new_config.id} cho fund {portfolio_fund.id}")
                else:
                    # Cập nhật nav.fund.config
                    old_values = {
                        'initial_nav_price': nav_config.initial_nav_price,
                        'initial_ccq_quantity': nav_config.initial_ccq_quantity,
                        'capital_cost_percent': nav_config.capital_cost_percent,
                    }
                    
                    nav_config.with_context(
                        skip_certificate_sync=True,
                        skip_fund_sync=True,
                        skip_nav_config_sync=True
                    ).write({
                        'initial_nav_price': cert.initial_certificate_price if cert.initial_certificate_price is not None else 0.0,
                        'initial_ccq_quantity': cert.initial_certificate_quantity if cert.initial_certificate_quantity is not None else 0.0,
                        'capital_cost_percent': cert.capital_cost if cert.capital_cost is not None else 0.0,
                    })
                    print(f"DEBUG: Đã cập nhật nav.fund.config {nav_config.id} từ {old_values} sang giá trị mới")
                    
            except Exception as e:
                # Log lỗi nhưng không chặn transaction
                import logging
                _logger = logging.getLogger(__name__)
                _logger.warning(f"Lỗi khi đồng bộ fund.certificate {cert.id} sang nav.fund.config: {e}")
                print(f"DEBUG: Lỗi khi đồng bộ fund.certificate {cert.id}: {e}")
                pass
    
    def _sync_to_daily_inventory(self):
        """Đồng bộ dữ liệu từ fund.certificate sang tồn kho CCQ hàng ngày"""
        for cert in self:
            try:
                print(f"DEBUG: Bắt đầu đồng bộ sang tồn kho hàng ngày cho fund.certificate {cert.id} ({cert.symbol})")
                
                # Tìm portfolio.fund tương ứng
                portfolio_fund = self.env['portfolio.fund'].search([
                    ('certificate_id', '=', cert.id)
                ], limit=1)
                
                if not portfolio_fund:
                    print(f"DEBUG: Không tìm thấy portfolio.fund cho certificate {cert.id}")
                    continue
                
                print(f"DEBUG: Tìm thấy portfolio.fund {portfolio_fund.id} cho certificate {cert.id}")
                
                # Tìm tất cả bản ghi tồn kho của quỹ này
                daily_inventories = self.env['nav.daily.inventory'].search([
                    ('fund_id', '=', portfolio_fund.id)
                ])
                
                if not daily_inventories:
                    print(f"DEBUG: Không tìm thấy tồn kho hàng ngày cho fund {portfolio_fund.id}")
                    continue
                
                # Sử dụng method sync_from_fund_certificate để cập nhật tất cả bản ghi
                certificate_data = {
                    'initial_certificate_quantity': cert.initial_certificate_quantity if cert.initial_certificate_quantity is not None else 0.0,
                    'initial_certificate_price': cert.initial_certificate_price if cert.initial_certificate_price is not None else 0.0,
                }
                
                # Gọi method sync từ nav.daily.inventory
                self.env['nav.daily.inventory'].sync_from_fund_certificate(
                    portfolio_fund.id, 
                    certificate_data
                )
                
                print(f"DEBUG: Hoàn thành đồng bộ sang tồn kho hàng ngày cho fund.certificate {cert.id}")
                
            except Exception as e:
                # Log lỗi nhưng không chặn transaction
                import logging
                _logger = logging.getLogger(__name__)
                _logger.warning(f"Lỗi khi đồng bộ fund.certificate {cert.id} sang tồn kho hàng ngày: {e}")
                print(f"DEBUG: Lỗi khi đồng bộ fund.certificate {cert.id} sang tồn kho hàng ngày: {e}")
                pass

# Loại chương trình
class SchemeType(models.Model):
    _name = 'fund.scheme.type'
    _description = 'Loại chương trình'

    name = fields.Char(string="Tên Scheme", required=True)
    name_acronym = fields.Char(string="Tên Scheme (viết tắt)", required=True)
    scheme_code = fields.Char(string="Mã Scheme", required=True)
    auto_invest = fields.Boolean(string="Tự động mua")
    activate_scheme = fields.Boolean(string="Kích hoạt")
    first_transaction_fee = fields.Boolean(string="Tính phí theo giao dịch đầu tiên")
    scheme_ids = fields.One2many("fund.scheme", "scheme_type_id", string="Các chương trình")


# Chương trình
class Scheme(models.Model):
    _name = 'fund.scheme'
    _description = 'Chương trình'

    name = fields.Char(string="Tên chương trình", required=True)
    name_acronym = fields.Char(string="Tên viết tắt", required=True)
    transaction_code = fields.Char(string="Mã giao dịch", required=True)
    min_purchase_value = fields.Float(string="Giá trị mua tối thiểu", required=True)
    min_sell_quantity = fields.Float(string="Số lượng bán tối thiểu", required=True)
    min_conversion_quantity = fields.Float(string="Số lượng chuyển đổi tối thiểu", required=True)
    min_holding_quantity = fields.Float(string="Số lượng nắm giữ tối thiểu", required=True)
    select_fund_id = fields.Many2one("fund.certificate", string="Chọn quỹ",
                                     required=True)  # nhiều chương trình có thể chọn 1 quỹ -> link đến model chứng chỉ quỹ?
    scheme_type_id = fields.Many2one("fund.scheme.type", string="Chọn loại chương trình",
                                     required=True)  # nhiều chương trình có thể chọn 1 loại chương trình
    amc_fee = fields.Float(string="Phí AMC", required=True)
    fund_fee = fields.Float(string="Phí quỹ", required=True)
    active_status = fields.Selection([
        ('active', 'Kích hoạt'),
        ('inactive', 'Không kích hoạt'),
        ('pending', 'Chờ xử lý'),
        ('suspended', 'Tạm ngưng')
    ], string="Kích hoạt trạng thái", required=True)
    can_purchase = fields.Boolean(string="Được phép Mua?")
    can_sell = fields.Boolean(string="Được phép Bán?")
    can_convert = fields.Boolean(string="Được phép Chuyển đổi?")


# Biểu phí
class FeeSchedule(models.Model):
    _name = 'fund.fee.schedule'
    _description = 'Biểu phí'

    fee_name = fields.Char(string="Tên loại phí", required=True)
    fee_code = fields.Char(string="Mã phí VSD", required=True)
    fee_type = fields.Selection([
        ('subscription', 'Phí mua chứng chỉ quỹ'),
        ('redemption', 'Phí bán chứng chỉ quỹ'),
        ('switching', 'Phí chuyển đổi'),
        ('management', 'Phí quản lý'),
        ('performance', 'Phí thành công'),
        ('other', 'Phí khác')
    ], string="Loại phí", required=True)  # gắn tạm giá trị
    scheme_id = fields.Many2one("fund.scheme", string="Chương trình", required=True)
    operator_1 = fields.Selection([ ('+', '+'), ], string="Toán tử ban đầu", required=True)
    initial_value = fields.Float(string="Giá trị ban đầu", required=True)
    operator_2 = fields.Selection([ ('+', '+'), ], string="Toán tử kết thúc", required=True)
    end_value = fields.Char(string="Giá trị kết thúc", required=True)
    fee_rate = fields.Float(string="Tỉ lệ phí", required=True)
    activate = fields.Boolean(string="Kích hoạt")

#SIP
class SipSettings(models.Model):
    _name = 'fund.sip.settings'
    _description = 'Cài đặt SIP'

    # sip_scheme = fields.Selection([], string="Chọn chương trình sip", required=True)
    sip_scheme_id = fields.Many2one('fund.scheme', string="Chọn chương trình SIP", required=True)
    max_non_consecutive_periods = fields.Integer(string="Số kỳ tối đa không liên tục", required=True)
    min_monthly_amount = fields.Float(string="Số tiền tối thiểu hằng tháng", required=True)
    min_maintenance_periods = fields.Integer(string="Số kỳ duy trì tối thiểu", required=True)
    cycle_code = fields.Char(string="Mã chu kỳ giao dịch", required=True)
    program_period = fields.Selection([
        ('monthly', 'Hàng tháng'),
        ('quarterly', 'Hàng quý'),
        ('yearly', 'Hàng năm'),
    ], string="Chọn kỳ của chương trình", required=True) #gắn tạm giá trị
    allow_multiple_investments = fields.Boolean(string="Cho phép đầu tư nhiều lần trong kỳ")
    active = fields.Boolean(string="Kích hoạt")


# Thuế
class TaxSettings(models.Model):
    _name = "fund.tax.settings"
    _description = "Cài đặt thuế"

    tax_name = fields.Char(string="Tên Thuế", required=True)
    tax_english_name = fields.Char(string="Tên Tiếng Anh", required=True)
    tax_code = fields.Char(string="Mã Thuế", required=True)
    rate = fields.Float(string="Tỉ lệ đóng", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)


# === AUTO FUND CERTIFICATE CREATION ===
class AutoFundCertificateCreator(models.Model):
    """Tự động tạo fund certificate từ symbols có OHLC data"""
    _name = 'auto.fund.certificate.creator'
    _description = 'Auto Fund Certificate Creator'
    
    @api.model
    def auto_create_fund_certificates_from_ohlc(self):
        """Tạo/cập nhật CCQ trực tiếp từ danh sách Daily OHLC (menu Daily OHLC Data).
        Lấy unique security_id từ `ssi.daily.ohlc`, dùng `ssi.securities` để map sang `fund.certificate`.
        """
        try:
            ohlc_model = self.env['ssi.daily.ohlc'].sudo()
            sec_model = self.env['ssi.securities'].sudo()
            fund_model = self.env['fund.certificate'].sudo()

            ohlc_records = ohlc_model.search([])
            unique_sec_ids = set([r.security_id.id for r in ohlc_records if r.security_id])

            if not unique_sec_ids:
                msg = "Auto Fund Certificate Creation Completed:\n• Created: 0 certificates\n• Updated: 0 certificates\n• Skipped: 0 symbols\n• Total processed: 0 symbols"
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': 'Auto Fund Certificate Creation',
                        'message': msg,
                        'type': 'warning',
                        'sticky': False,
                    }
                }

            created = 0
            updated = 0
            skipped = 0

            securities = sec_model.browse(list(unique_sec_ids))
            for sec in securities:
                try:
                    if not sec.symbol or not sec.market:
                        skipped += 1
                        continue
                    existing = fund_model.search([('symbol', '=', sec.symbol), ('market', '=', sec.market)], limit=1)
                    
                    # Lấy close_price từ Daily OHLC mới nhất
                    latest_ohlc = ohlc_model.search([
                        ('security_id', '=', sec.id)
                    ], order='date desc', limit=1)
                    initial_price = latest_ohlc.close_price if latest_ohlc and latest_ohlc.close_price else 0.0
                    
                    vals = {
                        'symbol': sec.symbol,
                        'market': sec.market,
                        'floor_code': sec.floor_code,
                        'security_type': sec.security_type,
                        'short_name_vn': sec.stock_name_vn,
                        'short_name_en': sec.stock_name_en,
                        'reference_price': sec.reference_price,
                        'ceiling_price': sec.ceiling_price,
                        'floor_price': sec.floor_price,
                        'last_trading_date': sec.last_trading_date,
                        'current_price': sec.current_price,
                        'high_price': sec.high_price,
                        'low_price': sec.low_price,
                        'initial_certificate_quantity': int(sec.volume) if sec.volume else 0,
                        'initial_certificate_price': initial_price,
                        'last_price': sec.last_price,
                        'is_active': True,
                        'last_update': fields.Datetime.now(),
                        'product_status': 'active',
                        'fund_description': f"{sec.symbol} - {sec.security_type} - {sec.market}",
                    }
                    if existing:
                        existing.with_context(skip_fund_sync=True).write(vals)
                        updated += 1
                    else:
                        fund_model.with_context(skip_fund_sync=True).create(vals)
                        created += 1
                except Exception:
                    skipped += 1
                    continue

            total = created + updated + skipped
            message = (
                "Auto Fund Certificate Creation Completed:\n"
                f"• Created: {created} certificates\n"
                f"• Updated: {updated} certificates\n"
                f"• Skipped: {skipped} symbols\n"
                f"• Total processed: {total} symbols"
            )
            _logger.info(message)
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Auto Fund Certificate Creation',
                    'message': message,
                    'type': 'success',
                    'sticky': True,
                }
            }
        except Exception as e:
            _logger.error("Error in auto_create_fund_certificates_from_ohlc: %s", str(e), exc_info=True)
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Auto Fund Certificate Creation Error',
                    'message': f'Error: {str(e)}',
                    'type': 'danger',
                    'sticky': True,
                }
            }
    
    @api.model
    def cron_auto_create_fund_certificates(self):
        """Cron job để tự động tạo fund certificate mỗi ngày"""
        _logger.info("Starting cron job: auto_create_fund_certificates")
        self.auto_create_fund_certificates_from_ohlc()
    
    @api.model
    def action_auto_create_fund_certificates(self):
        """Action để gọi từ button hoặc menu"""
        return self.auto_create_fund_certificates_from_ohlc()
    
    @api.model
    def get_ohlc_statistics(self):
        """Lấy thống kê về symbols có OHLC data"""
        try:
            daily_ohlc_model = self.env['ssi.daily.ohlc']
            securities_model = self.env['ssi.securities']
            fund_cert_model = self.env['fund.certificate']
            
            # Đếm symbols có Daily OHLC
            daily_ohlc_count = daily_ohlc_model.search_count([])
            
            # Đếm unique symbols có OHLC
            daily_ohlc_records = daily_ohlc_model.search([])
            symbols_with_ohlc = set()
            for ohlc in daily_ohlc_records:
                if ohlc.security_id and ohlc.security_id.symbol and ohlc.security_id.market:
                    symbols_with_ohlc.add((ohlc.security_id.symbol, ohlc.security_id.market))
            
            # Đếm fund certificates hiện có
            fund_cert_count = fund_cert_model.search_count([])
            
            # Đếm securities tổng cộng
            securities_count = securities_model.search_count([])
            
            stats = {
                'daily_ohlc_records': daily_ohlc_count,
                'symbols_with_ohlc': len(symbols_with_ohlc),
                'fund_certificates': fund_cert_count,
                'securities_total': securities_count,
                'coverage_percent': round((len(symbols_with_ohlc) / securities_count * 100) if securities_count > 0 else 0, 2)
            }
            
            return stats
            
        except Exception as e:
            _logger.error("Error getting OHLC statistics: %s", str(e))
            return {}