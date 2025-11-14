{
    'name': 'Stock Data',
    'version': '18.0.1.0.0',
    'category': 'Financial',
    'summary': 'Stock Data integration via SSI FastConnect API',
    'description': """
        Module tích hợp dữ liệu thị trường chứng khoán từ SSI FastConnect Data API:
        - Lấy danh sách chứng khoán (Securities)
        - Dữ liệu OHLC hàng ngày (Daily OHLC)
        - Dữ liệu OHLC trong ngày (Intraday OHLC)
        - Danh sách chỉ số (Index List)
        - Thành phần chỉ số (Index Components)
        - Tự động cập nhật dữ liệu
    """,
    'author': 'HDC',
    'website': 'https://www.hdc.com.vn',
    'license': 'LGPL-3',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'data/api_config_data.xml',
        'data/ir_cron_data.xml',
        'views/api_config_views.xml',
        'views/securities_views.xml',
        'views/wizard_views.xml',
        'views/daily_ohlc_views.xml',
        'views/index_views.xml',
        'views/daily_index_views.xml',
        'views/menu_views.xml',
    ],
    'external_dependencies': {
        'python': ['ssi_fc_data'],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}


