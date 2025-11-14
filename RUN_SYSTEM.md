# Hướng dẫn chạy hệ thống

## Bước 1: Khởi động Odoo 18 (Docker)

```bash
cd odoo-18-docker-compose
docker-compose up -d
```

**Kiểm tra:**
- Odoo chạy tại: `http://localhost:11018`
- Database: `anfan`
- Username: `admin` / Password: `admin` (hoặc theo config của bạn)

**Xem logs:**
```bash
docker-compose logs -f odoo18
```

---

## Bước 2: Khởi động API Middleware

### 2.1. Tạo file `.env` (nếu chưa có)

Tạo file `.env` trong thư mục `api-middleware`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Odoo Backend Configuration
ODOO_BASE_URL=http://localhost:11018
ODOO_DATABASE=anfan
ODOO_USERNAME=admin
ODOO_PASSWORD=admin

# API Configuration
API_PREFIX=/api/v1
CACHE_TTL=300
REQUEST_TIMEOUT=15000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### 2.2. Cài đặt dependencies và chạy

```bash
cd api-middleware
npm install
npm run dev
```

**Hoặc dùng script tự động:**
```bash
node start-dev.js
```

**Kiểm tra:**
- API Middleware chạy tại: `http://localhost:3001`
- Health check: `http://localhost:3001/health`
- Portfolio overview: `http://localhost:3001/api/v1/portfolio/overview`

---

## Bước 3: Khởi động Client App (Expo)

### 3.1. Cài đặt dependencies

```bash
cd client_app
npm install
```

### 3.2. Cấu hình IP Address

**Quan trọng:** Cập nhật IP trong `src/config/apiConfig.ts` hoặc tạo file `.env`:

```env
EXPO_PUBLIC_API_IP=192.168.1.4
```

Thay `192.168.1.4` bằng IP máy tính của bạn (dùng `ipconfig` trên Windows để xem).

### 3.3. Chạy Expo

```bash
npm start
```

**Hoặc chạy trên platform cụ thể:**
```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

---

## Kiểm tra kết nối

### 1. Test Odoo
```bash
curl http://localhost:11018/web/database/list
```

### 2. Test API Middleware
```bash
# Health check
curl http://localhost:3001/health

# Portfolio funds
curl http://localhost:3001/api/v1/portfolio/funds
```

### 3. Test từ Client App

Mở app và kiểm tra:
- Login screen có hiển thị không
- Có thể login được không
- Dashboard có load được data không

---

## Troubleshooting

### Lỗi: "Cannot connect to Odoo"
- Kiểm tra Odoo đã chạy: `docker-compose ps`
- Kiểm tra port 11018: `netstat -ano | findstr :11018`
- Kiểm tra `.env` trong `api-middleware` có đúng `ODOO_BASE_URL` không

### Lỗi: "Cannot connect to API Middleware"
- Kiểm tra middleware đã chạy: `curl http://localhost:3001/health`
- Kiểm tra port 3001: `netstat -ano | findstr :3001`
- Kiểm tra IP trong `client_app/src/config/apiConfig.ts`

### Lỗi: "Network request failed" trên mobile
- Đảm bảo mobile và máy tính cùng mạng WiFi
- Cập nhật IP trong `apiConfig.ts` hoặc `.env`
- Kiểm tra firewall không chặn port 3001

### Lỗi: "Session expired" hoặc "Authentication failed"
- Kiểm tra credentials trong `.env` của middleware
- Thử login lại từ client app
- Xóa cache: `npm run clear-cache` (nếu có)

---

## Thứ tự khởi động đúng

1. ✅ **Odoo 18** (Docker) - Port 11018
2. ✅ **API Middleware** - Port 3001  
3. ✅ **Client App** (Expo) - Port 19000/8081

---

## Quick Start Commands

```bash
# Terminal 1: Odoo
cd odoo-18-docker-compose
docker-compose up -d

# Terminal 2: API Middleware
cd api-middleware
npm run dev

# Terminal 3: Client App
cd client_app
npm start
```

---

## Notes

- Odoo cần vài phút để khởi động lần đầu
- API Middleware tự động retry nếu Odoo chưa sẵn sàng
- Client App cần IP đúng để kết nối từ mobile device
- Tất cả API calls từ client app đều đi qua middleware (trừ auth)

