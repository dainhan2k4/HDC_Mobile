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
        'investor_profile_management'
    ],
    'data': [
        # Security - Phân quyền truy cập models
        'security/ir.model.access.csv',
        
        # Data - Sequences
        'data/sequence_data.xml',
        
        # Views - Giao diện người dùng (đảm bảo menu_root được nạp trước)
        'views/transaction_list_views.xml',        # Views + root menu
        'views/transaction_list/matched_orders_view.xml',    # Views cho lệnh thỏa thuận (cung cấp view ids)
        'views/menu_views.xml',                    # Menu sử dụng view ids đã nạp
        
        # Website Templates - Trang web frontend
        'views/transaction_list/transaction_list_page.xml',  # Trang danh sách giao dịch
    ],
    
    # Assets - JavaScript và CSS files
    'assets': {
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
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
} 