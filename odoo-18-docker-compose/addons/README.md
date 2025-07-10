# Hệ Thống Quản Lý Đầu Tư p2p Lending

## 📋 Tổng Quan

Hệ thống quản lý đầu tư p2p Lending là một nền tảng toàn diện được xây dựng trên Odoo để quản lý các hoạt động đầu tư, quản lý quỹ, và quản lý hồ sơ nhà đầu tư. Hệ thống bao gồm 6 module chính, mỗi module đảm nhiệm một chức năng cụ thể trong quy trình đầu tư.

## 🏗️ Kiến Trúc Hệ Thống

### Các Module Chính

#### 1. **Custom Auth** - Xác thực tùy chỉnh
- **Chức năng**: Tùy biến giao diện đăng nhập, đăng ký và đặt lại mật khẩu
- **Tính năng**:
  - Giao diện đăng nhập hiện đại với Tailwind CSS
  - Hệ thống đăng ký với xác thực OTP
  - Trang đặt lại mật khẩu
  - Popup xác thực OTP

#### 2. **Investor Profile Management** - Quản lý hồ sơ nhà đầu tư
- **Chức năng**: Quản lý thông tin cá nhân và tài khoản của nhà đầu tư
- **Tính năng**:
  - Quản lý thông tin cá nhân
  - Quản lý tài khoản ngân hàng
  - Quản lý địa chỉ
  - Xác thực tài liệu
  - Quản lý trạng thái hồ sơ

#### 3. **Fund Management** - Quản lý quỹ đầu tư
- **Chức năng**: Quản lý các quỹ đầu tư và giao dịch
- **Tính năng**:
  - Danh sách quỹ đầu tư
  - Mua/bán quỹ
  - Quản lý danh mục đầu tư
  - So sánh quỹ
  - Quản lý số dư tài khoản
  - Tính phí giao dịch

#### 4. **Asset Management** - Quản lý tài sản
- **Chức năng**: Quản lý và theo dõi tài sản đầu tư
- **Tính năng**:
  - Dashboard quản lý tài sản
  - Theo dõi hiệu suất đầu tư
  - Báo cáo tài sản

#### 5. **Overview Fund Management** - Tổng quan quản lý quỹ
- **Chức năng**: Cung cấp cái nhìn tổng quan về hệ thống quỹ
- **Tính năng**:
  - Dashboard tổng quan
  - Thống kê đầu tư
  - Báo cáo tổng hợp

#### 6. **Transaction Management** - Quản lý giao dịch
- **Chức năng**: Quản lý các giao dịch đầu tư
- **Tính năng**:
  - Giao dịch đang chờ xử lý
  - Lịch sử giao dịch
  - Giao dịch định kỳ

## 🚀 Yêu Cầu Hệ Thống

### Yêu Cầu Tối Thiểu
- **Odoo**: Phiên bản 16.0 trở lên
- **Python**: 3.8 trở lên
- **Database**: PostgreSQL 12 trở lên
- **RAM**: Tối thiểu 4GB
- **Storage**: Tối thiểu 10GB

### Yêu Cầu Khuyến Nghị
- **Odoo**: Phiên bản 16.0 hoặc mới hơn
- **Python**: 3.9 hoặc 3.10
- **Database**: PostgreSQL 13 trở lên
- **RAM**: 8GB trở lên
- **Storage**: 20GB trở lên

## 📦 Cài Đặt

### Bước 1: Chuẩn Bị Môi Trường
```bash
# Clone repository
git clone <repository-url>
cd addons

# Tạo virtual environment (nếu cần)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate     # Windows
```

### Bước 2: Cài Đặt Odoo
```bash
# Cài đặt Odoo (nếu chưa có)
pip install odoo

# Hoặc sử dụng Docker
docker pull odoo:16.0
```

### Bước 3: Cấu Hình Odoo
1. Tạo file cấu hình Odoo (`odoo.conf`):
```ini
[options]
addons_path = /path/to/your/addons
data_dir = /path/to/data
admin_passwd = your_admin_password
db_host = localhost
db_port = 5432
db_user = odoo
db_password = your_db_password
```

### Bước 4: Cài Đặt Modules
1. Khởi động Odoo:
```bash
odoo -c odoo.conf
```

2. Truy cập Odoo qua trình duyệt: `http://localhost:8069`

3. Tạo database mới và cài đặt các modules theo thứ tự:
   - `custom_auth`
   - `investor_profile_management`
   - `fund_management`
   - `asset_management`
   - `overview_fund_management`
   - `transaction_management`

## 🎯 Hướng Dẫn Sử Dụng

### 1. Thiết Lập Ban Đầu

#### Cấu Hình Xác Thực
1. Vào **Settings > Custom Auth**
2. Cấu hình các thông số xác thực OTP
3. Tùy chỉnh giao diện đăng nhập/đăng ký

#### Thiết Lập Quỹ Đầu Tư
1. Vào **Fund Management > Funds**
2. Thêm các quỹ đầu tư mới
3. Cấu hình thông tin quỹ, phí giao dịch
4. Thiết lập quy tắc mua/bán

### 2. Quản Lý Nhà Đầu Tư

