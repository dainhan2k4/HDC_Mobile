# -*- coding: utf-8 -*-
{
    "name": "Quản lý Quỹ (Fund Management)",
    "summary": """Quản lý các sản phẩm chứng chỉ quỹ, chương trình, biểu phí và các cài đặt liên quan.""",
    "description": """Module này cung cấp các chức năng để quản lý toàn diện các quỹ đầu tư.""",
    "author": "Your Company Name",
    "website": "https://www.yourcompany.com",
    "category": "",
    "version": "18.0.0.0.0",
    "depends": ["base", "crm", "web", "bus"],
    "data": [
        "security/ir.model.access.csv",
        "data/product_data.xml",
        "views/sidebar.xml",
        "views/fund_certificate/fund_certificate_page.xml",
        "views/fund_certificate/fund_certificate_form.xml",
        "views/fund_certificate/fund_certificate_edit_form.xml",
        "views/scheme_type/scheme_type_page.xml",
        "views/scheme_type/scheme_type_form.xml",
        "views/scheme_type/scheme_type_edit_form.xml",
        "views/scheme/scheme_page.xml",
        "views/scheme/scheme_form.xml",
        "views/scheme/scheme_edit_form.xml",
        "views/fee_schedule/fee_schedule_page.xml",
        "views/fee_schedule/fee_schedule_form.xml",
        "views/fee_schedule/fee_schedule_edit_form.xml",
        "views/sip_settings/sip_settings_page.xml",
        "views/sip_settings/sip_settings_form.xml",
        "views/sip_settings/sip_settings_edit_form.xml",
        "views/tax_settings/tax_settings_page.xml",
        "views/tax_settings/tax_settings_form.xml",
        "views/tax_settings/tax_settings_edit_form.xml",
        "views/chatbot_ai/chatbot_menu.xml",
        # Data Management
        "views/holiday_page.xml",
        "views/holiday_form.xml",
        "views/bank_page.xml",
        "views/bank_form.xml",
        "views/bank_branch_page.xml",
        "views/bank_branch_form.xml",
        "views/country_page.xml",
        "views/country_form.xml",
        "views/city_page.xml",
        "views/city_form.xml",
        "views/ward_page.xml",
        "views/ward_form.xml",
    ],
    "assets": {
        "web.assets_backend": [
            # 0. Widget Mounting Service (PHẢI TẢI ĐẦU TIÊN)
            "fund_management_control/static/src/js/widget_mounting_service.js",
            # 2. Tải các file định nghĩa widget
            # Chứng chỉ quỹ
            "fund_management_control/static/src/js/fund_certificate/fund_certificate_widget.js",
            # Loại chương trình
            "fund_management_control/static/src/js/scheme_type/scheme_type_widget.js",
            # Chương trình
            "fund_management_control/static/src/js/scheme/scheme_widget.js",
            # Biểu phí
            "fund_management_control/static/src/js/fee_schedule/fee_schedule_widget.js",
            # Sip Settings
            "fund_management_control/static/src/js/sip_settings/sip_settings_widget.js",
            # Cài đặt Thuế
            "fund_management_control/static/src/js/tax_settings/tax_settings_widget.js",
            #
            "fund_management_control/static/src/js/chatbot_ai/chatbot_ai_widget.js",
            # 3. Tải các file entrypoint CUỐI CÙNG
            # Chứng chỉ quỹ
            "fund_management_control/static/src/js/fund_certificate/entrypoint.js",
            # Loại chương trình
            "fund_management_control/static/src/js/scheme_type/entrypoint.js",
            # Chương trình
            "fund_management_control/static/src/js/scheme/entrypoint.js",
            # Biểu phí
            "fund_management_control/static/src/js/fee_schedule/entrypoint.js",
            # Sip Settings
            "fund_management_control/static/src/js/sip_settings/entrypoint.js",
            # Cài đặt Thuế
            "fund_management_control/static/src/js/tax_settings/entrypoint.js",
            # Chatbot AI widget (Floating Action Button)
            "fund_management_control/static/src/js/chatbot_ai/entrypoint.js",
            # Data Management
            "fund_management_control/static/src/js/holiday/holiday_widget.js",
            "fund_management_control/static/src/js/holiday/entrypoint.js",
            "fund_management_control/static/src/js/bank/bank_widget.js",
            "fund_management_control/static/src/js/bank/entrypoint.js",
            "fund_management_control/static/src/js/bank_branch/bank_branch_widget.js",
            "fund_management_control/static/src/js/bank_branch/entrypoint.js",
            "fund_management_control/static/src/js/country/country_widget.js",
            "fund_management_control/static/src/js/country/entrypoint.js",
            "fund_management_control/static/src/js/city/city_widget.js",
            "fund_management_control/static/src/js/city/entrypoint.js",
            "fund_management_control/static/src/js/ward/ward_widget.js",
            "fund_management_control/static/src/js/ward/entrypoint.js",
        ],
    },
    "application": True,
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}
