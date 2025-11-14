from odoo import api, fields, models

from ..utils import constants


class Fund(models.Model):
    _name = "portfolio.fund"
    _description = "Fund"
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Link tới master Fund Certificate ở module fund_management_control
    certificate_id = fields.Many2one(
        comodel_name="fund.certificate",
        string="Fund Certificate (master)",
        help="Chọn chứng chỉ quỹ từ trang master để đồng bộ thông tin",
    )

    name = fields.Char(string="Name", required=True)
    ticker = fields.Char(string="Ticker", required=True)
    description = fields.Text(string="Description")
    inception_date = fields.Date(string="Inception Date", required=True)
    current_nav = fields.Float(string="Current NAV", required=True)
    # Thay thế các trường cũ bằng low/high/open để đồng bộ với fund_management_control
    low_price = fields.Float(string="Low Price")
    high_price = fields.Float(string="High Price")
    open_price = fields.Float(string="Open Price")
    investment_type = fields.Selection(
        constants.FUND_INVESTMENT_TYPES,
        string="Investment Type",
        required=True
    )
    is_shariah = fields.Boolean(string="Is Shariah")
    ytd_history = fields.Text(string="YTD History (JSON)")
    nav_history = fields.Text(string="NAV History (JSON)")
    # Dạng JSON tiện cho ace editor ở module overview
    ytd_history_json = fields.Text(string="YTD History JSON")
    nav_history_json = fields.Text(string="NAV History JSON")
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)
    status = fields.Selection(
        constants.FUND_STATUSES,
        string="Status",
        default=constants.DEFAULT_FUND_STATUS
    )
    # Thống kê mở rộng phục vụ overview_fund_management (để tránh lỗi view khi cột tồn tại)
    investment_count = fields.Integer(string="Investment Count", default=0)
    total_units = fields.Float(string="Total Units", default=0.0)
    flex_units = fields.Float(string="Flex Units", default=0.0)
    sip_units = fields.Float(string="SIP Units", default=0.0)
    total_investment = fields.Float(string="Total Investment", default=0.0)
    current_value = fields.Float(string="Current Value", default=0.0)
    profit_loss = fields.Float(string="Profit/Loss", default=0.0)
    profit_loss_percentage = fields.Float(string="Profit/Loss %", default=0.0)
    last_update = fields.Datetime(string="Last Update")
    color = fields.Char(string="Color", default="#2B4BFF")
    # Market dynamics
    change = fields.Float(string="Change", default=0.0)
    change_percent = fields.Float(string="Change %", default=0.0)
    volume = fields.Float(string="Volume", default=0.0)

    # Relations
    investment_ids = fields.One2many('portfolio.investment', 'fund_id', string='Investments')

    # --- Sync helpers (simplified) ---
    def _map_fund_type(self, fund_type_value):
        """Map fund type to investment type"""
        return constants.FUND_TYPE_MAPPING.get(
            fund_type_value or '',
            self.investment_type or constants.FUND_INVESTMENT_TYPE_GROWTH
        )

    def _sync_from_certificate(self):
        """Sync data from certificate - simplified version"""
        self.ensure_one()
        if not self.certificate_id:
            return {}
        
        cert = self.certificate_id
        vals = {}
        
        # Basic info mapping: ticker = symbol, name = stockname (short_name_* mapped from stock_data)
        vals['ticker'] = cert.symbol or ''
        name_val = cert.short_name_vn or cert.short_name_en or cert.symbol or ''
        vals['name'] = name_val
        
        # Dùng current_price thay vì current_nav
        if cert.current_price is not None:
            vals['current_nav'] = cert.current_price
        
        # Đồng bộ low/high/open từ fund_management_control
        if getattr(cert, 'low_price', None) is not None:
            vals['low_price'] = cert.low_price
        if getattr(cert, 'high_price', None) is not None:
            vals['high_price'] = cert.high_price
        # Add change / change% / volume if available
        if hasattr(cert, 'change') and cert.change is not None:
            vals['change'] = cert.change
        if hasattr(cert, 'change_percent') and cert.change_percent is not None:
            vals['change_percent'] = cert.change_percent
        if hasattr(cert, 'volume') and cert.volume is not None:
            vals['volume'] = float(cert.volume or 0.0)
        
        # Open price lấy từ Daily OHLC gần nhất, fallback reference_price
        try:
            ohlc = self.env['ssi.daily.ohlc'].sudo().search([
                ('security_id.symbol', '=', cert.symbol),
                ('security_id.market', '=', cert.market)
            ], order='date desc', limit=1)
            if ohlc and ohlc.open_price is not None:
                vals['open_price'] = ohlc.open_price
            elif cert.reference_price is not None:
                vals['open_price'] = cert.reference_price
        except Exception:
            if cert.reference_price is not None:
                vals['open_price'] = cert.reference_price
        
        # Dùng fund_type nếu có
        if cert.fund_type:
            vals['investment_type'] = self._map_fund_type(cert.fund_type)
        # Sync fund color if provided by master certificate
        if getattr(cert, 'fund_color', None):
            vals['color'] = cert.fund_color
            
        return vals

    @api.onchange('certificate_id')
    def _onchange_certificate_id(self):
        """Sync when certificate changes"""
        for rec in self:
            if rec.certificate_id:
                vals = rec._sync_from_certificate()
                for key, value in vals.items():
                    setattr(rec, key, value)

    # ---- Sync actions ----
    def action_sync_from_certificate(self):
        """Sync data from linked certificate"""
        for rec in self:
            if rec.certificate_id:
                vals = rec._sync_from_certificate()
                if vals:
                    rec.write(vals)
        return True

    @api.model
    def sync_all_from_master(self):
        """Sync all funds from master certificates"""
        certificates = self.env['fund.certificate'].sudo().search([])
        synced_count = 0
        
        for cert in certificates:
            # Tìm fund theo ticker = symbol
            ticker_to_search = cert.symbol
            if not ticker_to_search:
                continue
                
            fund = self.sudo().search([('ticker', '=', ticker_to_search)], limit=1)
            
            if fund:
                # Update existing fund
                if not fund.certificate_id:
                    fund.certificate_id = cert.id
                fund.action_sync_from_certificate()
                synced_count += 1
            else:
                # Create new fund
                name_val = cert.short_name_vn or cert.short_name_en or cert.symbol or 'N/A'
                ticker_val = cert.symbol or 'N/A'
                
                vals = {
                    'certificate_id': cert.id,
                    'name': name_val,
                    'ticker': ticker_val,
                    'description': cert.fund_description or '',
                    'inception_date': cert.closure_date or fields.Date.context_today(self),
                    'current_nav': cert.current_price or 0.0,  # Dùng current_price thay vì current_nav
                    'investment_type': (
                        self._map_fund_type(cert.fund_type)
                        if cert.fund_type
                        else constants.FUND_INVESTMENT_TYPE_GROWTH
                    ),
                    'color': getattr(cert, 'fund_color', '#2B4BFF') or '#2B4BFF',
                }

                # Bổ sung low/high/open
                if getattr(cert, 'low_price', None) is not None:
                    vals['low_price'] = cert.low_price
                if getattr(cert, 'high_price', None) is not None:
                    vals['high_price'] = cert.high_price
                try:
                    ohlc = self.env['ssi.daily.ohlc'].sudo().search([
                        ('security_id.symbol', '=', cert.symbol),
                        ('security_id.market', '=', cert.market)
                    ], order='date desc', limit=1)
                    if ohlc and ohlc.open_price is not None:
                        vals['open_price'] = ohlc.open_price
                    elif cert.reference_price is not None:
                        vals['open_price'] = cert.reference_price
                except Exception:
                    if cert.reference_price is not None:
                        vals['open_price'] = cert.reference_price
                # changes & volume
                if hasattr(cert, 'change') and cert.change is not None:
                    vals['change'] = cert.change
                if hasattr(cert, 'change_percent') and cert.change_percent is not None:
                    vals['change_percent'] = cert.change_percent
                if hasattr(cert, 'volume') and cert.volume is not None:
                    vals['volume'] = float(cert.volume or 0.0)
                new_fund = self.sudo().create(vals)
                new_fund.action_sync_from_certificate()
                synced_count += 1
        
        return {
            'synced_count': synced_count,
            'total_certificates': len(certificates),
        }