(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF'
diff --git a/API_DOCUMENTATION_CURRENT.md b/API_DOCUMENTATION_CURRENT.md
--- a/API_DOCUMENTATION_CURRENT.md
+++ b/API_DOCUMENTATION_CURRENT.md
@@ -0,0 +1,574 @@
+# Tài liệu API Hệ thống Quản lý Quỹ Đầu tư
+
+**Base URL:** `http://localhost:10018`  
+**Phiên bản:** 1.0  
+**Ngày cập nhật:** 2024
+
+## 🔗 Tổng quan
+
+API này cung cấp các endpoint cho hệ thống quản lý quỹ đầu tư, bao gồm:
+- Xác thực người dùng
+- Quản lý quỹ đầu tư
+- Quản lý danh mục đầu tư
+- Quản lý hồ sơ nhà đầu tư
+- Quản lý giao dịch
+
+---
+
+## 🔐 1. Authentication & Authorization
+
+### 1.1 Đăng ký với OTP
+```http
+POST /web/signup/otp
+Content-Type: application/json
+
+{
+  "email": "user@example.com"
+}
+```
+
+**Response:**
+```json
+{
+  "success": true,
+  "otp": "123456",
+  "message": "OTP đã được gửi đến email"
+}
+```
+
+### 1.2 Xác thực OTP
+```http
+POST /web/signup/verify-otp
+Content-Type: application/json
+
+{
+  "email": "user@example.com",
+  "otp": "123456"
+}
+```
+
+**Response:**
+```json
+{
+  "success": true,
+  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
+  "user": {
+    "id": 1,
+    "email": "user@example.com",
+    "name": "Nguyễn Văn A"
+  }
+}
+```
+
+**Authorization Header:**
+```
+Authorization: Bearer <token>
+```
+
+---
+
+## 💰 2. Fund Management
+
+### 2.1 Lấy danh sách quỹ
+```http
+GET /data_fund
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 1,
+    "ticker": "VFM-VN30",
+    "name": "Vietnam 30 Fund",
+    "description": "Quỹ đầu tư vào 30 cổ phiếu hàng đầu VN",
+    "current_ytd": 12.5,
+    "current_nav": 25000,
+    "investment_type": "equity",
+    "risk_level": "medium",
+    "min_investment": 1000000,
+    "management_fee": 1.5
+  },
+  {
+    "id": 2,
+    "ticker": "VBF-BOND",
+    "name": "Vietnam Bond Fund",
+    "description": "Quỹ đầu tư trái phiếu",
+    "current_ytd": 8.2,
+    "current_nav": 11500,
+    "investment_type": "bond",
+    "risk_level": "low",
+    "min_investment": 500000,
+    "management_fee": 0.8
+  }
+]
+```
+
+### 2.2 Widget quỹ (HTML)
+```http
+GET /fund_widget
+```
+Trả về trang HTML hiển thị danh sách quỹ với giao diện người dùng.
+
+### 2.3 So sánh quỹ
+```http
+GET /fund_compare?funds=1,2,3
+```
+Trang so sánh các quỹ được chọn.
+
+### 2.4 Trang mua quỹ
+```http
+GET /fund_buy?fund_id=1
+```
+
+### 2.5 Trang bán quỹ
+```http
+GET /fund_sell?investment_id=1
+```
+
+---
+
+## 📊 3. Investment Management
+
+### 3.1 Tạo khoản đầu tư mới
+```http
+POST /create_investment
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "fund_id": 1,
+  "amount": 2500000,
+  "units": 100.5
+}
+```
+
+**Response:**
+```json
+{
+  "success": true,
+  "message": "Đã tạo investment thành công",
+  "id": 123,
+  "investment": {
+    "id": 123,
+    "fund_id": 1,
+    "amount": 2500000,
+    "units": 100.5,
+    "nav_price": 24876,
+    "created_date": "2024-01-15T10:30:00Z"
+  }
+}
+```
+
+### 3.2 Lấy danh sách đầu tư
+```http
+GET /data_investment
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 1,
+    "fund_id": 5,
+    "fund_name": "Vietnam Growth Fund",
+    "fund_ticker": "VGF",
+    "units": 100.5,
+    "amount": 2500000,
+    "current_nav": 25000,
+    "current_value": 2512500,
+    "profit_loss": 12500,
+    "profit_loss_percent": 0.5,
+    "investment_type": "equity",
+    "investment_date": "2024-01-15T10:30:00Z"
+  }
+]
+```
+
+### 3.3 Bán quỹ
+```http
+POST /submit_fund_sell
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "investment_id": 1,
+  "quantity": 50,
+  "estimated_value": 1250000
+}
+```
+
+**Response:**
+```json
+{
+  "success": true,
+  "message": "Cập nhật investment thành công",
+  "transaction_id": "TXN_20240115_001",
+  "estimated_proceeds": 1250000
+}
+```
+
+---
+
+## 📈 4. Portfolio Management
+
+### 4.1 Dashboard đầu tư
+```http
+GET /investment_dashboard
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+{
+  "total_investment": 5000000,
+  "current_value": 5125000,
+  "total_profit": 125000,
+  "profit_percent": 2.5,
+  "asset_allocation": {
+    "equity": 60,
+    "bond": 30,
+    "cash": 10
+  },
+  "recent_transactions": [
+    {
+      "id": 1,
+      "type": "buy",
+      "fund_name": "VN30 Fund",
+      "amount": 1000000,
+      "date": "2024-01-15"
+    }
+  ]
+}
+```
+
+### 4.2 Widget danh mục
+```http
+GET /portfolio_widget
+```
+Trang HTML hiển thị widget danh mục đầu tư.
+
+---
+
+## 👤 5. Investor Profile Management
+
+### 5.1 Lấy thông tin cá nhân
+```http
+GET /data_personal_profile
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 1,
+    "name": "Nguyễn Văn A",
+    "email": "a@example.com",
+    "phone": "0123456789",
+    "birth_date": "1990-01-01",
+    "gender": "male",
+    "nationality": 230,
+    "id_type": "citizen_id",
+    "id_number": "123456789",
+    "id_issue_date": "2010-01-01",
+    "id_issue_place": "Hà Nội",
+    "verification_status": "verified",
+    "kyc_level": "full"
+  }
+]
+```
+
+### 5.2 Cập nhật thông tin cá nhân
+```http
+POST /save_personal_profile
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "name": "Nguyễn Văn A",
+  "phone": "0123456789",
+  "birth_date": "1990-01-01",
+  "gender": "male",
+  "nationality": 230,
+  "id_type": "citizen_id",
+  "id_number": "123456789",
+  "id_issue_date": "2010-01-01",
+  "id_issue_place": "Hà Nội"
+}
+```
+
+### 5.3 Upload ảnh CMND/CCCD
+```http
+POST /upload_id_image
+Authorization: Bearer <token>
+Content-Type: multipart/form-data
+
+{
+  "id_front": <file>,
+  "id_back": <file>
+}
+```
+
+### 5.4 Lưu tất cả thông tin
+```http
+POST /save_all_profile_data
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "personal_info": { ... },
+  "bank_info": { ... },
+  "address_info": { ... }
+}
+```
+
+---
+
+## 🏦 6. Banking Information
+
+### 6.1 Lấy thông tin ngân hàng
+```http
+GET /data_bank_info
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 1,
+    "account_holder": "Nguyễn Văn A",
+    "account_number": "0123456789",
+    "bank_name": "Vietcombank",
+    "bank_code": "VCB",
+    "branch": "Hoàn Kiếm",
+    "is_primary": true
+  }
+]
+```
+
+### 6.2 Cập nhật thông tin ngân hàng
+```http
+POST /save_bank_info
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "account_holder": "Nguyễn Văn A",
+  "account_number": "0123456789",
+  "bank_name": "Vietcombank",
+  "branch": "Hoàn Kiếm"
+}
+```
+
+---
+
+## 📍 7. Address Information
+
+### 7.1 Lấy thông tin địa chỉ
+```http
+GET /data_address_info
+Authorization: Bearer <token>
+```
+
+### 7.2 Cập nhật địa chỉ
+```http
+POST /save_address_info
+Authorization: Bearer <token>
+Content-Type: application/json
+
+{
+  "street": "123 Đường ABC",
+  "ward": "Phường XYZ",
+  "district": "Quận 1",
+  "city": "TP. Hồ Chí Minh",
+  "country": "Vietnam",
+  "postal_code": "700000"
+}
+```
+
+---
+
+## 💳 8. Transaction Management
+
+### 8.1 Giao dịch định kỳ
+```http
+GET /transaction_management/periodic
+Authorization: Bearer <token>
+```
+
+### 8.2 Lệnh giao dịch
+```http
+GET /transaction_management/order
+Authorization: Bearer <token>
+```
+
+### 8.3 Giao dịch chờ xử lý
+```http
+GET /transaction_management/pending
+Authorization: Bearer <token>
+```
+
+---
+
+## 💰 9. Account Balance
+
+### 9.1 Xem số dư
+```http
+GET /account_balance
+```
+
+**Response:**
+```json
+{
+  "available_balance": 5000000,
+  "invested_amount": 15000000,
+  "pending_transactions": 500000,
+  "total_portfolio_value": 15750000,
+  "currency": "VND"
+}
+```
+
+---
+
+## 🌍 10. Reference Data
+
+### 10.1 Danh sách quốc gia
+```http
+GET /get_countries
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 230,
+    "name": "Vietnam",
+    "code": "VN"
+  }
+]
+```
+
+### 10.2 Danh sách tiền tệ
+```http
+GET /get_currencies
+Authorization: Bearer <token>
+```
+
+**Response:**
+```json
+[
+  {
+    "id": 1,
+    "name": "VND",
+    "symbol": "₫",
+    "code": "VND"
+  }
+]
+```
+
+### 10.3 Thông tin trạng thái
+```http
+GET /get_status_info
+Authorization: Bearer <token>
+```
+
+---
+
+## 🏢 11. Asset Management
+
+### 11.1 Quản lý tài sản
+```http
+GET /asset-management
+Authorization: Bearer <token>
+```
+
+---
+
+## ⚠️ 12. Error Handling
+
+Tất cả API đều trả về error theo format chuẩn:
+
+```json
+{
+  "success": false,
+  "error": "ERROR_CODE",
+  "message": "Mô tả lỗi bằng tiếng Việt"
+}
+```
+
+### Mã lỗi phổ biến:
+- `AUTH_REQUIRED`: Cần đăng nhập
+- `INVALID_TOKEN`: Token không hợp lệ
+- `TOKEN_EXPIRED`: Token đã hết hạn
+- `NOT_FOUND`: Không tìm thấy tài nguyên
+- `VALIDATION_ERROR`: Dữ liệu đầu vào không hợp lệ
+- `INSUFFICIENT_BALANCE`: Số dư không đủ
+- `FUND_NOT_AVAILABLE`: Quỹ không khả dụng
+
+---
+
+## 📱 13. Client Integration Examples
+
+### JavaScript/React Native
+```javascript
+// Cấu hình base API
+const API_BASE = 'http://localhost:10018';
+
+// Lấy danh sách quỹ
+const getFunds = async () => {
+  const response = await fetch(`${API_BASE}/data_fund`);
+  return response.json();
+};
+
+// Tạo đầu tư với token
+const createInvestment = async (investmentData, token) => {
+  const response = await fetch(`${API_BASE}/create_investment`, {
+    method: 'POST',
+    headers: {
+      'Content-Type': 'application/json',
+      'Authorization': `Bearer ${token}`
+    },
+    body: JSON.stringify(investmentData)
+  });
+  return response.json();
+};
+```
+
+### cURL Examples
+```bash
+# Lấy danh sách quỹ
+curl -X GET http://localhost:10018/data_fund
+
+# Tạo đầu tư
+curl -X POST http://localhost:10018/create_investment \
+  -H "Content-Type: application/json" \
+  -H "Authorization: Bearer YOUR_TOKEN" \
+  -d '{"fund_id": 1, "amount": 2500000, "units": 100.5}'
+```
+
+---
+
+## 🔒 14. Security & Best Practices
+
+1. **Authentication**: Sử dụng JWT token trong header `Authorization`
+2. **HTTPS**: Luôn sử dụng HTTPS trong production
+3. **Rate Limiting**: API có giới hạn số request per IP
+4. **CORS**: Đã cấu hình CORS cho phép cross-origin requests
+5. **Input Validation**: Tất cả input đều được validate
+6. **Error Handling**: Không expose sensitive information trong error messages
+
+---
+
+## 📞 15. Support & Contact
+
+- **Email**: support@fundinvestment.com
+- **Documentation**: Cập nhật thường xuyên
+- **Environment**: Development server tại `localhost:10018`
+
+---
+
+*Tài liệu này được cập nhật liên tục. Vui lòng check phiên bản mới nhất trước khi tích hợp.*
EOF
)