{
    'name': "Fund Management",
    'version': '1.1',
    'depends': ['base', 'web', 'mail', 'fund_management_control'],
    'author': "Danh",
    'category': 'Assets',
    'summary': "A module for managing Fund",
    'description': """
        This module helps in managing Fund.
    """,
    'data': [
        # Core views (load views before actions)
        'views/fund/fund.xml',
        
        # Investment views (must load before fund_action.xml)
        'views/investment/investment_views.xml',
        
        # Transaction views (must load before fund_action.xml)
        'views/transaction/transaction_views.xml',
        
        # Actions (load after views are defined)
        'views/fund/fund_action.xml',
        'views/fund/fund_menu.xml',

        # Account Balance views
        'views/account_balance/account_balance_views.xml',
        'views/account_balance/account_balance_page.xml',
        
        # Balance History views
        'views/balance_history/balance_history_views.xml',
        
        # Comparison views
        'views/comparison/comparison_views.xml',
        
        # Signed Contract views
        'views/signed_contract/signed_contract_views.xml',
        
        # Frontend pages
        'views/fund/fund_page.xml',
        'views/fund/fund_compare.xml',

        # Fund Buy templates
        'views/fund/fund_buy/fund_buy.xml',
        'views/fund/fund_buy/fund_confirm.xml',
        'views/fund/fund_buy/fund_result.xml',
        'views/fund/fund_buy/fee_template.xml',
        'views/fund/fund_buy/terms_modal_template.xml',
        'views/fund/fund_buy/signature_modal_template.xml',

        # Fund Sell templates
        'views/fund/fund_sell/fund_sell.xml',
        'views/fund/fund_sell/fund_sell_confirm.xml',

        # Data
        'data/fund_sync_cron.xml',
        'security/ir.model.access.csv',
    ],
    'demo': [
    ],
    'qweb': [],
    'assets': {
        'web.assets_frontend': [

            'fund_management/static/src/css/steps.css',
            'fund_management/static/src/css/fund_widget.css',
            'fund_management/static/src/css/fund_buy.css',
            'fund_management/static/src/css/smart_otp_popup.css',
            'fund_management/static/src/css/signature_modal.css',

            # OTP module
            'fund_management/static/src/js/otp/smart_otp_modal.js',

            'fund_management/static/src/js/fund/entry_fund.js',
            'fund_management/static/src/js/fund/fund_widget.js',

            'fund_management/static/src/js/fund/fund_buy/fund_buy.js',
            'fund_management/static/src/js/fund/fund_buy/fund_confirm.js',
            'fund_management/static/src/js/fund/fund_buy/fund_result.js',
            
            # Signature module
            'fund_management/static/src/js/fund/signature/signature_sign.js',

            'fund_management/static/src/js/fund/fund_sell/fund_sell.js'
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}

