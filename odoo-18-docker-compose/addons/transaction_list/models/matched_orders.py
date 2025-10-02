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
    buy_out_time = fields.Datetime(related='buy_order_id.approved_at', string='Buy Out Time', store=True)
    sell_out_time = fields.Datetime(related='sell_order_id.approved_at', string='Sell Out Time', store=True)

    # Additional quantitative fields for UI reporting
    buy_units = fields.Float(related='buy_order_id.units', string='Buy Units', store=True)
    sell_units = fields.Float(related='sell_order_id.units', string='Sell Units', store=True)
    buy_price = fields.Float(related='buy_order_id.current_nav', string='Buy Price', store=True)
    sell_price = fields.Float(related='sell_order_id.current_nav', string='Sell Price', store=True)
    buy_remaining_units = fields.Float(related='buy_order_id.remaining_units', string='Buy Remaining Units', store=True)
    sell_remaining_units = fields.Float(related='sell_order_id.remaining_units', string='Sell Remaining Units', store=True)

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
        """Update the related transaction statuses after matching"""
        for record in self:
            # Update buy order
            if record.buy_order_id:
                buy_order = record.buy_order_id
                buy_matched = buy_order.matched_units + record.matched_quantity
                buy_remaining = buy_order.units - buy_matched
                buy_order.write({
                    'matched_units': buy_matched,
                    'remaining_units': buy_remaining,
                    'is_matched': buy_remaining <= 0
                })

            # Update sell order
            if record.sell_order_id:
                sell_order = record.sell_order_id
                sell_matched = sell_order.matched_units + record.matched_quantity
                sell_remaining = sell_order.units - sell_matched
                sell_order.write({
                    'matched_units': sell_matched,
                    'remaining_units': sell_remaining,
                    'is_matched': sell_remaining <= 0
                })

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

            return records

        except Exception as e:
            _logger.error(f"Error creating matched order: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def check_and_continue_matching(self):
        """Kiểm tra và tiếp tục khớp các lệnh còn lại sau khi tạo matched order"""
        try:
            # Lấy tất cả lệnh pending còn remaining_units > 0
            pending_buys = self.env['portfolio.transaction'].search([
                ('transaction_type', '=', 'purchase'),
                ('status', '=', 'pending'),
                ('remaining_units', '>', 0)
            ])
            
            pending_sells = self.env['portfolio.transaction'].search([
                ('transaction_type', '=', 'sell'),
                ('status', '=', 'pending'),
                ('remaining_units', '>', 0)
            ])
            
            print(f"[DEBUG] Found {len(pending_buys)} pending buys and {len(pending_sells)} pending sells")
            
            if not pending_buys or not pending_sells:
                return {'success': True, 'message': 'No pending orders to match'}
            
            # Gọi engine khớp lệnh để tiếp tục khớp
            from ..controller.fund_calc_integration_controller import OrderMatchingEngine
            engine = OrderMatchingEngine(self.env)
            
            # Khớp lệnh với các lệnh còn lại
            result = engine.match_orders(pending_buys, pending_sells, use_time_priority=False)
            
            if result.get('matched_pairs'):
                print(f"[DEBUG] Found {len(result['matched_pairs'])} additional matches")
                
                # Tạo các matched orders mới
                for pair in result['matched_pairs']:
                    self.create({
                        'buy_order_id': pair['buy_id'],
                        'sell_order_id': pair['sell_id'],
                        'matched_quantity': pair['matched_ccq'],
                        'matched_price': pair['matched_price'],
                        'status': 'confirmed'
                    })
                
                return {
                    'success': True, 
                    'message': f'Created {len(result["matched_pairs"])} additional matches',
                    'matched_pairs': result['matched_pairs']
                }
            else:
                return {'success': True, 'message': 'No additional matches found'}
                
        except Exception as e:
            print(f"[ERROR] Error in check_and_continue_matching: {str(e)}")
            return {'success': False, 'message': str(e)}

    def fix_remaining_units_calculation(self):
        """Sửa lại tính toán remaining_units cho tất cả lệnh pending"""
        try:
            # Lấy tất cả lệnh pending
            pending_orders = self.env['portfolio.transaction'].search([
                ('status', '=', 'pending')
            ])
            
            fixed_count = 0
            for order in pending_orders:
                # Tính lại remaining_units dựa trên units và matched_units
                total_units = order.units or 0
                matched_units = order.matched_units or 0
                calculated_remaining = max(0, total_units - matched_units)
                
                # Kiểm tra tính hợp lệ
                if matched_units > total_units:
                    print(f"[ERROR] Order {order.id}: matched_units ({matched_units}) > total_units ({total_units})")
                    # Sửa lỗi: đặt matched_units = total_units
                    matched_units = total_units
                    calculated_remaining = 0
                
                # Nếu khác với giá trị hiện tại, cập nhật
                if order.remaining_units != calculated_remaining:
                    order.sudo().write({
                        'matched_units': matched_units,
                        'remaining_units': calculated_remaining,
                        'is_matched': calculated_remaining <= 0
                    })
                    fixed_count += 1
                    print(f"[DEBUG] Fixed order {order.id}: matched={matched_units}, remaining={calculated_remaining}")
            
            return {
                'success': True,
                'message': f'Fixed {fixed_count} orders',
                'fixed_count': fixed_count
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def validate_order_data_integrity(self):
        """Kiểm tra tính hợp lệ của dữ liệu lệnh"""
        try:
            # Lấy tất cả lệnh pending
            pending_orders = self.env['portfolio.transaction'].search([
                ('status', '=', 'pending')
            ])
            
            errors = []
            for order in pending_orders:
                total_units = order.units or 0
                matched_units = order.matched_units or 0
                remaining_units = order.remaining_units or 0
                
                # Kiểm tra các điều kiện
                if matched_units > total_units:
                    errors.append(f"Order {order.id}: matched_units ({matched_units}) > total_units ({total_units})")
                
                if remaining_units != (total_units - matched_units):
                    errors.append(f"Order {order.id}: remaining_units ({remaining_units}) != total_units - matched_units ({total_units - matched_units})")
                
                if matched_units + remaining_units != total_units:
                    errors.append(f"Order {order.id}: matched_units + remaining_units ({matched_units + remaining_units}) != total_units ({total_units})")
            
            return {
                'success': True,
                'errors': errors,
                'error_count': len(errors),
                'total_orders': len(pending_orders)
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def get_remaining_orders_summary(self):
        """Lấy tổng kết các lệnh còn lại"""
        try:
            pending_buys = self.env['portfolio.transaction'].search([
                ('transaction_type', '=', 'purchase'),
                ('status', '=', 'pending'),
                ('remaining_units', '>', 0)
            ])
            
            pending_sells = self.env['portfolio.transaction'].search([
                ('transaction_type', '=', 'sell'),
                ('status', '=', 'pending'),
                ('remaining_units', '>', 0)
            ])
            
            buy_summary = []
            for buy in pending_buys:
                buy_summary.append({
                    'id': buy.id,
                    'fund_name': buy.fund_id.name if buy.fund_id else '',
                    'remaining_units': buy.remaining_units,
                    'total_units': buy.units,
                    'matched_units': buy.matched_units,
                    'price': buy.current_nav
                })
            
            sell_summary = []
            for sell in pending_sells:
                sell_summary.append({
                    'id': sell.id,
                    'fund_name': sell.fund_id.name if sell.fund_id else '',
                    'remaining_units': sell.remaining_units,
                    'total_units': sell.units,
                    'matched_units': sell.matched_units,
                    'price': sell.current_nav
                })
            
            return {
                'success': True,
                'buy_orders': buy_summary,
                'sell_orders': sell_summary,
                'total_buy_remaining': sum(b['remaining_units'] for b in buy_summary),
                'total_sell_remaining': sum(s['remaining_units'] for s in sell_summary)
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    # Lưu ý: _compute_total_value đã được định nghĩa phía trên (tránh duplicate)