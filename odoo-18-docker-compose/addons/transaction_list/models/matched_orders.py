from odoo import models, fields, api

class MatchedOrders(models.Model):
    _name = 'transaction.matched.orders'
    _description = 'Matched Buy/Sell Orders'
    _order = 'match_date desc'
    _rec_name = 'name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Reference', readonly=True)
    match_date = fields.Datetime(string='Match Date', default=fields.Datetime.now)
    # Hỗ trợ cả 'purchase' và 'buy' để tương thích dữ liệu cũ
    buy_order_id = fields.Many2one('portfolio.transaction', string='Buy Order', domain=[('transaction_type', 'in', ['purchase', 'buy'])])
    sell_order_id = fields.Many2one('portfolio.transaction', string='Sell Order', domain=[('transaction_type', '=', 'sell')])
    matched_quantity = fields.Float(string='Matched Quantity')
    matched_price = fields.Float(string='Matched Price')
    total_value = fields.Float(string='Total Value', compute='_compute_total_value', store=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft', tracking=True)
    
    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.company)
    active = fields.Boolean(default=True, tracking=True)
    create_uid = fields.Many2one('res.users', string='Created by', readonly=True, default=lambda self: self.env.user)
    match_type = fields.Selection([
        ('investor_investor', 'Investor - Investor'),
        ('investor_market_maker', 'Investor - Market Maker'),
        ('market_maker_market_maker', 'Market Maker - Market Maker')
    ], string='Match Type', compute='_compute_match_type', store=True)
    buy_user_type = fields.Selection([
        ('investor', 'Investor'),
        ('market_maker', 'Market Maker')
    ], string='Buy User Type', compute='_compute_user_types', store=True)
    sell_user_type = fields.Selection([
        ('investor', 'Investor'),
        ('market_maker', 'Market Maker')
    ], string='Sell User Type', compute='_compute_user_types', store=True)
    
    # Add source fields
    buy_source = fields.Selection(related='buy_order_id.source', string='Buy Source', store=True)
    sell_source = fields.Selection(related='sell_order_id.source', string='Sell Source', store=True)

    # Add explicit user fields for clarity in UI/report
    buy_user_id = fields.Many2one(related='buy_order_id.user_id', string='Buy User', store=True)
    sell_user_id = fields.Many2one(related='sell_order_id.user_id', string='Sell User', store=True)

    # Fund info
    fund_id = fields.Many2one(related='buy_order_id.fund_id', string='Fund', store=True)

    # Term and interest rate (per side)
    buy_term_months = fields.Integer(related='buy_order_id.term_months', string='Buy Term (months)', store=True)
    sell_term_months = fields.Integer(related='sell_order_id.term_months', string='Sell Term (months)', store=True)
    buy_interest_rate = fields.Float(related='buy_order_id.interest_rate', string='Buy Interest Rate (%)', store=True)
    sell_interest_rate = fields.Float(related='sell_order_id.interest_rate', string='Sell Interest Rate (%)', store=True)

    # In/Out times per side
    buy_in_time = fields.Datetime(string='Buy In Time', compute='_compute_in_out_times', store=True)
    sell_in_time = fields.Datetime(string='Sell In Time', compute='_compute_in_out_times', store=True)
    # Use stable field available in base transaction model to avoid dependency issues
    buy_out_time = fields.Datetime(related='buy_order_id.date_end', string='Buy Out Time', store=True)
    sell_out_time = fields.Datetime(related='sell_order_id.date_end', string='Sell Out Time', store=True)

    # Additional quantitative fields for UI reporting
    buy_units = fields.Float(related='buy_order_id.units', string='Buy Units', store=True)
    sell_units = fields.Float(related='sell_order_id.units', string='Sell Units', store=True)
    buy_price = fields.Float(related='buy_order_id.current_nav', string='Buy Price', store=True)
    sell_price = fields.Float(related='sell_order_id.current_nav', string='Sell Price', store=True)
    buy_remaining_units = fields.Float(related='buy_order_id.remaining_units', string='Buy Remaining Units', store=True)
    sell_remaining_units = fields.Float(related='sell_order_id.remaining_units', string='Sell Remaining Units', store=True)
    
    # Field để đánh dấu đã gửi lên sàn
    sent_to_exchange = fields.Boolean(string="Đã gửi lên sàn", default=False, tracking=True, help="Cặp lệnh đã được gửi lên sàn thông qua trading.order")
    sent_to_exchange_at = fields.Datetime(string="Thời gian gửi lên sàn", help="Thời điểm cặp lệnh được gửi lên sàn")

    @api.depends('buy_order_id.user_id', 'sell_order_id.user_id', 'buy_source', 'sell_source')
    def _compute_user_types(self):
        for record in self:
            # Default to investor
            record.buy_user_type = 'investor'
            record.sell_user_type = 'investor'

            def is_market_maker(user, source):
                try:
                    # Internal User in Odoo
                    if user and user.has_group('base.group_user'):
                        return True
                except Exception:
                    pass
                # Fallback theo nguồn: chỉ 'sale' coi là MM
                return (source == 'sale')

            # Determine buy side
            if record.buy_order_id:
                record.buy_user_type = 'market_maker' if is_market_maker(record.buy_order_id.user_id, record.buy_source) else 'investor'

            # Determine sell side
            if record.sell_order_id:
                record.sell_user_type = 'market_maker' if is_market_maker(record.sell_order_id.user_id, record.sell_source) else 'investor'

    @api.depends('buy_user_type', 'sell_user_type')
    def _compute_match_type(self):
        for record in self:
            if record.buy_user_type == 'investor' and record.sell_user_type == 'investor':
                record.match_type = 'investor_investor'
            elif record.buy_user_type == 'market_maker' and record.sell_user_type == 'market_maker':
                record.match_type = 'market_maker_market_maker'
            else:
                record.match_type = 'investor_market_maker'

    @api.depends('matched_quantity', 'matched_price')
    def _compute_total_value(self):
        for record in self:
            record.total_value = record.matched_quantity * record.matched_price

    @api.depends('buy_order_id.create_date', 'sell_order_id.create_date')
    def _compute_in_out_times(self):
        for record in self:
            # Prefer explicit created_at if exists, fallback to create_date
            try:
                buy_created_at = getattr(record.buy_order_id, 'created_at', False)
            except Exception:
                buy_created_at = False
            try:
                sell_created_at = getattr(record.sell_order_id, 'created_at', False)
            except Exception:
                sell_created_at = False

            record.buy_in_time = buy_created_at or record.buy_order_id.create_date or False
            record.sell_in_time = sell_created_at or record.sell_order_id.create_date or False
            
    def update_transaction_statuses(self):
        """Deprecated: Transaction status updates are now handled by OrderMatchingEngine"""
        pass

    @api.model_create_multi
    def create(self, vals_list):
        import logging
        _logger = logging.getLogger(__name__)
        
        # Generate names for records that don't have them
        for vals in vals_list:
            if not vals.get('name'):
                # Generate reference number using sequence
                try:
                    sequence = self.env['ir.sequence'].next_by_code('transaction.matched.orders')
                    if sequence:
                        vals['name'] = sequence
                    else:
                        # Fallback if sequence not found
                        today = fields.Date.today()
                        vals['name'] = f"MATCH/{today.strftime('%Y%m%d')}/NEW"
                except Exception as e:
                    _logger.warning(f"Could not generate sequence for matched order: {e}")
                    today = fields.Date.today()
                    vals['name'] = f"MATCH/{today.strftime('%Y%m%d')}/FALLBACK"

        try:
            # Create the records
            records = super().create(vals_list)
            _logger.info(f"Created {len(records)} matched orders")

            # Note: We don't update transaction units here anymore
            # This is now handled in the action_match_orders method
            # to avoid double updates and conflicts

            # Trigger recompute stats cho engines
            self._trigger_engine_stats_recompute()
            return records

        except Exception as e:
            _logger.error(f"Error creating matched order: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def write(self, vals):
        result = super(MatchedOrders, self).write(vals)
        # Trigger recompute stats cho engines
        self._trigger_engine_stats_recompute()
        return result

    def unlink(self):
        result = super(MatchedOrders, self).unlink()
        # Trigger recompute stats cho engines
        self._trigger_engine_stats_recompute()
        return result

    @api.model
    def _trigger_engine_stats_recompute(self):
        """Trigger recompute stats cho engines khi có thay đổi matched orders"""
        try:
            engine_model = self.env['transaction.partial.matching.engine']
            if hasattr(engine_model, '_trigger_recompute_stats'):
                engine_model._trigger_recompute_stats()
        except Exception:
            # Ignore errors để không ảnh hưởng đến chức năng chính
            pass

    def get_remaining_orders_summary(self):
        """Lấy tổng kết các lệnh còn lại - simplified version"""
        try:
            pending_buys = self.env['portfolio.transaction'].search([
                ('transaction_type', 'in', ['buy', 'purchase']),
                ('status', '=', 'completed'),
                ('ccq_remaining_to_match', '>', 0)
            ])
            
            pending_sells = self.env['portfolio.transaction'].search([
                ('transaction_type', '=', 'sell'),
                ('status', '=', 'completed'),
                ('ccq_remaining_to_match', '>', 0)
            ])
            
            return {
                'success': True,
                'buy_orders_count': len(pending_buys),
                'sell_orders_count': len(pending_sells),
                'total_buy_remaining': sum(b.ccq_remaining_to_match for b in pending_buys),
                'total_sell_remaining': sum(s.ccq_remaining_to_match for s in pending_sells)
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    # Lưu ý: _compute_total_value đã được định nghĩa phía trên (tránh duplicate)