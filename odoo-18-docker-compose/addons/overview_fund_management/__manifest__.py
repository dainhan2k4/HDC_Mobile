{
    'name': 'Overview Fund Management',
    'version': '1.0',
    'category': 'Finance',
    'summary': 'Quản lý quỹ đầu tư và danh mục',
    'description': """
        Module này cung cấp chức năng Tổng quan
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        'portal'
    ],
    'data': [
        # Security - Phân quyền truy cập models
        'security/ir.model.access.csv',
        
        # Views - Giao diện người dùng
        'views/menu_views.xml',                    # Menu chính của module
        'views/fund_views.xml',                    # Views cho quản lý quỹ
        'views/investment_views.xml',              # Views cho quản lý đầu tư
        'views/transaction_views.xml',             # Views cho quản lý giao dịch
        'views/comparison_views.xml',              # Views cho so sánh danh mục
        
        # Website Templates - Trang web frontend
        'views/overview_fund_management/overview_fund_management_page.xml',  # Trang tổng quan quỹ                 # Dữ liệu mẫu cho quỹ
    ],
    
    # Assets - JavaScript và CSS files
    'assets': {
        # Frontend Assets - Cho website pages
        'web.assets_frontend': [
            # Components - Header và navigation
            'overview_fund_management/static/src/js/components/header.js',           # Header component
            'overview_fund_management/static/src/js/components/entrypoint.js',       # Header entrypoint
            
            # Overview Fund Management - Trang tổng quan
            'overview_fund_management/static/src/js/overview_fund_management/overview_fund_management_widget.js',  # Widget chính
            'overview_fund_management/static/src/js/overview_fund_management/entrypoint.js',                      # Entrypoint# Entrypoint
            'overview_fund_management/static/src/css/header.css',
        ],
        
        # Backend Assets - Cho Odoo backend interface
        'web.assets_backend': [
            # Components - Header và navigation
            'overview_fund_management/static/src/js/components/header.js',           # Header component
            'overview_fund_management/static/src/js/components/entrypoint.js',       # Header entrypoint
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
