# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class MaturityNotification(models.Model):
    _name = 'transaction.maturity.notification'
    _description = 'Thông báo đáo hạn lệnh giao dịch'
    _order = 'maturity_date desc, create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Mã thông báo', required=True, readonly=True, default=lambda self: _('New'))
    transaction_id = fields.Many2one('portfolio.transaction', string='Lệnh giao dịch', required=True, ondelete='cascade', tracking=True)
    user_id = fields.Many2one('res.users', string='Nhà đầu tư', related='transaction_id.user_id', store=True, readonly=True)
    partner_id = fields.Many2one('res.partner', string='Đối tác', related='transaction_id.user_id.partner_id', store=True, readonly=True)
    fund_id = fields.Many2one('portfolio.fund', string='Quỹ', related='transaction_id.fund_id', store=True, readonly=True)
    maturity_date = fields.Date(string='Ngày đáo hạn', required=True, tracking=True, help='Ngày mà lệnh đến hạn và cần xác nhận bán')
    units = fields.Float(string='Số lượng CCQ', related='transaction_id.units', store=True, readonly=True, digits=(16, 2))
    remaining_units = fields.Float(string='Số lượng còn lại', related='transaction_id.remaining_units', store=True, readonly=True, digits=(16, 2))
    notification_sent = fields.Boolean(string='Đã gửi thông báo', default=False, tracking=True)
    notification_sent_at = fields.Datetime(string='Thời gian gửi thông báo', readonly=True)
    investor_response = fields.Selection([
        ('pending', 'Chờ phản hồi'),
        ('confirmed', 'Đồng ý bán'),
        ('rejected', 'Từ chối bán'),
        ('expired', 'Hết hạn')
    ], string='Phản hồi nhà đầu tư', default='pending', tracking=True)
    investor_response_at = fields.Datetime(string='Thời gian phản hồi', readonly=True)
    sell_order_id = fields.Many2one('portfolio.transaction', string='Lệnh bán đã tạo', readonly=True, help='Lệnh bán tự động được tạo khi nhà đầu tư xác nhận')
    state = fields.Selection([
        ('draft', 'Nháp'),
        ('sent', 'Đã gửi'),
        ('confirmed', 'Đã xác nhận'),
        ('rejected', 'Đã từ chối'),
        ('expired', 'Hết hạn'),
        ('done', 'Hoàn thành')
    ], string='Trạng thái', default='draft', tracking=True, compute='_compute_state', store=True)
    term_months = fields.Integer(string='Kỳ hạn (tháng)', related='transaction_id.term_months', store=True, readonly=True)
    interest_rate = fields.Float(string='Lãi suất (%)', related='transaction_id.interest_rate', store=True, readonly=True, digits=(16, 2))
    current_nav = fields.Float(string='Giá NAV hiện tại', related='transaction_id.current_nav', store=True, readonly=True, digits=(16, 2))
    confirmation_token = fields.Char(string='Token xác nhận', readonly=True, copy=False, help='Token để xác thực khi nhà đầu tư xác nhận qua link')

    @api.depends('notification_sent', 'investor_response', 'sell_order_id')
    def _compute_state(self):
        for record in self:
            if record.investor_response == 'confirmed' and record.sell_order_id:
                record.state = 'done'
            elif record.investor_response == 'confirmed':
                record.state = 'confirmed'
            elif record.investor_response == 'rejected':
                record.state = 'rejected'
            elif record.investor_response == 'expired':
                record.state = 'expired'
            elif record.notification_sent:
                record.state = 'sent'
            else:
                record.state = 'draft'

    @api.model
    def create(self, vals):
        try:
            if vals.get('name', _('New')) == _('New'):
                try:
                    sequence = self.env['ir.sequence'].next_by_code('transaction.maturity.notification')
                    if sequence:
                        vals['name'] = sequence
                    else:
                        # Fallback nếu sequence không tìm thấy
                        today = fields.Date.today()
                        vals['name'] = f"MAT/{today.strftime('%Y%m%d')}/NEW"
                        _logger.warning("Sequence 'transaction.maturity.notification' không tìm thấy, sử dụng fallback")
                except Exception as seq_error:
                    # Fallback nếu có lỗi khi gọi sequence
                    today = fields.Date.today()
                    vals['name'] = f"MAT/{today.strftime('%Y%m%d')}/FALLBACK"
                    _logger.warning(f"Lỗi khi gọi sequence: {str(seq_error)}, sử dụng fallback")
        except Exception as e:
            _logger.error(f"Lỗi khi tạo name cho notification: {str(e)}")
            # Đảm bảo có name trước khi create
            if not vals.get('name') or vals.get('name') == _('New'):
                today = fields.Date.today()
                vals['name'] = f"MAT/{today.strftime('%Y%m%d')}/ERROR"
        
        if not vals.get('confirmation_token'):
            try:
                import secrets
                vals['confirmation_token'] = secrets.token_urlsafe(32)
            except Exception as token_error:
                _logger.warning(f"Lỗi khi tạo confirmation_token: {str(token_error)}")
                # Fallback: dùng timestamp và random
                import time
                import random
                vals['confirmation_token'] = f"{int(time.time())}{random.randint(1000, 9999)}"
        
        try:
            return super(MaturityNotification, self).create(vals)
        except Exception as create_error:
            _logger.error(f"Lỗi khi tạo notification record: {str(create_error)}", exc_info=True)
            raise

    def action_send_notification(self):
        self.ensure_one()
        if not self.user_id:
            raise ValidationError(_('Nhà đầu tư không tồn tại.'))
        
        try:
            # Chuẩn bị dữ liệu thông báo
            transaction = self.transaction_id
            fund_name = transaction.fund_id.name if transaction.fund_id else 'N/A'
            maturity_date_str = self.maturity_date.strftime('%d/%m/%Y') if self.maturity_date else 'N/A'
            units = transaction.remaining_units if transaction.remaining_units > 0 else transaction.units
            nav = transaction.current_nav or transaction.price or 0
            estimated_value = units * nav
            
            # Chuẩn bị payload để gửi qua websocket/bus
            payload = {
                'type': 'maturity_notification',
                'notification_id': self.id,
                'user_id': self.user_id.id,
                'partner_id': self.partner_id.id if self.partner_id else False,
                'transaction_id': transaction.id,
                'transaction_name': transaction.name,
                'fund_name': fund_name,
                'maturity_date': maturity_date_str,
                'units': units,
                'nav': nav,
                'estimated_value': estimated_value,
                'title': f'Thông báo đáo hạn - Lệnh {transaction.name}',
                'message': f'Lệnh {transaction.name} của quỹ {fund_name} đã đến ngày đáo hạn ({maturity_date_str}). Số lượng: {units:,.2f} CCQ.',
                'timestamp': fields.Datetime.now().isoformat()
            }
            
            # Gửi qua bus đến channel chung, frontend sẽ filter theo user_id
            self.env['bus.bus']._sendone('transaction.maturity.notifications', payload)
            
            self.write({
                'notification_sent': True,
                'notification_sent_at': fields.Datetime.now(),
                'state': 'sent'
            })
            _logger.info(f"Đã gửi thông báo đáo hạn qua websocket cho lệnh {self.transaction_id.name} đến user {self.user_id.name}")
        except Exception as e:
            _logger.error(f"Lỗi khi gửi thông báo đáo hạn: {str(e)}")
            raise ValidationError(_('Không thể gửi thông báo: %s') % str(e))

    def action_confirm_sell(self):
        self.ensure_one()
        if self.investor_response != 'pending':
            raise ValidationError(_('Thông báo này đã được xử lý.'))
        if not self.transaction_id:
            raise ValidationError(_('Lệnh không tồn tại.'))
        # Kiểm tra số lượng để bán: ưu tiên remaining_units, nếu = 0 thì dùng units (vì khi khớp thành công remaining_units = 0)
        units_to_sell = self.transaction_id.remaining_units if self.transaction_id.remaining_units > 0 else self.transaction_id.units
        if units_to_sell <= 0:
            raise ValidationError(_('Lệnh không còn số lượng để bán.'))
        sell_order = self._create_sell_order()
        self.write({
            'investor_response': 'confirmed',
            'investor_response_at': fields.Datetime.now(),
            'sell_order_id': sell_order.id,
            'state': 'confirmed'
        })
        self._send_confirmation_email()
        _logger.info(f"Nhà đầu tư {self.user_id.name} đã xác nhận bán lệnh {self.transaction_id.name}, đã tạo lệnh bán {sell_order.name}")
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Thành công'),
                'message': _('Đã tạo lệnh bán thành công. Lệnh sẽ được đưa vào sổ lệnh để khớp.'),
                'sticky': False,
            }
        }

    def action_reject_sell(self):
        self.ensure_one()
        if self.investor_response != 'pending':
            raise ValidationError(_('Thông báo này đã được xử lý.'))
        self.write({
            'investor_response': 'rejected',
            'investor_response_at': fields.Datetime.now(),
            'state': 'rejected'
        })
        _logger.info(f"Nhà đầu tư {self.user_id.name} đã từ chối bán lệnh {self.transaction_id.name}")
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Đã từ chối'),
                'message': _('Bạn đã từ chối bán lệnh này.'),
                'sticky': False,
            }
        }

    def _create_sell_order(self):
        transaction = self.transaction_id
        fund_id = transaction.fund_id.id if transaction.fund_id else False
        
        # Lấy giá CCQ từ tồn kho đầu ngày (fund_buy), không phải giá NAV của quỹ
        try:
            from odoo.addons.fund_management.utils import investment_utils
            ccq_price = investment_utils.InvestmentHelper._get_ccq_price_from_inventory(self.env, fund_id)
            if ccq_price <= 0:
                # Fallback về current_nav nếu không lấy được giá CCQ từ tồn kho
                ccq_price = transaction.current_nav or transaction.price or 0
                _logger.warning(f"Không lấy được giá CCQ từ tồn kho cho fund_id={fund_id}, dùng giá NAV: {ccq_price}")
            else:
                _logger.info(f"Đã lấy giá CCQ từ tồn kho đầu ngày: {ccq_price} cho fund_id={fund_id}")
        except Exception as e:
            _logger.error(f"Lỗi khi lấy giá CCQ từ tồn kho: {str(e)}, dùng giá NAV làm fallback")
            ccq_price = transaction.current_nav or transaction.price or 0
        
        # Làm tròn giá CCQ theo bội số 50 (MROUND)
        try:
            from odoo.addons.transaction_list.utils import mround
            sell_price = mround(ccq_price, 50)
        except Exception as e:
            # Fallback nếu không import được mround
            _logger.warning(f"Không import được mround: {str(e)}, dùng công thức làm tròn thủ công")
            sell_price = round(ccq_price / 50) * 50
        
        # Số lượng để bán: ưu tiên remaining_units, nếu = 0 thì dùng units (vì khi khớp thành công remaining_units = 0)
        units_to_sell = transaction.remaining_units if transaction.remaining_units > 0 else transaction.units
        if units_to_sell <= 0:
            raise ValidationError(_('Lệnh không còn số lượng để bán.'))
        
        # Tạo lệnh bán với status 'pending' để có thể đưa vào sổ lệnh để khớp
        sell_order_vals = {
            'user_id': transaction.user_id.id,
            'fund_id': fund_id,
            'transaction_type': 'sell',
            'status': 'pending',  # Để có thể khớp lệnh sau này
            'units': units_to_sell,
            'remaining_units': units_to_sell,
            'matched_units': 0.0,
            'is_matched': False,
            'amount': units_to_sell * sell_price,
            'price': sell_price,  # Giá CCQ từ tồn kho đầu ngày (đã làm tròn)
            'current_nav': sell_price,
            'term_months': transaction.term_months or 0,
            'interest_rate': transaction.interest_rate or 0.0,
            'currency_id': transaction.currency_id.id if transaction.currency_id else self.env.company.currency_id.id,
            'investment_type': transaction.investment_type or 'fund_certificate',
            'source': 'portfolio',
            'description': f'Lệnh bán tự động từ đáo hạn - Lệnh mua #{transaction.name}',
        }
        try:
            sell_order = self.env['portfolio.transaction'].sudo().create(sell_order_vals)
            _logger.info(f"Đã tạo lệnh bán {sell_order.name} từ thông báo đáo hạn {self.name} với giá CCQ {sell_price} (từ tồn kho đầu ngày)")
            return sell_order
        except Exception as e:
            _logger.error(f"Lỗi khi tạo lệnh bán từ thông báo đáo hạn {self.name}: {str(e)}")
            raise ValidationError(_('Không thể tạo lệnh bán: %s') % str(e))

    def _send_confirmation_email(self):
        """Gửi thông báo xác nhận qua websocket"""
        try:
            if not self.user_id:
                return
            
            payload = {
                'type': 'maturity_confirmation',
                'notification_id': self.id,
                'user_id': self.user_id.id,
                'partner_id': self.partner_id.id if self.partner_id else False,
                'transaction_id': self.transaction_id.id,
                'transaction_name': self.transaction_id.name,
                'sell_order_id': self.sell_order_id.id if self.sell_order_id else False,
                'sell_order_name': self.sell_order_id.name if self.sell_order_id else 'Đang xử lý...',
                'title': 'Xác nhận bán thành công',
                'message': f'Bạn đã xác nhận đồng ý bán lệnh {self.transaction_id.name}. Lệnh bán đã được tạo và sẽ được đưa vào sổ lệnh để khớp.',
                'timestamp': fields.Datetime.now().isoformat()
            }
            
            # Gửi qua bus đến channel chung
            self.env['bus.bus']._sendone('transaction.maturity.notifications', payload)
        except Exception as e:
            _logger.warning(f"Không thể gửi thông báo xác nhận: {str(e)}")

    def _create_default_email_template(self):
        return False

    @api.model
    def check_maturity_dates(self):
        today = fields.Date.today()
        transactions = self.env['portfolio.transaction'].search([
            ('transaction_type', 'in', ['buy', 'purchase']),
            ('status', '=', 'completed'),
            ('term_months', '>', 0)
        ])
        notifications_created = 0
        notifications_sent = 0
        for transaction in transactions:
            # Kiểm tra user_id
            if not transaction.user_id:
                continue
            
            maturity_date = self._calculate_maturity_date(transaction)
            if not maturity_date:
                continue
            if maturity_date == today:
                # Luôn tạo và gửi thông báo mới, không kiểm tra existing notification
                # Cho phép gửi lại nhiều lần
                notification = self.create({
                    'transaction_id': transaction.id,
                    'maturity_date': maturity_date,
                    'state': 'draft'
                })
                notifications_created += 1
                try:
                    notification.action_send_notification()
                    notifications_sent += 1
                except Exception as e:
                    _logger.error(f"Không thể gửi thông báo cho lệnh {transaction.name}: {str(e)}")
        _logger.info(f"Đã kiểm tra đáo hạn: Tạo {notifications_created} thông báo, gửi {notifications_sent} thông báo")
        return {
            'notifications_created': notifications_created,
            'notifications_sent': notifications_sent
        }

    @api.model
    def _calculate_maturity_date(self, transaction):
        if not transaction.term_months or transaction.term_months <= 0:
            return False
        start_date = transaction.date_end or transaction.create_date
        if not start_date:
            return False
        if isinstance(start_date, datetime):
            start_date = start_date.date()
        elif isinstance(start_date, fields.Datetime):
            start_date = start_date.date()
        try:
            days_to_add = transaction.term_months * 30
            maturity_date = start_date + timedelta(days=days_to_add)
        except Exception:
            return False
        return maturity_date

    @api.model
    def action_expire_notification(self):
        expired_days = 7
        cutoff_date = fields.Date.today() - timedelta(days=expired_days)
        expired_notifications = self.search([
            ('maturity_date', '<=', cutoff_date),
            ('investor_response', '=', 'pending'),
            ('state', '=', 'sent')
        ])
        expired_notifications.write({
            'investor_response': 'expired',
            'state': 'expired'
        })
        _logger.info(f"Đã đánh dấu {len(expired_notifications)} thông báo hết hạn")
        return len(expired_notifications)

    @api.model
    def check_maturity_dates_for_test(self):
        """
        Method để test: Gửi thông báo đáo hạn cho TẤT CẢ lệnh mua đã hoàn thành,
        không kiểm tra ngày đáo hạn. Dùng để test tính năng.
        """
        transactions = self.env['portfolio.transaction'].search([
            ('transaction_type', 'in', ['buy', 'purchase']),
            ('status', '=', 'completed'),
            ('term_months', '>', 0)
        ])
        
        _logger.info(f"[TEST] Tìm thấy {len(transactions)} lệnh mua đã hoàn thành có term_months > 0")
        
        notifications_created = 0
        notifications_sent = 0
        skipped_no_user = 0
        
        for transaction in transactions:
            # Kiểm tra user_id
            if not transaction.user_id:
                skipped_no_user += 1
                _logger.warning(f"[TEST] Lệnh {transaction.name} không có user_id, bỏ qua")
                continue
            
            maturity_date = self._calculate_maturity_date(transaction)
            if not maturity_date:
                # Nếu không tính được ngày đáo hạn, dùng ngày hôm nay
                maturity_date = fields.Date.today()
            
            # Luôn tạo và gửi thông báo mới, không kiểm tra existing notification
            # Cho phép gửi lại nhiều lần
            try:
                notification = self.create({
                    'transaction_id': transaction.id,
                    'maturity_date': maturity_date,
                    'state': 'draft'
                })
                notifications_created += 1
                _logger.info(f"[TEST] Đã tạo thông báo cho lệnh {transaction.name}, maturity_date: {maturity_date}")
                
                try:
                    notification.action_send_notification()
                    notifications_sent += 1
                    _logger.info(f"[TEST] Đã gửi thông báo cho lệnh {transaction.name}")
                except Exception as e:
                    _logger.error(f"[TEST] Không thể gửi thông báo cho lệnh {transaction.name}: {str(e)}")
            except Exception as e:
                _logger.error(f"[TEST] Không thể tạo notification cho lệnh {transaction.name}: {str(e)}")
        
        _logger.info(f"[TEST] Kết quả: Tìm thấy {len(transactions)} lệnh, "
                    f"Bỏ qua {skipped_no_user} lệnh không có user_id, "
                    f"Tạo {notifications_created} thông báo mới, "
                    f"Gửi {notifications_sent} thông báo")
        
        return {
            'notifications_created': notifications_created,
            'notifications_sent': notifications_sent,
            'total_transactions': len(transactions),
            'skipped_no_user': skipped_no_user,
            'skipped_existing': 0  # Không còn skip existing nữa
        }

