# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from enum import Enum

_logger = logging.getLogger(__name__)


class OrderType(Enum):
    """Loại lệnh giao dịch"""
    BUY = 'buy'
    SELL = 'sell'


class PartialMatchingEngine(models.Model):
    """
    Engine khớp lệnh một phần chính xác theo thuật toán Stock Exchange
    Dựa trên thuật toán từ StockExchangeApp với Priority Queue và FIFO
    """
    _name = 'transaction.partial.matching.engine'
    _description = 'Partial Matching Engine for Stock Exchange'
    _rec_name = 'name'

    name = fields.Char(string='Engine Name', required=True, default='Partial Matching Engine')
    fund_id = fields.Many2one('portfolio.fund', string='Fund', required=True)
    is_active = fields.Boolean(string='Active', default=True)
    
    # Cấu hình engine
    use_time_priority = fields.Boolean(
        string='Use Time Priority (FIFO)', 
        default=True,
        help='Ưu tiên thời gian khi cùng giá'
    )
    min_match_quantity = fields.Float(
        string='Minimum Match Quantity', 
        default=50.0,
        help='Số lượng tối thiểu để khớp lệnh'
    )
    max_partial_matches = fields.Integer(
        string='Max Partial Matches per Order',
        default=10,
        help='Số lần khớp một phần tối đa cho mỗi lệnh'
    )
    
    # Thống kê (tính động dựa trên giao dịch đã khớp)
    total_matches = fields.Integer(
        string='Total Matches',
        compute='_compute_engine_match_stats',
        store=True,
        search='_search_total_matches'
    )
    total_partial_matches = fields.Integer(
        string='Total Partial Matches',
        compute='_compute_engine_match_stats',
        store=True,
        search='_search_total_partial_matches'
    )
    last_match_date = fields.Datetime(
        string='Last Match Date',
        compute='_compute_engine_match_stats',
        store=True,
        search='_search_last_match_date'
    )
    
    # Logs
    match_logs = fields.Text(string='Match Logs', readonly=True)

    def add_order(self, order_record):
        """
        Thêm lệnh vào engine và thực hiện khớp lệnh
        
        Args:
            order_record: portfolio.transaction record
            
        Returns:
            List[Dict]: Danh sách các cặp lệnh đã khớp
        """
        try:
            # Validate order
            if not self._validate_order(order_record):
                return []
            
            # Thêm lệnh vào priority queue
            self._add_to_queue(order_record)
            
            # Thực hiện khớp lệnh
            matched_pairs = self._match_orders()
            
            # Cập nhật thống kê
            self._update_statistics(matched_pairs)
            
            return matched_pairs
            
        except Exception as e:
            _logger.error(f"Error in add_order: {str(e)}")
            return []

    def _validate_order(self, order_record):
        """Validate lệnh trước khi thêm vào engine"""
        if not order_record:
            return False
        
        if order_record.fund_id.id != self.fund_id.id:
            return False
            
        if order_record.status != 'pending':
            return False
            
        if order_record.remaining_units <= 0:
            return False
            
        return True

    def _add_to_queue(self, order_record):
        """Thêm lệnh vào priority queue tương ứng"""
        # Lưu trữ trong database thay vì memory queue
        queue_record = self.env['transaction.order.queue'].create({
            'engine_id': self.id,
            'order_id': order_record.id,
            'order_type': order_record.transaction_type,
            'price': order_record.price or order_record.current_nav,
            'quantity': order_record.remaining_units,
            'priority_score': self._calculate_priority_score(order_record),
            'create_time': order_record.create_date,
            'status': 'pending'
        })
        
        return queue_record

    def _calculate_priority_score(self, order_record):
        """
        Tính điểm ưu tiên theo Price-Time Priority
        Dựa trên thuật toán từ CompanyStockComparator
        """
        price = float(order_record.price or order_record.current_nav or 0)
        create_time = order_record.create_date
        
        # Chuyển đổi thời gian thành số để so sánh (giống CompanyStockComparator)
        time_score = self._time_to_integer(create_time)
        
        if order_record.transaction_type in ['buy', 'purchase']:
            # Buy: Giá cao nhất trước, cùng giá thì thời gian sớm nhất trước
            # Sử dụng công thức: (price * 1000000) - time_score
            return (price * 1000000) - time_score
        else:  # sell
            # Sell: Giá thấp nhất trước, cùng giá thì thời gian sớm nhất trước
            # Sử dụng công thức: (1000000 - price * 1000000) - time_score
            return (1000000 - price * 1000000) - time_score

    def _time_to_integer(self, datetime_obj):
        """
        Chuyển đổi datetime thành integer để so sánh
        Tương tự companyOrderIntegerTime trong Java
        """
        if not datetime_obj:
            return 0
        
        try:
            # Lấy giờ và phút
            hour = datetime_obj.hour
            minute = datetime_obj.minute
            # Chuyển thành phút từ 00:00 (giống Java)
            return hour * 60 + minute
        except Exception:
            return 0

    def _match_orders(self):
        """
        Thực hiện khớp lệnh theo thuật toán Stock Exchange
        Dựa trên CompanyOrderBookModule.match()
        """
        matched_pairs = []
        
        try:
            # Lấy buy orders (sắp xếp theo priority score giảm dần)
            buy_orders = self.env['transaction.order.queue'].search([
                ('engine_id', '=', self.id),
                ('order_type', 'in', ['buy', 'purchase']),
                ('status', '=', 'pending'),
                ('quantity', '>', 0)
            ], order='priority_score desc')
            
            # Lấy sell orders (sắp xếp theo priority score giảm dần)
            sell_orders = self.env['transaction.order.queue'].search([
                ('engine_id', '=', self.id),
                ('order_type', '=', 'sell'),
                ('status', '=', 'pending'),
                ('quantity', '>', 0)
            ], order='priority_score desc')
            
            # Khớp lệnh theo thuật toán
            for buy_queue in buy_orders:
                if buy_queue.quantity <= 0:
                    continue
                    
                for sell_queue in sell_orders:
                    if sell_queue.quantity <= 0:
                        continue
                    
                    # Kiểm tra điều kiện khớp: buy_price >= sell_price
                    if buy_queue.price < sell_queue.price:
                        continue
                    
                    # Kiểm tra không cùng user
                    buy_order = buy_queue.order_id
                    sell_order = sell_queue.order_id
                    if buy_order.user_id.id == sell_order.user_id.id:
                        continue
                    
                    # Tính số lượng khớp
                    matched_quantity = min(buy_queue.quantity, sell_queue.quantity)
                    if matched_quantity < self.min_match_quantity:
                        continue
                    
                    # Tạo cặp khớp
                    pair = self._create_matched_pair(buy_order, sell_order, matched_quantity)
                    matched_pairs.append(pair)
                    
                    # Cập nhật database
                    self._update_transaction_status(buy_order, sell_order, matched_quantity)
                    
                    # Cập nhật queue quantities
                    buy_queue.quantity -= matched_quantity
                    sell_queue.quantity -= matched_quantity
                    
                    # Đánh dấu completed nếu hết
                    if buy_queue.quantity <= 0:
                        buy_queue.status = 'completed'
                    if sell_queue.quantity <= 0:
                        sell_queue.status = 'completed'
                    
                    # Không break: cho phép một lệnh khớp liên tiếp với nhiều lệnh đối ứng
                    # Tiếp tục duyệt các sell_orders còn lại cho đến khi buy_queue.quantity về 0
            
            return matched_pairs
            
        except Exception as e:
            _logger.error(f"Error in _match_orders: {str(e)}")
            return []

    def _create_matched_pair(self, buy_order, sell_order, matched_quantity):
        """
        Tạo cặp lệnh khớp theo chuẩn Stock Exchange
        Dựa trên CompanyStockTransaction
        """
        try:
            # Tạo matched order record
            matched_order = self.env['transaction.matched.orders'].create({
                'name': f"PM-{self.fund_id.id}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}-{buy_order.id}-{sell_order.id}",
                'buy_order_id': buy_order.id,
                'sell_order_id': sell_order.id,
                'matched_quantity': matched_quantity,
                'matched_price': sell_order.price or sell_order.current_nav,  # Giá khớp = giá sell
                'fund_id': self.fund_id.id,
                'status': 'confirmed',
                'buy_user_type': self._get_user_type(buy_order),
                'sell_user_type': self._get_user_type(sell_order),
            })
            
            return {
                'id': matched_order.id,
                'buy_id': buy_order.id,
                'sell_id': sell_order.id,
                'matched_quantity': matched_quantity,
                'matched_price': sell_order.price or sell_order.current_nav,
                'match_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'algorithm_used': 'Partial Matching Engine',
                'fund_name': self.fund_id.name,
            }
            
        except Exception as e:
            _logger.error(f"Error creating matched pair: {str(e)}")
            return None

    def _get_user_type(self, transaction):
        """Xác định loại user"""
        if not transaction.user_id:
            return 'investor'
        
        if transaction.user_id.has_group('base.group_user'):
            return 'market_maker'
        
        if hasattr(transaction, 'source') and transaction.source == 'sale':
            return 'market_maker'
        
        return 'investor'

    def _update_transaction_status(self, buy_order, sell_order, matched_quantity):
        """
        Cập nhật trạng thái giao dịch sau khi khớp
        Dựa trên thuật toán từ CompanyOrderBookModule.checkTransactionExecutor
        """
        try:
            # Cập nhật buy order - sử dụng logic hiện tại
            new_buy_matched = (buy_order.matched_units or 0) + matched_quantity
            buy_remaining = max(0, (buy_order.units or 0) - new_buy_matched)
            
            # Cập nhật ccq_remaining_to_match chính xác
            buy_ccq_remaining = max(0, buy_remaining) if buy_remaining > 0 else 0
            
            buy_vals = {
                'matched_units': new_buy_matched,
                'remaining_units': buy_remaining,
                'ccq_remaining_to_match': buy_ccq_remaining,  # Record chính xác số lượng còn lại cần khớp
                'status': 'completed' if buy_remaining <= 0 else 'pending',
            }
            
            if buy_remaining <= 0:
                buy_order.sudo().write(buy_vals)
            else:
                buy_order.with_context(bypass_investment_update=True).sudo().write(buy_vals)
            
            # Cập nhật sell order - sử dụng logic hiện tại
            new_sell_matched = (sell_order.matched_units or 0) + matched_quantity
            sell_remaining = max(0, (sell_order.units or 0) - new_sell_matched)
            
            # Cập nhật ccq_remaining_to_match chính xác
            sell_ccq_remaining = max(0, sell_remaining) if sell_remaining > 0 else 0
            
            sell_vals = {
                'matched_units': new_sell_matched,
                'remaining_units': sell_remaining,
                'ccq_remaining_to_match': sell_ccq_remaining,  # Record chính xác số lượng còn lại cần khớp
                'status': 'completed' if sell_remaining <= 0 else 'pending',
            }
            
            if sell_remaining <= 0:
                sell_order.sudo().write(sell_vals)
            else:
                sell_order.with_context(bypass_investment_update=True).sudo().write(sell_vals)
                
        except Exception as e:
            _logger.error(f"Error updating transaction status: {str(e)}")

    def _update_statistics(self, matched_pairs):
        """Cập nhật thống kê engine"""
        # Giữ lại để log nội bộ; thống kê hiển thị được tính động qua _compute_engine_match_stats
        if not matched_pairs:
            return
        # Ghi log để truy vết (không thay đổi trường thống kê hiển thị)
        try:
            new_logs = (self.match_logs or '') + f"\nMatched {len(matched_pairs)} pairs at {fields.Datetime.now()}"
            self.match_logs = new_logs.strip()
        except Exception:
            pass

    @api.depends('fund_id')
    @api.depends_context('force_recompute')
    def _compute_engine_match_stats(self):
        """Tính thống kê từ bảng transaction.matched.orders (danh sách lệnh thỏa thuận)"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        Transaction = self.env['portfolio.transaction'].sudo()

        for engine in self:
            if not engine.fund_id:
                engine.total_matches = 0
                engine.total_partial_matches = 0
                engine.last_match_date = False
                continue

            # Lấy tất cả matched orders theo quỹ từ danh sách lệnh thỏa thuận
            matched_orders = MatchedOrder.search([
                ('fund_id', '=', engine.fund_id.id),
                ('status', 'in', ['confirmed', 'done'])  # Chỉ lấy các lệnh đã xác nhận hoặc hoàn thành
            ])
            
            # Tổng số lần khớp
            engine.total_matches = len(matched_orders)

            # Lần khớp cuối cùng
            if matched_orders:
                # Ưu tiên field match_date, fallback create_date
                dates = []
                for mo in matched_orders:
                    match_date = mo.match_date or mo.create_date
                    if match_date:
                        dates.append(match_date)
                engine.last_match_date = max(dates) if dates else False
            else:
                engine.last_match_date = False

            # Tính số lần khớp một phần
            # Một cặp được coi là khớp một phần nếu sau khi khớp, 
            # lệnh mua hoặc lệnh bán vẫn còn remaining_units > 0
            partial_count = 0
            for mo in matched_orders:
                try:
                    # Lấy thông tin lệnh mua và bán
                    buy_order = mo.buy_order_id
                    sell_order = mo.sell_order_id
                    
                    if buy_order and sell_order:
                        # Kiểm tra xem có còn remaining_units không
                        buy_remaining = buy_order.remaining_units or 0
                        sell_remaining = sell_order.remaining_units or 0
                        
                        # Nếu một trong hai lệnh còn remaining > 0 thì là khớp một phần
                        if buy_remaining > 0 or sell_remaining > 0:
                            partial_count += 1
                            
                except Exception as e:
                    # Log lỗi nhưng không dừng quá trình
                    _logger.warning(f"Error checking partial match for {mo.name}: {str(e)}")
                    continue
                    
            engine.total_partial_matches = partial_count

    @api.model
    def _trigger_recompute_stats(self):
        """Trigger recompute cho tất cả engines khi có thay đổi dữ liệu"""
        engines = self.search([])
        engines.with_context(force_recompute=True)._compute_engine_match_stats()

    def _search_total_matches(self, operator, value):
        """Search method cho total_matches"""
        if operator == '>':
            return [('fund_id', 'in', self._get_funds_with_matches_greater_than(value))]
        elif operator == '=':
            return [('fund_id', 'in', self._get_funds_with_matches_equal_to(value))]
        elif operator == '>=':
            return [('fund_id', 'in', self._get_funds_with_matches_greater_equal(value))]
        return []

    def _search_total_partial_matches(self, operator, value):
        """Search method cho total_partial_matches"""
        if operator == '>':
            return [('fund_id', 'in', self._get_funds_with_partial_matches_greater_than(value))]
        elif operator == '=':
            return [('fund_id', 'in', self._get_funds_with_partial_matches_equal_to(value))]
        elif operator == '>=':
            return [('fund_id', 'in', self._get_funds_with_partial_matches_greater_equal(value))]
        return []

    def _search_last_match_date(self, operator, value):
        """Search method cho last_match_date"""
        if operator == '>':
            return [('fund_id', 'in', self._get_funds_with_last_match_after(value))]
        elif operator == '=':
            return [('fund_id', 'in', self._get_funds_with_last_match_on(value))]
        elif operator == '>=':
            return [('fund_id', 'in', self._get_funds_with_last_match_after_equal(value))]
        return []

    def _get_funds_with_matches_greater_than(self, value):
        """Lấy danh sách fund_id có total_matches > value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.read_group(
            [
                ('fund_id', '!=', False),
                ('status', 'in', ['confirmed', 'done'])
            ],
            ['fund_id'],
            ['fund_id']
        )
        fund_ids = []
        for group in matched_orders:
            if group['fund_id_count'] > value:
                fund_ids.append(group['fund_id'][0])
        return fund_ids

    def _get_funds_with_matches_equal_to(self, value):
        """Lấy danh sách fund_id có total_matches = value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.read_group(
            [
                ('fund_id', '!=', False),
                ('status', 'in', ['confirmed', 'done'])
            ],
            ['fund_id'],
            ['fund_id']
        )
        fund_ids = []
        for group in matched_orders:
            if group['fund_id_count'] == value:
                fund_ids.append(group['fund_id'][0])
        return fund_ids

    def _get_funds_with_matches_greater_equal(self, value):
        """Lấy danh sách fund_id có total_matches >= value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.read_group(
            [
                ('fund_id', '!=', False),
                ('status', 'in', ['confirmed', 'done'])
            ],
            ['fund_id'],
            ['fund_id']
        )
        fund_ids = []
        for group in matched_orders:
            if group['fund_id_count'] >= value:
                fund_ids.append(group['fund_id'][0])
        return fund_ids

    def _get_funds_with_partial_matches_greater_than(self, value):
        """Lấy danh sách fund_id có partial matches > value"""
        # Simplified implementation - có thể cải thiện sau
        return self._get_funds_with_matches_greater_than(value)

    def _get_funds_with_partial_matches_equal_to(self, value):
        """Lấy danh sách fund_id có partial matches = value"""
        # Simplified implementation - có thể cải thiện sau
        return self._get_funds_with_matches_equal_to(value)

    def _get_funds_with_partial_matches_greater_equal(self, value):
        """Lấy danh sách fund_id có partial matches >= value"""
        # Simplified implementation - có thể cải thiện sau
        return self._get_funds_with_matches_greater_equal(value)

    def _get_funds_with_last_match_after(self, value):
        """Lấy danh sách fund_id có last_match_date > value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.search([
            ('fund_id', '!=', False),
            ('status', 'in', ['confirmed', 'done']),
            ('match_date', '>', value)
        ])
        return list(set(matched_orders.mapped('fund_id.id')))

    def _get_funds_with_last_match_on(self, value):
        """Lấy danh sách fund_id có last_match_date = value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.search([
            ('fund_id', '!=', False),
            ('status', 'in', ['confirmed', 'done']),
            ('match_date', '=', value)
        ])
        return list(set(matched_orders.mapped('fund_id.id')))

    def _get_funds_with_last_match_after_equal(self, value):
        """Lấy danh sách fund_id có last_match_date >= value từ danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        matched_orders = MatchedOrder.search([
            ('fund_id', '!=', False),
            ('status', 'in', ['confirmed', 'done']),
            ('match_date', '>=', value)
        ])
        return list(set(matched_orders.mapped('fund_id.id')))

    def clear_queue(self):
        """Xóa tất cả lệnh trong queue"""
        self.env['transaction.order.queue'].search([
            ('engine_id', '=', self.id)
        ]).unlink()

    def get_queue_status(self):
        """Lấy trạng thái queue"""
        buy_count = self.env['transaction.order.queue'].search_count([
            ('engine_id', '=', self.id),
            ('order_type', 'in', ['buy', 'purchase']),
            ('status', '=', 'pending')
        ])
        
        sell_count = self.env['transaction.order.queue'].search_count([
            ('engine_id', '=', self.id),
            ('order_type', '=', 'sell'),
            ('status', '=', 'pending')
        ])
        
        return {
            'buy_orders': buy_count,
            'sell_orders': sell_count,
            'total_orders': buy_count + sell_count
        }

    def process_all_pending_orders(self):
        """Xử lý tất cả lệnh pending trong queue"""
        matched_pairs = []
        
        # Lấy tất cả lệnh pending
        pending_orders = self.env['portfolio.transaction'].search([
            ('fund_id', '=', self.fund_id.id),
            ('status', '=', 'pending'),
            ('remaining_units', '>', 0)
        ])
        
        # Thêm từng lệnh vào engine
        for order in pending_orders:
            pairs = self.add_order(order)
            matched_pairs.extend(pairs)
        
        return matched_pairs

    @api.model
    def create_engine_for_fund(self, fund_id):
        """Tạo engine mới cho một quỹ"""
        existing = self.search([('fund_id', '=', fund_id), ('is_active', '=', True)])
        if existing:
            return existing[0]
        
        return self.create({
            'name': f'Partial Matching Engine - {fund_id}',
            'fund_id': fund_id,
            'is_active': True
        })

    @api.model
    def auto_create_engines_for_funds_with_matches(self, *args, **kwargs):
        """Tự động tạo engine cho các quỹ đã có matched orders trong danh sách lệnh thỏa thuận"""
        MatchedOrder = self.env['transaction.matched.orders'].sudo()
        
        # Lấy danh sách các quỹ đã có matched orders
        matched_orders = MatchedOrder.search([
            ('fund_id', '!=', False),
            ('status', 'in', ['confirmed', 'done'])
        ])
        
        fund_ids = list(set(matched_orders.mapped('fund_id.id')))
        
        created_engines = []
        for fund_id in fund_ids:
            # Kiểm tra xem đã có engine chưa
            existing = self.search([('fund_id', '=', fund_id), ('is_active', '=', True)])
            if not existing:
                # Tạo engine mới
                fund = self.env['portfolio.fund'].browse(fund_id)
                engine = self.create({
                    'name': f'Bộ Khớp Lệnh - {fund.name}',
                    'fund_id': fund_id,
                    'is_active': True
                })
                created_engines.append(engine)
        
        # Trả về thông báo ngắn gọn
        try:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Hoàn tất'),
                    'message': _('Đã tạo %(n)d engine (nếu thiếu).', n=len(created_engines)),
                    'sticky': False,
                }
            }
        except Exception:
            return True


class TransactionOrderQueue(models.Model):
    """
    Model lưu trữ lệnh trong queue của engine
    Thay thế cho PriorityQueue trong Java
    """
    _name = 'transaction.order.queue'
    _description = 'Transaction Order Queue'
    _order = 'priority_score desc'
    _rec_name = 'order_id'

    engine_id = fields.Many2one('transaction.partial.matching.engine', string='Engine', required=True)
    order_id = fields.Many2one('portfolio.transaction', string='Order', required=True)
    order_type = fields.Selection([
        ('buy', 'Buy'),
        ('purchase', 'Purchase'),
        ('sell', 'Sell')
    ], string='Order Type', required=True)
    
    price = fields.Float(string='Price', digits=(16, 2))
    quantity = fields.Float(string='Remaining Quantity', digits=(16, 2))
    priority_score = fields.Float(string='Priority Score', digits=(20, 6))
    create_time = fields.Datetime(string='Create Time')
    
    status = fields.Selection([
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='pending')
    
    # Thông tin bổ sung
    user_id = fields.Many2one(related='order_id.user_id', string='User', store=True)
    fund_id = fields.Many2one(related='order_id.fund_id', string='Fund', store=True)
    
    # Các trường từ transaction để hiển thị chính xác số lượng khớp
    ccq_remaining_to_match = fields.Float(
        related='order_id.ccq_remaining_to_match', 
        string='CCQ Còn Lại Cần Khớp', 
        store=True,
        digits=(16, 2)
    )
    matched_units = fields.Float(
        related='order_id.matched_units', 
        string='CCQ Đã Khớp', 
        store=True,
        digits=(16, 2)
    )
    remaining_units = fields.Float(
        related='order_id.remaining_units', 
        string='CCQ Còn Lại', 
        store=True,
        digits=(16, 2)
    )
    
    @api.model
    def cleanup_old_queues(self, days=7):
        """Dọn dẹp queue cũ"""
        cutoff_date = fields.Datetime.now() - timedelta(days=days)
        old_queues = self.search([
            ('create_time', '<', cutoff_date),
            ('status', 'in', ['completed', 'cancelled'])
        ])
        old_queues.unlink()
        return len(old_queues)

    def update_queue_from_transaction(self, transaction_id):
        """
        Cập nhật queue khi transaction thay đổi
        Đồng bộ số lượng còn lại cần khớp từ transaction
        """
        try:
            transaction = self.env['portfolio.transaction'].browse(transaction_id)
            if not transaction.exists():
                return False
            
            # Tìm queue record tương ứng
            queue_record = self.search([
                ('order_id', '=', transaction_id),
                ('status', '=', 'pending')
            ], limit=1)
            
            if queue_record:
                # Cập nhật quantity từ transaction
                queue_record.write({
                    'quantity': transaction.remaining_units or 0,
                    'ccq_remaining_to_match': transaction.ccq_remaining_to_match or 0,
                    'matched_units': transaction.matched_units or 0,
                    'remaining_units': transaction.remaining_units or 0
                })
                
                # Nếu không còn quantity, đánh dấu completed
                if (transaction.remaining_units or 0) <= 0:
                    queue_record.status = 'completed'
                
                return True
            
            return False
            
        except Exception as e:
            _logger.error(f"Error updating queue from transaction: {str(e)}")
            return False
