{
    'name': 'Investor List',
    'version': '1.0',
    'category': 'Finance',
    'summary': 'Quản lý danh sách nhà đầu tư',
    'description': """
        Module này cung cấp chức năng quản lý danh sách nhà đầu tư
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        'portal',
        'investor_profile_management'
    ],
    'data': [
        # Security - Phân quyền truy cập models
        'security/ir.model.access.csv',
        
        # Views - Giao diện người dùng
        'views/menu_views.xml',                    # Menu chính của module

        'views/investor_list_views.xml',           # Views cho danh sách nhà đầu tư
        
        # Website Templates - Trang web frontend
        'views/investor_list/investor_list_page.xml',  # Trang danh sách nhà đầu tư
    ],
    
    # Assets - JavaScript và CSS files
    'assets': {
        # Frontend Assets - Cho website pages
        'web.assets_frontend': [
            # Components - Header và navigation
            'investor_list/static/src/js/components/header.js',           # Header component
            'investor_list/static/src/js/components/entrypoint.js',       # Header entrypoint
            
            # Investor List - Trang danh sách nhà đầu tư
            'investor_list/static/src/js/investor_list/investor_list_widget.js',  # Widget chính
            'investor_list/static/src/js/investor_list/entrypoint.js',                      # Entrypoint
            'investor_list/static/src/css/header.css',
            'investor_list/static/src/css/investor_list.css',
        ],
        
        # Backend Assets - Cho Odoo backend interface
        'web.assets_backend': [
            # Components - Header và navigation
            'investor_list/static/src/js/components/header.js',           # Header component
            'investor_list/static/src/js/components/entrypoint.js',       # Header entrypoint
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
