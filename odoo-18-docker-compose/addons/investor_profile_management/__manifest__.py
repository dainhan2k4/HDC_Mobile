{
    'name': 'Investor Profile Management',
    'version': '1.0',
    'category': 'Investor',
    'summary': 'Manage investor profiles and related information',
    'description': """
        This module provides functionality to manage investor profiles including:
        - Personal information
        - Bank accounts
        - Addresses
        - ID documents
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': ['base', 'crm', 'web', 'portal'],
    'data': [
        'security/ir.model.access.csv',
        'views/menu_views.xml',
        'views/status_info_views.xml',
        'views/personal_info_view.xml',
        'views/bank_info_view.xml',
        'views/address_info_view.xml',
        'views/res_partner_profiles_views.xml',
        'views/res_partner_bank_views.xml',
        'views/res_partner_address_views.xml',
        'views/res_partner_hide_view.xml',
        'views/res_partner_status_views.xml',
        'views/personal_profile/personal_profile_page.xml',
        'views/bank_info/bank_info_page.xml',
        'views/address_info/address_info_page.xml',
        'views/verification/verification_page.xml',
        'views/verification/ekyc_verification_page.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'investor_profile_management/static/src/js/personal_profile/entrypoint.js',
            'investor_profile_management/static/src/js/personal_profile/personal_profile_widget.js',
            'investor_profile_management/static/src/js/bank_info/entrypoint.js',
            'investor_profile_management/static/src/js/bank_info/bank_info_widget.js',
            'investor_profile_management/static/src/js/address_info/entrypoint.js',
            'investor_profile_management/static/src/js/address_info/address_info_widget.js',
            'investor_profile_management/static/src/js/verification/entrypoint.js',
            'investor_profile_management/static/src/js/verification/verification_widget.js',
        ],
    },
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
