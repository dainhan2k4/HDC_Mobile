#!/bin/sh
# Render provides a PORT environment variable that we must use.
# Default to 8069 if PORT is not set (for local execution).
ODOO_HTTP_PORT=${PORT:-8069}

# --- DEBUGGING STEP ---
# We are temporarily disabling ALL custom module installations.
# The goal is to verify if the basic Odoo service can start correctly.
# If this deploy succeeds, it confirms the problem is within one of the custom modules.
odoo -c /etc/odoo/odoo.conf \
     --http-port $ODOO_HTTP_PORT \
     --http-interface 0.0.0.0 \
     --db_host $DB_HOST \
     --db_port $DB_PORT \
     --db_user $DB_USER \
     --db_password $DB_PASSWORD \
     --database $DB_DATABASE