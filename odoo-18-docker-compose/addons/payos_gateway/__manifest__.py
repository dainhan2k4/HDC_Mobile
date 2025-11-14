{
    'name': 'PayOS Gateway',
    'summary': 'Tích hợp PayOS: tạo payment link và webhook verify',
    'version': '1.0.0',
    'category': 'Accounting/Payment',
    'author': 'Internal',
    'license': 'LGPL-3',
    'depends': ['base'],
    'external_dependencies': {
        'python': ['requests', 'Crypto']
    },
    'data': [
        'data/payos_credentials_data.xml',
        'views/payos_settings.xml',
        'views/payos_config_views.xml',
    ],
    'installable': True,
    'application': True,
}


