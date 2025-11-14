@echo off
REM Script cài đặt tất cả custom addons cho Odoo 18 vào database anfan

echo 🚀 Bắt đầu cài đặt custom addons vào database anfan...

REM Danh sách các addons cần install
set ADDONS=fund_management,investor_profile_management,asset_management,transaction_list,transaction_management,investor_list,nav_management,overview_fund_management,report_list,fund_management_control,custom_auth,sign_oca,stock_data,stock_trading,payos_gateway

echo 📦 Danh sách addons sẽ cài: %ADDONS%
echo.
echo ⚠️  Lưu ý: Nếu database anfan chưa tồn tại, vui lòng tạo database trước qua Odoo web interface
echo    Truy cập: http://localhost:11018
echo.

REM Cài đặt addons vào database anfan với đầy đủ thông tin kết nối
echo 🔄 Đang cài đặt addons...
docker exec odoo-18-docker-compose-odoo18-1 odoo -c /etc/odoo/odoo.conf -d anfan --db_host=db --db_port=5432 --db_user=odoo --db_password=odoo18@2024 -i %ADDONS% --stop-after-init

if %ERRORLEVEL% EQU 0 (
    echo ✅ Hoàn thành cài đặt addons!
) else (
    echo ⚠️  Có lỗi xảy ra. Có thể database anfan chưa tồn tại.
    echo    Vui lòng:
    echo    1. Truy cập http://localhost:11018
    echo    2. Tạo database anfan (nếu chưa có)
    echo    3. Chạy lại script này
)

echo.
echo 🔄 Khởi động lại Odoo container...
docker restart odoo-18-docker-compose-odoo18-1

echo.
echo ✅ Hoàn tất! Kiểm tra Odoo tại http://localhost:11018
pause







