{
    'name': 'Transaction List',
    'version': '1.0',
    'category': 'Finance',
    'summary': 'Quản lý danh sách lệnh giao dịch',
    'description': """
        Module này cung cấp chức năng quản lý danh sách lệnh giao dịch của nhà đầu tư
        với 2 tab: Pending (chờ duyệt) và Approved (đã duyệt)
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        'portal',
        'transaction_management',
        'investor_profile_management',
        'stock_trading'  # Cần để sử dụng model trading.order
    ],
    'data': [
        # Security - Phân quyền truy cập models
        'security/ir.model.access.csv',
        
        # Data - Sequences
        'data/sequence_data.xml',
        'data/maturity_notification_data.xml',
        
        # Views - Giao diện người dùng (đảm bảo views được nạp trước menu)
        'views/transaction_list_views.xml',        # Views chính
        'views/transaction_list/matched_orders_view.xml',    # Views cho lệnh thỏa thuận
        'views/maturity_notification_views.xml',  # Views cho thông báo đáo hạn
        'views/menu_views.xml',                   # Menu root phải được nạp trước sent_orders_views
        'views/sent_orders_views.xml',            # Danh sách lệnh đã lên sàn (sử dụng menu root)
        'views/order_book_page.xml',               # Trang sổ lệnh
        'views/completed_orders_page.xml',         # Trang đã khớp
        'views/negotiated_orders_page.xml',        # Trang khớp thỏa thuận
        # 'views/transaction_list/partial_orders_views.xml',   # ĐÃ XÓA theo yêu cầu

        # Website Templates - Trang web frontend
        'views/transaction_list/transaction_list_page.xml',  # Trang danh sách giao dịch
        'views/maturity_notification_response_page.xml',     # Trang xác nhận đáo hạn
    ],
    
    # Assets - JavaScript và CSS files
    'assets': {
        # Backend Assets - Cho Odoo backend interface (cần để sử dụng bus_service)
        'web.assets_backend': [
            'transaction_list/static/src/js/maturity_notification_bus.js',
        ],
        # Frontend Assets - Cho website pages
        'web.assets_frontend': [
            # Transaction List - Trang danh sách giao dịch
            'transaction_list/static/src/js/transaction_list/transaction_list_tab.js',      # Tab danh sách giao dịch
            'transaction_list/static/src/js/transaction_list/beta_export_tab.js',           # Tab beta export
            'transaction_list/static/src/js/transaction_list/order_allocation_tab.js',      # Tab phân bố lệnh
            'transaction_list/static/src/js/transaction_list/matched_orders_tab.js',        # Tab lệnh khớp thỏa thuận
            'transaction_list/static/src/js/transaction_list/transaction_list_widget.js',   # Widget chính
            'transaction_list/static/src/js/transaction_list/entrypoint.js',               # Entrypoint
            'transaction_list/static/src/css/transaction_list.css',
            'transaction_list/static/src/css/matched_orders.css',                          # CSS cho tab lệnh khớp thỏa thuận
            
            # Order Book - Sổ lệnh giao dịch
            'transaction_list/static/src/js/order_book/order_book_component.js',           # Component sổ lệnh
            'transaction_list/static/src/js/order_book/entrypoint.js',                    # Entrypoint chung
            'transaction_list/static/src/js/order_book/completed_orders_component.js',    # Component đã khớp
            'transaction_list/static/src/js/order_book/negotiated_orders_component.js',   # Component thỏa thuận
            'transaction_list/static/src/css/order_book.css',                              # CSS sổ lệnh

            # Global worker - Tự động khớp lệnh nền mỗi 1s trên mọi trang
            'transaction_list/static/src/js/auto_match_worker.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
} 