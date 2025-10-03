from odoo import http
from odoo.http import request
import json
import pytz
from datetime import datetime, timedelta


class OverviewFundManagementController(http.Controller):
    
    def _get_safe_timezone(self, user_tz=None):
        """
        Lấy timezone an toàn cho user
        Args:
            user_tz: timezone của user
        Returns:
            pytz timezone object
        """
        if not user_tz:
            user_tz = 'Asia/Ho_Chi_Minh'
        
        # Kiểm tra và sửa timezone không hợp lệ
        if user_tz == 'Asia/Saigon':
            user_tz = 'Asia/Ho_Chi_Minh'
        
        # Validate timezone và sử dụng timezone mặc định nếu không hợp lệ
        try:
            return pytz.timezone(user_tz)
        except pytz.exceptions.UnknownTimeZoneError:
            # Fallback về timezone mặc định nếu timezone không hợp lệ
            return pytz.timezone('Asia/Ho_Chi_Minh')
    
    @http.route('/investment_dashboard', type='http', auth='user', website=True)
    def investment_dashboard_page(self, **kwargs):
        # Lấy dữ liệu quỹ đầu tư chỉ có investment của user hiện tại
        user_investments = request.env['portfolio.investment'].search([
            ('user_id', '=', request.env.user.id),
            ('status', '=', 'active')
        ])
        
        # Lấy các fund mà user hiện tại đã đầu tư
        user_funds = user_investments.mapped('fund_id').filtered(lambda f: f.status == 'active')
        
        # Lọc các fund có ít nhất 1 investment của user hiện tại
        funds_with_investment = user_funds.filtered(lambda f: f.investment_count > 0)
        fund_data = []
        
        # Gộp các fund có cùng ticker
        merged_funds = {}
        for fund in funds_with_investment:
            ticker = fund.ticker
            # Lấy investment của user hiện tại cho fund này
            user_investments = request.env['portfolio.investment'].search([
                ('user_id', '=', request.env.user.id),
                ('fund_id', '=', fund.id),
                ('status', '=', 'active')
            ])
            
            # Chỉ hiển thị fund nếu user có investment thực sự
            if not user_investments:
                continue
                
            user_total_investment = sum(user_investments.mapped('amount'))
            user_total_units = sum(user_investments.mapped('units'))
            user_current_value = sum(user_investments.mapped('current_value'))
            
            # Chỉ hiển thị fund nếu user có investment với số lượng > 0
            if user_total_units <= 0:
                continue
            # Lấy giao dịch mua/bán gần nhất của fund này
            last_transaction = request.env['portfolio.transaction'].search([
                ('fund_id', '=', fund.id),
                ('user_id', '=', request.env.user.id),
                ('status', 'in', ['pending', 'completed', 'cancelled']),
                ('transaction_type', 'in', ['purchase', 'sale'])
            ], order='created_at desc', limit=1)
            last_update_str = last_transaction.created_at.strftime('%d/%m/%Y') if last_transaction and last_transaction.created_at else ""
            if ticker not in merged_funds:
                merged_funds[ticker] = {
                    'name': fund.name,
                    'ticker': fund.ticker,
                    'total_units': user_total_units,
                    'total_investment': user_total_investment,
                    'current_nav': fund.current_nav or 0,  # Giữ lại cho hiển thị, nhưng không dùng để tính toán
                    'previous_nav': fund.previous_nav or 0,
                    'current_value': user_current_value,
                    'profit_loss_percentage': 0.0,  # sẽ tính lại phía dưới
                    'flex_sip_percentage': 0.0,     # sẽ tính lại phía dưới
                    'color': fund.color,
                    'investment_type': fund.investment_type,
                    'current_ytd': fund.current_ytd or 0,
                    'last_update': last_update_str,
                    'flex_units': 0.0,  # sẽ tính lại phía dưới
                    'sip_units': 0.0    # sẽ tính lại phía dưới
                }
            else:
                merged = merged_funds[ticker]
                merged['total_units'] += user_total_units
                merged['total_investment'] += user_total_investment
                merged['current_value'] += user_current_value
                # Lấy ngày cập nhật mới nhất giữa các fund cùng ticker
                if last_update_str and (not merged['last_update'] or last_update_str > merged['last_update']):
                    merged['last_update'] = last_update_str
