from odoo import models, fields, api
from datetime import datetime

class ReportTransaction(models.Model):
    _inherit = 'portfolio.transaction'
    _description = 'Report Transaction - Extended from Portfolio Transaction'
    
    # Computed fields để map với dữ liệu từ portfolio.transaction
    so_tai_khoan = fields.Char(string="Số tài khoản", compute='_compute_so_tai_khoan', store=True)
    nha_dau_tu = fields.Char(string="Nhà đầu tư", compute='_compute_nha_dau_tu', store=True)
    dksh = fields.Char(string="ĐKSH", compute='_compute_dksh', store=True)
    quy = fields.Char(string="Quỹ", compute='_compute_quy', store=True)
    chuong_trinh = fields.Char(string="Chương trình", compute='_compute_chuong_trinh', store=True)
    phien_giao_dich = fields.Date(string="Phiên giao dịch", compute='_compute_phien_giao_dich', store=True)
    ma_giao_dich = fields.Char(string="Mã giao dịch", compute='_compute_ma_giao_dich', store=True)
    loai_lenh = fields.Selection([
        ('mua', 'Lệnh mua'),
        ('ban', 'Lệnh bán'),
    ], string="Loại lệnh", compute='_compute_loai_lenh', store=True)
    so_ccq = fields.Float(string="Số CCQ", compute='_compute_so_ccq', store=True)
    gia_tien = fields.Float(string="Giá tiền", compute='_compute_gia_tien', store=True)
    tong_so_tien = fields.Float(string="Tổng số tiền", compute='_compute_tong_so_tien', store=True)
    chuong_trinh_ticker = fields.Char(string="Chương trình Ticker", compute='_compute_chuong_trinh_ticker', store=True)
    # Không cần định nghĩa trường contract_pdf_path ở đây

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

    @api.depends('user_id')
    def _compute_nha_dau_tu(self):
        """Compute tên nhà đầu tư"""
        for record in self:
            record.nha_dau_tu = record.user_id.name if record.user_id else ''

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

    @api.depends('created_at')
    def _compute_phien_giao_dich(self):
        """Compute phiên giao dịch từ created_at"""
        for record in self:
            if record.created_at:
                record.phien_giao_dich = record.created_at.date()
            else:
                record.phien_giao_dich = False

    @api.depends('name')
    def _compute_ma_giao_dich(self):
        """Compute mã giao dịch từ name"""
        for record in self:
            record.ma_giao_dich = record.name or ''

    @api.depends('transaction_type')
    def _compute_loai_lenh(self):
        """Compute loại lệnh từ transaction_type"""
        for record in self:
            if record.transaction_type == 'purchase':
                record.loai_lenh = 'mua'
            elif record.transaction_type == 'sell':
                record.loai_lenh = 'ban'
            elif record.transaction_type == 'exchange':
                record.loai_lenh = 'hoan_doi'
            else:
                record.loai_lenh = 'mua'

    @api.depends('units')
    def _compute_so_ccq(self):
        """Compute số CCQ từ units"""
        for record in self:
            record.so_ccq = record.units or 0.0

    @api.depends('calculated_amount', 'units')
    def _compute_gia_tien(self):
        """Compute giá tiền từ calculated_amount và units"""
        for record in self:
            if record.units and record.units > 0:
                record.gia_tien = record.calculated_amount / record.units
            else:
                record.gia_tien = 0.0

    @api.depends('amount')
    def _compute_tong_so_tien(self):
        """Compute tổng số tiền từ amount"""
        for record in self:
            record.tong_so_tien = record.amount or 0.0

    @api.depends('fund_id')
    def _compute_chuong_trinh_ticker(self):
        """Compute ticker của fund"""
        for record in self:
            record.chuong_trinh_ticker = record.fund_id.ticker if record.fund_id and record.fund_id.ticker else ''



    @api.model
    def get_report_data(self, domain=None, search_values=None, limit=10, offset=0):
        """Get report data using real transaction data"""
        try:
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
                        elif field == 'phien_giao_dich':
                            filter_domain.append(('created_at', '>=', f"{value} 00:00:00"))
                        elif field == 'phien_giao_dich_to':
                            filter_domain.append(('created_at', '<=', f"{value} 23:59:59"))
                domain = filter_domain
            elif not isinstance(domain, list):
                domain = []

            # Add search values from inline search fields
            if search_values:
                print(f"Search values received: {search_values}")
                for field, value in search_values.items():
                    if value:
                        if field == 'loai_lenh':
                            # Map loại lệnh từ frontend sang transaction_type
                            type_mapping = {
                                'mua': 'purchase',
                                'ban': 'sell',
                                'hoan_doi': 'exchange'
                            }
                            mapped_value = type_mapping.get(value)
                            print(f"Mapping loai_lenh: {value} -> {mapped_value}")
                            if mapped_value:
                                domain.append(('transaction_type', '=', mapped_value))
                        else:
                            # Map frontend field names to actual model fields
                            field_mapping = {
                                'so_tai_khoan': 'user_id.partner_id.name',
                                'nha_dau_tu': 'user_id.name',
                                'quy': 'fund_id.name',
                                'ma_giao_dich': 'name',
                            }
                            actual_field = field_mapping.get(field, field)
                            domain.append((actual_field, 'ilike', value))

            # Debug: Log domain and parameters
            print(f"Report Transaction Domain: {domain}")
            print(f"Limit: {limit}, Offset: {offset}")
            
            total = self.search_count(domain)
            print(f"Total records found: {total}")
            
            records = self.search(domain, limit=limit, offset=offset, order='created_at desc')
            print(f"Records retrieved: {len(records)}")
            
            formatted_records = []
            for record in records:
                # Lấy dữ liệu trực tiếp từ transaction record, ưu tiên các field NAV đã tính toán
                formatted_records.append({
                    'id': record.id,
                    'so_tai_khoan': record.so_tai_khoan,
                    'nha_dau_tu': record.nha_dau_tu,
                    'dksh': record.dksh,
                    'quy': record.quy,
                    'chuong_trinh': record.chuong_trinh,
                    'chuong_trinh_ticker': record.chuong_trinh_ticker,
                    'phien_giao_dich': record.phien_giao_dich.strftime('%Y-%m-%d') if record.phien_giao_dich else None,
                    'ma_giao_dich': record.ma_giao_dich,
                    'loai_lenh': record.loai_lenh,
                    'so_ccq': record.so_ccq,
                    'gia_tien': record.gia_tien,
                    'tong_so_tien': record.tong_so_tien,
                    'contract_pdf_path': getattr(record, 'contract_pdf_path', ''),
                    # Thêm các field NAV nếu có
                    'nav_maturity_date': record.nav_maturity_date.strftime('%Y-%m-%d') if getattr(record, 'nav_maturity_date', False) else None,
                    'nav_sell_date': record.nav_sell_date.strftime('%Y-%m-%d') if getattr(record, 'nav_sell_date', False) else None,
                    'nav_days': getattr(record, 'nav_days', 0),
                    'nav_purchase_value': getattr(record, 'nav_purchase_value', 0.0),
                    'nav_sell_value1': getattr(record, 'nav_sell_value1', 0.0),
                    'nav_customer_receive': getattr(record, 'nav_customer_receive', 0.0),
                })
            
            result = {
                'records': formatted_records,
                'total': total,
            }
            print(f"Returning result: {result}")
            return result
            
        except Exception as e:
            print(f"Error in get_report_data: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'records': [],
                'total': 0,
            }

    @api.model
    def get_products(self):
        """Get distinct fund values from the transaction records"""
        try:
            funds = self.read_group([], ['fund_id'], ['fund_id'])
            products = []
            
            for fund in funds:
                if fund.get('fund_id'):
                    fund_name = fund['fund_id'][1] if isinstance(fund['fund_id'], tuple) else fund['fund_id']
                    products.append({
                        'id': fund_name, 
                        'name': fund_name
                    })
            
            # Sort products by name
            products.sort(key=lambda x: x['name'])
            print(f"Products found: {products}")
            return products
            
        except Exception as e:
            print(f"Error in get_products: {str(e)}")
            import traceback
            traceback.print_exc()
            return []