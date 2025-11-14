from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import json
import logging
from datetime import datetime
from ..utils import mround

_logger = logging.getLogger(__name__)


class TransactionList(models.Model):
    _inherit = "portfolio.transaction"
    _description = "Transaction List Extension"

    # Thêm các trường mới cho transaction list mà không ảnh hưởng đến model gốc
    source = fields.Selection([
        ('portal', 'Portal'),
        ('sale', 'Sale Portal'),
        ('portfolio', 'Portfolio')
    ], string="Source", default='portfolio', tracking=True)
    
    approved_by = fields.Many2one("res.users", string="Approved By", tracking=True)
    approved_at = fields.Datetime(string="Approved At", tracking=True)
    contract_pdf_path = fields.Char(string="Contract PDF Path")
    # Computed field for account number
    account_number = fields.Char(string="Số tài khoản", compute='_compute_account_number', store=True)
    
    # Computed field for investor name
    investor_name = fields.Char(string="Tên nhà đầu tư", compute='_compute_investor_name', store=True)
    
    # Computed field for investor phone
    investor_phone = fields.Char(string="Số điện thoại", compute='_compute_investor_phone', store=True)
    
    # Field for current NAV/unit price
    current_nav = fields.Float(string="Giá NAV hiện tại", digits=(16, 2), help="Giá NAV hiện tại của quỹ tại thời điểm giao dịch")
    
    # Field for transaction price per unit
    price = fields.Monetary(string="Giá đơn vị", required=True, tracking=True, help="Giá đơn vị cho giao dịch này")
    
    # Fields for order matching
    matched_units = fields.Float(string="Số lượng khớp", digits=(16, 2), default=0, help="Số lượng CCQ đã được khớp lệnh")
    is_matched = fields.Boolean(string="Đã khớp lệnh", default=False, help="Lệnh đã được khớp")
    matched_order_ids = fields.One2many('transaction.matched.orders', 'buy_order_id', string="Lệnh mua đã khớp")
    matched_sell_order_ids = fields.One2many('transaction.matched.orders', 'sell_order_id', string="Lệnh bán đã khớp")
    remaining_units = fields.Float(string="Số lượng còn lại", compute='_compute_remaining_units', store=True)
    
    # Field cho khớp lệnh liên tục
    ccq_remaining_to_match = fields.Float(
        string="CCQ còn lại cần khớp", 
        digits=(16, 2),
        compute='_compute_ccq_remaining_to_match', 
        store=True,
        help="Số lượng CCQ còn lại cần khớp lệnh"
    )

    # Số liệu dựa trên các cặp lệnh đã ghi nhận (transaction.matched.orders)
    pair_matched_units = fields.Float(
        string="Số lượng đã khớp (cặp)",
        compute='_compute_pair_based_quantities',
        store=False,
        digits=(16, 2),
    )
    pair_remaining_units = fields.Float(
        string="Số lượng còn lại (cặp)",
        compute='_compute_pair_based_quantities',
        store=False,
        digits=(16, 2),
    )
    is_partial_pair = fields.Boolean(
        string="Khớp một phần (cặp)",
        compute='_compute_is_partial_pair',
        search='_search_is_partial_pair',
        store=False,
    )

    # Bổ sung trường kỳ hạn/lãi suất để đồng bộ fund_management
    term_months = fields.Integer(string="Kỳ hạn (tháng)")
    interest_rate = fields.Float(string="Lãi suất (%)", digits=(16, 2))
    
    # Field để lưu trạng thái gửi lên sàn
    sent_to_exchange = fields.Boolean(string="Đã gửi lên sàn", default=False, help="Giao dịch đã được gửi lên sàn")
    sent_to_exchange_at = fields.Datetime(string="Thời gian gửi lên sàn", help="Thời điểm giao dịch được gửi lên sàn")
    
    # Computed field cho ngày đáo hạn
    maturity_date = fields.Date(
        string='Ngày đáo hạn',
        compute='_compute_maturity_date',
        store=True,
        help='Ngày đáo hạn được tính từ date_end hoặc create_date + term_months'
    )
    
    # One2many để liên kết với thông báo đáo hạn
    maturity_notification_ids = fields.One2many(
        'transaction.maturity.notification',
        'transaction_id',
        string='Thông báo đáo hạn'
    )
    maturity_notification_count = fields.Integer(
        string='Số thông báo đáo hạn',
        compute='_compute_maturity_notification_count'
    )

    @api.depends('units', 'matched_units')
    def _compute_remaining_units(self):
        for record in self:
            record.remaining_units = record.units - record.matched_units

    @api.depends('units', 'matched_units', 'status')
    def _compute_ccq_remaining_to_match(self):
        """Tính số lượng CCQ còn lại cần khớp lệnh"""
        for record in self:
            # Chỉ tính cho các lệnh đã được phê duyệt và chưa khớp hoàn toàn
            if record.status == 'completed' and record.remaining_units > 0:
                record.ccq_remaining_to_match = record.remaining_units
            else:
                record.ccq_remaining_to_match = 0.0

    def _compute_pair_based_quantities(self):
        """Tính matched/remaining dựa trên transaction.matched.orders theo vai trò của lệnh.
        - Nếu lệnh là BUY/PURCHASE: chỉ cộng các bản ghi có buy_order_id = id.
        - Nếu lệnh là SELL: chỉ cộng các bản ghi có sell_order_id = id.
        """
        Matched = self.env['transaction.matched.orders'].sudo()
        for rec in self:
            try:
                if not rec.id:
                    rec.pair_matched_units = 0.0
                    rec.pair_remaining_units = rec.units or 0.0
                    continue
                units_total = float(rec.units or 0.0)
                if rec.transaction_type in ('buy', 'purchase'):
                    domain = [('buy_order_id', '=', rec.id), ('status', 'in', ['confirmed', 'done'])]
                elif rec.transaction_type == 'sell':
                    domain = [('sell_order_id', '=', rec.id), ('status', 'in', ['confirmed', 'done'])]
                else:
                    domain = [('id', '=', 0)]
                # Tổng matched theo vai trò
                total = sum(Matched.search(domain).mapped('matched_quantity'))
                rec.pair_matched_units = min(float(total or 0.0), units_total)
                rec.pair_remaining_units = max(units_total - rec.pair_matched_units, 0.0)
            except Exception:
                rec.pair_matched_units = 0.0
                rec.pair_remaining_units = float(rec.units or 0.0)

    def _compute_is_partial_pair(self):
        for rec in self:
            try:
                rec.is_partial_pair = (rec.status == 'pending' and rec.pair_matched_units > 0 and rec.pair_remaining_units > 0)
            except Exception:
                rec.is_partial_pair = False

    def _search_is_partial_pair(self, operator, value):
        """Custom search cho is_partial_pair dựa trên bảng matched orders.
        Hỗ trợ tìm True/False.
        """
        if operator not in ('=', '=='):
            # Không hỗ trợ toán tử khác
            return [('id', 'in', [])]
        want_true = bool(value)
        cr = self.env.cr
        try:
            cr.execute(
                """
                SELECT t.id
                FROM portfolio_transaction t
                JOIN (
                    SELECT buy_order_id AS tx_id, SUM(matched_quantity) AS qty FROM transaction_matched_orders
                    WHERE status IN ('confirmed','done') AND buy_order_id IS NOT NULL
                    GROUP BY buy_order_id
                    UNION ALL
                    SELECT sell_order_id AS tx_id, SUM(matched_quantity) AS qty FROM transaction_matched_orders
                    WHERE status IN ('confirmed','done') AND sell_order_id IS NOT NULL
                    GROUP BY sell_order_id
                ) m ON m.tx_id = t.id
                GROUP BY t.id, t.status, t.units
                HAVING t.status = 'pending' AND SUM(m.qty) > 0 AND SUM(m.qty) < COALESCE(t.units, 0)
                """
            )
            ids = [row[0] for row in cr.fetchall()]
        except Exception:
            ids = []
        if want_true:
            return [('id', 'in', ids)]
        # False: lấy các bản ghi không thuộc danh sách trên
        return [('id', 'not in', ids)]

    # Computed field để hiển thị số lượng matched orders
    matched_orders_count = fields.Integer(
        string="Số lần khớp lệnh",
        compute='_compute_matched_orders_count',
        store=False,
        help="Số lượng lần khớp lệnh"
    )

    @api.depends('matched_order_ids', 'matched_sell_order_ids', 'transaction_type')
    def _compute_matched_orders_count(self):
        """Tính số lượng matched orders"""
        for record in self:
            if record.transaction_type in ['buy', 'purchase']:
                record.matched_orders_count = len(record.matched_order_ids)
            elif record.transaction_type == 'sell':
                record.matched_orders_count = len(record.matched_sell_order_ids)
            else:
                record.matched_orders_count = 0

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_account_number(self):
        """Compute account number from status_info"""
        for record in self:
            try:
                if record.user_id and record.user_id.partner_id:
                    # Check if status.info model exists
                    if 'status.info' in self.env:
                        status_info = self.env['status.info'].sudo().search([('partner_id', '=', record.user_id.partner_id.id)], limit=1)
                        record.account_number = status_info.so_tk if status_info and status_info.so_tk else ''
                    else:
                        record.account_number = ''
                else:
                    record.account_number = ''
            except Exception as e:
                record.account_number = ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_investor_name(self):
        """Compute investor name"""
        for record in self:
            try:
                if record.user_id and record.user_id.partner_id:
                    record.investor_name = record.user_id.partner_id.name or ''
                elif record.user_id:
                    record.investor_name = record.user_id.name or ''
                else:
                    record.investor_name = ''
            except Exception as e:
                record.investor_name = ''

    @api.depends('user_id', 'user_id.partner_id')
    def _compute_investor_phone(self):
        """Compute investor phone"""
        for record in self:
            try:
                if record.user_id and record.user_id.partner_id:
                    record.investor_phone = record.user_id.partner_id.phone or ''
                else:
                    record.investor_phone = ''
            except Exception as e:
                record.investor_phone = ''

    @api.depends('date_end', 'create_date', 'term_months')
    def _compute_maturity_date(self):
        """Tính ngày đáo hạn từ date_end hoặc create_date + term_months"""
        for record in self:
            if not record.term_months or record.term_months <= 0:
                record.maturity_date = False
                continue
            
            # Ưu tiên dùng date_end nếu có, nếu không dùng create_date
            start_date = record.date_end or record.create_date
            
            if not start_date:
                record.maturity_date = False
                continue
            
            # Chuyển sang date nếu là datetime
            if isinstance(start_date, datetime):
                start_date = start_date.date()
            elif hasattr(start_date, 'date'):
                start_date = start_date.date()
            
            # Tính ngày đáo hạn: start_date + term_months (30 ngày/tháng)
            try:
                from datetime import timedelta
                days_to_add = record.term_months * 30
                record.maturity_date = start_date + timedelta(days=days_to_add)
            except Exception:
                record.maturity_date = False

    @api.depends('maturity_notification_ids')
    def _compute_maturity_notification_count(self):
        """Đếm số thông báo đáo hạn"""
        for record in self:
            record.maturity_notification_count = len(record.maturity_notification_ids)

    @api.onchange('status')
    def _onchange_status(self):
        """Auto update approved_by and approved_at when status changes to completed"""
        for record in self:
            if record.status == 'completed' and not record.approved_by:
                record.approved_by = self.env.user
                record.approved_at = fields.Datetime.now()

    def write(self, vals):
        """Override write to handle status change (không xử lý Investment tại đây)."""
        res = super().write(vals)
        
        for record in self:
            if 'status' in vals and vals['status'] == 'completed' and record.status == 'completed':
                # Auto set approved_by and approved_at if not provided
                if not record.approved_by:
                    record.approved_by = self.env.user
                if not record.approved_at:
                    record.approved_at = fields.Datetime.now()
                # Set date_end = thời điểm khớp/hoàn tất nếu chưa có
                if not getattr(record, 'date_end', False):
                    try:
                        record.date_end = fields.Datetime.now()
                    except Exception:
                        pass

                # Không cập nhật Investment ở transaction_list; ủy quyền cho fund_management

                # Try to match orders when status changes to completed
                if record.transaction_type in ['buy', 'sell'] and not record.is_matched:
                    self.with_context(bypass_match_check=True).action_match_orders()
        
        return res

    def action_approve(self):
        """Custom approve action for transaction list (không xử lý Investment)."""
        for record in self:
            if record.status != 'pending':
                raise ValidationError(_("Only pending transactions can be approved."))
            record.status = 'completed'
            record.approved_by = self.env.user
            record.approved_at = fields.Datetime.now()
            # Set date_end tại thời điểm phê duyệt (coi như khớp)
            try:
                record.date_end = fields.Datetime.now()
            except Exception:
                pass

    def action_close_partial(self):
        """Đóng phần còn lại của lệnh khớp một phần: đặt remaining_units = 0 và chuyển completed.
        Dùng khi cần kết thúc lệnh để tránh tồn đọng trong quy trình khớp liên tục."""
        for record in self.sudo():
            # Chỉ áp dụng cho lệnh đang pending và đã khớp một phần
            remaining = float(getattr(record, 'remaining_units', 0.0) or 0.0)
            matched = float(getattr(record, 'matched_units', 0.0) or 0.0)
            if record.status != 'pending' or matched <= 0 or remaining <= 0:
                raise ValidationError(_("Chỉ có thể đóng lệnh đang khớp một phần (pending, matched > 0, remaining > 0)."))

            vals = {
                'status': 'completed',
                'approved_by': self.env.user,
                'approved_at': fields.Datetime.now(),
            }
            # Nếu field remaining_units tồn tại, đưa về 0
            if 'remaining_units' in record._fields:
                vals['remaining_units'] = 0.0

            # Bỏ cập nhật Investment phía fund_management (tránh duplicate)
            record.with_context(bypass_investment_update=True).write(vals)

        return True

    def action_cancel_list(self):
        """Custom cancel action for transaction list (không xử lý Investment)."""
        for record in self:
            record.status = 'cancelled'

    # ===================== Investment helpers (deprecated) =====================
    def _get_effective_matched_units(self):
        """Xác định số CCQ hiệu lực để cập nhật investment"""
        self.ensure_one()
        matched = float(getattr(self, 'matched_units', 0) or 0)
        if matched > 0:
            return matched
        units = float(getattr(self, 'units', 0) or 0)
        return max(units, 0.0)

    def action_match_orders(self):
        """Deprecated: Logic khớp lệnh đã được chuyển sang OrderMatchingEngine trong controller"""
        _logger.warning("action_match_orders is deprecated. Use OrderMatchingEngine in controller instead.")
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _("Information"),
                'message': _("Order matching is now handled by the OrderMatchingEngine. Please use the API endpoint."),
                'sticky': False,
                'type': 'info',
            }
        }

    @api.model
    def get_transaction_data(self, status_filter=None, source_filter=None):
        """Get transaction data for the frontend"""
        domain = []
        
        
        if status_filter and status_filter.strip():
            status_filter = status_filter.lower().strip()
            # Map status from frontend to database
            frontend_to_db_mapping = {
                'pending': ['pending'],
                'completed': ['completed'],
                'approved': ['completed'],  # Approved tab should show completed transactions
                'cancelled': ['cancelled']
            }
            
            mapped_statuses = frontend_to_db_mapping.get(status_filter, [status_filter])
            if len(mapped_statuses) == 1:
                domain.append(('status', '=', mapped_statuses[0]))
            else:
                domain.append(('status', 'in', mapped_statuses))
            
        
        if source_filter and source_filter.strip():
            domain.append(('source', '=', source_filter))
        
        transactions = self.search(domain)
        
        result = []
        for trans in transactions:
            def _amount_ex_fee(tx):
                try:
                    fee_val = getattr(tx, 'fee', 0) or 0
                    amt_val = tx.amount or 0
                    return max(amt_val - fee_val, 0)
                except Exception:
                    return tx.amount or 0
            # Kiểm tra xem có hợp đồng không
            has_contract = bool(trans.contract_pdf_path)
            contract_url = ''
            contract_download_url = ''
            if has_contract:
                contract_url = f"/transaction-list/contract/{trans.id}"
                contract_download_url = f"/transaction-list/contract/{trans.id}?download=1"
            
            # Map status trước khi thêm vào result
            frontend_status = trans.status  # Use status as-is since mapping is in domain already
            
            result.append({
                'id': trans.id,
                'name': trans.name,
                'user_id': trans.user_id.id,
                'account_number': trans.account_number or '',
                'investor_name': trans.investor_name or '',
                'investor_phone': trans.investor_phone or '',
                'fund_id': trans.fund_id.id if trans.fund_id else None,
                'fund_name': trans.fund_id.name if trans.fund_id else '',
                'fund_ticker': trans.fund_id.ticker if trans.fund_id else '',
                'transaction_code': trans.reference or '',
                'transaction_type': trans.transaction_type,
                'target_fund': trans.destination_fund_id.name if trans.destination_fund_id else '',
                'target_fund_ticker': trans.destination_fund_id.ticker if trans.destination_fund_id else '',
                'units': trans.units,
                'price': trans.price if hasattr(trans, 'price') and trans.price else 0.0,
                'destination_units': trans.destination_units or 0,
                'amount': _amount_ex_fee(trans),
                'calculated_amount': _amount_ex_fee(trans),
                # Giá đơn vị: ưu tiên price (giá giao dịch), fallback current_nav/fund.current_nav
                'current_nav': trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0)),
                'unit_price': (trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0))),
                'matched_units': trans.matched_units if hasattr(trans, 'matched_units') and trans.matched_units else 0,  # Số lượng CCQ đã khớp
                'ccq_remaining_to_match': trans.ccq_remaining_to_match if hasattr(trans, 'ccq_remaining_to_match') else 0,  # CCQ còn lại cần khớp
                'currency': trans.currency_id.symbol if trans.currency_id else '',
                'status': frontend_status,
                'original_status': trans.status,  # Thêm trường này để debug
                'source': trans.source,
                'investment_type': trans.investment_type,
                'created_at': (trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(trans, 'created_at') and trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else '')),
                'date_end': (trans.date_end.strftime('%Y-%m-%d %H:%M:%S') if hasattr(trans, 'date_end') and trans.date_end else ''),
                # transaction_date: Ưu tiên date_end (thời gian khớp), nếu không có thì dùng created_at (thời gian vào)
                'transaction_date': (trans.date_end.strftime('%Y-%m-%d') if hasattr(trans, 'date_end') and trans.date_end else (trans.created_at.strftime('%Y-%m-%d') if hasattr(trans, 'created_at') and trans.created_at else (trans.create_date.strftime('%Y-%m-%d') if trans.create_date else ''))),
                # Thời gian vào/ra để frontend hiển thị In/Out
                # first_in_time và in_time: Dùng created_at (thời gian vào lệnh)
                'first_in_time': (trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(trans, 'created_at') and trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else '')),
                'in_time': (trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(trans, 'created_at') and trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else '')),
                # out_time: Dùng date_end (thời gian khớp lệnh)
                'out_time': (trans.date_end.strftime('%Y-%m-%d %H:%M:%S') if hasattr(trans, 'date_end') and trans.date_end else ''),
                'approved_by': trans.approved_by.name if trans.approved_by else '',
                'approved_at': trans.approved_at.strftime('%Y-%m-%d %H:%M:%S') if trans.approved_at else '',
                'description': trans.description or '',
                'has_contract': has_contract,
                'contract_url': contract_url,
                'contract_download_url': contract_download_url,
            })
        
        return result

    def _map_status_to_frontend(self, status):
        """Map status to frontend format"""
        if not status:
            return ''
        # Chuẩn hóa status về lowercase
        status = status.lower()
        # Map status từ database sang frontend
        status_mapping = {
            'pending': 'pending',
            'completed': 'completed',
            'approved': 'completed',
            'cancelled': 'cancelled'
        }
        mapped_status = status_mapping.get(status, status)
        return mapped_status

    @api.model
    def get_transaction_stats(self):
        """Get transaction statistics"""
        total_pending = self.search_count([('status', '=', 'pending')])
        total_approved = self.search_count([('status', '=', 'completed')])
        total_cancelled = self.search_count([('status', '=', 'cancelled')])
        
        portal_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'portal')])
        sale_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'sale')])
        portfolio_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'portfolio')])
        
        return {
            'total_pending': total_pending,
            'total_approved': total_approved,
            'total_cancelled': total_cancelled,
            'portal_pending': portal_pending,
            'sale_pending': sale_pending,
            'portfolio_pending': portfolio_pending,
            'portfolio_approved': total_approved,
            'portfolio_cancelled': total_cancelled,
            'list_total': total_pending + total_approved + total_cancelled,
            'portfolio_total': total_pending + total_approved + total_cancelled,
        }

    @api.model
    def get_matched_orders(self, transaction_id=None):
        """Get matched orders information - simplified version"""
        domain = []
        if transaction_id:
            domain = ['|', 
                ('buy_order_id', '=', transaction_id),
                ('sell_order_id', '=', transaction_id)
            ]
        
        MatchedOrders = self.env['transaction.matched.orders']
        matched_orders = MatchedOrders.search(domain, order='match_date desc')
        
        result = []
        for match in matched_orders:
            result.append({
                'id': match.id,
                'reference': match.name,
                'match_date': match.match_date.strftime('%Y-%m-%d %H:%M:%S') if match.match_date else '',
                'status': match.status,
                'matched_quantity': match.matched_quantity,
                'matched_price': match.matched_price,
                'total_value': match.total_value,
            })
        
        return result




    # ===================== Investment helpers (deprecated) =====================
    def _get_effective_matched_units(self):

        """Xác định số CCQ hiệu lực để cập nhật investment"""
        self.ensure_one()

        matched = float(getattr(self, 'matched_units', 0) or 0)

        if matched > 0:

            return matched

        units = float(getattr(self, 'units', 0) or 0)

        return max(units, 0.0)



    def action_match_orders(self):
        """Deprecated: Logic khớp lệnh đã được chuyển sang OrderMatchingEngine trong controller"""
        _logger.warning("action_match_orders is deprecated. Use OrderMatchingEngine in controller instead.")
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _("Information"),
                'message': _("Order matching is now handled by the OrderMatchingEngine. Please use the API endpoint."),
                'sticky': False,
                'type': 'info',
            }
        }



    @api.model

    def get_transaction_data(self, status_filter=None, source_filter=None):

        """Get transaction data for the frontend"""

        domain = []

        


        

        if status_filter and status_filter.strip():

            status_filter = status_filter.lower().strip()

            # Map status from frontend to database

            frontend_to_db_mapping = {

                'pending': ['pending'],

                'completed': ['completed'],

                'approved': ['completed'],  # Approved tab should show completed transactions

                'cancelled': ['cancelled']

            }

            

            mapped_statuses = frontend_to_db_mapping.get(status_filter, [status_filter])

            if len(mapped_statuses) == 1:

                domain.append(('status', '=', mapped_statuses[0]))

            else:

                domain.append(('status', 'in', mapped_statuses))

            


        

        if source_filter and source_filter.strip():

            domain.append(('source', '=', source_filter))


        

        transactions = self.search(domain)

        

        result = []

        for trans in transactions:

            def _amount_ex_fee(tx):

                try:

                    fee_val = getattr(tx, 'fee', 0) or 0

                    amt_val = tx.amount or 0

                    return max(amt_val - fee_val, 0)

                except Exception:

                    return tx.amount or 0

            # Kiểm tra xem có hợp đồng không

            has_contract = bool(trans.contract_pdf_path)

            contract_url = ''

            contract_download_url = ''

            if has_contract:

                contract_url = f"/transaction-list/contract/{trans.id}"

                contract_download_url = f"/transaction-list/contract/{trans.id}?download=1"

            

            # Map status trước khi thêm vào result

            frontend_status = trans.status  # Use status as-is since mapping is in domain already


            

            result.append({

                'id': trans.id,

                'name': trans.name,

                'user_id': trans.user_id.id,

                'account_number': trans.account_number or '',

                'investor_name': trans.investor_name or '',

                'investor_phone': trans.investor_phone or '',

                'fund_id': trans.fund_id.id if trans.fund_id else None,

                'fund_name': trans.fund_id.name if trans.fund_id else '',

                'fund_ticker': trans.fund_id.ticker if trans.fund_id else '',

                'transaction_code': trans.reference or '',

                'transaction_type': trans.transaction_type,

                'target_fund': trans.destination_fund_id.name if trans.destination_fund_id else '',

                'target_fund_ticker': trans.destination_fund_id.ticker if trans.destination_fund_id else '',

                'units': trans.units,

                'price': trans.price if hasattr(trans, 'price') and trans.price else 0.0,

                'destination_units': trans.destination_units or 0,

                'amount': _amount_ex_fee(trans),

                'calculated_amount': _amount_ex_fee(trans),

                # Giá đơn vị: ưu tiên price (giá giao dịch), fallback current_nav/fund.current_nav

                'current_nav': trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0)),

                'unit_price': (trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0))),

                'matched_units': trans.matched_units if hasattr(trans, 'matched_units') and trans.matched_units else 0,  # Số lượng CCQ đã khớp

                'ccq_remaining_to_match': trans.ccq_remaining_to_match if hasattr(trans, 'ccq_remaining_to_match') else 0,  # CCQ còn lại cần khớp

                'currency': trans.currency_id.symbol if trans.currency_id else '',

                'status': frontend_status,

                'original_status': trans.status,  # Thêm trường này để debug

                'source': trans.source,

                'investment_type': trans.investment_type,

                'created_at': trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else ''),

                'transaction_date': (trans.date_end.strftime('%Y-%m-%d') if hasattr(trans, 'date_end') and trans.date_end else (trans.created_at.strftime('%Y-%m-%d') if hasattr(trans, 'created_at') and trans.created_at else (trans.create_date.strftime('%Y-%m-%d') if trans.create_date else ''))),

                # Thời gian vào/ra để frontend hiển thị In/Out

                'first_in_time': trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else ''),

                'in_time': trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else ''),

                'out_time': trans.approved_at.strftime('%Y-%m-%d %H:%M:%S') if trans.approved_at else '',

                'approved_by': trans.approved_by.name if trans.approved_by else '',

                'approved_at': trans.approved_at.strftime('%Y-%m-%d %H:%M:%S') if trans.approved_at else '',

                'description': trans.description or '',

                'has_contract': has_contract,

                'contract_url': contract_url,

                'contract_download_url': contract_download_url,

            })

        

        return result



    def _map_status_to_frontend(self, status):

        """Map status to frontend format"""

        if not status:

            return ''

        # Chuẩn hóa status về lowercase

        status = status.lower()

        # Map status từ database sang frontend

        status_mapping = {

            'pending': 'pending',

            'completed': 'completed',

            'approved': 'completed',

            'cancelled': 'cancelled'

        }

        mapped_status = status_mapping.get(status, status)


        return mapped_status



    @api.model

    def get_transaction_stats(self):

        """Get transaction statistics"""

        total_pending = self.search_count([('status', '=', 'pending')])

        total_approved = self.search_count([('status', '=', 'completed')])

        total_cancelled = self.search_count([('status', '=', 'cancelled')])

        

        portal_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'portal')])

        sale_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'sale')])

        portfolio_pending = self.search_count([('status', '=', 'pending'), ('source', '=', 'portfolio')])

        

        return {

            'total_pending': total_pending,

            'total_approved': total_approved,

            'total_cancelled': total_cancelled,

            'portal_pending': portal_pending,

            'sale_pending': sale_pending,

            'portfolio_pending': portfolio_pending,

            'portfolio_approved': total_approved,

            'portfolio_cancelled': total_cancelled,

            'list_total': total_pending + total_approved + total_cancelled,

            'portfolio_total': total_pending + total_approved + total_cancelled,

        }



    @api.model

    def get_matched_orders(self, transaction_id=None):

        """Get matched orders information - simplified version"""
        domain = []

        if transaction_id:

            domain = ['|', 

                ('buy_order_id', '=', transaction_id),

                ('sell_order_id', '=', transaction_id)

            ]

        

        MatchedOrders = self.env['transaction.matched.orders']

        matched_orders = MatchedOrders.search(domain, order='match_date desc')

        

        result = []

        for match in matched_orders:

            result.append({

                'id': match.id,

                'reference': match.name,

                'match_date': match.match_date.strftime('%Y-%m-%d %H:%M:%S') if match.match_date else '',

                'status': match.status,

                'matched_quantity': match.matched_quantity,

                'matched_price': match.matched_price,

                'total_value': match.total_value,

            })

        

        return result




