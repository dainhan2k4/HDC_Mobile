# -*- coding: utf-8 -*-
{
    'name': 'Stock Trading',
    'version': '18.0.1.0.0',
    'category': 'Finance',
    'summary': 'Quản lý giao dịch chứng khoán qua FastConnect Trading API',
    'description': """
Module này cung cấp chức năng quản lý giao dịch chứng khoán thông qua FastConnect Trading API của SSI:
- Quản lý cấu hình API (Consumer ID, Secret, Private Key)
- Đặt lệnh mua/bán (Stock & Derivatives)
- Quản lý lệnh (Sửa, Hủy)
- Xem số dư tài khoản & vị thế
- Quản lý tiền mặt (Cash Management)
- Đăng ký quyền mua (Online Right Subscription)
- Chuyển khoản cổ phiếu (Stock Transfer)
- Lịch sử giao dịch & sổ lệnh
- Streaming real-time qua SignalR
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        'portal',  # Để tạo portal pages
        'stock_data',  # Để link với dữ liệu chứng khoán
        'investor_list',  # Để quản lý danh sách nhà đầu tư
    ],
    'external_dependencies': {
        'python': ['ssi-fctrading'],
    },
    'data': [
        'security/ir.model.access.csv',
        'data/trading_cron.xml',
        'views/trading_config_views.xml',
        'views/trading_order_views.xml',
        'views/trading_account_views.xml',
        'views/trading_cash_views.xml',
        'views/trading_ors_views.xml',
        'views/trading_stock_transfer_views.xml',
        'views/trading_history_views.xml',
        'views/trading_menus.xml',
        'views/trading_portal/trading_portal_templates.xml',
    ],
    'demo': [],
    'assets': {
        'web.assets_backend': [
            'stock_trading/static/src/css/trading.css',
        ],
        'web.assets_frontend': [
            'stock_trading/static/src/js/trading_portal.js',
            'stock_trading/static/src/css/trading_portal.css',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}

