{
    'name': 'NAV Management',
    'version': '1.0',
    'category': 'Finance',
    'summary': 'Quản lý NAV phiên giao dịch và NAV tháng',
    'description': """
        Module này cung cấp chức năng quản lý NAV:
        - NAV phiên giao dịch: Hiển thị danh sách giá trị NAV của tất cả các phiên giao dịch theo Quỹ được chọn. Có thể xuất file danh sách NAV
        - NAV tháng: Hiển thị danh sách NAV tháng theo Quỹ được chọn. Có thể thêm giá trị NAV tháng
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        # Cần cho model portfolio.fund
        'overview_fund_management',
        # Cần để tái sử dụng dữ liệu portfolio.transaction
        'transaction_list',
        # Cần cho mock data từ fund_management
        'fund_management',
    ],
    'data': [
        # Security - Phân quyền truy cập models
        'security/ir.model.access.csv',
        
        # Views - Giao diện người dùng
        'views/menu_views.xml',                    # Menu chính của module
        'views/nav_term_rate_views.xml',           # Views cho kỳ hạn / lãi suất
        'views/nav_cap_config_views.xml',          # Views cho chặn trên / chặn dưới
        'views/nav_daily_inventory_views.xml',     # Views cho tồn kho CCQ hàng ngày
        # Seed data
        'data/nav_seed_data.xml',
        'data/nav_daily_cron.xml',             # Cron job tự động tạo tồn kho hàng ngày
        
        # Website Templates - Trang web frontend
        'views/nav_transaction/nav_transaction_page.xml',  # Trang NAV phiên giao dịch
        'views/nav_monthly/nav_monthly_page.xml',          # Trang NAV tháng
    ],
    
    # Assets - JavaScript và CSS files
    'assets': {
        # Frontend Assets - Cho website pages
        'web.assets_frontend': [
            # NAV Transaction - Trang NAV phiên giao dịch
            'nav_management/static/src/js/nav_transaction/nav_transaction_widget.js',  # Widget chính
            'nav_management/static/src/js/nav_transaction/entrypoint.js',              # Entrypoint
            
            # NAV Monthly - Trang NAV tháng
            'nav_management/static/src/js/nav_monthly/nav_monthly_widget.js',          # Widget chính
            'nav_management/static/src/js/nav_monthly/entrypoint.js',                  # Entrypoint
            
            'nav_management/static/src/css/nav_management.css',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
