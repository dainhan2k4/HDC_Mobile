# 🚀 **Odoo Investment Portfolio Management System**

## 📋 **Tổng quan**

Hệ thống quản lý danh mục đầu tư với:
- **🐳 Odoo Backend**: Custom modules quản lý quỹ, giao dịch, profile
- **🌐 API Middleware**: Node.js REST API layer
- **📱 Mobile App**: React Native với Expo
- **💾 Database**: PostgreSQL

## 🏗️ **Cấu trúc dự án**

```
odoo/
├── client_app/                    # React Native Mobile App
│   ├── src/
│   │   ├── api/                   # API clients
│   │   ├── components/            # UI components
│   │   ├── screens/               # App screens
│   │   ├── types/                 # TypeScript types
│   │   ├── config/                # App configuration
│   │   └── navigation/            # Navigation setup
│   ├── package.json
│   └── app.json
├── odoo-18-docker-compose/        # Odoo Backend
│   ├── addons/                    # Custom Odoo modules
│   │   ├── fund_management/       # Quản lý quỹ đầu tư
│   │   ├── asset_management/      # Quản lý tài sản
│   │   ├── custom_auth/           # Authentication custom
│   │   └── investor_profile_management/
│   ├── docker-compose.yml
│   └── etc/odoo.conf
└── api-middleware/                # Node.js API Layer
    ├── src/
    │   ├── controllers/           # API controllers
    │   ├── services/              # Business services
    │   ├── routes/                # API routes
    │   └── config/                # Configuration
    ├── package.json
    └── server.js
```

## 🔧 **Requirements**
- **Node.js**: >= 18.0.0
- **Docker & Docker Compose**: Latest version
- **Expo Go**: App trên điện thoại (để test mobile app)

## 🚨 **Tìm IP thật của máy cho Mobile App**

### **🔍 Cách tìm IP thật (không phải 127.0.0.1)**

#### **Windows**
```cmd
# Cách 1: Command Prompt
ipconfig
# Tìm "Wireless LAN adapter Wi-Fi:" hoặc "Ethernet adapter"
# IPv4 Address: 192.168.x.x (ví dụ: 192.168.50.104)

# Cách 2: PowerShell (lọc chỉ IP cần thiết)
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
```

#### **macOS**
```bash
# Cách 1: Tìm tất cả IP (loại trừ localhost)
ifconfig | grep "inet " | grep -v 127.0.0.1
# Tìm dòng: inet 192.168.x.x netmask...

# Cách 2: Chỉ IP WiFi
ipconfig getifaddr en0
```

#### **Linux**
```bash
# Cách 1: Hiện tất cả IP thật
hostname -I

# Cách 2: Chi tiết
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

### **📱 Config Mobile App với IP thật**
```env
# client_app/.env - Thay <Your ip> bằng IP máy bạn
EXPO_PUBLIC_API_BASE_URL=<Your ip>:3001/api/v1
EXPO_PUBLIC_ODOO_BASE_URL=<Your ip>:11018
EXPO_PUBLIC_USE_MIDDLEWARE=true
```

### **🔥 Lưu ý quan trọng**
- ✅ Mobile và máy tính phải cùng WiFi network
- ✅ Mở firewall ports 3001, 11018  
- ✅ Restart Expo sau khi thay đổi IP: `npx expo start -c`

## 🚀 **Quick Start**

### **🪟 Windows**
```bash
# Quick start script
quick-start.bat
```

### **📖 Manual Setup**
```bash
# 1. Start Odoo Backend
cd odoo-18-docker-compose
docker-compose up -d

# 2. Start API Middleware  
cd api-middleware
npm install && npm start

# 3. Start Mobile App
cd client_app  
npm install && npx expo start
```

## ⚙️ **Configuration & Network Setup**

### **🌐 Config IP cho API (Quan trọng!)**

#### **💻 Test trên máy tính (Simulator)**
```env
# Mobile App (.env)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

