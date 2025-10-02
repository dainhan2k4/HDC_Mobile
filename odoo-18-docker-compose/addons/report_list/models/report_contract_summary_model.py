from odoo import models, fields, api

class ReportContractSummary(models.Model):
    _inherit = 'portfolio.transaction'
    _description = 'Report Contract Summary - Extended from Portfolio Transaction'
    
    # Computed fields để map với dữ liệu từ portfolio.transaction
    so_hop_dong = fields.Char(string="Số Hợp đồng", compute='_compute_so_hop_dong', store=True)
    so_tk = fields.Char(string="Số TK", compute='_compute_so_tk', store=True)
    so_tk_gdck = fields.Char(string="Số TK GDCK", compute='_compute_so_tk_gdck', store=True)
    khach_hang = fields.Char(string="Khách hàng", compute='_compute_khach_hang', store=True)
    ngay_mua = fields.Date(string="Ngày mua", compute='_compute_ngay_mua', store=True)
    ngay_thanh_toan = fields.Date(string="Ngày thanh toán", compute='_compute_ngay_thanh_toan', store=True)
    so_luong = fields.Float(string="Số lượng", compute='_compute_so_luong', store=True)
    gia_mua = fields.Float(string="Giá mua", compute='_compute_gia_mua', store=True)
    thanh_tien = fields.Float(string="Thành tiền", compute='_compute_thanh_tien', store=True)
    ky_han = fields.Char(string="Kỳ hạn", compute='_compute_ky_han', store=True)
    lai_suat = fields.Float(string="Lãi Suất", compute='_compute_lai_suat', store=True)
    so_ngay = fields.Integer(string="Số Ngày", compute='_compute_so_ngay', store=True)
    tien_lai_du_kien = fields.Float(string="Tiền lãi dự kiến khi đến hạn", compute='_compute_tien_lai_du_kien', store=True)
    gia_ban_lai_du_kien = fields.Float(string="Giá bán lại dự kiến theo HĐ", compute='_compute_gia_ban_lai_du_kien', store=True)
    goc_lai_du_kien = fields.Float(string="Gốc + lãi dự kiến khi đến hạn", compute='_compute_goc_lai_du_kien', store=True)
    ngay_ban_lai_du_kien = fields.Date(string="Ngày bán lại dự kiến theo HĐ", compute='_compute_ngay_ban_lai_du_kien', store=True)
    ngay_den_han = fields.Date(string="Ngày đến hạn", compute='_compute_ngay_den_han', store=True)
    ngay_ban_lai = fields.Date(string="Ngày bán lại", compute='_compute_ngay_ban_lai', store=True)
    ngay_thanh_toan_ban_lai = fields.Date(string="Ngày thanh toán bán lại", compute='_compute_ngay_thanh_toan_ban_lai', store=True)
    ls_ban_lai = fields.Float(string="LS bán lại", compute='_compute_ls_ban_lai', store=True)
    tien_lai = fields.Float(string="Tiền lãi", compute='_compute_tien_lai', store=True)
    goc_lai = fields.Float(string="Gốc + lãi", compute='_compute_goc_lai', store=True)

    @api.depends('name')
    def _compute_so_hop_dong(self):
        """Compute số hợp đồng từ name"""
        for record in self:
            record.so_hop_dong = record.name or ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_so_tk(self):
        """Compute số tài khoản từ user"""
        for record in self:
            partner = record.user_id.partner_id if record.user_id else False
            if partner:
                status_info = self.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                record.so_tk = status_info.so_tk if status_info else partner.name
            else:
                record.so_tk = ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_so_tk_gdck(self):
        """Compute số TK GDCK"""
        for record in self:
            # Có thể map từ field khác hoặc để trống
            record.so_tk_gdck = ''

    @api.depends('user_id')
    def _compute_khach_hang(self):
        """Compute tên khách hàng"""
        for record in self:
            record.khach_hang = record.user_id.name if record.user_id else ''

    @api.depends('transaction_date')
    def _compute_ngay_mua(self):
        """Compute ngày mua từ transaction_date"""
        for record in self:
            record.ngay_mua = record.transaction_date

    @api.depends('transaction_date')
    def _compute_ngay_thanh_toan(self):
        """Compute ngày thanh toán"""
        for record in self:
            # Có thể tính từ transaction_date + số ngày xử lý
            record.ngay_thanh_toan = record.transaction_date

    @api.depends('units')
    def _compute_so_luong(self):
        """Compute số lượng từ units"""
        for record in self:
            record.so_luong = record.units or 0.0

    @api.depends('calculated_amount', 'units')
    def _compute_gia_mua(self):
        """Compute giá mua từ calculated_amount và units"""
        for record in self:
            if record.units and record.units > 0:
                record.gia_mua = record.calculated_amount / record.units
            else:
                record.gia_mua = 0.0

    @api.depends('amount')
    def _compute_thanh_tien(self):
        """Compute thành tiền từ amount"""
        for record in self:
            record.thanh_tien = record.amount or 0.0

    @api.depends('fund_id')
    def _compute_ky_han(self):
        """Compute kỳ hạn từ fund"""
        for record in self:
            # Có thể map từ fund hoặc để mặc định
            record.ky_han = '12'  # Mặc định 12 tháng

    @api.depends('fund_id')
    def _compute_lai_suat(self):
        """Compute lãi suất"""
        for record in self:
            # Có thể map từ fund hoặc để mặc định
            record.lai_suat = 8.5  # Mặc định 8.5%

    @api.depends('transaction_date')
    def _compute_so_ngay(self):
        """Compute số ngày từ transaction_date"""
        for record in self:
            if record.transaction_date:
                from datetime import date
                today = date.today()
                delta = today - record.transaction_date
                record.so_ngay = delta.days
            else:
                record.so_ngay = 0

    @api.depends('amount', 'lai_suat', 'ky_han')
    def _compute_tien_lai_du_kien(self):
        """Compute tiền lãi dự kiến khi đến hạn"""
        for record in self:
            if record.amount and record.lai_suat and record.ky_han:
                try:
                    ky_han_months = int(record.ky_han)
                    tien_lai = record.amount * (record.lai_suat / 100) * (ky_han_months / 12)
                    record.tien_lai_du_kien = tien_lai
                except:
                    record.tien_lai_du_kien = 0.0
            else:
                record.tien_lai_du_kien = 0.0

    @api.depends('gia_mua', 'lai_suat', 'ky_han')
    def _compute_gia_ban_lai_du_kien(self):
        """Compute giá bán lại dự kiến theo HĐ"""
        for record in self:
            if record.gia_mua and record.lai_suat and record.ky_han:
                try:
                    ky_han_months = int(record.ky_han)
                    gia_ban_lai = record.gia_mua * (1 + (record.lai_suat / 100) * (ky_han_months / 12))
                    record.gia_ban_lai_du_kien = gia_ban_lai
                except:
                    record.gia_ban_lai_du_kien = 0.0
            else:
                record.gia_ban_lai_du_kien = 0.0

    @api.depends('amount', 'tien_lai_du_kien')
    def _compute_goc_lai_du_kien(self):
        """Compute gốc + lãi dự kiến khi đến hạn"""
        for record in self:
            record.goc_lai_du_kien = (record.amount or 0.0) + (record.tien_lai_du_kien or 0.0)

    @api.depends('transaction_date', 'ky_han')
    def _compute_ngay_ban_lai_du_kien(self):
        """Compute ngày bán lại dự kiến theo HĐ"""
        for record in self:
            if record.transaction_date and record.ky_han:
                try:
                    from datetime import timedelta
                    ky_han_months = int(record.ky_han)
                    ngay_ban_lai = record.transaction_date + timedelta(days=ky_han_months * 30)
                    record.ngay_ban_lai_du_kien = ngay_ban_lai
                except:
                    record.ngay_ban_lai_du_kien = False
            else:
                record.ngay_ban_lai_du_kien = False

    @api.depends('ngay_ban_lai_du_kien')
    def _compute_ngay_den_han(self):
        """Compute ngày đến hạn"""
        for record in self:
            record.ngay_den_han = record.ngay_ban_lai_du_kien

    @api.depends('transaction_type')
    def _compute_ngay_ban_lai(self):
        """Compute ngày bán lại"""
        for record in self:
            # Chỉ có ngày bán lại khi transaction_type là 'sell'
            if record.transaction_type == 'sell':
                record.ngay_ban_lai = record.transaction_date
            else:
                record.ngay_ban_lai = False

    @api.depends('ngay_ban_lai')
    def _compute_ngay_thanh_toan_ban_lai(self):
        """Compute ngày thanh toán bán lại"""
        for record in self:
            if record.ngay_ban_lai:
                # Có thể tính từ ngày bán + số ngày xử lý
                record.ngay_thanh_toan_ban_lai = record.ngay_ban_lai
            else:
                record.ngay_thanh_toan_ban_lai = False

    @api.depends('transaction_type')
    def _compute_ls_ban_lai(self):
        """Compute lãi suất bán lại"""
        for record in self:
            if record.transaction_type == 'sell':
                record.ls_ban_lai = record.lai_suat
            else:
                record.ls_ban_lai = 0.0

    @api.depends('transaction_type', 'tien_lai_du_kien')
    def _compute_tien_lai(self):
        """Compute tiền lãi thực tế"""
        for record in self:
            if record.transaction_type == 'sell':
                # Tính tiền lãi thực tế khi bán
                record.tien_lai = record.tien_lai_du_kien
            else:
                record.tien_lai = 0.0

    @api.depends('transaction_type', 'goc_lai_du_kien')
    def _compute_goc_lai(self):
        """Compute gốc + lãi thực tế"""
        for record in self:
            if record.transaction_type == 'sell':
                record.goc_lai = record.goc_lai_du_kien
            else:
                record.goc_lai = 0.0

    @api.model
    def get_report_data(self, domain=None, filters=None, search_values=None, limit=10, offset=0):
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
                        elif field == 'transaction_date':
                            filter_domain.append(('transaction_date', '>=', value))
                        elif field == 'transaction_date_to':
                            filter_domain.append(('transaction_date', '<=', value))
                domain = filter_domain
            elif not isinstance(domain, list):
                domain = []

            # Add filters
            if filters:
                for field, value in filters.items():
                    if value:
                        if field == 'customer':
                            domain.append(('user_id.name', 'ilike', value))
                        elif field == 'contract':
                            domain.append(('name', 'ilike', value))
                        elif field == 'date_from':
                            domain.append(('transaction_date', '>=', value))
                        elif field == 'date_to':
                            domain.append(('transaction_date', '<=', value))

            # Add search values from inline search fields
            if search_values:
                for field, value in search_values.items():
                    if value:
                        field_mapping = {
                            'so_hop_dong': 'name',
                            'so_tk': 'user_id.partner_id.name',
                            'khach_hang': 'user_id.name',
                        }
                        actual_field = field_mapping.get(field, field)
                        domain.append((actual_field, 'ilike', value))

            # Debug: Log domain and parameters
            print(f"Report Contract Summary Domain: {domain}")
            print(f"Limit: {limit}, Offset: {offset}")
            
            total = self.search_count(domain)
            print(f"Total records found: {total}")
            
            records = self.search(domain, limit=limit, offset=offset, order='transaction_date desc')
            print(f"Records retrieved: {len(records)}")
            
            formatted_records = []
            for index, record in enumerate(records):
                formatted_records.append({
                    'stt': offset + index + 1,
                    'so_hop_dong': record.so_hop_dong,
                    'so_tk': record.so_tk,
                    'so_tk_gdck': record.so_tk_gdck,
                    'khach_hang': record.khach_hang,
                    'ngay_mua': record.ngay_mua.strftime('%d/%m/%Y') if record.ngay_mua else '',
                    'ngay_thanh_toan': record.ngay_thanh_toan.strftime('%d/%m/%Y') if record.ngay_thanh_toan else '',
                    'so_luong': record.so_luong,
                    'gia_mua': record.gia_mua,
                    'thanh_tien': record.thanh_tien,
                    'ky_han': record.ky_han,
                    'lai_suat': record.lai_suat,
                    'so_ngay': record.so_ngay,
                    'tien_lai_du_kien': record.tien_lai_du_kien,
                    'gia_ban_lai_du_kien': record.gia_ban_lai_du_kien,
                    'goc_lai_du_kien': record.goc_lai_du_kien,
                    'ngay_ban_lai_du_kien': record.ngay_ban_lai_du_kien.strftime('%d/%m/%Y') if record.ngay_ban_lai_du_kien else '',
                    'ngay_den_han': record.ngay_den_han.strftime('%d/%m/%Y') if record.ngay_den_han else '',
                    'ngay_ban_lai': record.ngay_ban_lai.strftime('%d/%m/%Y') if record.ngay_ban_lai else '',
                    'ngay_thanh_toan_ban_lai': record.ngay_thanh_toan_ban_lai.strftime('%d/%m/%Y') if record.ngay_thanh_toan_ban_lai else '',
                    'ls_ban_lai': record.ls_ban_lai,
                    'tien_lai': record.tien_lai,
                    'goc_lai': record.goc_lai,
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
