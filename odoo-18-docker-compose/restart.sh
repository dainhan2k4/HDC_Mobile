#!/bin/bash

echo "Restarting Odoo container..."
docker-compose restart odoo18

echo "Waiting for Odoo to start..."
sleep 10

echo "Odoo container restarted successfully!"
echo "You can access Odoo at: http://localhost:10018" 