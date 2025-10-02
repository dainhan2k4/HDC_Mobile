from odoo import models, fields, api

class ReportBalance(models.Model):
    _inherit = 'portfolio.investment'
    _description = 'Report Balance - Extended from Portfolio Investment'
    
    # Computed fields để map với dữ liệu từ portfolio.investment
    so_tai_khoan = fields.Char(string="Số tài khoản", compute='_compute_so_tai_khoan', store=True)
    nha_dau_tu = fields.Char(string="Nhà đầu tư", compute='_compute_nha_dau_tu', store=True)
    so_dien_thoai = fields.Char(string="Số điện thoại", compute='_compute_so_dien_thoai', store=True)
    dksh = fields.Char(string="ĐKSH", compute='_compute_dksh', store=True)
    email = fields.Char(string="Email", compute='_compute_email', store=True)
    loai_ndt = fields.Selection([
        ('truc_tiep', 'Trực tiếp'),
        ('ky_danh', 'Ký danh'),
    ], string="Loại nhà đầu tư", default='truc_tiep')
    quy = fields.Char(string="Quỹ", compute='_compute_quy', store=True)
    chuong_trinh = fields.Char(string="Chương trình", compute='_compute_chuong_trinh', store=True)
    chuong_trinh_ticker = fields.Char(string="Chương trình Ticker", compute='_compute_chuong_trinh_ticker', store=True)
    ngay_in = fields.Date(string="Ngày in", default=fields.Date.today)
    so_ccq = fields.Float(string="Số CCQ", compute='_compute_so_ccq', store=True)
    
    @api.depends('user_id', 'user_id.partner_id')
    def _compute_so_tai_khoan(self):
        """Compute số tài khoản từ user"""
        for record in self:
            partner = record.user_id.partner_id if record.user_id else False
            if partner:
                status_info = self.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                record.so_tai_khoan = status_info.so_tk if status_info else partner.name
            else:
                record.so_tai_khoan = ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_nha_dau_tu(self):
        """Compute tên nhà đầu tư"""
        for record in self:
            record.nha_dau_tu = record.user_id.name if record.user_id else ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_so_dien_thoai(self):
        """Compute số điện thoại"""
        for record in self:
            partner = record.user_id.partner_id if record.user_id else False
            record.so_dien_thoai = partner.phone if partner else ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_dksh(self):
        """Compute ĐKSH từ investor_profile_management"""
        for record in self:
            if record.user_id and record.user_id.partner_id:
                # Tìm investor profile
                investor_profile = self.env['investor.profile'].sudo().search([
                    ('partner_id', '=', record.user_id.partner_id.id)
                ], limit=1)
                if investor_profile and investor_profile.id_number:
                    record.dksh = str(investor_profile.id_number)
                else:
                    record.dksh = "-"
            else:
                record.dksh = "-"

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_email(self):
        """Compute email"""
        for record in self:
            partner = record.user_id.partner_id if record.user_id else False
            record.email = partner.email if partner else ''

    @api.depends('fund_id')
    def _compute_quy(self):
        """Compute tên quỹ"""
        for record in self:
            record.quy = record.fund_id.name if record.fund_id else ''

    @api.depends('fund_id')
    def _compute_chuong_trinh(self):
        """Compute chương trình từ fund"""
        for record in self:
            record.chuong_trinh = record.fund_id.name if record.fund_id else ''

    @api.depends('fund_id')
    def _compute_chuong_trinh_ticker(self):
        """Compute ticker của fund"""
        for record in self:
            record.chuong_trinh_ticker = record.fund_id.ticker if record.fund_id and record.fund_id.ticker else ''

    @api.depends('units')
    def _compute_so_ccq(self):
        """Compute số CCQ từ units"""
        for record in self:
            record.so_ccq = record.units or 0.0
    
    @api.model
    def search_report_balance(self, domain=None, limit=10, offset=0):
        """
        Search method for report balance with pagination - sử dụng dữ liệu thật từ portfolio.investment
        """
        # Initialize domain as list
        if not domain:
            domain = []
        elif isinstance(domain, dict):
            # Convert dict to list
            filter_domain = []
            for field, value in domain.items():
                if value:
                    if field == 'fund_id.name':
                        filter_domain.append(('fund_id.name', '=', value))
                    elif field == 'create_date':
                        filter_domain.append(('create_date', '>=', value))
                    elif field == 'create_date_to':
                        filter_domain.append(('create_date', '<=', value))
            domain = filter_domain
        elif not isinstance(domain, list):
            domain = []
            
        # Lấy tất cả dữ liệu, không filter theo status
        # domain.append(('status', '=', 'active'))
        
        # Get total count
        total = self.search_count(domain)
        
        # Get records with pagination
        records = self.search(domain, limit=limit, offset=offset, order='id desc')
        
        # Format data for frontend
        data = []
        for record in records:
            data.append({
                'id': record.id,
                'so_tai_khoan': record.so_tai_khoan,
                'nha_dau_tu': record.nha_dau_tu,
                'so_dien_thoai': record.so_dien_thoai,
                'dksh': record.dksh,
                'email': record.email,
                'loai_ndt': record.loai_ndt,
                'quy': record.quy,
                'chuong_trinh': record.chuong_trinh,
                'chuong_trinh_ticker': record.chuong_trinh_ticker,
                'ngay_in': record.ngay_in.strftime('%Y-%m-%d') if record.ngay_in else '',
                'so_ccq': record.so_ccq,
            })
        
        return {
            'records': data,
            'total': total,
        }
    
    @api.model
    def get_products_for_filter(self):
        """
        Get funds for filter dropdown từ portfolio.fund
        """
        funds = self.env['portfolio.fund'].search_read(
            [], 
            ['id', 'name'], 
            order='name'
        )
        return funds
