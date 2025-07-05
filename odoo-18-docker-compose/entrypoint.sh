#!/bin/sh
# Render provides a PORT environment variable that we must use.
# Default to 8069 if PORT is not set (for local execution).
ODOO_HTTP_PORT=${PORT:-8069}

# Resolve database host – if the provided DB_HOST cannot be resolved (e.g. Render hostname on local), fallback to 'db'
RESOLVED_HOST=${DB_HOST:-}
if ! getent hosts "$RESOLVED_HOST" >/dev/null 2>&1; then
  echo "[entrypoint] DB_HOST '$RESOLVED_HOST' not resolvable – falling back to 'db'"
  RESOLVED_HOST="db"
fi

# Override environment so subprocess sees correct host
export DB_HOST="$RESOLVED_HOST"

# --- DEBUGGING STEP ---
# We are temporarily disabling ALL custom module installations.
# The goal is to verify if the basic Odoo service can start correctly.
# If this deploy succeeds, it confirms the problem is within one of the custom modules.
odoo -c /etc/odoo/odoo.conf \
     --http-port $ODOO_HTTP_PORT \
     --http-interface 0.0.0.0 \
     --db_host ${DB_HOST:-localhost} \
     --db_port ${DB_PORT:-5432} \
     --db_user ${DB_USER:-odoo} \
     --db_password ${DB_PASSWORD:-odoo} \
     --database ${DB_DATABASE:-odoo} \
     -i custom_auth,fund_management,overview_fund_management