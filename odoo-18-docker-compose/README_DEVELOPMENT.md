# Hướng dẫn Development với Docker Mount

## Cấu hình hiện tại

Dự án đã được cấu hình để hỗ trợ development mode với Docker mount, cho phép bạn sửa đổi code mà không cần restart container.

### Các mount volumes đã cấu hình:

1. **Addons**: `./addons:/mnt/extra-addons` - Mount thư mục addons vào container
2. **Config**: `./etc:/etc/odoo` - Mount cấu hình Odoo
3. **Development mount**: `./addons:/opt/odoo/addons` - Mount bổ sung cho development
4. **Config file**: `./etc/odoo.conf:/etc/odoo/odoo.conf` - Mount file cấu hình

### Các tính năng development đã bật:

- `dev_mode = reload` - Tự động reload khi có thay đổi
- `DEV_MODE=1` - Environment variable cho development
- `LIST_DB=1` - Hiển thị danh sách database

## Cách sử dụng

### 1. Khởi động container:
```bash
docker-compose up -d
```

### 2. Sửa đổi code:
- Sửa đổi các file trong thư mục `addons/`
- Các thay đổi sẽ được mount tự động vào container

### 3. Khi nào cần restart:

**KHÔNG cần restart khi:**
- Sửa đổi Python code trong models
- Sửa đổi JavaScript/CSS files
- Sửa đổi XML views
- Thêm/sửa đổi translations

**CẦN restart khi:**
- Thêm module mới
- Sửa đổi `__manifest__.py`
- Thay đổi dependencies
- Sửa đổi security rules

### 4. Restart container (khi cần):
```bash
# Cách 1: Sử dụng script (Linux/Mac)
./restart.sh

# Cách 2: Sử dụng script (Windows PowerShell)
.\restart.ps1

# Cách 3: Restart thủ công
docker-compose restart odoo18
```

### 5. Kiểm tra trạng thái:
```bash
# Linux/Mac
./status.sh

# Windows PowerShell
.\status.ps1
```

### 6. Xem logs:
```bash
docker-compose logs -f odoo18
```

## Lưu ý quan trọng

1. **Auto-reload**: Odoo sẽ tự động reload các thay đổi Python code
2. **Module updates**: Sau khi sửa đổi, vào Odoo web interface và update module
3. **Cache**: Đôi khi cần clear browser cache để thấy thay đổi JavaScript/CSS
4. **Database**: Các thay đổi model có thể cần update module hoặc restart

## Troubleshooting

### Nếu thay đổi không được nhận diện:
1. Kiểm tra logs: `docker-compose logs odoo18`
2. Update module trong Odoo web interface
3. Clear browser cache
4. Restart container nếu cần

### Nếu có lỗi mount:
1. Kiểm tra quyền truy cập thư mục
2. Đảm bảo Docker có quyền truy cập thư mục
3. Restart Docker service nếu cần

## Access URLs

- **Odoo Web Interface**: http://localhost:10018
- **Live Chat**: http://localhost:20018
- **Database Manager**: http://localhost:10018/web/database/manager 