#### Tạo Hồ Sơ Nhà Đầu Tư
1. Vào **Investor Profile > Personal Profile**
2. Nhập thông tin cá nhân
3. Thêm thông tin ngân hàng
4. Cập nhật địa chỉ
5. Xác thực tài liệu

#### Quản Lý Trạng Thái
- Theo dõi trạng thái xác thực
- Cập nhật thông tin khi cần thiết
- Quản lý tài khoản ngân hàng

### 3. Quản Lý Đầu Tư

#### Mua Quỹ
1. Vào **Fund Management > Fund List**
2. Chọn quỹ muốn mua
3. Nhập số tiền đầu tư
4. Xác nhận giao dịch
5. Thanh toán

#### Bán Quỹ
1. Vào **Portfolio > My Investments**
2. Chọn quỹ muốn bán
3. Nhập số lượng/số tiền bán
4. Xác nhận giao dịch

#### Theo Dõi Danh Mục
- Xem tổng quan danh mục đầu tư
- Theo dõi hiệu suất
- So sánh với các quỹ khác

### 4. Quản Lý Giao Dịch

#### Giao Dịch Đang Chờ
- Xem danh sách giao dịch chờ xử lý
- Phê duyệt/từ chối giao dịch
- Theo dõi trạng thái

#### Lịch Sử Giao Dịch
- Xem toàn bộ lịch sử giao dịch
- Xuất báo cáo
- Phân tích giao dịch

#### Giao Dịch Định Kỳ
- Thiết lập giao dịch tự động
- Quản lý lịch giao dịch
- Theo dõi hiệu suất

## 🔧 Phát Triển

### Cấu Trúc Thư Mục
```
addons/
├── custom_auth/                 # Xác thực tùy chỉnh
├── investor_profile_management/ # Quản lý hồ sơ nhà đầu tư
├── fund_management/            # Quản lý quỹ đầu tư
├── asset_management/           # Quản lý tài sản
├── overview_fund_management/   # Tổng quan quản lý quỹ
└── transaction_management/     # Quản lý giao dịch
```

### Quy Tắc Code
- **Python**: Tuân thủ PEP 8
- **JavaScript**: Sử dụng ES6+ syntax
- **XML**: Tuân thủ Odoo XML conventions
- **CSS**: Sử dụng Tailwind CSS khi có thể

### Thêm Module Mới
1. Tạo thư mục module mới
2. Tạo file `__manifest__.py`
3. Cấu hình dependencies
4. Thêm models, views, controllers
5. Cập nhật security rules

### Debug và Testing
```bash
# Chạy Odoo với debug mode
odoo -c odoo.conf --dev=all

# Chạy tests
odoo -c odoo.conf -d your_database --test-enable --stop-after-init
```

## 📊 Báo Cáo và Analytics

### Dashboard Chính
- Tổng quan tài sản
- Hiệu suất đầu tư
- Giao dịch gần đây
- Cảnh báo và thông báo

### Báo Cáo Định Kỳ
- Báo cáo hàng tháng
- Báo cáo quý
- Báo cáo năm
- So sánh hiệu suất

## 🔒 Bảo Mật

### Xác Thực và Phân Quyền
- Hệ thống xác thực OTP
- Phân quyền theo vai trò
- Mã hóa dữ liệu nhạy cảm
- Audit trail cho giao dịch

### Bảo Mật Dữ Liệu
- Backup tự động
- Mã hóa database
- Logging hoạt động
- Monitoring hệ thống

## 🚨 Xử Lý Sự Cố

### Lỗi Thường Gặp

#### Lỗi Kết Nối Database
```bash
# Kiểm tra kết nối PostgreSQL
psql -h localhost -U odoo -d your_database

# Kiểm tra log Odoo
tail -f /var/log/odoo/odoo.log
```

#### Lỗi Module Không Load
1. Kiểm tra file `__manifest__.py`
2. Kiểm tra dependencies
3. Restart Odoo server
4. Update module list

#### Lỗi Giao Dịch
1. Kiểm tra trạng thái giao dịch
2. Xem log giao dịch
3. Kiểm tra cấu hình quỹ
4. Liên hệ support nếu cần

### Tài Liệu Bổ Sung
- [API Documentation](./docs/api.md)
- [User Manual](./docs/user-manual.md)
- [Developer Guide](./docs/developer-guide.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

### Community
- **GitHub Issues**: [Report Issues](https://github.com/your-repo/issues)
- **Discussions**: [Community Forum](https://github.com/your-repo/discussions)
- **Wiki**: [Project Wiki](https://github.com/your-repo/wiki)

## 📄 License

Dự án này được phát hành dưới giấy phép LGPL-3. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📈 Roadmap

### Phiên Bản 1.2 (Q1 2024)
- [ ] Tích hợp AI cho phân tích đầu tư
- [ ] Mobile app
- [ ] API cho third-party integration

### Phiên Bản 1.3 (Q2 2024)
- [ ] Blockchain integration
- [ ] Advanced analytics
- [ ] Multi-language support

### Phiên Bản 2.0 (Q3 2024)
- [ ] Microservices architecture
- [ ] Real-time trading
- [ ] Advanced risk management

---

**Lưu ý**: Đây là tài liệu phiên bản 1.0. Vui lòng cập nhật thông tin liên hệ và cấu hình phù hợp với môi trường thực tế của bạn. 