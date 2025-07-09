(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF'
diff --git a/odoo-18-docker-compose/CLIENT_API_DOCUMENTATION_VI.md b/odoo-18-docker-compose/CLIENT_API_DOCUMENTATION_VI.md
--- a/odoo-18-docker-compose/CLIENT_API_DOCUMENTATION_VI.md
+++ b/odoo-18-docker-compose/CLIENT_API_DOCUMENTATION_VI.md
@@ -0,0 +1,213 @@
+# Tài liệu API cho Client
+
+_Tài liệu này tổng hợp các API REST do Odoo (thư mục `odoo-18-docker-compose/`) cung cấp và cách sử dụng chúng từ phía client (React-Native, Web, Postman …)._  
+Các **đường dẫn** dưới đây giả định môi trường local docker-compose với base-url:
+
+```
+http://localhost:10018
+```
+
+> Với môi trường production hãy thay thế domain và giao thức (https).
+
+---
+
+## 1. Xác thực (Custom Auth)
+
+| Hành động | Endpoint | Method | Loại auth | Body/Params | Phản hồi mẫu |
+|-----------|----------|--------|-----------|-------------|--------------|
+| Gửi OTP đăng ký | `/web/signup/otp` | POST (JSON) | Public | `{ "email": "a@example.com" }` | `{ "success": true, "otp": "123456" }` |
+| Xác thực OTP    | `/web/signup/verify-otp` | POST (JSON) | Public | `{ "email": "a@example.com", "otp": "123456" }` | `{ "success": true, "token": "..." }` |
+
+> Sau khi nhận `token`, client gửi kèm header: `Authorization: Bearer <token>`.
+
+---
+
+## 2. Fund Management
+
+| Hành động | Endpoint | Method | Auth |
+|-----------|----------|--------|------|
+| Danh sách quỹ | `/data_fund` | GET | none |
+| Widget quỹ (HTML) | `/fund_widget` | GET | none |
+| So sánh quỹ      | `/fund_compare` | GET | none |
+| Trang mua quỹ    | `/fund_buy`     | GET | none |
+| Xác nhận mua     | `/fund_confirm` | GET | none |
+| Kết quả giao dịch| `/fund_result`  | GET | none |
+| Trang bán quỹ    | `/fund_sell`    | GET | none |
+| Xác nhận bán     | `/fund_sell_confirm` | GET | none |
+
+### 2.1 Tạo khoản đầu tư
+
+```
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
+Phản hồi:
+
+```json
+{
+  "success": true,
+  "message": "Đã tạo investment thành công",
+  "id": 123
+}
+```
+
+### 2.2 Bán khoản đầu tư
+
+```
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
+---
+
+## 3. Portfolio / Dashboard
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| `/portfolio_widget` | GET | none | Trang widget danh mục đầu tư |
+| `/investment_dashboard` | GET | user | Dashboard tổng quan đầu tư |
+
+---
+
+## 4. Tài khoản & Số dư
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| `/account_balance` | GET | none | Xem số dư tài khoản |
+
+---
+
+## 5. Hồ sơ nhà đầu tư
+
+| Hành động | Endpoint | Method | Auth |
+|-----------|----------|--------|------|
+| Trang profile (HTML) | `/personal_profile` | GET | user |
+| Lấy dữ liệu profile  | `/data_personal_profile` | GET | user |
+| Lưu profile          | `/save_personal_profile` | POST | user |
+| Upload ảnh CMND/CCCD | `/upload_id_image` | POST multipart | user |
+| **Tổng hợp lưu**     | `/save_all_profile_data` | POST | user |
+| Lấy countries        | `/get_countries` | GET | user |
+| Lấy currencies       | `/get_currencies` | GET | user |
+| Lấy status info      | `/get_status_info` | GET | user |
+
+### 5.1 Cấu trúc `personalProfileData`
+
+```json
+{
+  "name": "Nguyễn Văn A",
+  "email": "a@example.com",
+  "phone": "0123456789",
+  "gender": "male",
+  "birth_date": "1990-01-01",
+  "nationality": 230,
+  "id_type": "citizen_id",
+  "id_number": "123456789",
+  "id_issue_date": "2010-01-01",
+  "id_issue_place": "Hà Nội"
+}
+```
+
+---
+
+## 6. Thông tin ngân hàng
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| Lấy bank info | `/data_bank_info` | GET | user |
+| Lưu bank info | `/save_bank_info` | POST | user |
+
+Body mẫu:
+
+```json
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
+## 7. Địa chỉ liên hệ
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| Lấy address info | `/data_address_info` | GET | user |
+| Lưu address info | `/save_address_info` | POST | user |
+
+---
+
+## 8. Quản lý giao dịch (Transaction Management)
+
+Các trang HTML (phù hợp khi nhúng widget):
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| `/transaction_management/periodic` | GET | user | Giao dịch định kỳ |
+| `/transaction_management/order`    | GET | user | Lệnh giao dịch |
+| `/transaction_management/pending`  | GET | user | Giao dịch chờ xử lý |
+
+---
+
+## 9. Quản lý tài sản
+
+| Endpoint | Method | Auth | Mô tả |
+|----------|--------|------|-------|
+| `/asset-management` | GET | user | Trang quản lý tài sản |
+
+---
+
+## 10. Lỗi & Xử lý
+
+Tất cả API sẽ trả về dạng:
+
+```json
+{
+  "success": false,
+  "error": "INVALID_TOKEN",
+  "message": "Phiên đăng nhập đã hết hạn"
+}
+```
+
+Các mã lỗi phổ biến:
+
+* `AUTH_REQUIRED`
+* `INVALID_TOKEN`
+* `TOKEN_EXPIRED`
+* `NOT_FOUND`
+* `VALIDATION_ERROR`
+EOF
+)
+
+# ===== TRANSACTION MANAGEMENT API =====
+
+## API Middleware Endpoints
+
+API middleware chạy trên port 3001 cung cấp các endpoints RESTful để lấy data transaction_management:
+
+**Base URL:** `http://localhost:3001/api/v1`
+
+### 1. Lấy danh sách giao dịch pending
+```
+GET /api/v1/transaction/pending
+```
+
+**Query Parameters:**
+- `userId` (optional): ID của user để filter
+- `page` (optional): Trang hiện tại (mặc định: 1)
+- `limit` (optional): Số lượng items mỗi trang (mặc định: 20)
+
+**Response:**
+```json
+{
+  "success": true,
+  "message": "Pending transactions retrieved successfully",
+  "data": [
+    {
+      "id": 1,
+      "name": "TX000001",
+      "account_number": "Pham Toan",
+      "fund_name": "VCBF-BCF",
+      "fund_id": 1,
+      "order_date": "09/07/2025, 15:30:45",
+      "order_code": "TX000001",
+      "amount": 1000000,
+      "session_date": "09/07/2025",
+      "status": "Chờ khớp lệnh",
+      "status_detail": "Chờ xác nhận tiền",
+      "transaction_type": "Mua",
+      "units": 100,
+      "currency": "VND"
+    }
+  ],
+  "pagination": {
+    "page": 1,
+    "limit": 20,
+    "total": 5
+  }
+}
+```
+
+### 2. Lấy lịch sử giao dịch
+```
+GET /api/v1/transaction/history
+```
+
+**Query Parameters:**
+- `userId`, `status`, `page`, `limit`, `startDate`, `endDate`
+
+### 3. Lấy thông tin giao dịch cụ thể
+```
+GET /api/v1/transaction/:id
+```
+
+### 4. Lấy thống kê giao dịch
+```
+GET /api/v1/transaction/stats
+```
+
+### 5. Tạo giao dịch mua/bán
+```
+POST /api/v1/transaction/buy
+POST /api/v1/transaction/sell
+```
+
+## Sử dụng trong React Native
+
+```typescript
+// services/transactionApi.ts
+import { apiService } from '../config/apiService';
+
+export const transactionApi = {
+  getPendingTransactions: async (params = {}) => {
+    const response = await apiService.get('/transaction/pending', { params });
+    return response.data;
+  },
+  // ... các methods khác
+};
+```