# Sau khi gộp xong, tính lại các trường phụ thuộc
        for fund in merged_funds.values():
            # Tính flex_units, sip_units cho user hiện tại
            flex_units = 0.0
            sip_units = 0.0
            user_investments = request.env['portfolio.investment'].search([
                ('user_id', '=', request.env.user.id),
                ('fund_id.ticker', '=', fund['ticker']),
                ('status', '=', 'active')
            ])
            for inv in user_investments:
                if inv.investment_type == 'flex':
                    flex_units += inv.units
                elif inv.investment_type == 'sip':
                    sip_units += inv.units
            fund['flex_units'] = flex_units
            fund['sip_units'] = sip_units
            # Tính lại % lợi/lỗ dựa trên giá tồn kho đầu ngày hiện tại
            if fund['total_investment'] > 0 and fund['total_units'] > 0:
                # Lấy giá tồn kho đầu ngày hiện tại từ nav_management
                current_nav_price = self._get_current_nav_price(fund['ticker'])
                if current_nav_price > 0:
                    # Tính giá trị hiện tại dựa trên giá tồn kho đầu ngày
                    current_value = fund['total_units'] * current_nav_price
                    profit_loss = current_value - fund['total_investment']
                    fund['profit_loss_percentage'] = (profit_loss / fund['total_investment']) * 100
                    fund['current_value'] = current_value  # Cập nhật giá trị hiện tại
                else:
                    # Fallback về logic cũ nếu không có giá tồn kho
                    profit_loss = fund['current_value'] - fund['total_investment']
                    fund['profit_loss_percentage'] = (profit_loss / fund['total_investment']) * 100
            else:
                fund['profit_loss_percentage'] = 0.0
            # Tính flex_sip_percentage
            if fund['total_units'] > 0:
                fund['flex_sip_percentage'] = (fund['sip_units'] / fund['total_units']) * 100
            else:
                fund['flex_sip_percentage'] = 0.0
        
        fund_data = list(merged_funds.values())

        # Lấy dữ liệu giao dịch gần nhất với thời gian chính xác
        transactions = request.env['portfolio.transaction'].search([
            ('user_id', '=', request.env.user.id),
            ('status', 'in', ['pending', 'completed', 'cancelled'])
        ], order='created_at desc', limit=5)
        
        transaction_data = []
        status_map = {
            'pending': 'Chờ Khớp lệnh',
            'completed': 'Đã Khớp lệnh',
            'cancelled': 'Đã Hủy',
        }
        transaction_type_map = {
            'purchase': 'mua',
            'sell': 'bán',
        }
        # Xử lý timezone an toàn
        tz = self._get_safe_timezone(request.env.user.tz)
        for trans in transactions:
            local_dt = trans.created_at.astimezone(tz) if trans.created_at else None
            transaction_type_display = transaction_type_map.get(trans.transaction_type.lower(), trans.transaction_type.lower())
            transaction_data.append({
                'date': local_dt.strftime('%d/%m/%Y') if local_dt else '',
                'time': local_dt.strftime('%H:%M:%S') if local_dt else '',
                'description': f"Lệnh {transaction_type_display} {trans.fund_id.name} - {trans.fund_id.ticker}",
                'status': status_map.get(trans.status, trans.status),
                'status_raw': trans.status,
                'amount': trans.units if trans.transaction_type == 'sale' else trans.amount,
                'is_units': trans.transaction_type == 'sale',
                'investment_type': trans.investment_type,
                'currency_symbol': trans.currency_id.symbol if trans.currency_id else ''
            })

        # Lấy dữ liệu tổng quan tài sản từ model Investment
        investments = request.env['portfolio.investment'].search([
            ('user_id', '=', request.env.user.id),
            ('status', '=', 'active')
        ])
        
        total_investment = sum(investments.mapped('amount'))
        total_current_value = sum(investments.mapped('current_value'))
        total_profit_loss = total_current_value - total_investment
        total_profit_loss_percentage = (total_profit_loss / total_investment * 100) if total_investment else 0

        # Lấy dữ liệu so sánh từ model Comparison
        comparisons = request.env['portfolio.comparison'].search([
            ('user_id', '=', request.env.user.id),
            ('status', '=', 'active')
        ], limit=5)
        
        comparison_data = []
        for comp in comparisons:
            comparison_data.append({
                'name': comp.name,
                'total_investment': comp.total_investment,
                'total_return': comp.total_return,
                'return_percentage': comp.return_percentage,
                'comparison_type': comp.comparison_type,
                'last_update': comp.last_update.strftime('%d/%m/%Y %H:%M') if comp.last_update else False
            })

        # Tạo dữ liệu cho biểu đồ với thông tin chi tiết từng quỹ
        chart_data = {
            'labels': [fund['name'] for fund in fund_data],
            'tickers': [fund['ticker'] for fund in fund_data],
            'datasets': [{
                'data': [fund['current_value'] for fund in fund_data],
                'backgroundColor': [fund['color'] for fund in fund_data]
            }]
        }

        all_dashboard_data = {
            'funds': fund_data,
            'transactions': transaction_data,
            'total_investment': total_investment,
            'total_current_value': total_current_value,
            'total_profit_loss': total_profit_loss,
            'total_profit_loss_percentage': total_profit_loss_percentage,
            'chart_data': json.dumps(chart_data),
            'comparisons': comparison_data
        }

        return request.render('overview_fund_management.overview_fund_management_page', {
            'all_dashboard_data': json.dumps(all_dashboard_data)
        })
    
    def _get_current_nav_price(self, ticker):
        """Lấy giá tồn kho đầu ngày hiện tại từ nav_management"""
        try:
            # Tìm quỹ theo ticker
            fund = request.env['portfolio.fund'].search([
                ('ticker', '=', ticker),
                ('active', '=', True)
            ], limit=1)
            
            if not fund:
                return 0.0
            
            # Lấy giá tồn kho đầu ngày hiện tại từ nav.daily.inventory
            today = datetime.now().date()
            current_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund.id),
                ('inventory_date', '=', today)
            ], limit=1)
            
            if current_inventory and current_inventory.opening_avg_price > 0:
                return current_inventory.opening_avg_price
            
            # Nếu không có tồn kho hôm nay, tìm tồn kho gần nhất
            nearest_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund.id),
                ('opening_avg_price', '>', 0)
            ], order='inventory_date desc', limit=1)
            
            if nearest_inventory:
                return nearest_inventory.opening_avg_price
            
            # Nếu không có tồn kho nào, lấy giá tồn kho ban đầu từ nav.fund.config
            fund_config = request.env['nav.fund.config'].search([
                ('fund_id', '=', fund.id),
                ('active', '=', True)
            ], limit=1)
            
            if fund_config and fund_config.initial_nav_price > 0:
                return fund_config.initial_nav_price
            
            # Không fallback về current_nav, chỉ trả về 0.0 nếu không có dữ liệu tồn kho
            return 0.0
            
        except Exception as e:
            # Không fallback về current_nav, chỉ trả về 0.0 nếu có lỗi
            return 0.0 