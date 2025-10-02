# -*- coding: utf-8 -*-
{
    "name": "Live Stock Market Data",
    "version": "18.0.0.1",
    "summary": "Live Stock Market Data",
    "sequence": 2,
    "category": "Other",
    "website": "https://www.vperfectcs.com",
    "author": "VperfectCS",
    "maintainer": "VperfectCS",
    "description": """Live Stock Market Data""",
    "images": ["static/description/banner.png"],
    "depends": ["crm"],
    'external_dependencies': {
        'python': ['nsepython']
    },
    "data": [
        "security/ir.model.access.csv",
        "data/cron_job.xml",
        "views/stock_market_data_view.xml",
        "views/dashboard.xml",
        "views/allIndices_view.xml",
        "views/watchlist.xml",
        "views/menu.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "/stock_market_data/static/src/js/dashbord_view_owl.js",
            "/stock_market_data/static/src/xml/dashboard_owl.xml",
            "/stock_market_data/static/src/css/dashboard.css",
            "/stock_market_data/static/src/css/kanban_view.css",
        ],
    },
    "license": "LGPL-3",
    "post_init_hook": "_stock_market_data_post_hook",
    "installable": True,
    "application": True,
    "auto_install": False,
}
