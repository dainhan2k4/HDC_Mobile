from odoo import models, fields, api
from datetime import datetime

class ReportOrderHistory(models.Model):
    _name = 'report.order.history'
    _description = 'Report Order History - Sổ lệnh lịch sử giao dịch'
    _auto = False  # View model
    
    # Fields cho báo cáo sổ lệnh lịch sử
    gio_dat = fields.Datetime(string="Giờ đặt", required=True)
    trang_thai = fields.Selection([
        ('pending', 'Chờ khớp'),
        ('matched', 'Đã khớp'),
        ('cancelled', 'Đã hủy'),
        ('partial', 'Khớp một phần'),
    ], string="Trạng thái", default='pending')
    so_tk = fields.Char(string="Số TK", required=True)
    so_tk_gdck = fields.Char(string="Số TK GDCK")
    khach_hang = fields.Char(string="Khách hàng", required=True)
    nvcs = fields.Char(string="NVCS")
    loai_lenh = fields.Selection([
        ('mua', 'Lệnh mua'),
        ('ban', 'Lệnh bán'),
    ], string="Loại lệnh", required=True)
    lenh = fields.Char(string="Lệnh", required=True)
    ma_ck = fields.Char(string="Mã CK", required=True)
    kl_dat = fields.Float(string="KL đặt", digits=(16, 0))
    gia_dat = fields.Float(string="Giá đặt", digits=(16, 2))
    kl_khop = fields.Float(string="KL khớp", digits=(16, 0))
    gia_khop = fields.Float(string="Giá khớp", digits=(16, 2))
    kl_cho = fields.Float(string="KL chờ", digits=(16, 0))
    gia_cho = fields.Float(string="Giá chờ", digits=(16, 2))
    shl = fields.Char(string="SHL")
    
    @api.model
    def get_order_history_data(self, domain=None, search_values=None, limit=10, offset=0):
        """Get order history data with pagination"""
        try:
            # Initialize domain as list
            if not domain:
                domain = []
            elif isinstance(domain, dict):
                # Convert dict to list
                filter_domain = []
                for field, value in domain.items():
                    if value:
                        if field == 'ma_ck':
                            filter_domain.append(('ma_ck', '=', value))
                        elif field == 'gio_dat_from':
                            filter_domain.append(('gio_dat', '>=', value))
                        elif field == 'gio_dat_to':
                            filter_domain.append(('gio_dat', '<=', value))
                        elif field == 'trang_thai':
                            filter_domain.append(('trang_thai', '=', value))
                domain = filter_domain
            elif not isinstance(domain, list):
                domain = []

            # Add search values from inline search fields
            if search_values:
                for field, value in search_values.items():
                    if value:
                        if field == 'so_tk':
                            domain.append(('so_tk', 'ilike', value))
                        elif field == 'khach_hang':
                            domain.append(('khach_hang', 'ilike', value))
                        elif field == 'ma_ck':
                            domain.append(('ma_ck', 'ilike', value))
                        elif field == 'lenh':
                            domain.append(('lenh', 'ilike', value))

            # Get total count
            total = self.search_count(domain)
            
            # Get records with pagination
            records = self.search(domain, limit=limit, offset=offset, order='gio_dat desc')
            
            # Format data for frontend
            data = []
            for record in records:
                data.append({
                    'id': record.id,
                    'gio_dat': record.gio_dat.strftime('%d/%m/%Y %H:%M:%S') if record.gio_dat else '',
                    'trang_thai': record.trang_thai,
                    'so_tk': record.so_tk,
                    'so_tk_gdck': record.so_tk_gdck or '',
                    'khach_hang': record.khach_hang,
                    'nvcs': record.nvcs or '',
                    'loai_lenh': record.loai_lenh,
                    'lenh': record.lenh,
                    'ma_ck': record.ma_ck,
                    'kl_dat': record.kl_dat,
                    'gia_dat': record.gia_dat,
                    'kl_khop': record.kl_khop,
                    'gia_khop': record.gia_khop,
                    'kl_cho': record.kl_cho,
                    'gia_cho': record.gia_cho,
                    'shl': record.shl or '',
                })
            
            return {
                'records': data,
                'total': total,
            }
            
        except Exception as e:
            print(f"Error in get_order_history_data: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'records': [],
                'total': 0,
            }
    
    @api.model
    def get_securities(self):
        """Get distinct securities for filter dropdown"""
        try:
            securities = self.read_group([], ['ma_ck'], ['ma_ck'])
            products = []
            
            for security in securities:
                if security.get('ma_ck'):
                    security_code = security['ma_ck'][1] if isinstance(security['ma_ck'], tuple) else security['ma_ck']
                    products.append({
                        'id': security_code, 
                        'name': security_code
                    })
            
            # Sort products by name
            products.sort(key=lambda x: x['name'])
            return products
            
        except Exception as e:
            print(f"Error in get_securities: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
