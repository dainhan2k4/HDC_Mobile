from odoo import models, fields, api

class ReportPurchaseContract(models.Model):
    _inherit = 'portfolio.transaction'
    _description = 'Report Purchase Contract - Extended from Portfolio Transaction'
    
    # Computed fields để map với dữ liệu từ portfolio.transaction
    so_hop_dong = fields.Char(string="Số Hợp đồng", compute='_compute_so_hop_dong', store=True)
    so_tk = fields.Char(string="Số TK", compute='_compute_so_tk', store=True)
    so_tk_gdck = fields.Char(string="Số TK GDCK", compute='_compute_so_tk_gdck', store=True)
    khach_hang = fields.Char(string="Khách hàng", compute='_compute_khach_hang', store=True)
    so_tien = fields.Float(string="Số tiền", compute='_compute_so_tien', store=True)
    ngay_hd_mua = fields.Date(string="Ngày HĐ mua", compute='_compute_ngay_hd_mua', store=True)
    ngay_mua = fields.Date(string="Ngày mua", compute='_compute_ngay_mua', store=True)
    ngay_thanh_toan = fields.Date(string="Ngày thanh toán", compute='_compute_ngay_thanh_toan', store=True)
    ky_han = fields.Char(string="Kỳ hạn", compute='_compute_ky_han', store=True)
    lai_suat = fields.Float(string="Lãi suất", compute='_compute_lai_suat', store=True)
    so_ngay_tham_gia = fields.Integer(string="Số ngày tham gia", compute='_compute_so_ngay_tham_gia', store=True)
    tien_lai_du_kien = fields.Float(string="Tiền lãi dự kiến khi đến hạn", compute='_compute_tien_lai_du_kien', store=True)
    goc_lai_du_kien = fields.Float(string="Gốc + lãi dự kiến khi đến hạn", compute='_compute_goc_lai_du_kien', store=True)

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

    @api.depends('amount')
    def _compute_so_tien(self):
        """Compute số tiền từ amount"""
        for record in self:
            record.so_tien = record.amount or 0.0

    @api.depends('created_at')
    def _compute_ngay_hd_mua(self):
        """Compute ngày HĐ mua từ created_at"""
        for record in self:
            if record.created_at:
                record.ngay_hd_mua = record.created_at.date()
            else:
                record.ngay_hd_mua = False

    @api.depends('created_at')
    def _compute_ngay_mua(self):
        """Compute ngày mua từ created_at"""
        for record in self:
            if record.created_at:
                record.ngay_mua = record.created_at.date()
            else:
                record.ngay_mua = False

    @api.depends('created_at')
    def _compute_ngay_thanh_toan(self):
        """Compute ngày thanh toán"""
        for record in self:
            # Có thể tính từ created_at + số ngày xử lý
            if record.created_at:
                record.ngay_thanh_toan = record.created_at.date()
            else:
                record.ngay_thanh_toan = False

    @api.depends('term_months')
    def _compute_ky_han(self):
        """Compute kỳ hạn từ term_months"""
        for record in self:
            record.ky_han = str(record.term_months) if record.term_months else '12'

    @api.depends('interest_rate')
    def _compute_lai_suat(self):
        """Compute lãi suất từ interest_rate"""
        for record in self:
            record.lai_suat = record.interest_rate if record.interest_rate else 8.5

    @api.depends('created_at', 'term_months')
    def _compute_so_ngay_tham_gia(self):
        """Compute số ngày tham gia - sử dụng nav_days nếu có"""
        for record in self:
            # Ưu tiên sử dụng nav_days đã tính toán sẵn
            nav_days = getattr(record, 'nav_days', 0)
            if nav_days and nav_days > 0:
                record.so_ngay_tham_gia = nav_days
            elif record.created_at:
                from datetime import date
                today = date.today()
                transaction_date = record.created_at.date()
                delta = today - transaction_date
                record.so_ngay_tham_gia = delta.days
            else:
                record.so_ngay_tham_gia = 0

    @api.depends('nav_customer_receive', 'amount')
    def _compute_tien_lai_du_kien(self):
        """Compute tiền lãi dự kiến khi đến hạn - sử dụng NAV customer_receive nếu có"""
        for record in self:
            # Ưu tiên sử dụng nav_customer_receive - amount (nếu có)
            nav_customer_receive = getattr(record, 'nav_customer_receive', 0.0)
            if nav_customer_receive > 0 and record.amount:
                record.tien_lai_du_kien = nav_customer_receive - record.amount
            elif record.amount and record.lai_suat and record.ky_han:
                try:
                    ky_han_months = int(record.ky_han)
                    tien_lai = record.amount * (record.lai_suat / 100) * (ky_han_months / 12)
                    record.tien_lai_du_kien = tien_lai
                except:
                    record.tien_lai_du_kien = 0.0
            else:
                record.tien_lai_du_kien = 0.0

    @api.depends('amount', 'tien_lai_du_kien')
    def _compute_goc_lai_du_kien(self):
        """Compute gốc + lãi dự kiến khi đến hạn"""
        for record in self:
            record.goc_lai_du_kien = (record.amount or 0.0) + (record.tien_lai_du_kien or 0.0)

    @api.model
    def get_report_data(self, domain=None, filters=None, search_values=None, limit=10, offset=0):
        """Get report data using real transaction data - chỉ lấy giao dịch mua"""
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

            # Chỉ lấy giao dịch mua
            domain.append(('transaction_type', '=', 'purchase'))

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
            print(f"Report Purchase Contract Domain: {domain}")
            print(f"Limit: {limit}, Offset: {offset}")
            
            total = self.search_count(domain)
            print(f"Total records found: {total}")
            
            records = self.search(domain, limit=limit, offset=offset, order='created_at desc')
            print(f"Records retrieved: {len(records)}")
            
            formatted_records = []
            for index, record in enumerate(records):
                formatted_records.append({
                    'stt': offset + index + 1,
                    'so_hop_dong': record.so_hop_dong,
                    'so_tk': record.so_tk,
                    'so_tk_gdck': record.so_tk_gdck,
                    'khach_hang': record.khach_hang,
                    'so_tien': record.so_tien,
                    'ngay_hd_mua': record.ngay_hd_mua.strftime('%d/%m/%Y') if record.ngay_hd_mua else '',
                    'ngay_mua': record.ngay_mua.strftime('%d/%m/%Y') if record.ngay_mua else '',
                    'ngay_thanh_toan': record.ngay_thanh_toan.strftime('%d/%m/%Y') if record.ngay_thanh_toan else '',
                    'ky_han': record.ky_han,
                    'lai_suat': record.lai_suat,
                    'so_ngay_tham_gia': record.so_ngay_tham_gia,
                    'tien_lai_du_kien': record.tien_lai_du_kien,
                    'goc_lai_du_kien': record.goc_lai_du_kien,
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
