from odoo import models, fields, api
from datetime import datetime, timedelta

class ReportEarlySale(models.Model):
    _name = 'report.early.sale'
    _description = 'Report Early Sale - Báo cáo bán trước hạn'
    _auto = False  # View model
    
    # Fields cho báo cáo bán trước hạn
    stt = fields.Integer(string="STT")
    so_hop_dong = fields.Char(string="Số Hợp đồng", required=True)
    so_tk = fields.Char(string="Số TK", required=True)
    so_tk_gdck = fields.Char(string="Số TK GDCK")
    khach_hang = fields.Char(string="Khách hàng", required=True)
    so_tien = fields.Float(string="Số tiền", digits=(16, 0), required=True)
    ngay_hd_mua = fields.Date(string="Ngày HĐ mua", required=True)
    ky_han = fields.Integer(string="Kỳ hạn (tháng)", required=True)
    lai_suat = fields.Float(string="Lãi suất (%)", digits=(5, 2), required=True)
    ngay_ban_lai_theo_hd = fields.Date(string="Ngày bán lại theo HĐ")
    ngay_dao_han = fields.Date(string="Ngày đáo hạn", required=True)
    ngay_ban_lai = fields.Date(string="Ngày bán lại", required=True)
    ngay_thanh_toan = fields.Date(string="Ngày thanh toán")
    so_ngay_duy_tri = fields.Integer(string="Số ngày duy trì", compute='_compute_so_ngay_duy_tri', store=True)
    so_ngay_ban_truoc_han = fields.Integer(string="Số ngày bán trước hạn", compute='_compute_so_ngay_ban_truoc_han', store=True)
    lai_suat_truoc_han = fields.Float(string="Lãi suất trước hạn (%)", digits=(5, 2), compute='_compute_lai_suat_truoc_han', store=True)
    tien_lai = fields.Float(string="Tiền lãi", digits=(16, 0), compute='_compute_tien_lai', store=True)
    lai_goc = fields.Float(string="Lãi + gốc", digits=(16, 0), compute='_compute_lai_goc', store=True)
    
    @api.depends('ngay_hd_mua', 'ngay_ban_lai')
    def _compute_so_ngay_duy_tri(self):
        """Compute số ngày duy trì"""
        for record in self:
            if record.ngay_hd_mua and record.ngay_ban_lai:
                delta = record.ngay_ban_lai - record.ngay_hd_mua
                record.so_ngay_duy_tri = delta.days
            else:
                record.so_ngay_duy_tri = 0
    
    @api.depends('ngay_ban_lai', 'ngay_dao_han')
    def _compute_so_ngay_ban_truoc_han(self):
        """Compute số ngày bán trước hạn"""
        for record in self:
            if record.ngay_ban_lai and record.ngay_dao_han:
                delta = record.ngay_dao_han - record.ngay_ban_lai
                record.so_ngay_ban_truoc_han = delta.days
            else:
                record.so_ngay_ban_truoc_han = 0
    
    @api.depends('lai_suat', 'so_ngay_ban_truoc_han', 'ky_han')
    def _compute_lai_suat_truoc_han(self):
        """Compute lãi suất trước hạn"""
        for record in self:
            if record.ky_han > 0 and record.so_ngay_ban_truoc_han > 0:
                # Tính lãi suất trước hạn dựa trên số ngày bán trước hạn
                penalty_rate = (record.so_ngay_ban_truoc_han / (record.ky_han * 30)) * 0.5  # 0.5% penalty per month
                record.lai_suat_truoc_han = max(0, record.lai_suat - penalty_rate)
            else:
                record.lai_suat_truoc_han = record.lai_suat
    
    @api.depends('so_tien', 'lai_suat_truoc_han', 'so_ngay_duy_tri')
    def _compute_tien_lai(self):
        """Compute tiền lãi"""
        for record in self:
            if record.so_tien and record.lai_suat_truoc_han and record.so_ngay_duy_tri:
                # Tính lãi theo ngày
                daily_rate = record.lai_suat_truoc_han / 365 / 100
                record.tien_lai = record.so_tien * daily_rate * record.so_ngay_duy_tri
            else:
                record.tien_lai = 0
    
    @api.depends('so_tien', 'tien_lai')
    def _compute_lai_goc(self):
        """Compute lãi + gốc"""
        for record in self:
            record.lai_goc = record.so_tien + record.tien_lai
    
    @api.model
    def get_early_sale_data(self, domain=None, search_values=None, limit=10, offset=0):
        """Get early sale data with pagination"""
        try:
            # Initialize domain as list
            if not domain:
                domain = []
            elif isinstance(domain, dict):
                # Convert dict to list
                filter_domain = []
                for field, value in domain.items():
                    if value:
                        if field == 'ky_han':
                            filter_domain.append(('ky_han', '=', value))
                        elif field == 'ngay_hd_mua_from':
                            filter_domain.append(('ngay_hd_mua', '>=', value))
                        elif field == 'ngay_hd_mua_to':
                            filter_domain.append(('ngay_hd_mua', '<=', value))
                        elif field == 'ngay_ban_lai_from':
                            filter_domain.append(('ngay_ban_lai', '>=', value))
                        elif field == 'ngay_ban_lai_to':
                            filter_domain.append(('ngay_ban_lai', '<=', value))
                domain = filter_domain
            elif not isinstance(domain, list):
                domain = []

            # Add search values from inline search fields
            if search_values:
                for field, value in search_values.items():
                    if value:
                        if field == 'so_hop_dong':
                            domain.append(('so_hop_dong', 'ilike', value))
                        elif field == 'so_tk':
                            domain.append(('so_tk', 'ilike', value))
                        elif field == 'khach_hang':
                            domain.append(('khach_hang', 'ilike', value))

            # Get total count
            total = self.search_count(domain)
            
            # Get records with pagination
            records = self.search(domain, limit=limit, offset=offset, order='ngay_ban_lai desc')
            
            # Format data for frontend
            data = []
            for i, record in enumerate(records, 1):
                data.append({
                    'id': record.id,
                    'stt': i,
                    'so_hop_dong': record.so_hop_dong,
                    'so_tk': record.so_tk,
                    'so_tk_gdck': record.so_tk_gdck or '',
                    'khach_hang': record.khach_hang,
                    'so_tien': record.so_tien,
                    'ngay_hd_mua': record.ngay_hd_mua.strftime('%d/%m/%Y') if record.ngay_hd_mua else '',
                    'ky_han': record.ky_han,
                    'lai_suat': record.lai_suat,
                    'ngay_ban_lai_theo_hd': record.ngay_ban_lai_theo_hd.strftime('%d/%m/%Y') if record.ngay_ban_lai_theo_hd else '',
                    'ngay_dao_han': record.ngay_dao_han.strftime('%d/%m/%Y') if record.ngay_dao_han else '',
                    'ngay_ban_lai': record.ngay_ban_lai.strftime('%d/%m/%Y') if record.ngay_ban_lai else '',
                    'ngay_thanh_toan': record.ngay_thanh_toan.strftime('%d/%m/%Y') if record.ngay_thanh_toan else '',
                    'so_ngay_duy_tri': record.so_ngay_duy_tri,
                    'so_ngay_ban_truoc_han': record.so_ngay_ban_truoc_han,
                    'lai_suat_truoc_han': record.lai_suat_truoc_han,
                    'tien_lai': record.tien_lai,
                    'lai_goc': record.lai_goc,
                })
            
            return {
                'records': data,
                'total': total,
            }
            
        except Exception as e:
            print(f"Error in get_early_sale_data: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'records': [],
                'total': 0,
            }
    
    @api.model
    def get_terms(self):
        """Get distinct terms for filter dropdown"""
        try:
            terms = self.read_group([], ['ky_han'], ['ky_han'])
            products = []
            
            for term in terms:
                if term.get('ky_han'):
                    term_value = term['ky_han']
                    products.append({
                        'id': term_value, 
                        'name': f"{term_value} tháng"
                    })
            
            # Sort products by term
            products.sort(key=lambda x: x['id'])
            return products
            
        except Exception as e:
            print(f"Error in get_terms: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
