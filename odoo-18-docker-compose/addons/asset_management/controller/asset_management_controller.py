from odoo import http
from odoo.http import request
import json
from datetime import datetime, timedelta

class AssetManagementController(http.Controller):
    @http.route('/asset-management', type='http', auth='user', website=True)
    def asset_management(self, **kwargs):
        # Hàm parse_date để chuyển string sang date
        def parse_date(s):
            try:
                return datetime.strptime(s, '%Y-%m-%d').date()
            except Exception:
                return None
        # Lấy danh sách các khoản đầu tư CCQ đang hoạt động của user hiện tại
        investments = request.env['portfolio.investment'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'active'),
            ('user_id', '=', request.env.user.id)
        ])

        # Lấy danh sách quỹ có investment (theo fund_id từ investments)
        fund_ids_with_investment = list(set(inv.fund_id.id for inv in investments if inv.fund_id))
        funds = request.env['portfolio.fund'].search([
            ('status', '=', 'active'),
            ('id', 'in', fund_ids_with_investment)
        ])

        # Tính tổng tài sản từ giá trị thực tế của investment thay vì current_nav
        total_assets = sum(inv.amount for inv in investments)
        
        # Danh sách màu mặc định
        default_colors = [
            '#2B4BFF', '#FF5733', '#33FF57', '#FF33EE', '#33B5FF', '#FFD700',
            '#8A2BE2', '#DC143C', '#00CED1', '#FF8C00', '#4B0082', '#228B22',
            '#FF1493', '#20B2AA', '#FF6347', '#4682B4', '#B8860B', '#9932CC',
            '#008080', '#B22222', '#5F9EA0', '#D2691E', '#7FFF00', '#FF4500'
        ]
        used_colors = {}
        color_pool = default_colors.copy()

        fund_certificates_data = []
        seen_funds = set()
        for fund in funds:
            key = (fund.name, fund.ticker)
            if key in seen_funds:
                continue
            seen_funds.add(key)
            # Gán màu cho từng cặp (name, ticker)
            if key not in used_colors:
                color = fund.color or (color_pool.pop(0) if color_pool else '#2B4BFF')
                used_colors[key] = color
            else:
                color = used_colors[key]
            fund_certificates_data.append({
                'name': fund.name,
                'code': fund.ticker,
                'quantity': f"{fund.total_units:,.0f}",
                'quantity2': None,
                'change': f"{fund.profit_loss_percentage:,.2f}",
                'isProfit': fund.profit_loss_percentage >= 0,
                'color': color
            })
        
        # Hàm chuyển đổi loại giao dịch
        def get_transaction_type_display(type):
            type_map = {
                'purchase': 'Mua',
                'sale': 'Bán'
            }
            return type_map.get(type, type)

        # Lấy danh sách holdings từ các khoản đầu tư của user hiện tại
        investments = request.env['portfolio.investment'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('status', '=', 'active'),
            ('user_id', '=', request.env.user.id)
        ])
        
        holdings_data = []
        for inv in investments:
            # Lấy partner_id từ user hiện tại
            partner = request.env.user.partner_id
            so_tk = ''
            if partner:
                status_info = request.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                so_tk = status_info.so_tk if status_info else ''
            # Nếu model investment có transaction_date thì dùng, không thì lấy create_date
            transaction_date_obj = getattr(inv, 'transaction_date', None)
            if not transaction_date_obj:
                transaction_date_obj = inv.create_date
            transaction_date_str = transaction_date_obj.strftime('%Y-%m-%d')
            holdings_data.append({
                'accountNumber': so_tk,
                'fund': inv.fund_id.name,
                'ticker': inv.fund_id.ticker,
                'tradingDate': inv.create_date.strftime('%d/%m/%Y'),
                'transactionDate': transaction_date_str,
                'buyPrice': f"{inv.average_price:,.0f}",
                'quantity': f"{inv.units:,.0f}",
                'investmentValue': inv.amount,
                'previousNav': self._get_previous_nav_price(inv.fund_id.id),
                'currentValue': inv.amount,  # Sử dụng giá trị thực tế từ form thay vì current_nav
                'profitLossPercent': self._calculate_profit_loss_percentage(inv),
                'profitLossAmount': self._calculate_profit_loss_amount(inv),
                'isProfit': self._calculate_profit_loss_amount(inv) >= 0,
                'transactionType': get_transaction_type_display(getattr(inv, 'transaction_type', 'purchase'))
            })
        # Lấy tất cả các giao dịch từ model Transaction của user hiện tại
        transactions = request.env['portfolio.transaction'].search([
            ('investment_type', '=', 'fund_certificate'),
            ('user_id', '=', request.env.user.id)
        ], order='create_date desc')
        # Hàm chuyển đổi trạng thái
        def get_status_display(status):
            status_map = {
                'pending': {
                    'text': 'Chờ khớp lệnh',
                    'color': 'text-yellow-500'
                },
                'completed': {
                    'text': 'Đã khớp lệnh',
                    'color': 'text-green-500'
                },
                'cancelled': {
                    'text': 'Đã hủy',
                    'color': 'text-red-500'
                }
            }
            return status_map.get(status, {
                'text': status,
                'color': 'text-gray-500'
            })
        # Lọc swap_orders theo transaction_date
        swap_orders_data = []
        for transaction in transactions:
            partner = request.env.user.partner_id
            so_tk = ''
            if partner:
                status_info = request.env['status.info'].sudo().search([('partner_id', '=', partner.id)], limit=1)
                so_tk = status_info.so_tk if status_info else ''
            transaction_date_obj = transaction.transaction_date
            transaction_date_str = transaction_date_obj.strftime('%Y-%m-%d')
            status_info_dict = get_status_display(transaction.status)
            swap_orders_data.append({
                'accountNumber': so_tk,
                'fund': transaction.fund_id.name,
                'ticker': transaction.fund_id.ticker,
                'tradingDate': transaction.transaction_date.strftime('%d/%m/%Y'),
                'transactionDate': transaction_date_str,
                'amount': transaction.amount,
                'status': status_info_dict['text'],
                'statusColor': status_info_dict['color'],
                'transactionType': get_transaction_type_display(transaction.transaction_type),
                'units': f"{transaction.units:,.0f}",
                'description': transaction.description or ''
            })
        
        # Chuẩn bị dữ liệu cho biểu đồ sử dụng giá trị thực tế từ investment
        chart_data = {
            'labels': [inv.fund_id.name for inv in investments],
            'datasets': [{
                'data': [inv.amount for inv in investments],  # Sử dụng giá trị thực tế từ form thay vì current_nav
                'backgroundColor': [inv.fund_id.color or '#2B4BFF' for inv in investments] # Sử dụng màu từ quỹ
            }]
        }

        # Chuẩn bị dữ liệu cho tabs (gộp theo (name, ticker))
        fund_tabs = []
        seen_tab_keys = set()
        first_tab = True
        for fund in funds:
            key = (fund.name, fund.ticker)
            if key in seen_tab_keys:
                continue
            seen_tab_keys.add(key)
            fund_tabs.append({
                'name': fund.name,
                'code': fund.ticker,
                'isActive': first_tab
            })
            first_tab = False

        # Tính toán pagination
        page_size = 10
        current_page = 1
        total_items = len(holdings_data)
        start_item = (current_page - 1) * page_size
        end_item = min(start_item + page_size, total_items)
        
        has_previous = current_page > 1
        has_next = end_item < total_items
        
        # Tạo pages array
        total_pages = (total_items + page_size - 1) // page_size
        pages = []
        for i in range(1, total_pages + 1):
            pages.append({
                'number': i,
                'is_current': i == current_page
            })
        
        # Tạo dictionary chứa tất cả dữ liệu
        asset_data = {
            'totalAssets': total_assets,
            'fundCertificates': fund_certificates_data,
            'holdings': holdings_data[start_item:end_item],
            'swapOrders': {
                'items': swap_orders_data,
                'total': len(swap_orders_data)
            },
            'chartData': json.dumps(chart_data),
            'activeTab': funds[0].ticker if funds else '',
            'currentPage': current_page,
            'pageSize': page_size,
            'pagination_total': total_items,
            'pagination_start': start_item + 1,
            'pagination_end': end_item,
            'hasPrevious': has_previous,
            'hasNext': has_next,
            'pages': pages,
            'selectedFund': {
                'name': funds[0].name if funds else '',
                'ticker': funds[0].ticker if funds else ''
            },
            'fundTabs': fund_tabs
        }
        
        # Loại bỏ trường transactionDateObj (kiểu date) trước khi trả về
        for h in holdings_data:
            if 'transactionDateObj' in h:
                del h['transactionDateObj']
        for o in swap_orders_data:
            if 'transactionDateObj' in o:
                del o['transactionDateObj']

        return request.render('asset_management.asset_management_page', {
            'asset_data': json.dumps(asset_data)
        })
    
    def _get_previous_nav_price(self, fund_id):
        """Lấy giá tồn kho đầu ngày hôm trước từ nav_management, nếu chưa có thì lấy giá tồn kho ban đầu"""
        try:
            # Lấy giá tồn kho đầu ngày hôm trước từ nav.daily.inventory
            yesterday = datetime.now().date() - timedelta(days=1)
            
            # Tìm tồn kho ngày hôm trước
            previous_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund_id),
                ('inventory_date', '=', yesterday)
            ], limit=1)
            
            if previous_inventory and previous_inventory.opening_avg_price > 0:
                return previous_inventory.opening_avg_price
            
            # Nếu không có tồn kho ngày hôm trước, tìm tồn kho gần nhất trước đó
            nearest_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund_id),
                ('inventory_date', '<', yesterday),
                ('opening_avg_price', '>', 0)
            ], order='inventory_date desc', limit=1)
            
            if nearest_inventory:
                return nearest_inventory.opening_avg_price
            
            # Nếu không có tồn kho nào, lấy giá tồn kho ban đầu từ nav.fund.config
            fund_config = request.env['nav.fund.config'].search([
                ('fund_id', '=', fund_id),
                ('active', '=', True)
            ], limit=1)
            
            if fund_config and fund_config.initial_nav_price > 0:
                return fund_config.initial_nav_price
            
            # Không fallback về current_nav, chỉ trả về 0.0 nếu không có dữ liệu tồn kho
            return 0.0
            
        except Exception as e:
            # Không fallback về current_nav, chỉ trả về 0.0 nếu có lỗi
            return 0.0
    
    def _calculate_profit_loss_percentage(self, investment):
        """Tính phần trăm lời/lỗ dựa trên giá tồn kho đầu ngày hiện tại"""
        try:
            if not investment or investment.amount <= 0 or investment.units <= 0:
                return 0.0
            
            # Lấy giá tồn kho đầu ngày hiện tại
            current_nav_price = self._get_current_nav_price(investment.fund_id.id)
            if current_nav_price <= 0:
                return 0.0
            
            # Tính giá trị hiện tại dựa trên giá tồn kho đầu ngày
            current_value = investment.units * current_nav_price
            profit_loss = current_value - investment.amount
            profit_loss_percentage = (profit_loss / investment.amount) * 100
            
            return f"{profit_loss_percentage:,.2f}"
            
        except Exception as e:
            return "0.00"
    
    def _calculate_profit_loss_amount(self, investment):
        """Tính số tiền lời/lỗ dựa trên giá tồn kho đầu ngày hiện tại"""
        try:
            if not investment or investment.amount <= 0 or investment.units <= 0:
                return 0.0
            
            # Lấy giá tồn kho đầu ngày hiện tại
            current_nav_price = self._get_current_nav_price(investment.fund_id.id)
            if current_nav_price <= 0:
                return 0.0
            
            # Tính giá trị hiện tại dựa trên giá tồn kho đầu ngày
            current_value = investment.units * current_nav_price
            profit_loss = current_value - investment.amount
            
            return profit_loss
            
        except Exception as e:
            return 0.0
    
    def _get_current_nav_price(self, fund_id):
        """Lấy giá tồn kho đầu ngày hiện tại từ nav_management"""
        try:
            # Lấy giá tồn kho đầu ngày hiện tại từ nav.daily.inventory
            today = datetime.now().date()
            current_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund_id),
                ('inventory_date', '=', today)
            ], limit=1)
            
            if current_inventory and current_inventory.opening_avg_price > 0:
                return current_inventory.opening_avg_price
            
            # Nếu không có tồn kho hôm nay, tìm tồn kho gần nhất
            nearest_inventory = request.env['nav.daily.inventory'].search([
                ('fund_id', '=', fund_id),
                ('opening_avg_price', '>', 0)
            ], order='inventory_date desc', limit=1)
            
            if nearest_inventory:
                return nearest_inventory.opening_avg_price
            
            # Nếu không có tồn kho nào, lấy giá tồn kho ban đầu từ nav.fund.config
            fund_config = request.env['nav.fund.config'].search([
                ('fund_id', '=', fund_id),
                ('active', '=', True)
            ], limit=1)
            
            if fund_config and fund_config.initial_nav_price > 0:
                return fund_config.initial_nav_price
            
            # Không fallback về current_nav, chỉ trả về 0.0 nếu không có dữ liệu tồn kho
            return 0.0
            
        except Exception as e:
            # Không fallback về current_nav, chỉ trả về 0.0 nếu có lỗi
            return 0.0 