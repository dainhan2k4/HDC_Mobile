{
    'name': "Fund Management",
    'version': '1.1',
    'depends': ['base', 'web', 'mail'],
    'author': "Danh",
    'category': 'Assets',
    'summary': "A module for managing Fund",
    'description': """
        This module helps in managing Fund.
    """,
    'data': [
        'data/fund_data.xml',

        'views/fund/fund_action.xml',
        'views/fund/fund_menu.xml',
        'views/fund/fund.xml',

        'views/header.xml',

        'views/fund/fund_page.xml',

        'views/fund/fund_compare.xml',

        'views/fund/fund_buy/fund_buy.xml',

        'views/fund/fund_buy/fund_confirm.xml',

        'views/fund/fund_buy/fund_result.xml',

        'views/fund/fund_buy/fee_template.xml',

        'views/fund/fund_buy/terms_modal_template.xml',

        'views/fund/fund_buy/signature_modal_template.xml',

        'views/fund/fund_sell/fund_sell.xml',

        'views/fund/fund_sell/fund_sell_confirm.xml',

        'views/portfolio/investment_portfolio.xml',

        'views/account_balance/account_balance_page.xml',

        'security/ir.model.access.csv',
    ],
    'demo': [
    ],
    'assets': {
        'web.assets_frontend': [
            'https://cdn.jsdelivr.net/npm/sweetalert2@11',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'fund_management/static/src/css/steps.css',
            'fund_management/static/src/css/fund_widget.css',

            'fund_management/static/src/xml/fund_templates.xml',
            'fund_management/static/src/js/fund/entry_fund.js',
            'fund_management/static/src/js/fund/fund_widget.js',

            'fund_management/static/src/js/fund/fund_buy/fund_buy.js',
            'fund_management/static/src/js/fund/fund_buy/signature_utils.js',
            'fund_management/static/src/js/fund/fund_buy/fund_confirm.js',
            'fund_management/static/src/js/fund/fund_buy/fund_result.js',

            'fund_management/static/src/js/fund/fund_sell/fund_sell.js'
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}
