from odoo import models, fields, api
from datetime import datetime

class ReportContractStatistics(models.Model):
    _name = 'report.contract.statistics'
    _description = 'Report Contract Statistics - Thống kê HĐ theo kỳ hạn'
    _auto = False  # View model
    
    # Fields cho báo cáo thống kê HĐ theo kỳ hạn
    stt = fields.Integer(string="STT")
    so_hop_dong = fields.Char(string="Số Hợp đồng", required=True)
    so_tk = fields.Char(string="Số TK", required=True)
    so_tk_gdck = fields.Char(string="Số TK GDCK")
    khach_hang = fields.Char(string="Khách hàng", required=True)
    ky_han = fields.Integer(string="Kỳ hạn (tháng)", required=True)
    so_tien = fields.Float(string="Số tiền", digits=(16, 0), required=True)
    ngay_hop_dong = fields.Date(string="Ngày Hợp đồng", required=True)
    ngay_den_han = fields.Date(string="Ngày đến hạn", required=True)
    nvcs = fields.Char(string="NVCS")
    don_vi = fields.Char(string="Đơn vị")
    
    @api.model
    def get_contract_statistics_data(self, domain=None, search_values=None, limit=10, offset=0):
        """Get contract statistics data with pagination"""
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
                        elif field == 'ngay_hop_dong_from':
                            filter_domain.append(('ngay_hop_dong', '>=', value))
                        elif field == 'ngay_hop_dong_to':
                            filter_domain.append(('ngay_hop_dong', '<=', value))
                        elif field == 'don_vi':
                            filter_domain.append(('don_vi', '=', value))
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
                        elif field == 'nvcs':
                            domain.append(('nvcs', 'ilike', value))

            # Get total count
            total = self.search_count(domain)
            
            # Get records with pagination
            records = self.search(domain, limit=limit, offset=offset, order='ngay_hop_dong desc')
            
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
                    'ky_han': record.ky_han,
                    'so_tien': record.so_tien,
                    'ngay_hop_dong': record.ngay_hop_dong.strftime('%d/%m/%Y') if record.ngay_hop_dong else '',
                    'ngay_den_han': record.ngay_den_han.strftime('%d/%m/%Y') if record.ngay_den_han else '',
                    'nvcs': record.nvcs or '',
                    'don_vi': record.don_vi or '',
                })
            
            return {
                'records': data,
                'total': total,
            }
            
        except Exception as e:
            print(f"Error in get_contract_statistics_data: {str(e)}")
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
