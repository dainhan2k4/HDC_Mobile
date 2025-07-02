#!/bin/bash

echo "=== Odoo Development Environment Status ==="
echo ""

echo "1. Container Status:"
docker-compose ps
echo ""

echo "2. Mount Volumes:"
docker-compose exec odoo18 ls -la /mnt/extra-addons
echo ""

echo "3. Odoo Configuration:"
docker-compose exec odoo18 cat /etc/odoo/odoo.conf | grep -E "(dev_mode|addons_path)"
echo ""

echo "4. Recent Logs:"
docker-compose logs --tail=10 odoo18
echo ""

echo "=== Access URLs ==="
echo "Odoo Web Interface: http://localhost:10018"
echo "Live Chat: http://localhost:20018"
echo "Database Manager: http://localhost:10018/web/database/manager" 