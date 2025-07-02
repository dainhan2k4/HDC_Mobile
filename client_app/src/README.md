# Expo Components Documentation

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── auth/
│   │   └── LoginScreen.tsx
│   ├── fund/
│   │   └── FundListScreen.tsx
│   ├── portfolio/
│   │   └── PortfolioOverviewScreen.tsx
│   ├── common/
│   │   └── FundCard.tsx
│   └── index.ts
├── types/
│   ├── auth.ts
│   ├── fund.ts
│   ├── portfolio.ts
│   └── transaction.ts
└── README.md
```

## 🎯 Components đã tạo

### 🔐 Authentication Components

#### LoginScreen
```typescript
import { LoginScreen } from './components/auth/LoginScreen';

<LoginScreen
  onLogin={(email, password) => {
    // Handle login logic
  }}
  onNavigateToSignup={() => {
    // Navigate to signup
  }}
  onNavigateToForgotPassword={() => {
    // Navigate to forgot password
  }}
  isLoading={false}
/>
```

**Props:**
- `onLogin: (email: string, password: string) => void` - Callback khi đăng nhập
- `onNavigateToSignup: () => void` - Callback chuyển đến trang đăng ký
- `onNavigateToForgotPassword: () => void` - Callback chuyển đến trang quên mật khẩu
- `isLoading?: boolean` - Trạng thái loading

### 📈 Fund Management Components

#### FundListScreen
```typescript
import { FundListScreen } from './components/fund/FundListScreen';

<FundListScreen
  funds={funds}
  isLoading={false}
  onRefresh={() => {
    // Refresh fund list
  }}
  onFundPress={(fund) => {
    // Navigate to fund detail
  }}
  onBuyPress={(fund) => {
    // Navigate to buy screen
  }}
  onSellPress={(fund) => {
    // Navigate to sell screen
  }}
/>
```

**Props:**
- `funds: Fund[]` - Danh sách quỹ
- `isLoading?: boolean` - Trạng thái loading
- `onRefresh?: () => void` - Callback refresh
- `onFundPress: (fund: Fund) => void` - Callback khi nhấn vào quỹ
- `onBuyPress: (fund: Fund) => void` - Callback khi nhấn nút mua
- `onSellPress: (fund: Fund) => void` - Callback khi nhấn nút bán

#### FundCard
```typescript
import { FundCard } from './components/common/FundCard';

<FundCard
  fund={fund}
  onPress={(fund) => {
    // Handle fund press
  }}
  showActions={true}
  onBuyPress={(fund) => {
    // Handle buy press
  }}
  onSellPress={(fund) => {
    // Handle sell press
  }}
/>
```

**Props:**
- `fund: Fund` - Thông tin quỹ
- `onPress: (fund: Fund) => void` - Callback khi nhấn vào card
- `showActions?: boolean` - Hiển thị nút mua/bán
- `onBuyPress?: (fund: Fund) => void` - Callback nút mua
- `onSellPress?: (fund: Fund) => void` - Callback nút bán

### 📊 Portfolio Components

#### PortfolioOverviewScreen
```typescript
import { PortfolioOverviewScreen } from './components/portfolio/PortfolioOverviewScreen';

<PortfolioOverviewScreen
  portfolio={portfolio}
  onFundPress={(fund) => {
    // Navigate to fund detail
  }}
  onTransactionPress={(transaction) => {
    // Navigate to transaction detail
  }}
/>
```

**Props:**
- `portfolio: PortfolioOverview` - Thông tin tổng quan danh mục
- `onFundPress: (fund: any) => void` - Callback khi nhấn vào quỹ
- `onTransactionPress: (transaction: any) => void` - Callback khi nhấn vào giao dịch

## 🎨 Design System

### Colors
```typescript
const colors = {
  primary: '#2B4BFF',      // Blue
  secondary: '#FF5733',    // Orange
  success: '#33FF57',      // Green
  warning: '#FFD700',      // Gold
  error: '#DC143C',        // Crimson
  background: '#F8F9FA',   // Light gray
  text: '#212529',         // Dark gray
  textSecondary: '#6C757D', // Medium gray
  border: '#DEE2E6',       // Light border
};
```

### Typography
```typescript
const typography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  body: {
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    color: '#6C757D',
  },
};
```

### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

## 📱 Usage Examples

### Basic App Structure
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen, FundListScreen, PortfolioOverviewScreen } from './components';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Portfolio" component={PortfolioOverviewScreen} />
        <Tab.Screen name="Funds" component={FundListScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
```

### Authentication Flow
```typescript
import React, { useState } from 'react';
import { LoginScreen } from './components';

const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // API call to login
      await loginAPI(email, password);
      // Navigate to main app
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onNavigateToSignup={() => navigation.navigate('Signup')}
      onNavigateToForgotPassword={() => navigation.navigate('ForgotPassword')}
      isLoading={isLoading}
    />
  );
};
```

## 🔧 Development

### Adding New Components
1. Tạo file component trong thư mục phù hợp
2. Export component từ file `index.ts`
3. Thêm TypeScript interfaces nếu cần
4. Cập nhật documentation

### Styling Guidelines
- Sử dụng StyleSheet.create() cho styles
- Tuân thủ design system colors và spacing
- Responsive design cho các kích thước màn hình
- Accessibility support (semantic colors, proper contrast)

### Testing
- Unit tests cho logic components
- Integration tests cho user flows
- Accessibility testing
- Performance testing cho large lists

## 📚 Next Steps

### Components cần tạo tiếp:
1. **SignupScreen** - Màn hình đăng ký
2. **OTPVerification** - Xác thực OTP
3. **FundDetailScreen** - Chi tiết quỹ
4. **FundBuyScreen** - Màn hình mua quỹ
5. **FundSellScreen** - Màn hình bán quỹ
6. **TransactionHistoryScreen** - Lịch sử giao dịch
7. **ProfileScreen** - Hồ sơ người dùng
8. **Chart Components** - Biểu đồ

### Features cần implement:
1. **State Management** - Redux/Zustand
2. **API Integration** - Axios/React Query
3. **Navigation** - React Navigation
4. **Storage** - AsyncStorage
5. **Push Notifications** - Expo Notifications
6. **Biometric Auth** - Expo Local Authentication 