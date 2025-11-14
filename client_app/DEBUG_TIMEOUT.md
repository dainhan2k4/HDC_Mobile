# Debug Timeout Issues

## Vấn đề: Request timeout khi gọi middleware

### Nguyên nhân có thể:

1. **Middleware không chạy**
   - Kiểm tra: `curl http://10.10.3.47:3001/health`
   - Hoặc mở browser: `http://10.10.3.47:3001/health`

2. **IP Address không đúng**
   - Kiểm tra IP hiện tại: `ipconfig` (Windows)
   - Cập nhật trong `apiConfig.ts` nếu IP thay đổi

3. **Firewall chặn port 3001**
   - Windows Firewall có thể chặn incoming connections
   - Cần allow port 3001 trong Windows Firewall

4. **Mobile device không cùng network**
   - Đảm bảo mobile và máy tính cùng WiFi network
   - Kiểm tra IP range: mobile và máy tính phải cùng subnet (10.10.x.x)

5. **Session ID không được lưu**
   - Kiểm tra log: `✅ [AuthContext] Login successful, session saved`
   - Nếu không thấy, session ID không được extract từ login response

## Cách debug:

### 1. Kiểm tra Middleware đang chạy
```bash
# Terminal 1: Kiểm tra middleware
cd api-middleware
npm start

# Terminal 2: Test từ máy tính
curl http://localhost:3001/health
curl http://10.10.3.47:3001/health
```

### 2. Kiểm tra từ Mobile Device
- Mở browser trên mobile: `http://10.10.3.47:3001/health`
- Nếu không load được → network/firewall issue

### 3. Kiểm tra Logs trong App
Sau khi login, xem logs:
```
🔐 [AuthContext] Starting login process...
✅ [AuthContext] Got session ID from getSessionId(): ...
✅ [AuthContext] Login successful, session saved to storage
```

Khi load data:
```
📤 [ApiService] Making request to: /portfolio/funds
📤 [ApiService] Full URL: http://10.10.3.47:3001/api/v1/portfolio/funds
🔐 [ApiService] Adding session cookie: session_id=...
```

Nếu thấy:
- `⚠️ [ApiService] No session ID available` → Session không được lưu sau login
- `⏱️ [ApiService] Request timeout` → Middleware không accessible
- `🔌 [ApiService] Connection error` → Network/firewall issue

### 4. Fix Windows Firewall
```powershell
# Allow port 3001
New-NetFirewallRule -DisplayName "API Middleware" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 5. Test Connection từ Mobile
```bash
# Trên mobile device, mở browser và test:
http://10.10.3.47:3001/health
http://10.10.3.47:3001/api/v1/portfolio/overview
```

## Quick Fix Checklist:

- [ ] Middleware đang chạy trên port 3001
- [ ] IP address đúng trong `apiConfig.ts` (10.10.3.47)
- [ ] Windows Firewall allow port 3001
- [ ] Mobile và máy tính cùng WiFi network
- [ ] Session ID được lưu sau login (check logs)
- [ ] Test health endpoint từ mobile browser

## Nếu vẫn timeout:

1. **Thử dùng ngrok để expose middleware:**
```bash
ngrok http 3001
# Copy ngrok URL và update BASE_URL trong apiConfig.ts
```

2. **Hoặc dùng localhost nếu test trên emulator:**
- Android emulator: `10.0.2.2:3001`
- iOS simulator: `localhost:3001`

3. **Kiểm tra network connectivity:**
```bash
# Từ mobile device
ping 10.10.3.47
telnet 10.10.3.47 3001
```

