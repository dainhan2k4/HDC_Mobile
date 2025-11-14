import os
from odoo import api, fields, models, _
from odoo.exceptions import UserError
from datetime import datetime

from ..services import PayOSService


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    payos_client_id = fields.Char(string='PayOS Client ID')
    payos_api_key = fields.Char(string='PayOS API Key')
    payos_checksum_key = fields.Char(string='PayOS Checksum Key')
    payos_status = fields.Char(string='Trạng thái', compute='_compute_payos_status', readonly=True)
    payos_is_configured = fields.Boolean(string='Đã cấu hình', compute='_compute_payos_status', readonly=True)
    
    # Kết quả test connection
    payos_last_connection_date = fields.Datetime(string='Ngày kết nối lần cuối', readonly=True)
    payos_last_connection_status = fields.Selection([
        ('success', 'Thành công'),
        ('failed', 'Thất bại'),
        ('not_tested', 'Chưa kiểm tra')
    ], string='Trạng thái kết nối lần cuối', default='not_tested', readonly=True)
    payos_connection_message = fields.Text(string='Thông báo kết nối', readonly=True)
    payos_webhook_url = fields.Char(string='Webhook URL', compute='_compute_webhook_url', readonly=True)
    
    @api.depends()
    def _compute_webhook_url(self):
        """Tính toán webhook URL dựa trên base URL hiện tại"""
        for record in self:
            # Lấy base URL từ request nếu có
            if hasattr(self.env, 'request') and self.env.request:
                httprequest = self.env.request.httprequest
                base_url = httprequest.host_url.rstrip('/')
                record.payos_webhook_url = f'{base_url}/payos/webhook'
            else:
                # Fallback: dùng config hoặc default
                params = self.env['ir.config_parameter'].sudo()
                base_url = params.get_param('web.base.url', 'http://localhost:8069')
                record.payos_webhook_url = f'{base_url}/payos/webhook'

    @api.depends('payos_client_id', 'payos_api_key', 'payos_checksum_key')
    def _compute_payos_status(self):
        for record in self:
            has_client_id = bool(record.payos_client_id and record.payos_client_id.strip())
            has_api_key = bool(record.payos_api_key and record.payos_api_key.strip())
            has_checksum_key = bool(record.payos_checksum_key and record.payos_checksum_key.strip())
            
            record.payos_is_configured = has_client_id and has_api_key and has_checksum_key
            
            if record.payos_is_configured:
                record.payos_status = 'Đã cấu hình - Đang hoạt động'
            else:
                missing = []
                if not has_client_id:
                    missing.append('Client ID')
                if not has_api_key:
                    missing.append('API Key')
                if not has_checksum_key:
                    missing.append('Checksum Key')
                record.payos_status = f'Chưa cấu hình đầy đủ - Thiếu: {", ".join(missing)}'

    def set_values(self):
        super().set_values()
        params = self.env['ir.config_parameter'].sudo()
        params.set_param('payos.client_id', self.payos_client_id or '')
        params.set_param('payos.api_key', self.payos_api_key or '')
        params.set_param('payos.checksum_key', self.payos_checksum_key or '')

    @api.model
    def get_values(self):
        res = super().get_values()
        params = self.env['ir.config_parameter'].sudo()
        
        # Lấy last_connection_date, chỉ set nếu có giá trị hợp lệ
        last_connection_date_str = params.get_param('payos.last_connection_date', '')
        last_connection_date = False
        if last_connection_date_str:
            try:
                # Convert string về datetime object
                last_connection_date = fields.Datetime.from_string(last_connection_date_str)
            except (ValueError, TypeError):
                last_connection_date = False
        
        res.update(
            payos_client_id=params.get_param('payos.client_id', os.getenv('PAYOS_CLIENT_ID', '')),
            payos_api_key=params.get_param('payos.api_key', os.getenv('PAYOS_API_KEY', '')),
            payos_checksum_key=params.get_param('payos.checksum_key', os.getenv('PAYOS_CHECKSUM_KEY', '')),
            payos_last_connection_date=last_connection_date,
            payos_last_connection_status=params.get_param('payos.last_connection_status', 'not_tested'),
            payos_connection_message=params.get_param('payos.connection_message', ''),
        )
        return res

    def action_test_connection(self):
        """Test kết nối tới PayOS API"""
        if not self.payos_client_id or not self.payos_api_key or not self.payos_checksum_key:
            raise UserError(_('Vui lòng nhập đầy đủ Client ID, API Key và Checksum Key trước khi test kết nối'))
        
        try:
            # Tạo PayOS service với credentials
            service = PayOSService(
                client_id=self.payos_client_id,
                api_key=self.payos_api_key,
                checksum_key=self.payos_checksum_key,
                base_url='https://api-merchant.payos.vn'
            )
            
            # Test kết nối bằng cách tạo payment link test
            test_order_code = int(datetime.now().timestamp() * 1000)
            # PayOS yêu cầu description tối đa 25 ký tự
            test_data = {
                'orderCode': test_order_code,
                'amount': 1000,  # 1000 VND test
                'description': 'Test connection',  # 14 ký tự - OK
                'returnUrl': 'https://localhost/test',
                'cancelUrl': 'https://localhost/test'
            }
            
            # Thử tạo payment link để test
            resp = service.create_payment_link(test_data)
            
            # Nếu thành công, cập nhật trạng thái vào config parameter
            now_str = fields.Datetime.to_string(fields.Datetime.now())
            params = self.env['ir.config_parameter'].sudo()
            params.set_param('payos.last_connection_date', now_str)
            params.set_param('payos.last_connection_status', 'success')
            params.set_param('payos.connection_message', f'Kết nối thành công! Order Code: {test_order_code}')
            
            # Cập nhật vào record hiện tại để hiển thị ngay
            self.payos_last_connection_date = fields.Datetime.now()
            self.payos_last_connection_status = 'success'
            self.payos_connection_message = f'Kết nối thành công! Order Code: {test_order_code}'
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Thành công'),
                    'message': _('Bạn đã kết nối thành công tới PayOS API!'),
                    'type': 'success',
                    'sticky': False,
                }
            }
        except Exception as e:
            error_msg = str(e)
            
            # Cập nhật trạng thái lỗi vào config parameter
            now_str = fields.Datetime.to_string(fields.Datetime.now())
            params = self.env['ir.config_parameter'].sudo()
            params.set_param('payos.last_connection_date', now_str)
            params.set_param('payos.last_connection_status', 'failed')
            params.set_param('payos.connection_message', f'Lỗi: {error_msg}')
            
            # Cập nhật vào record hiện tại
            self.payos_last_connection_date = fields.Datetime.now()
            self.payos_last_connection_status = 'failed'
            self.payos_connection_message = f'Lỗi: {error_msg}'
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Thất bại'),
                    'message': _('Không thể kết nối tới PayOS API: %s') % error_msg,
                    'type': 'danger',
                    'sticky': True,
                }
            }


