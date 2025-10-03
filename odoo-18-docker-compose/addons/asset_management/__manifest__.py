{
    'name': 'Asset Management',
    'version': '1.0',
    'category': 'Finance',
    'summary': 'Quản lý tài sản',
    'description': """
        Module này cung cấp chức năng quản lý tài sản:
        * Quản lý tài sản
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'web',
        'mail',
        'portal',
        'overview_fund_management'
    ],
    'data': [
        'views/asset_management/asset_management_page.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'asset_management/static/src/css/asset_management_custom.css',
            'asset_management/static/src/js/asset_management/asset_management_widget.js',
            'asset_management/static/src/js/asset_management/entrypoint.js',
        ],
        'web.assets_backend': [
            'asset_management/static/src/js/asset_management/asset_management_widget.js',
            'asset_management/static/src/js/asset_management/entrypoint.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
