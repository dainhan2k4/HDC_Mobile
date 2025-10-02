from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import json
import logging
from datetime import datetime

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

    # Bổ sung trường kỳ hạn/lãi suất để đồng bộ fund_management
    term_months = fields.Integer(string="Kỳ hạn (tháng)")
    interest_rate = fields.Float(string="Lãi suất (%)", digits=(16, 2))
    
    # Field để lưu trạng thái gửi lên sàn
    sent_to_exchange = fields.Boolean(string="Đã gửi lên sàn", default=False, help="Giao dịch đã được gửi lên sàn")
    sent_to_exchange_at = fields.Datetime(string="Thời gian gửi lên sàn", help="Thời điểm giao dịch được gửi lên sàn")



    units = fields.Float(string="Số lượng", required=True)
    @api.depends('units', 'matched_units')
    def _compute_remaining_units(self):
        for record in self:
            record.remaining_units = max(0, (record.units or 0) - (record.matched_units or 0))


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
                print(f"Error computing account number for transaction {record.id}: {e}")
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
                print(f"Error computing investor name for transaction {record.id}: {e}")
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
                print(f"Error computing investor phone for transaction {record.id}: {e}")
                record.investor_phone = ''

    @api.onchange('status')
    def _onchange_status(self):
        """Auto update approved_by and approved_at when status changes to completed"""
        for record in self:
            if record.status == 'completed' and not record.approved_by:
                record.approved_by = self.env.user
                record.approved_at = fields.Datetime.now()

    def write(self, vals):
        """Override write to handle status change"""
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
                        # ignore if field not present in a particular override
                        pass
                
                # Try to match orders when status changes to completed
                if record.transaction_type in ['buy', 'sell'] and not record.is_matched:
                    self.with_context(bypass_match_check=True).action_match_orders()
        
        return res

    def action_approve(self):
        """Custom approve action for transaction list"""
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
            record._update_investment()

    def action_cancel_list(self):
        """Custom cancel action for transaction list"""
        for record in self:
            if record.status == 'completed':
                record._revert_investment_update()
            record.status = 'cancelled'

    def action_match_orders(self):
        """Khớp lệnh theo Price–Time, hỗ trợ partial fill nhiều đối tác và ghi nhận giá SELL"""
        _logger.info("Starting order matching process...")
        
        if not self.env.context.get('bypass_match_check'):
            current_transaction = self[0] if self else None
        else:
            current_transaction = None

        # Get all approved buy orders with remaining units (hỗ trợ 'buy'/'purchase')
        domain_buy = [
            ('status', '=', 'completed'),
            ('transaction_type', 'in', ['buy', 'purchase']),
            ('remaining_units', '>', 0)
        ]
        if current_transaction and current_transaction.transaction_type in ['buy', 'purchase']:
            domain_buy.append(('id', '=', current_transaction.id))

        buy_orders = self.search(domain_buy, order='create_date asc')
        _logger.info(f"Found {len(buy_orders)} buy orders to match")

        # Get all approved sell orders with remaining units
        domain_sell = [
            ('status', '=', 'completed'),
            ('transaction_type', '=', 'sell'),
            ('remaining_units', '>', 0)
        ]
        if current_transaction and current_transaction.transaction_type == 'sell':
            domain_sell.append(('id', '=', current_transaction.id))

        sell_orders = self.search(domain_sell, order='create_date asc')
        _logger.info(f"Found {len(sell_orders)} sell orders to match")

        if not buy_orders or not sell_orders:
            _logger.warning("No buy or sell orders found for matching")
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Information'),
                    'message': _('No orders found to match'),
                    'sticky': False,
                    'type': 'info',
                }
            }

        MatchedOrders = self.env['transaction.matched.orders'].sudo()
        matched_count = 0
        matched_pairs = []

        try:
            for buy_order in buy_orders:
                if buy_order.remaining_units <= 0:
                    _logger.debug(f"Buy order {buy_order.id} has no remaining units, skipping")
                    continue

                # Find matching sell orders for this buy order
                matching_sell_orders = sell_orders.filtered(
                    lambda x: (x.fund_id.id == buy_order.fund_id.id and 
                             x.remaining_units > 0 and 
                             x.id != buy_order.id)  # Prevent matching with self
                )

                if not matching_sell_orders:
                    _logger.debug(f"No matching sell orders found for buy order {buy_order.id}")
                    continue

                # Sắp xếp SELL theo Price–Time: giá thấp hơn trước, cùng giá thì thời gian sớm trước
                def _price(o):
                    return (o.price or (o.current_nav or (o.fund_id.current_nav if o.fund_id else 0.0)))
                def _ts(o):
                    return getattr(o, 'created_at', False) or getattr(o, 'create_date', None)
                matching_sell_orders = sorted(matching_sell_orders, key=lambda s: (_price(s), _ts(s) or 0))

                _logger.info(f"Processing buy order {buy_order.id} with {len(matching_sell_orders)} potential sell matches")

                for sell_order in matching_sell_orders:
                    try:
                        # Calculate the matching quantity
                        # Điều kiện giá: BUY >= SELL
                        buy_price = buy_order.price or (buy_order.current_nav or (buy_order.fund_id.current_nav if buy_order.fund_id else 0.0))
                        sell_price = sell_order.price or (sell_order.current_nav or (sell_order.fund_id.current_nav if sell_order.fund_id else 0.0))
                        
                        _logger.debug(f"Price check: Buy {buy_price} >= Sell {sell_price}")
                        if buy_price < sell_price:
                            _logger.debug(f"Price condition not met: {buy_price} < {sell_price}")
                            continue

                        match_quantity = min(buy_order.remaining_units, sell_order.remaining_units)
                        
                        if match_quantity <= 0:
                            _logger.debug(f"Match quantity is 0 or negative: {match_quantity}")
                            continue

                        # Giá khớp luôn lấy theo SELL
                        match_price = sell_price

                        _logger.info(f"Creating match: Buy {buy_order.id} ({buy_order.remaining_units}) + Sell {sell_order.id} ({sell_order.remaining_units}) = {match_quantity} @ {match_price}")

                        # Prepare matched order values
                        matched_order_vals = {
                            'buy_order_id': buy_order.id,
                            'sell_order_id': sell_order.id,
                            'matched_quantity': match_quantity,
                            'matched_price': match_price,
                            'status': 'confirmed',
                        }

                        # Create matched order
                        matched_order = MatchedOrders.create(matched_order_vals)
                        _logger.info(f"Created matched order: {matched_order.name}")

                        # Update orders atomically
                        new_buy_matched = buy_order.matched_units + match_quantity
                        new_buy_remaining = buy_order.units - new_buy_matched
                        
                        new_sell_matched = sell_order.matched_units + match_quantity
                        new_sell_remaining = sell_order.units - new_sell_matched

                        buy_update_vals = {
                            'matched_units': new_buy_matched,
                            'remaining_units': new_buy_remaining,
                            'is_matched': new_buy_remaining <= 0
                        }

                        sell_update_vals = {
                            'matched_units': new_sell_matched,
                            'remaining_units': new_sell_remaining,
                            'is_matched': new_sell_remaining <= 0
                        }

                        # Update both orders
                        buy_order.write(buy_update_vals)
                        sell_order.write(sell_update_vals)

                        # Nếu lệnh nào đã khớp hết thì ghi nhận thời điểm khớp vào date_end
                        try:
                            if buy_update_vals.get('is_matched') and not getattr(buy_order, 'date_end', False):
                                buy_order.date_end = fields.Datetime.now()
                            if sell_update_vals.get('is_matched') and not getattr(sell_order, 'date_end', False):
                                sell_order.date_end = fields.Datetime.now()
                        except Exception:
                            pass

                        matched_count += 1
                        matched_pairs.append({
                            'buy_id': buy_order.id,
                            'sell_id': sell_order.id,
                            'quantity': match_quantity,
                            'price': match_price
                        })

                        _logger.info(f"Successfully matched orders: {matched_order.name}")

                        # Nếu SELL đã hết, tiếp tục SELL khác; nếu BUY đã đủ thì sang BUY tiếp theo
                        if sell_update_vals['is_matched']:
                            _logger.debug(f"Sell order {sell_order.id} is fully matched, continuing to next sell order")
                            continue
                        if buy_update_vals['is_matched']:
                            _logger.debug(f"Buy order {buy_order.id} is fully matched, breaking to next buy order")
                            break

                    except Exception as e:
                        _logger.error(f"Error matching orders {buy_order.id} and {sell_order.id}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        continue

        except Exception as e:
            _logger.error(f"Error in matching process: {str(e)}")
            import traceback
            traceback.print_exc()

        _logger.info(f"Matching completed. Created {matched_count} matched orders")

        if matched_count > 0:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Success'),
                    'message': _('%d orders have been matched successfully', matched_count),
                    'sticky': False,
                    'type': 'success',
                }
            }
        else:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Information'),
                    'message': _('No matching orders found'),
                    'sticky': False,
                    'type': 'info',
                }
            }

    @api.model
    def get_transaction_data(self, status_filter=None, source_filter=None):
        """Get transaction data for the frontend"""
        domain = []
        
        print(f"[DEBUG] get_transaction_data called with status_filter: {status_filter}, source_filter: {source_filter}")
        
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
            
            print(f"[DEBUG] Added status filter domain: {domain[-1]}")
            print(f"[DEBUG] Mapped status filter '{status_filter}' to database statuses: {mapped_statuses}")
        
        if source_filter and source_filter.strip():
            domain.append(('source', '=', source_filter))
            print(f"Added source filter: {source_filter}")
        
        print(f"Final domain: {domain}")
        transactions = self.search(domain)
        print(f"Found {len(transactions)} transactions with domain: {domain}")
        
        result = []
        for trans in transactions:
            # Kiểm tra xem có hợp đồng không
            has_contract = bool(trans.contract_pdf_path)
            contract_url = ''
            contract_download_url = ''
            if has_contract:
                contract_url = f"/transaction-list/contract/{trans.id}"
                contract_download_url = f"/transaction-list/contract/{trans.id}?download=1"
            
            # Map status trước khi thêm vào result
            frontend_status = trans.status  # Use status as-is since mapping is in domain already
            print(f"[DEBUG] Transaction {trans.id} status: {trans.status}")
            
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
                'amount': trans.amount,
                'calculated_amount': trans.calculated_amount,
                'current_nav': trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0)),
                'unit_price': trans.price or (trans.current_nav or (trans.fund_id.current_nav if trans.fund_id else 0.0)),  # Ưu tiên price từ transaction
                'matched_units': trans.matched_units if hasattr(trans, 'matched_units') and trans.matched_units else 0,  # Số lượng CCQ đã khớp
                'currency': trans.currency_id.symbol if trans.currency_id else '',
                'status': frontend_status,
                'original_status': trans.status,  # Thêm trường này để debug
                'source': trans.source,
                'investment_type': trans.investment_type,
                'created_at': trans.created_at.strftime('%Y-%m-%d %H:%M:%S') if trans.created_at else (trans.create_date.strftime('%Y-%m-%d %H:%M:%S') if trans.create_date else ''),
                'transaction_date': trans.transaction_date.strftime('%Y-%m-%d') if trans.transaction_date else (trans.created_at.strftime('%Y-%m-%d') if trans.created_at else (trans.create_date.strftime('%Y-%m-%d') if trans.create_date else '')),
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
        print(f"[DEBUG] Mapping status: {status} -> {mapped_status}")
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
        """Get matched orders information"""
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
            buy_order = match.buy_order_id
            sell_order = match.sell_order_id
            
            result.append({
                'id': match.id,
                'reference': match.name,
                'match_date': match.match_date.strftime('%Y-%m-%d %H:%M:%S') if match.match_date else '',
                'status': match.status,
                'match_type': match.match_type,
                'matched_quantity': match.matched_quantity,
                'matched_price': match.matched_price,
                'total_value': match.total_value,
                # Buy order information
                'buy_order': {
                    'id': buy_order.id,
                    'reference': buy_order.reference,
                    'investor_name': buy_order.investor_name,
                    'account_number': buy_order.account_number,
                    'units': buy_order.units,
                    'remaining_units': buy_order.remaining_units,
                    'matched_units': buy_order.matched_units,
                    'source': buy_order.source,
                    'user_type': match.buy_user_type,
                },
                # Sell order information
                'sell_order': {
                    'id': sell_order.id,
                    'reference': sell_order.reference,
                    'investor_name': sell_order.investor_name,
                    'account_number': sell_order.account_number,
                    'units': sell_order.units,
                    'remaining_units': sell_order.remaining_units,
                    'matched_units': sell_order.matched_units,
                    'source': sell_order.source,
                    'user_type': match.sell_user_type,
                },
                # Additional information
                'fund': {
                    'id': buy_order.fund_id.id,
                    'name': buy_order.fund_id.name,
                    'ticker': buy_order.fund_id.ticker,
                    'current_nav': buy_order.price or (buy_order.current_nav or buy_order.fund_id.current_nav),
                },
            })
        
        return result

    @api.model
    def get_matching_summary(self, fund_id=None, date_from=None, date_to=None):
        """Get matching summary statistics"""
        domain = [('status', 'in', ['confirmed', 'done'])]
        if fund_id:
            domain.append(('buy_order_id.fund_id', '=', fund_id))
        if date_from:
            domain.append(('match_date', '>=', date_from))
        if date_to:
            domain.append(('match_date', '<=', date_to))

        MatchedOrders = self.env['transaction.matched.orders']
        matched_orders = MatchedOrders.search(domain)

        summary = {
            'total_matches': len(matched_orders),
            'total_matched_quantity': sum(matched_orders.mapped('matched_quantity')),
            'total_matched_value': sum(matched_orders.mapped('total_value')),
            'match_types': {
                'investor_investor': len(matched_orders.filtered(lambda x: x.match_type == 'investor_investor')),
                'investor_market_maker': len(matched_orders.filtered(lambda x: x.match_type == 'investor_market_maker')),
                'market_maker_market_maker': len(matched_orders.filtered(lambda x: x.match_type == 'market_maker_market_maker')),
            },
            'by_source': {
                'portal': len(matched_orders.filtered(lambda x: x.buy_source == 'portal' or x.sell_source == 'portal')),
                'sale': len(matched_orders.filtered(lambda x: x.buy_source == 'sale' or x.sell_source == 'sale')),
                'portfolio': len(matched_orders.filtered(lambda x: x.buy_source == 'portfolio' or x.sell_source == 'portfolio')),
            }
        }
        
        return summary

