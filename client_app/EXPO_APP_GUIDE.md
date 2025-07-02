# Hướng dẫn sử dụng App Expo

## Tổng quan

App Expo này được tạo để kết nối với hệ thống Odoo quản lý quỹ đầu tư. App sử dụng expo-router cho navigation và được thiết kế với giao diện hiện đại, thân thiện với người dùng.

## Cấu trúc thư mục

```
my-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── _layout.tsx    # Auth layout
│   │   ├── login.tsx      # Login screen
│   │   ├── signup.tsx     # Signup screen
│   │   └── forgot-password.tsx # Forgot password screen
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx    # Tabs layout
│   │   ├── index.tsx      # Portfolio overview
│   │   ├── funds.tsx      # Fund list
│   │   ├── transactions.tsx # Transaction history
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Common UI components
│   │   ├── fund/         # Fund-related components
│   │   └── portfolio/    # Portfolio components
│   ├── types/            # TypeScript type definitions
│   └── navigation/       # Navigation configuration
└── App.tsx               # Root app component
```

## Các tính năng chính

### 1. Authentication (Xác thực)
- **Login**: Đăng nhập với email và mật khẩu
- **Signup**: Đăng ký tài khoản mới
- **Forgot Password**: Đặt lại mật khẩu qua email

### 2. Portfolio Overview (Tổng quan danh mục)
- Hiển thị tổng giá trị đầu tư
- Biểu đồ phân bổ quỹ
- Lịch sử giao dịch gần đây
- So sánh hiệu suất

### 3. Fund Management (Quản lý quỹ)
- Danh sách các quỹ đầu tư
- Thông tin chi tiết quỹ (NAV, YTD, loại đầu tư)
- Chức năng mua/bán quỹ
- So sánh quỹ

### 4. Transaction History (Lịch sử giao dịch)
- Danh sách tất cả giao dịch
- Lọc theo loại giao dịch (mua/bán)
- Trạng thái giao dịch
- Chi tiết giao dịch

### 5. User Profile (Hồ sơ người dùng)
- Thông tin cá nhân
- Tài khoản ngân hàng
- Địa chỉ
- Xác thực tài khoản
- Cài đặt ứng dụng

## Cách sử dụng

### Chạy ứng dụng

```bash
# Cài đặt dependencies
yarn install

# Chạy ứng dụng
yarn start

# Chạy trên Android
yarn android

# Chạy trên iOS
yarn ios

# Chạy trên web
yarn web
```

### Navigation

App sử dụng expo-router với cấu trúc navigation như sau:

1. **Authentication Flow**: `/(auth)/*`
   - Login → Main App
   - Signup → Login
   - Forgot Password → Login

2. **Main App Flow**: `/(tabs)/*`
   - Portfolio (index) - Tab chính
   - Funds - Danh sách quỹ
   - Transactions - Lịch sử giao dịch
   - Profile - Hồ sơ người dùng

### Components

#### Authentication Components
- `LoginScreen`: Màn hình đăng nhập
- `SignupScreen`: Màn hình đăng ký
- `ForgotPasswordScreen`: Màn hình quên mật khẩu

#### Fund Components
- `FundCard`: Card hiển thị thông tin quỹ
- `FundListScreen`: Danh sách quỹ
- `FundDetailScreen`: Chi tiết quỹ
- `FundBuyScreen`: Màn hình mua quỹ
- `FundSellScreen`: Màn hình bán quỹ

#### Portfolio Components
- `PortfolioOverviewScreen`: Tổng quan danh mục
- `FundCard`: Card quỹ trong danh mục

#### Common Components
- `ThemedText`: Text component với theme
- `ThemedView`: View component với theme

### Types

App sử dụng TypeScript với các type definitions:

- `auth.ts`: Types cho authentication
- `fund.ts`: Types cho quỹ đầu tư
- `portfolio.ts`: Types cho danh mục
- `transaction.ts`: Types cho giao dịch

## Kết nối với Odoo

### API Endpoints

App sẽ kết nối với các API endpoints từ Odoo addons:

1. **Authentication** (`custom_auth`):
   - POST `/api/auth/login`
   - POST `/api/auth/signup`
   - POST `/api/auth/reset-password`

2. **Fund Management** (`fund_management`):
   - GET `/api/funds` - Danh sách quỹ
   - GET `/api/funds/{id}` - Chi tiết quỹ
   - POST `/api/funds/buy` - Mua quỹ
   - POST `/api/funds/sell` - Bán quỹ

3. **Portfolio** (`fund_management`):
   - GET `/api/portfolio` - Thông tin danh mục
   - GET `/api/portfolio/investments` - Danh sách đầu tư

4. **Transactions** (`transaction_management`):
   - GET `/api/transactions` - Lịch sử giao dịch
   - GET `/api/transactions/pending` - Giao dịch chờ xử lý

5. **User Profile** (`investor_profile_management`):
   - GET `/api/profile` - Thông tin hồ sơ
   - PUT `/api/profile` - Cập nhật hồ sơ
   - POST `/api/profile/verify` - Xác thực tài khoản

### Cấu hình API

Tạo file `src/config/api.ts` để cấu hình API:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8069',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};
```

## Development

### Thêm màn hình mới

1. Tạo file trong thư mục `app/` tương ứng
2. Export component mặc định
3. Cập nhật navigation nếu cần

### Thêm component mới

1. Tạo file trong thư mục `src/components/`
2. Export component
3. Cập nhật `src/components/index.ts`

### Styling

App sử dụng StyleSheet của React Native với theme colors:

```typescript
const colors = {
  primary: '#2B4BFF',
  secondary: '#6C757D',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  light: '#F8F9FA',
  dark: '#212529',
};
```

## Troubleshooting

### Lỗi thường gặp

1. **Metro bundler error**: Chạy `yarn start --clear`
2. **TypeScript errors**: Kiểm tra types trong `src/types/`
3. **Navigation errors**: Kiểm tra cấu trúc thư mục `app/`

### Debug

- Sử dụng `console.log()` để debug
- React Native Debugger cho debugging nâng cao
- Expo DevTools cho development

## Deployment

### Build cho production

```bash
# Build cho Android
expo build:android

# Build cho iOS
expo build:ios

# Build cho web
expo build:web
```

### Publish

```bash
expo publish
```

## Tài liệu tham khảo

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://expo.github.io/router/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/) 