#!/bin/sh
# Render provides a PORT environment variable that we must use.
# Default to 8069 if PORT is not set (for local execution).
ODOO_HTTP_PORT=${PORT:-8069}

# Start Odoo
# --http-port: Use the port assigned by Render.
# --http-interface 0.0.0.0: Listen on all network interfaces, crucial for Render.
odoo -c /etc/odoo/odoo.conf \
     --http-port $ODOO_HTTP_PORT \
     --http-interface 0.0.0.0 \
     -i fund_management,custom_auth,investor_profile_management,asset_management,overview_fund_management,transaction_management \
     --db_host $DB_HOST \
     --db_port $DB_PORT \
     --db_user $DB_USER \
     --db_password $DB_PASSWORD \
     --database $DB_DATABASE \
     --load-language=vi_VN