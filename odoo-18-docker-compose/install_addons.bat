@echo off
REM Script cài đặt tất cả custom addons cho Odoo 18 trên Windows

echo 🚀 Bắt đầu cài đặt custom addons...

REM Danh sách các addons cần install
set ADDONS=web,fund_management,investor_profile_management,asset_management,transaction_list,transaction_management,investor_list,nav_management,overview_fund_management,report_list,fund_management_control,custom_auth,sign_oca,stock_data,stock_trading,payos_gateway

echo 📦 Danh sách addons sẽ cài: %ADDONS%

REM Cài đặt addons vào database anfan
docker exec odoo-18-docker-compose-odoo18-1 odoo ^
  -c /etc/odoo/odoo.conf ^
  -d anfan ^
  --db_host=db --db_port=5432 --db_user=odoo --db_password=odoo18@2024 ^
  -i %ADDONS% --stop-after-init

echo ✅ Hoàn thành cài đặt addons!
echo 🔄 Khởi động lại Odoo container...

docker restart odoo-18-docker-compose-odoo18-1

echo ✅ Xong! Các endpoints API giờ đã sẵn sàng.
pause

