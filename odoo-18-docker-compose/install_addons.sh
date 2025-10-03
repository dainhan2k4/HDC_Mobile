#!/bin/bash
# Script cài đặt tất cả custom addons cho Odoo 18

echo "🚀 Bắt đầu cài đặt custom addons..."

# Danh sách các addons cần install theo thứ tự dependency
ADDONS=(
    "fund_management"
    "investor_profile_management"
    "asset_management"
    "transaction_list"
    "transaction_management"
    "investor_list"
    "nav_management"
    "overview_fund_management"
    "report_list"
    "fund_management_control"
    "stock_market_data"
    "custom_auth"
    "sign_oca"
)

# Join array thành chuỗi phân cách bằng dấu phẩy
ADDON_LIST=$(IFS=, ; echo "${ADDONS[*]}")

echo "📦 Danh sách addons sẽ cài: $ADDON_LIST"

# Cài đặt addons vào database p2p
docker exec -it odoo-18-docker-compose-odoo18-1 odoo \
    -c /etc/odoo/odoo.conf \
    -d p2p \
    -i "$ADDON_LIST" \
    --stop-after-init \
    --no-http

echo "✅ Hoàn thành cài đặt addons!"
echo "🔄 Khởi động lại Odoo container..."

docker restart odoo-18-docker-compose-odoo18-1

echo "✅ Xong! Các endpoints API giờ đã sẵn sàng."

