# Cấu hình mạng - Network Configuration

## IP Address hiện tại của máy

```
IPv4 Address chính: 10.10.3.47
IPv4 Address khác: 
  - 192.168.56.1 (VirtualBox/Hyper-V)
  - 172.20.112.1 (Docker/WSL)
  - 192.168.192.1 (Virtual Network)
```

## Cấu hình Backend

### Odoo Backend
- **Status**: ✅ Đang chạy
- **Port**: 11018 (mapped từ container port 8069)
- **URL**: `http://10.10.3.47:11018` hoặc `http://localhost:11018`

### API Middleware
- **Port**: 3001
- **URL**: `http://10.10.3.47:3001/api/v1` hoặc `http://localhost:3001/api/v1`

### eKYC Service
- **Port**: 8000
- **URL**: `http://10.10.3.47:8000` hoặc `http://localhost:8000`

## Cấu hình App (app.json)

```json
{
  "extra": {
    "apiIp": "10.10.3.47",  // ⚠️ Cần cập nhật từ 192.168.1.4
    "useMiddleware": true,
    "environment": "development"
  }
}
```

## Cấu hình theo Platform

### Android Emulator
- Tự động dùng: `10.0.2.2` (để truy cập máy host)
- URL: `http://10.0.2.2:11018` (Odoo) hoặc `http://10.0.2.2:3001/api/v1` (Middleware)

### iOS Simulator
- Tự động dùng: `localhost`
- URL: `http://localhost:11018` (Odoo) hoặc `http://localhost:3001/api/v1` (Middleware)

### Physical Device
- Cần cấu hình IP: `10.10.3.47`
- URL: `http://10.10.3.47:11018` (Odoo) hoặc `http://10.10.3.47:3001/api/v1` (Middleware)

## Kiểm tra kết nối

### Test Odoo Backend
```bash
curl http://10.10.3.47:11018/web/database/selector
# hoặc
curl http://localhost:11018/web/database/selector
```

### Test API Middleware
```bash
curl http://10.10.3.47:3001/api/v1/health
# hoặc
curl http://localhost:3001/api/v1/health
```

## Cập nhật cấu hình

### Option 1: Cập nhật app.json (Khuyến nghị)
Sửa `app.json`:
```json
"extra": {
  "apiIp": "10.10.3.47"
}
```

### Option 2: Tạo file .env
Tạo file `.env` trong thư mục `client_app`:
```env
EXPO_PUBLIC_API_IP=10.10.3.47
EXPO_PUBLIC_USE_MIDDLEWARE=true
EXPO_PUBLIC_ENV=development
```

## Lưu ý

1. **Firewall**: Đảm bảo Windows Firewall không chặn port 11018, 3001, 8000
2. **Network**: Mobile device và máy tính phải cùng mạng WiFi
3. **Docker**: Odoo container phải expose ports ra ngoài (đã cấu hình đúng)







