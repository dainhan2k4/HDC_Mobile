#!/bin/sh
# Render provides a PORT environment variable that we must use.
# Default to 8069 if PORT is not set (for local execution).
ODOO_HTTP_PORT=${PORT:-8069}

# Install Python packages from requirements.txt (as non-root inside container)
echo "Installing Python packages from requirements.txt..."
if [ -f "/etc/odoo/requirements.txt" ]; then
    python3 -m pip install --no-input --disable-pip-version-check --root-user-action=ignore --break-system-packages -r /etc/odoo/requirements.txt
    echo "Python packages installed successfully"
else
    echo "requirements.txt not found"
fi

# Resolve database host – if the provided DB_HOST cannot be resolved (e.g. Render hostname on local), fallback to 'db'
RESOLVED_HOST=${DB_HOST:-}
if ! getent hosts "$RESOLVED_HOST" >/dev/null 2>&1; then
  echo "[entrypoint] DB_HOST '$RESOLVED_HOST' not resolvable – falling back to 'db'"
  RESOLVED_HOST="db"
fi

# Override environment so subprocess sees correct host
export DB_HOST="$RESOLVED_HOST"

# Wait for Postgres to be ready before starting Odoo (no external deps)
echo "[entrypoint] Waiting for Postgres at ${DB_HOST}:${DB_PORT:-5432}..."
python3 - << 'PY'
import os, time, sys
import psycopg2

host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', '5432'))
user = os.environ.get('DB_USER', 'odoo')
password = os.environ.get('DB_PASSWORD', 'odoo')
# Connect to maintenance DB to verify server readiness
dbname = os.environ.get('DB_MAINTENANCE', 'postgres')

deadline_seconds = int(os.environ.get('DB_WAIT_TIMEOUT', '60'))
interval_seconds = 2
deadline = time.time() + deadline_seconds

last_err = None
while time.time() < deadline:
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        conn.close()
        print('[entrypoint] Postgres is ready')
        sys.exit(0)
    except Exception as e:
        last_err = e
        print(f"[entrypoint] Postgres not ready yet: {e}")
        time.sleep(interval_seconds)

print('[entrypoint] Timed out waiting for Postgres')
if last_err:
    print(last_err)
sys.exit(1)
PY

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
     --db_password ${DB_PASSWORD:-odoo}