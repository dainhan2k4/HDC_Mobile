# HDC_Mobile

## Hệ thống Quản lý Danh mục Đầu tư (Odoo + Middleware + Mobile)

### Tổng quan
Hệ thống gồm 3 phần:
- Odoo backend (các addon tùy biến)
- API middleware (Node.js/Express)
- Ứng dụng mobile (React Native/Expo)

### Cấu trúc dự án
```
client_app/                  # Ứng dụng React Native
api-middleware/              # API middleware Node.js
odoo-18-docker-compose/      # Odoo + addons + docker-compose
```

## Yêu cầu
- Node.js >= 18
- Docker & Docker Compose
- Expo (để chạy mobile trên thiết bị thật/giả lập)

## Thiết lập Odoo (bắt buộc)
1) Mở trình duyệt: http://localhost:11018
2) Tạo mới database (ví dụ: p2p), đặt mật khẩu admin
3) Cài đặt và kích hoạt các module sau:
   - fund_management
   - asset_management
   - overview_fund_management
   - investor_profile_management
   - custom_auth (nếu dùng)
4) Đăng nhập và kiểm tra các route sau hoạt động:
   - /investment_dashboard
   - /asset-management
   - /data_fund

## Cấu hình môi trường

API Middleware (.env):
```
PORT=3001
NODE_ENV=development
ODOO_BASE_URL=http://localhost:11018
ODOO_DATABASE=p2p
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
```

Mobile App (client_app/.env):
```
EXPO_PUBLIC_API_BASE_URL=http://<your-ip>:3001/api/v1
EXPO_PUBLIC_ODOO_BASE_URL=http://<your-ip>:11018
EXPO_PUBLIC_USE_MIDDLEWARE=true
```
Lưu ý:
- Khi chạy trên điện thoại thật, thay <your-ip> bằng IPv4 của máy tính (ví dụ 192.168.x.x), không dùng 127.0.0.1
- Sau khi đổi IP, khởi động lại Expo bằng: npx expo start -c

## Khởi động nhanh
```bash
# 1) Odoo backend
cd odoo-18-docker-compose
docker-compose up -d

# 2) API middleware
cd ../api-middleware
npm install
npm start

# 3) Mobile app
cd ../client_app
npm install
npx expo start
```

## Tóm tắt API

Xác thực:
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

Tài sản/Danh mục:
```
GET  /api/v1/asset/management
GET  /api/v1/portfolio/overview
```

Giao dịch:
```
POST /api/v1/transaction/buy
POST /api/v1/transaction/sell
```

Chữ ký:
```
POST /api/v1/signature/digital
POST /api/v1/signature/hand
```

## Ghi chú mạng
- Dùng IPv4 nội bộ của máy tính cho mobile (khi chạy trên thiết bị thật)
- Mở/cho phép cổng 3001 (API) và 11018 (Odoo) trong firewall
- Nếu phản hồi rỗng do cache, khởi động lại middleware (ETag đã được tắt sẵn)
