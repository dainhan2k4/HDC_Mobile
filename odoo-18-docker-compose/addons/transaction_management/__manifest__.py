{
    'name': 'Transaction Management',
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
        # Website Templates - Trang web frontend
        'views/transaction_trading/transaction_pending_page.xml',  # Trang quản lý giao dịch
        'views/transaction_trading/transaction_order_page.xml',  # Trang lịch sử giao dịch
        'views/transaction_trading/transaction_periodic_page.xml',  # Trang quản lý định kỳ
    ],
    # Assets - JavaScript và CSS files
    'assets': {
        # Frontend Assets - Cho website pages
        'web.assets_frontend': [       # Header entrypoint
            'transaction_management/static/src/js/transaction_management/pending_widget.js',
            'transaction_management/static/src/js/transaction_management/order_widget.js',
            'transaction_management/static/src/js/transaction_management/periodic_widget.js',
            'transaction_management/static/src/js/transaction_management/entrypoint.js',
        ],
        # Backend Assets - Cho Odoo backend interface
        'web.assets_backend': [      # Header entrypoint
            'transaction_management/static/src/js/transaction_management/pending_widget.js',
            'transaction_management/static/src/js/transaction_management/order_widget.js',
            'transaction_management/static/src/js/transaction_management/periodic_widget.js',
            'transaction_management/static/src/js/transaction_management/entrypoint.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
