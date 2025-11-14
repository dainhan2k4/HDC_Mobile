# Fund P2P Mobile App

Ứng dụng mobile React Native (Expo) để kết nối với Odoo 18 backend.

## Cấu hình

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình API Backend

App tự động detect môi trường và sử dụng IP phù hợp:

- **Android Emulator**: Tự động dùng `10.0.2.2` để truy cập máy host
- **iOS Simulator**: Tự động dùng `localhost`
- **Physical Device**: Cần cấu hình IP của máy chạy Odoo

#### Cách cấu hình IP cho Physical Device:

**Option 1: Sử dụng Environment Variables (Khuyến nghị)**

Tạo file `.env` trong thư mục `client_app`:

```env
EXPO_PUBLIC_API_IP=192.168.1.4
EXPO_PUBLIC_USE_MIDDLEWARE=true
EXPO_PUBLIC_ENV=development
```

**Option 2: Cấu hình trong app.json**

Sửa file `app.json`, phần `extra.apiIp`:

```json
{
  "expo": {
    "extra": {
      "apiIp": "192.168.1.4"
    }
  }
}
```

**Lấy IP của máy tính:**

- Windows: `ipconfig | findstr IPv4`
- Mac/Linux: `ifconfig | grep "inet "`

### 3. Đảm bảo Odoo Backend đang chạy

Odoo backend cần chạy trên:
- **Port 11018** (local development) - mapped từ container port 8069
- **Port 3001** (API Middleware) - nếu sử dụng middleware

Kiểm tra Odoo đang chạy:
```bash
cd ../odoo-18-docker-compose
docker-compose up -d
```

### 4. Chạy ứng dụng

```bash
npx expo start
```

Sau đó chọn:
- `a` - Mở trên Android emulator/device
- `i` - Mở trên iOS simulator/device
- `w` - Mở trên web browser

## Cấu trúc kết nối

```
Mobile App (client_app)
    ↓
API Middleware (port 3001) [Nếu USE_MIDDLEWARE=true]
    ↓
Odoo 18 Backend (port 11018/8069)
    ↓
PostgreSQL Database
```

## Troubleshooting

### Không kết nối được từ physical device

1. Đảm bảo mobile và máy tính cùng mạng WiFi
2. Kiểm tra firewall không chặn port 11018, 3001
3. Cập nhật IP trong `.env` hoặc `app.json`
4. Restart Expo: `npx expo start --clear`

### Android Emulator không kết nối được

- App tự động dùng `10.0.2.2` cho Android emulator
- Nếu vẫn lỗi, kiểm tra Odoo có chạy trên máy host không

### iOS Simulator không kết nối được

- App tự động dùng `localhost` cho iOS simulator
- Đảm bảo Odoo chạy trên localhost

## Development

- **File cấu hình API**: `src/config/apiConfig.ts`
- **API Service**: `src/config/apiService.ts`
- **Endpoints**: Được định nghĩa trong `src/config/apiConfig.ts`

## Production

Để deploy production, cập nhật:

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://your-production-api.com
EXPO_PUBLIC_USE_MIDDLEWARE=true
```