#### **📱 Test trên điện thoại thật** 
1. **Tìm IP thật của máy tính** (xem hướng dẫn chi tiết ở trên)
2. **Cập nhật mobile app config**:
```env
# client_app/.env - Thay <Your ip> bằng IP thật máy bạn  
EXPO_PUBLIC_API_BASE_URL=<Your ip>:3001/api/v1
EXPO_PUBLIC_ODOO_BASE_URL=<Your ip>:11018
```

3. **Restart Expo để load config mới**:
```bash
cd client_app
npx expo start -c  # -c để clear cache
```

#### **🔧 Firewall Settings**
```bash
# Windows: Allow ports 3001, 11018 through Windows Firewall
# macOS: System Preferences > Security > Firewall > Allow Node.js
# Linux: sudo ufw allow 3001 && sudo ufw allow 11018
```

### **📋 Environment Files**

#### **Odoo (.env)**
```env
POSTGRES_DB=odoo
POSTGRES_USER=odoo  
POSTGRES_PASSWORD=odoo
ODOO_DB_NAME=p2p
ODOO_ADMIN_PASSWORD=admin
ODOO_PORT=11018
```

#### **API Middleware (.env)**
```env
PORT=3001
NODE_ENV=development
ODOO_BASE_URL=http://localhost:11018
ODOO_DATABASE=p2p
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
DEBUG_MODE=true
```

## 📡 **Access Points**
- **🐳 Odoo Admin**: http://localhost:11018 (admin/admin)
- **🌐 API Middleware**: http://localhost:3001  
- **📱 Mobile App**: Scan QR code với Expo Go app

> **⚠️ QUAN TRỌNG**: Nếu test trên điện thoại thật, phải cập nhật IP trong mobile app config!

## 🎯 **Features**
- 🔐 **Authentication**: Login/logout với OTP
- 📊 **Portfolio**: Real-time overview với profit/loss tracking  
- 💰 **Fund Trading**: Buy/sell operations với validation
- 📈 **Analytics**: Investment performance và charts
- 👤 **Profile**: Personal info, bank account, address management
- 📱 **Mobile**: Modern React Native interface

## 📡 **API Endpoints**

### **Authentication**
```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

### **Portfolio Management**
```http
GET  /api/v1/portfolio/overview
GET  /api/v1/portfolio/investments
GET  /api/v1/portfolio/funds
POST /api/v1/portfolio/clear-cache
```

### **Fund Management**
```http
GET  /api/v1/funds
GET  /api/v1/funds/:id
```

### **Transactions**
```http
POST /api/v1/transaction/buy
POST /api/v1/transaction/sell
```

## 🐛 **Common Issues & Quick Fixes**

### **🔧 Quick Fixes**
```bash
# Restart services
docker-compose restart
npm restart  
npx expo start --clear


# Check logs
docker-compose logs -f odoo
```

### **❓ Network & IP Issues**
- **📱 Mobile can't connect API**: Kiểm tra IP thật trong `client_app/.env` (không dùng 127.0.0.1)
- **🔥 Firewall blocking**: Mở ports 3001, 11018 trong Windows/macOS firewall  
- **🌐 Wrong network**: Đảm bảo mobile và máy tính cùng WiFi network
- **📱 Wrong IP**: Dùng IP dạng 192.168.x.x (ví dụ: 192.168.50.104), không phải localhost
- **🔄 Config không update**: Restart Expo với `npx expo start -c` sau khi đổi IP

### **🔧 Test IP Connection**
```bash
# Kiểm tra IP máy tính có đúng không
ping 192.168.50.104  # Thay bằng IP máy bạn

# Test API có chạy không  
curl <Your ip>:3001
curl <Your ip>:11018

# Kiểm tra ports đang mở
netstat -an | grep :3001
netstat -an | grep :11018
```

## 📋 **Development Tips**

### **🚀 Daily Workflow**
```bash
# Start all services
quick-start.bat  # Windows

# Or manual start:
cd odoo-18-docker-compose && docker-compose up -d
cd api-middleware && npm start  
cd client_app && npx expo start
```

### **🔍 Health Check**
```bash
# Check services
curl http://localhost:11018      # Odoo
curl http://localhost:3001       # API
# Mobile: Scan QR với Expo Go
```
