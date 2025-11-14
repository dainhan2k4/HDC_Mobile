# -*- coding: utf-8 -*-

import json
import logging
import random
from datetime import datetime

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

from .utils import (
    TokenConstants,
    TimeFormatConstants,
    is_token_expired,
    get_token_expires_in,
)

_logger = logging.getLogger(__name__)


class TradingOrder(models.Model):
    """Lệnh giao dịch chứng khoán"""
    _name = 'trading.order'
    _description = 'Trading Order'
    _order = 'create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Basic Info
    name = fields.Char(
        string='Order Reference',
        required=True,
        readonly=True,
        default=lambda self: _('New'),
        copy=False
    )
    
    user_id = fields.Many2one(
        'res.users',
        string='User',
        required=True,
        ondelete='restrict',
        help='User thực hiện đặt lệnh (dùng để suy ra API Configuration)'
    )
    
    config_id = fields.Many2one(
        'trading.config',
        string='API Configuration',
        compute='_compute_config_id',
        store=True,
        readonly=True,
        help='API Configuration (tự động lấy từ Investor)'
    )
    
    @api.depends('user_id')
    def _compute_config_id(self):
        """Lấy config từ user trực tiếp"""
        for record in self:
            if record.user_id:
                config = self.env['trading.config'].search([
                    ('user_id', '=', record.user_id.id),
                    ('active', '=', True)
                ], limit=1)
                record.config_id = config.id if config else False
            else:
                record.config_id = False
    
    config_write_access_token = fields.Char(
        related='config_id.write_access_token',
        string='Config Write Token',
        readonly=True,
        store=False,
        help='Write access token từ config (dùng để check visibility)'
    )
    
    config_two_fa_type = fields.Selection(
        related='config_id.two_fa_type',
        string='Config Two FA Type',
        readonly=True,
        store=False,
        help='Two Factor Type từ config (dùng để check visibility)'
    )
    
    has_valid_write_token = fields.Boolean(
        string='Has Valid Write Token',
        compute='_compute_has_valid_write_token',
        store=False,
        readonly=True,
        help='Kiểm tra xem config có write token còn hiệu lực không (dùng để ẩn/hiện field code)'
    )
    
    write_token_expires_in = fields.Char(
        string='Write Token Expires In',
        compute='_compute_write_token_expires_in',
        store=False,
        readonly=True,
        help='Thời gian còn lại của write token (cooldown)'
    )
    
    @api.depends('config_id', 'config_write_access_token')
    def _compute_has_valid_write_token(self):
        """Kiểm tra xem config có write token còn hiệu lực không"""
        for record in self:
            if not record.config_id or not record.config_write_access_token:
                record.has_valid_write_token = False
                continue
            
            try:
                # Sử dụng utility function để kiểm tra token hết hạn
                # Tránh tạo API client mỗi lần compute để tối ưu performance
                record.has_valid_write_token = not is_token_expired(
                    record.config_write_access_token,
                    buffer_seconds=TokenConstants.EXPIRATION_BUFFER_SECONDS
                )
            except Exception:
                record.has_valid_write_token = False
    
    @api.depends('config_id', 'config_write_access_token')
    def _compute_write_token_expires_in(self):
        """Tính thời gian còn lại của write token (cooldown)"""
        for record in self:
            if not record.config_id or not record.config_write_access_token:
                record.write_token_expires_in = ''
                continue
            
            try:
                # Sử dụng utility function để tính và format thời gian còn lại
                record.write_token_expires_in = get_token_expires_in(record.config_write_access_token)
            except Exception:
                record.write_token_expires_in = ''
    
    # Order Type
    order_type = fields.Selection([
        ('stock', 'Stock Order'),
        ('derivative', 'Derivative Order'),
    ], string='Order Type', required=True, default='stock')
    
    # Market Info
    account = fields.Char(
        string='Account',
        required=True,
        help='Tài khoản giao dịch (tự động lấy từ config nếu config có account)'
    )
    
    config_account = fields.Char(
        related='config_id.account',
        string='Config Account',
        readonly=True,
        store=False,
        help='Tài khoản từ config (dùng để tự động điền)'
    )
    
    account_balance_id = fields.Many2one(
        'trading.account.balance',
        string='Account Balance',
        compute='_compute_account_balance',
        store=False,
        readonly=True,
        help='Account Balance record để lấy sức mua'
    )
    
    purchasing_power = fields.Float(
        string='Purchasing Power (Sức mua)',
        compute='_compute_purchasing_power',
        store=False,
        readonly=True,
        digits=(20, 3),
        help='Sức mua từ Account Balance (số tiền có thể dùng để mua chứng khoán)'
    )
    
    instrument_id = fields.Many2one(
        'ssi.securities',
        string='Instrument',
        required=True,
        ondelete='restrict',
        help='Chứng khoán giao dịch'
    )
    
    instrument_code = fields.Char(
        related='instrument_id.symbol',
        string='Instrument Code',
        store=True,
        readonly=True
    )
    
    market = fields.Selection([
        ('VN', 'VN - Thị trường cơ sở'),
        ('VNFE', 'VNFE - Thị trường phái sinh'),
    ], string='Market', required=True, default='VN')
    
    # Order Details
    buy_sell = fields.Selection([
        ('B', 'Buy - Mua'),
        ('S', 'Sell - Bán'),
    ], string='Buy/Sell', required=True)
    
    order_type_detail = fields.Selection([
        ('MTL', 'MTL - Lệnh giới hạn'),
        ('ATO', 'ATO - Lệnh thị trường đầu phiên'),
        ('ATC', 'ATC - Lệnh thị trường cuối phiên'),
        ('MAK', 'MAK - Lệnh thị trường (phái sinh)'),
        ('MOK', 'MOK - Lệnh thị trường (phái sinh)'),
    ], string='Order Type', required=True, default='MTL',
       help='Loại lệnh chi tiết. Stock: MTL, ATO, ATC. Derivative: ATO, MAK, MOK, MTL, ATC')
    
    quantity = fields.Integer(
        string='Quantity',
        required=True,
        help='Khối lượng'
    )
    
    request_id = fields.Char(
        string='Request ID',
        required=True,
        readonly=True,
        default=lambda self: str(random.randint(0, 99999999)),
        help='ID yêu cầu duy nhất'
    )
    
    # Stop Order (chỉ cho derivative)
    stop_order = fields.Boolean(
        string='Stop Order',
        default=False,
        help='Lệnh điều kiện (chỉ áp dụng phái sinh)'
    )
    
    stop_price = fields.Float(
        string='Stop Price',
        digits=(16, 3),
        default=0.0,
        help='Giá trigger cho lệnh điều kiện'
    )
    
    stop_type = fields.Char(
        string='Stop Type',
        default='',
        help='Loại lệnh điều kiện'
    )
    
    stop_step = fields.Float(
        string='Stop Step',
        digits=(16, 3),
        default=0.0
    )
    
    loss_step = fields.Float(
        string='Loss Step',
        digits=(16, 3),
        default=0.0
    )
    
    profit_step = fields.Float(
        string='Profit Step',
        digits=(16, 3),
        default=0.0
    )
    
    # Device Info
    device_id = fields.Char(
        string='Device ID',
        help='Định danh thiết bị đặt lệnh'
    )
    
    user_agent = fields.Char(
        string='User Agent',
        help='User agent string'
    )
    
    # Status
    state = fields.Selection([
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('partially_filled', 'Partially Filled'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('error', 'Error'),
    ], string='Status', default='draft', tracking=True)
    
    # API Response
    api_order_id = fields.Char(
        string='API Order ID',
        readonly=True,
        help='Order ID từ API response'
    )
    
    api_response = fields.Text(
        string='API Response',
        readonly=True,
        help='Full response từ API'
    )
    
    error_message = fields.Text(
        string='Error Message',
        readonly=True
    )
    
    # Timestamps
    submitted_at = fields.Datetime(
        string='Submitted At',
        readonly=True
    )
    
    filled_at = fields.Datetime(
        string='Filled At',
        readonly=True
    )
    
    # Authentication
    code = fields.Char(
        string='OTP Code',
        help='OTP code để verify và lấy write token (chỉ cần khi write token hết hạn hoặc chưa có)'
    )
    
    # Account Verification
    account_name = fields.Char(
        string='Account Name',
        readonly=True,
        help='Tên chủ tài khoản (được lấy từ API khi verify account)'
    )
    
    account_verified = fields.Boolean(
        string='Account Verified',
        default=False,
        help='Đã verify account chưa'
    )
    
    # Notes
    notes = fields.Text(string='Notes')

    @api.model_create_multi
    def create(self, vals_list):
        """Generate sequence number"""
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('trading.order') or _('New')
        records = super().create(vals_list)
        return records
    
    @api.constrains('stop_order', 'order_type')
    def _check_stop_order(self):
        """Stop order chỉ áp dụng cho derivative"""
        for record in self:
            if record.stop_order and record.order_type != 'derivative':
                raise ValidationError(_('Lệnh điều kiện chỉ áp dụng cho phái sinh'))
    
    @api.depends('account', 'config_id')
    def _compute_account_balance(self):
        """Tính account_balance_id từ account và config_id"""
        for record in self:
            if record.account and record.config_id:
                account_clean = str(record.account).strip().upper()
                # Tìm Account Balance record gần nhất với account và config_id này
                balance = self.env['trading.account.balance'].search([
                    ('account', '=', account_clean),
                    ('config_id', '=', record.config_id.id),
                    ('balance_type', '=', 'stock' if record.order_type == 'stock' else 'derivative')
                ], order='last_sync desc', limit=1)
                record.account_balance_id = balance.id if balance else False
            else:
                record.account_balance_id = False
    
    @api.depends('account_balance_id', 'account_balance_id.purchasing_power')
    def _compute_purchasing_power(self):
        """Tính purchasing_power từ Account Balance"""
        for record in self:
            if record.account_balance_id and record.account_balance_id.purchasing_power:
                record.purchasing_power = record.account_balance_id.purchasing_power
            else:
                # Fallback: tìm Account Balance và lấy purchasing_power
                if record.account and record.config_id:
                    account_clean = str(record.account).strip().upper()
                    balance = self.env['trading.account.balance'].search([
                        ('account', '=', account_clean),
                        ('config_id', '=', record.config_id.id),
                        ('balance_type', '=', 'stock' if record.order_type == 'stock' else 'derivative')
                    ], order='last_sync desc', limit=1)
                    if balance and balance.purchasing_power:
                        record.purchasing_power = balance.purchasing_power
                    else:
                        record.purchasing_power = 0.0
                else:
                    record.purchasing_power = 0.0
    
    @staticmethod
    def _get_stock_order_types():
        """Lấy danh sách order types cho Stock"""
        return ['MTL', 'ATO', 'ATC']
    
    @staticmethod
    def _get_derivative_order_types():
        """Lấy danh sách order types cho Derivative"""
        return ['ATO', 'MAK', 'MOK', 'MTL', 'ATC']
    
    @staticmethod
    def _get_all_market_order_types():
        """Lấy danh sách tất cả order types yêu cầu price = 0 (theo API)"""
        # Tất cả các lệnh: ATO, ATC, MAK, MOK, MTL - đều phải có price = 0 (theo API yêu cầu)
        # API coi tất cả các loại này là market order và yêu cầu price = 0
        return ['ATO', 'ATC', 'MAK', 'MOK', 'MTL']
    
    @staticmethod
    def _get_order_price():
        """
        Lấy giá đặt lệnh (luôn = 0 theo yêu cầu API)
        
        Returns:
            float: Giá đặt lệnh (luôn là 0.0 cho tất cả order types)
        """
        # Tất cả các lệnh đều phải có price = 0 (theo API yêu cầu)
        return 0.0
    
    @api.constrains('order_type', 'order_type_detail')
    def _check_order_type_detail(self):
        """Validate order_type_detail phù hợp với order_type"""
        for record in self:
            stock_order_types = self._get_stock_order_types()
            derivative_order_types = self._get_derivative_order_types()
            
            if record.order_type == 'stock':
                if record.order_type_detail not in stock_order_types:
                    raise ValidationError(_('Lệnh cơ sở (Stock) chỉ hỗ trợ các loại: %s. Bạn đã chọn: %s') % (', '.join(stock_order_types), record.order_type_detail))
            elif record.order_type == 'derivative':
                if record.order_type_detail not in derivative_order_types:
                    raise ValidationError(_('Lệnh phái sinh (Derivative) chỉ hỗ trợ các loại: %s. Bạn đã chọn: %s') % (', '.join(derivative_order_types), record.order_type_detail))
    
    @api.onchange('user_id')
    def _onchange_user_id(self):
        """Tự động lấy account từ config khi chọn user"""
        if self.user_id and self.config_id and self.config_id.account:
            self.account = self.config_id.account.strip().upper()
    
    @api.onchange('order_type')
    def _onchange_order_type(self):
        """Filter order_type_detail theo order_type"""
        stock_order_types = self._get_stock_order_types()
        derivative_order_types = self._get_derivative_order_types()
        
        if self.order_type == 'stock':
            # Nếu order_type_detail không thuộc stock, set về default
            if self.order_type_detail not in stock_order_types:
                self.order_type_detail = 'MTL'
        elif self.order_type == 'derivative':
            # Nếu order_type_detail không thuộc derivative, set về default
            if self.order_type_detail not in derivative_order_types:
                self.order_type_detail = 'MTL'
    
    def action_get_otp(self):
        """
        Lấy OTP từ SSI (nếu dùng OTP authentication)
        
        OTP sẽ được gửi qua SMS hoặc Email theo cấu hình SSI.
        Sau khi nhận được OTP, user cần:
        1. Nhập OTP vào field "OTP Code"
        2. Click "Verify Code" hoặc "Verify OTP" để lấy write token
        3. Sau đó có thể submit order
        """
        self.ensure_one()
        
        if not self.config_id:
            raise UserError(_('Vui lòng chọn API Configuration'))
        
        # Kiểm tra two_fa_type (luôn phải là OTP)
        if self.config_id.two_fa_type != '1':
            raise UserError(_('Two Factor Type phải là OTP (SMS/Email).'))
        
        try:
            client = self.config_id.get_api_client()
            result = client.get_otp()
            
            # Kiểm tra response
            if isinstance(result, dict):
                status = result.get('status', 0)
                message = result.get('message', '')
                
                if status == 200:
                    # OTP đã được gửi thành công
                    return {
                        'type': 'ir.actions.client',
                        'tag': 'display_notification',
                        'params': {
                            'title': _('OTP đã được gửi'),
                            'message': _('OTP đã được gửi thành công qua SMS/Email.\n\nVui lòng:\n1. Kiểm tra SMS hoặc Email để lấy OTP code\n2. Nhập OTP vào field "OTP Code" bên dưới\n3. Click "Verify Code" hoặc "Verify OTP" để lấy write token\n4. Sau đó có thể submit order\n\nLưu ý: OTP có thời hạn (thường 5-10 phút) và chỉ dùng được 1 lần.'),
                            'type': 'success',
                            'sticky': True,  # Sticky để user có thời gian đọc
                        }
                    }
                else:
                    # Lỗi từ API
                    error_msg = message or f'API returned status {status}'
                    raise UserError(_('Không thể lấy OTP: %s') % error_msg)
            else:
                # Response không đúng format, nhưng vẫn thông báo thành công
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('OTP Request Sent'),
                        'message': _('Yêu cầu lấy OTP đã được gửi. Vui lòng kiểm tra SMS/Email.'),
                        'type': 'success',
                        'sticky': True,
                    }
                }
        except UserError:
            # Re-raise UserError để giữ nguyên thông báo
            raise
        except Exception as e:
            _logger.error(f'Error getting OTP: {e}')
            raise UserError(_('Không thể lấy OTP: %s') % str(e))
    
    def action_verify_account(self):
        """Verify account và lấy thông tin tên chủ tài khoản"""
        self.ensure_one()
        
        if not self.account:
            raise UserError(_('Vui lòng nhập Account'))
        
        # Validate và format account (loại bỏ khoảng trắng, uppercase)
        account_clean = str(self.account).strip().upper()
        if not account_clean:
            raise UserError(_('Account không được để trống'))
        
        if not self.config_id:
            raise UserError(_('Vui lòng chọn API Configuration'))
        
        try:
            client = self.config_id.get_api_client()
            
            # Gọi API để lấy thông tin account (dùng account đã clean)
            result = client.get_stock_account_balance(account_clean)
            
            # Parse response để lấy thông tin account name
            account_name = ''
            if result.get('status') == 200 and result.get('data'):
                data = result['data']
                if isinstance(data, dict):
                    # Thử các field có thể chứa tên account
                    account_name = (
                        data.get('accountName') or 
                        data.get('accountname') or 
                        data.get('name') or 
                        data.get('customerName') or 
                        data.get('customer_name') or 
                        data.get('fullName') or
                        data.get('full_name') or
                        ''
                    )
            
            # Cập nhật account name và verified status
            self.write({
                'account_name': account_name or self.account,  # Nếu không có tên thì hiển thị account number
                'account_verified': True,
            })
            
            # Tự động sync hoặc tạo Account Balance record sau khi verify thành công
            try:
                balance_type = 'stock' if self.order_type == 'stock' else 'derivative'
                # Tìm Account Balance record có sẵn
                balance = self.env['trading.account.balance'].search([
                    ('account', '=', account_clean),
                    ('config_id', '=', self.config_id.id),
                    ('balance_type', '=', balance_type)
                ], limit=1)
                
                if balance:
                    # Nếu có record, tự động sync
                    if balance.auto_sync:
                        balance.action_sync_balance()
                else:
                    # Nếu chưa có, tạo record mới (sẽ tự động sync trong create)
                    balance = self.env['trading.account.balance'].create({
                        'config_id': self.config_id.id,
                        'account': account_clean,
                        'balance_type': balance_type,
                        'auto_sync': True,
                    })
                    # Update account_balance_id để link với order
                    self.account_balance_id = balance
            except Exception as balance_error:
                # Không block flow nếu sync balance thất bại
                _logger.warning(f'Auto sync balance after verify account failed: {balance_error}')
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Account Verified'),
                    'message': _('Đã verify account thành công! Account: %s') % (account_name or self.account),
                    'type': 'success',
                    'sticky': False,
                }
            }
        except Exception as e:
            _logger.error(f'Error verifying account: {e}')
            self.write({
                'account_verified': False,
                'account_name': '',
            })
            raise UserError(_('Không thể verify account: %s') % str(e))
    
    def action_verify_otp(self):
        """
        Verify OTP code để kiểm tra và lấy write token
        Lưu ý: OTP chỉ có thể verify 1 lần, nên verify thành công sẽ lưu write token luôn
        """
        self.ensure_one()
        
        if not self.code:
            raise UserError(_('Vui lòng nhập OTP code'))
        
        if not self.config_id:
            raise UserError(_('Vui lòng chọn API Configuration'))
        
        if self.config_id.two_fa_type != '1':
            raise UserError(_('Chỉ có thể verify OTP khi Two Factor Type là OTP'))
        
        try:
            client = self.config_id.get_api_client()
            
            # Verify OTP bằng cách gọi verifyCode
            # Lưu ý: OTP chỉ có thể dùng 1 lần, nên verify thành công phải lưu write token luôn
            try:
                # Verify code để lấy write token (OTP sẽ bị consume sau lần verify này)
                client.verify_code(self.code)
                
                # Xóa code sau khi verify thành công để bảo mật
                self.code = False
                
                # Invalidate computed field để cập nhật UI
                self.invalidate_recordset(['has_valid_write_token'])
                # Invalidate cache để đảm bảo field được reload khi truy cập
                self.config_id.invalidate_recordset(['write_access_token'])
                
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('OTP Verified'),
                        'message': _('OTP code đã được xác thực thành công! Write token đã được lấy. Bạn có thể submit lệnh ngay bây giờ.'),
                        'type': 'success',
                        'sticky': False,
                    }
                }
            except Exception as verify_error:
                # Nếu verify thất bại, OTP không đúng
                error_msg = str(verify_error)
                _logger.warning(f'OTP verification failed: {error_msg}')
                
                # Xóa code nếu OTP sai
                self.code = False
                
                # Kiểm tra nếu lỗi liên quan đến twoFAType không match
                if 'TwoFactorType' in error_msg or 'twoFAType' in error_msg or 'not matched' in error_msg.lower():
                    current_type = 'OTP'
                    suggested_type = 'OTP'
                    
                    detailed_msg = (
                        _('Lỗi xác thực: TwoFactorType trong config không khớp với hệ thống SSI.\n\n') +
                        _('Config hiện tại: %s\n') % current_type +
                        _('Hệ thống SSI yêu cầu: %s\n\n') % suggested_type +
                        _('Vui lòng:\n') +
                        _('1. Vào API Configuration\n') +
                        _('2. Cập nhật "Two Factor Type" thành %s\n') % suggested_type +
                        _('3. Click "Get OTP" lại để lấy OTP mới\n') +
                        _('4. Thử lại verify OTP')
                    )
                    raise UserError(detailed_msg)
                elif 'Wrong OTP' in error_msg or 'wrong' in error_msg.lower():
                    raise UserError(_('OTP code không chính xác hoặc đã được sử dụng. OTP chỉ có thể dùng 1 lần. Vui lòng click "Get OTP" để lấy OTP mới và thử lại.'))
                else:
                    raise UserError(_('OTP code không chính xác hoặc đã hết hạn. Vui lòng lấy OTP mới và thử lại: %s') % error_msg)
        except UserError:
            # Re-raise UserError để giữ nguyên thông báo
            raise
        except Exception as e:
            _logger.error(f'Error verifying OTP: {e}')
            raise UserError(_('Không thể verify OTP: %s') % str(e))
    
    def action_verify_code(self):
        """Verify OTP code để kiểm tra và lấy write token"""
        self.ensure_one()
        
        if not self.code:
            raise UserError(_('Vui lòng nhập OTP code'))
        
        if not self.config_id:
            raise UserError(_('Vui lòng chọn API Configuration'))
        
        try:
            client = self.config_id.get_api_client()
            
            # Kiểm tra two_fa_type trong config (luôn là OTP)
            _logger.info(f'Verifying code with twoFAType: OTP (config value: {self.config_id.two_fa_type})')
            
            # Verify code để lấy write token
            client.verify_code(self.code)
            
            # Xóa code sau khi verify thành công để bảo mật
            self.code = False
            
            # Invalidate computed field để cập nhật UI
            self.invalidate_recordset(['has_valid_write_token'])
            # Invalidate cache để đảm bảo field được reload khi truy cập
            self.config_id.invalidate_recordset(['write_access_token'])
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Verify Success'),
                    'message': _('Code đã được verify thành công! Bạn có thể submit lệnh ngay bây giờ.'),
                    'type': 'success',
                    'sticky': False,
                }
            }
        except Exception as e:
            error_msg = str(e)
            _logger.error(f'Error verifying code: {error_msg}')
            
            # Kiểm tra nếu lỗi liên quan đến twoFAType không match
            if 'TwoFactorType' in error_msg or 'twoFAType' in error_msg or 'not matched' in error_msg.lower():
                # Parse error để lấy thông tin chi tiết
                current_type = 'OTP'
                suggested_type = 'OTP'
                
                detailed_msg = (
                    _('Lỗi xác thực: TwoFactorType trong config không khớp với hệ thống SSI.\n\n') +
                    _('Config hiện tại: %s\n') % current_type +
                    _('Hệ thống SSI yêu cầu: %s\n\n') % suggested_type +
                    _('Vui lòng:\n') +
                    _('1. Vào API Configuration\n') +
                    _('2. Cập nhật "Two Factor Type" thành %s\n') % suggested_type +
                    _('3. Nếu dùng OTP, click "Get OTP" trước khi verify\n') +
                    _('4. Thử lại verify code')
                )
                raise UserError(detailed_msg)
            elif 'Wrong OTP' in error_msg or ('wrong' in error_msg.lower() and 'otp' in error_msg.lower()):
                # OTP đã được sử dụng hoặc sai
                raise UserError(_('OTP code không chính xác hoặc đã được sử dụng.\n\nOTP chỉ có thể dùng 1 lần. Nếu bạn đã verify OTP trước đó, OTP đó đã được consume.\n\nVui lòng:\n1. Click "Get OTP" để lấy OTP mới\n2. Nhập OTP mới và click "Verify Code" hoặc "Verify OTP"'))
            else:
                raise UserError(_('Không thể verify code: %s') % error_msg)
    
    def action_submit_order(self):
        """Submit order to API"""
        self.ensure_one()
        
        if self.state != 'draft':
            raise UserError(_('Chỉ có thể submit lệnh ở trạng thái Draft'))
        
        try:
            # Invalidate cache để đảm bảo có write_access_token mới nhất
            self.config_id.invalidate_recordset(['write_access_token'])
            
            client = self.config_id.get_api_client()
            
            # Đảm bảo có write token hiệu lực
            # Nếu token còn hiệu lực, sẽ tự động dùng lại (không cần verify OTP)
            # Chỉ verify OTP khi token không tồn tại hoặc đã hết hạn
            try:
                client.ensure_write_token(code=self.code if self.code else None)
                # Xóa code sau khi verify thành công (nếu có)
                if self.code:
                    self.code = False
                    self.config_id.invalidate_recordset(['write_access_token'])
            except UserError as ue:
                # Nếu không có code, hiển thị thông báo hướng dẫn
                if not self.code:
                    raise UserError(
                        _('Write token đã hết hạn hoặc chưa được verify.\n\n'
                          'Vui lòng:\n'
                          '1. Click "Get OTP" để nhận OTP từ SSI (nếu dùng SMS/Email OTP)\n'
                          '2. Nhập OTP code vào trường "OTP Code"\n'
                          '3. Click "Verify Code" hoặc "Submit Order"\n\n'
                          'Lưu ý: Write token có hiệu lực %s giờ, sau khi verify sẽ tự động dùng cho các giao dịch tiếp theo.') %
                        TokenConstants.WRITE_TOKEN_LIFETIME_HOURS
                    )
                else:
                    # Re-raise nếu có code nhưng verify thất bại
                    raise
            
            # Generate deviceId và userAgent nếu chưa có
            device_id = self.device_id
            user_agent = self.user_agent
            if not device_id:
                device_id = client.get_deviceid()
                self.device_id = device_id
            if not user_agent:
                user_agent = client.get_user_agent()
                self.user_agent = user_agent
            
            # Validate account trước khi submit
            if not self.account:
                raise UserError(_('Vui lòng nhập Account'))
            
            # Validate và format account (loại bỏ khoảng trắng, uppercase)
            account_clean = str(self.account).strip().upper()
            if not account_clean:
                raise UserError(_('Account không được để trống'))
            
            # Lấy giá đặt lệnh (luôn = 0 theo yêu cầu API)
            order_price = self._get_order_price()
            
            # Prepare order data theo chuẩn fc-trading
            # Format: account.upper(), instrumentID.upper(), market.upper(), buySell.upper(), orderType.upper()
            order_data = {
                'account': account_clean,
                'requestID': str(self.request_id),
                'instrumentID': str(self.instrument_code).strip().upper(),
                'market': str(self.market).strip().upper(),
                'buySell': str(self.buy_sell).strip().upper(),
                'orderType': str(self.order_type_detail).strip().upper(),
                'price': order_price,
                'quantity': int(self.quantity),
                'stopOrder': bool(self.stop_order),
                'stopPrice': float(self.stop_price),
                'stopType': str(self.stop_type).strip(),
                'stopStep': float(self.stop_step),
                'lossStep': float(self.loss_step),
                'profitStep': float(self.profit_step),
                'deviceId': str(device_id),
                'userAgent': str(user_agent),
            }
            
            # Call API
            if self.order_type == 'stock':
                result = client.new_order(order_data)
            else:
                result = client.der_new_order(order_data)
            
            # Parse response
            response_json = json.dumps(result, indent=2)
            
            # Parse order status từ API response
            order_status = self._parse_order_status_from_response(result)
            
            # Log full response để debug
            _logger.info(f'Full API response for order {self.name}: {response_json}')
            _logger.info(f'Parsed order status: {order_status}')
            
            self.write({
                'state': order_status,
                'api_response': response_json,
                'submitted_at': fields.Datetime.now(),
            })
            
            # Extract order ID if available - thử nhiều vị trí khác nhau
            api_order_id = None
            
            # Thử tất cả các cách có thể
            if isinstance(result, dict):
                # 1. Check status == 200 và data dict
                if result.get('status') == 200:
                    if result.get('data'):
                        data = result['data']
                        if isinstance(data, dict):
                            # Thử các field có thể chứa order ID
                            api_order_id = (
                                data.get('orderID') or 
                                data.get('order_id') or 
                                data.get('orderId') or
                                data.get('OrderID') or
                                data.get('ORDER_ID') or
                                data.get('id') or
                                data.get('Id') or
                                data.get('ID') or
                                None
                            )
                        elif isinstance(data, (str, int)):
                            # Nếu data là string hoặc int, có thể đó là order ID
                            api_order_id = str(data) if data else None
                
                # 2. Check root level (không cần status == 200)
                if not api_order_id:
                    api_order_id = (
                        result.get('orderID') or 
                        result.get('order_id') or 
                        result.get('orderId') or
                        result.get('OrderID') or
                        result.get('ORDER_ID') or
                        result.get('id') or
                        result.get('Id') or
                        result.get('ID') or
                        None
                    )
                
                # 3. Check trong nested objects nếu có
                if not api_order_id:
                    for key, value in result.items():
                        if isinstance(value, dict):
                            api_order_id = (
                                value.get('orderID') or 
                                value.get('order_id') or 
                                value.get('orderId') or
                                value.get('OrderID') or
                                value.get('id') or
                                None
                            )
                            if api_order_id:
                                break
            elif isinstance(result, (str, int)):
                # Nếu result là string hoặc int trực tiếp
                api_order_id = str(result) if result else None
            
            # Log kết quả parse
            if api_order_id:
                _logger.info(f'Found API Order ID: {api_order_id} for order {self.name}')
            else:
                _logger.warning(f'Could not find API Order ID in response for order {self.name}. Response: {result}')
            
            # Lưu order ID nếu tìm thấy
            if api_order_id:
                self.write({'api_order_id': str(api_order_id)})
            else:
                # Nếu không tìm thấy, thử parse từ api_response string
                try:
                    response_str = json.dumps(result, indent=2)
                    # Tìm pattern orderID trong string response
                    import re
                    patterns = [
                        r'"orderID"\s*:\s*"([^"]+)"',
                        r'"order_id"\s*:\s*"([^"]+)"',
                        r'"orderId"\s*:\s*"([^"]+)"',
                        r'"orderID"\s*:\s*(\d+)',
                        r'"order_id"\s*:\s*(\d+)',
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, response_str, re.IGNORECASE)
                        if match:
                            api_order_id = match.group(1)
                            _logger.info(f'Found API Order ID via regex: {api_order_id} for order {self.name}')
                            self.write({'api_order_id': str(api_order_id)})
                            break
                except Exception as e:
                    _logger.error(f'Error parsing order ID from response string: {e}')
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Lệnh đã được submit thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error submitting order: {e}')
            self.write({
                'state': 'error',
                'error_message': str(e),
            })
            raise UserError(_('Không thể submit lệnh: %s') % str(e))
    
    def action_cancel_order(self):
        """Cancel order via API"""
        self.ensure_one()
        
        if self.state not in ['pending', 'submitted', 'partially_filled']:
            raise UserError(_('Chỉ có thể hủy lệnh ở trạng thái Pending, Submitted hoặc Partially Filled'))
        
        if not self.api_order_id:
            raise UserError(_('Không có Order ID để hủy'))
        
        try:
            client = self.config_id.get_api_client()
            
            # Đảm bảo có write token hiệu lực
            # Nếu token còn hiệu lực, sẽ tự động dùng lại (không cần verify OTP)
            try:
                client.ensure_write_token(code=self.code if self.code else None)
                # Xóa code sau khi verify thành công (nếu có)
                if self.code:
                    self.code = False
                    # Invalidate computed field để cập nhật UI
                    self.invalidate_recordset(['has_valid_write_token'])
                    self.config_id.invalidate_recordset(['write_access_token'])
            except UserError as ue:
                # Nếu không có code, hiển thị thông báo hướng dẫn
                if not self.code:
                    raise UserError(
                        _('Write token đã hết hạn hoặc chưa được verify.\n\n'
                          'Vui lòng:\n'
                          '1. Nhập OTP code vào trường "OTP Code"\n'
                          '2. Click "Cancel Order"\n\n'
                          'Lưu ý: Write token có hiệu lực %s giờ, sau khi verify sẽ tự động dùng cho các giao dịch tiếp theo mà không cần nhập OTP code nữa.') %
                        TokenConstants.WRITE_TOKEN_LIFETIME_HOURS
                    )
                else:
                    # Re-raise nếu có code nhưng verify thất bại
                    raise
            
            # Generate deviceId và userAgent nếu chưa có
            device_id = self.device_id or client.get_deviceid()
            user_agent = self.user_agent or client.get_user_agent()
            if not self.device_id:
                self.device_id = device_id
            if not self.user_agent:
                self.user_agent = user_agent
            
            # Validate account
            if not self.account:
                raise UserError(_('Vui lòng nhập Account'))
            
            account_clean = str(self.account).strip().upper()
            if not account_clean:
                raise UserError(_('Account không được để trống'))
            
            # Prepare cancel data theo chuẩn fc-trading
            # Format: account, requestID, orderID, marketID, instrumentID, buySell
            cancel_data = {
                'account': account_clean,
                'requestID': str(random.randint(0, 99999999)),
                'orderID': str(self.api_order_id),
                'marketID': str(self.market).strip().upper(),
                'instrumentID': str(self.instrument_code).strip().upper(),
                'buySell': str(self.buy_sell).strip().upper(),
                'deviceId': str(device_id),
                'userAgent': str(user_agent),
            }
            
            if self.order_type == 'stock':
                result = client.cancel_order(cancel_data)
            else:
                result = client.der_cancel_order(cancel_data)
            
            self.write({
                'state': 'cancelled',
                'api_response': json.dumps(result, indent=2),
            })
            
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('Lệnh đã được hủy thành công'),
                    'type': 'success',
                }
            }
        except Exception as e:
            _logger.error(f'Error canceling order: {e}')
            raise UserError(_('Không thể hủy lệnh: %s') % str(e))
    
    def action_modify_order(self):
        """Modify order via API"""
        self.ensure_one()
        
        if self.state not in ['pending', 'submitted', 'partially_filled']:
            raise UserError(_('Chỉ có thể sửa lệnh ở trạng thái Pending, Submitted hoặc Partially Filled'))
        
        if not self.api_order_id:
            raise UserError(_('Không có Order ID để sửa'))
        
            # Open wizard để modify
        return {
            'name': _('Modify Order'),
            'type': 'ir.actions.act_window',
            'res_model': 'trading.order.modify.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_order_id': self.id,
                'default_quantity': self.quantity,
            }
        }
    
    def _parse_order_status_from_response(self, response):
        """
        Parse order status từ API response
        
        Args:
            response: API response dict
            
        Returns:
            str: Odoo state ('pending', 'submitted', 'filled', 'partially_filled', 'cancelled', 'rejected', 'error')
        """
        if not isinstance(response, dict):
            return 'submitted'  # Default nếu không parse được
        
        # Kiểm tra status code của response
        status_code = response.get('status', 0)
        if status_code != 200:
            # Nếu API trả về lỗi, check message
            message = response.get('message', '').lower()
            if 'reject' in message or 'từ chối' in message:
                return 'rejected'
            else:
                return 'error'
        
        # Parse từ data field
        data = response.get('data')
        if isinstance(data, dict):
            # Tìm orderStatus, status, order_status trong data
            order_status = (
                data.get('orderStatus') or 
                data.get('status') or 
                data.get('order_status') or
                data.get('OrderStatus') or
                data.get('Status') or
                None
            )
            
            if order_status:
                return self._map_api_status_to_odoo_state(str(order_status).upper())
        
        # Nếu không tìm thấy trong data, check root level
        order_status = (
            response.get('orderStatus') or 
            response.get('status') or 
            response.get('order_status') or
            None
        )
        
        if order_status:
            return self._map_api_status_to_odoo_state(str(order_status).upper())
        
        # Default: nếu API trả về status 200 nhưng không có orderStatus, có thể là đã submit thành công
        # Nhưng chưa biết trạng thái, nên để pending
        return 'pending'
    
    def _map_api_status_to_odoo_state(self, api_status):
        """
        Map API status sang Odoo state
        
        Args:
            api_status: Status từ API (string, uppercase)
            
        Returns:
            str: Odoo state
        """
        api_status = str(api_status).upper().strip()
        
        # Map các status phổ biến
        status_mapping = {
            'PENDING': 'pending',
            'P': 'pending',
            'WAITING': 'pending',
            'NEW': 'pending',
            
            'SUBMITTED': 'submitted',
            'S': 'submitted',
            'ACTIVE': 'submitted',
            
            'FILLED': 'filled',
            'F': 'filled',
            'COMPLETED': 'filled',
            'DONE': 'filled',
            'EXECUTED': 'filled',
            
            'PARTIALLY_FILLED': 'partially_filled',
            'PARTIAL': 'partially_filled',
            'PF': 'partially_filled',
            
            'CANCELLED': 'cancelled',
            'CANCEL': 'cancelled',
            'C': 'cancelled',
            'CANCELED': 'cancelled',
            
            'REJECTED': 'rejected',
            'R': 'rejected',
            'REJECT': 'rejected',
            'FAILED': 'rejected',
            
            'ERROR': 'error',
            'E': 'error',
            'FAIL': 'error',
        }
        
        return status_mapping.get(api_status, 'submitted')  # Default là submitted
    
    def action_sync_status(self):
        """
        Sync order status từ Order Book API
        
        Lấy thông tin mới nhất từ API về trạng thái lệnh (đã khớp, chờ khớp, đã hủy, v.v.)
        """
        self.ensure_one()
        
        if not self.api_order_id:
            raise UserError(_('Không có API Order ID để sync status. Vui lòng submit lệnh trước.'))
        
        if not self.account:
            raise UserError(_('Không có Account để sync status.'))
        
        try:
            client = self.config_id.get_api_client()
            
            # Validate và format account
            account_clean = str(self.account).strip().upper()
            
            # Lấy order book để tìm lệnh hiện tại
            from ssi_fctrading.models import fcmodel_requests
            req = fcmodel_requests.OrderBook(account=account_clean)
            result = client.get_order_book(req)
            
            _logger.info(f'Order Book response for sync status: {json.dumps(result, indent=2)}')
            
            # Parse order status từ order book
            if isinstance(result, dict):
                status_code = result.get('status', 0)
                if status_code == 200:
                    data = result.get('data')
                    
                    # Tìm order trong order book
                    if isinstance(data, list):
                        # Nếu data là list các orders
                        for order in data:
                            order_id = (
                                str(order.get('orderID', '')) or 
                                str(order.get('order_id', '')) or 
                                str(order.get('id', '')) or
                                ''
                            )
                            if order_id == str(self.api_order_id):
                                # Tìm thấy order, parse status
                                order_status = self._parse_order_status_from_order_book(order)
                                old_state = self.state
                                
                                self.write({
                                    'state': order_status,
                                    'api_response': json.dumps(result, indent=2),
                                })
                                
                                # Update filled_at nếu đã filled
                                if order_status == 'filled' and old_state != 'filled':
                                    self.write({'filled_at': fields.Datetime.now()})
                                
                                return {
                                    'type': 'ir.actions.client',
                                    'tag': 'display_notification',
                                    'params': {
                                        'title': _('Status Updated'),
                                        'message': _('Trạng thái lệnh đã được cập nhật: %s → %s') % (old_state, order_status),
                                        'type': 'success',
                                    }
                                }
                    elif isinstance(data, dict):
                        # Nếu data là dict, có thể là single order
                        order_id = (
                            str(data.get('orderID', '')) or 
                            str(data.get('order_id', '')) or 
                            str(data.get('id', '')) or
                            ''
                        )
                        if order_id == str(self.api_order_id):
                            order_status = self._parse_order_status_from_order_book(data)
                            old_state = self.state
                            
                            self.write({
                                'state': order_status,
                                'api_response': json.dumps(result, indent=2),
                            })
                            
                            if order_status == 'filled' and old_state != 'filled':
                                self.write({'filled_at': fields.Datetime.now()})
                            
                            return {
                                'type': 'ir.actions.client',
                                'tag': 'display_notification',
                                'params': {
                                    'title': _('Status Updated'),
                                    'message': _('Trạng thái lệnh đã được cập nhật: %s → %s') % (old_state, order_status),
                                    'type': 'success',
                                }
                            }
                    
                    # Không tìm thấy order trong order book
                    # Có thể order đã filled hoặc cancelled
                    # Kiểm tra order history
                    return {
                        'type': 'ir.actions.client',
                        'tag': 'display_notification',
                        'params': {
                            'title': _('Order Not Found'),
                            'message': _('Không tìm thấy lệnh trong Order Book. Có thể lệnh đã khớp hoặc đã hủy. Vui lòng kiểm tra Order History.'),
                            'type': 'warning',
                        }
                    }
                else:
                    raise UserError(_('Không thể lấy Order Book: %s') % result.get('message', 'Unknown error'))
            else:
                raise UserError(_('Response không đúng format'))
                
        except Exception as e:
            _logger.error(f'Error syncing order status: {e}')
            raise UserError(_('Không thể sync status: %s') % str(e))
    
    def _parse_order_status_from_order_book(self, order_data):
        """
        Parse order status từ order book data
        
        Args:
            order_data: Order data từ order book API
            
        Returns:
            str: Odoo state
        """
        if not isinstance(order_data, dict):
            return 'pending'
        
        # Tìm orderStatus trong order data
        order_status = (
            order_data.get('orderStatus') or 
            order_data.get('status') or 
            order_data.get('order_status') or
            order_data.get('OrderStatus') or
            order_data.get('Status') or
            None
        )
        
        if order_status:
            return self._map_api_status_to_odoo_state(str(order_status))
        
        # Nếu không có orderStatus, check các field khác
        # Ví dụ: filledQty, pendingQty, cancelledQty
        filled_qty = order_data.get('filledQty') or order_data.get('filled_qty') or order_data.get('filledQuantity') or 0
        quantity = order_data.get('quantity') or order_data.get('qty') or self.quantity or 0
        
        try:
            filled_qty = float(filled_qty) if filled_qty else 0
            quantity = float(quantity) if quantity else 0
        except (ValueError, TypeError):
            filled_qty = 0
            quantity = 0
        
        if quantity > 0:
            if filled_qty >= quantity:
                return 'filled'
            elif filled_qty > 0:
                return 'partially_filled'
            else:
                return 'pending'
        
        # Default
        return 'pending'

