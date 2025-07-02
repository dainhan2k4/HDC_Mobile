# Phân tích Components cho App Expo

## 📊 Tổng quan các Addons

### 1. **Fund Management** - Quản lý quỹ đầu tư
### 2. **Overview Fund Management** - Tổng quan danh mục
### 3. **Transaction Management** - Quản lý giao dịch
### 4. **Investor Profile Management** - Quản lý hồ sơ nhà đầu tư
### 5. **Custom Auth** - Xác thực tùy chỉnh
### 6. **Asset Management** - Quản lý tài sản

---

## 🎯 Components cần thiết cho App Expo

### 🔐 **1. Authentication Components**

#### 1.1 Login Component
```typescript
// components/auth/LoginScreen.tsx
- Email/Phone input
- Password input
- Login button
- Forgot password link
- Sign up link
- OTP verification (nếu cần)
```

#### 1.2 Signup Component
```typescript
// components/auth/SignupScreen.tsx
- Personal information form
- Email/Phone verification
- OTP verification
- Terms & conditions
- Submit button
```

#### 1.3 OTP Verification Component
```typescript
// components/auth/OTPVerification.tsx
- OTP input fields
- Resend OTP button
- Timer countdown
- Verify button
```

#### 1.4 Forgot Password Component
```typescript
// components/auth/ForgotPasswordScreen.tsx
- Email/Phone input
- Reset password form
- OTP verification
- New password input
```

### 📈 **2. Fund Management Components**

#### 2.1 Fund List Component
```typescript
// components/fund/FundListScreen.tsx
- Fund cards với thông tin:
  + Ticker symbol
  + Fund name
  + Current NAV
  + Current YTD
  + Investment type
  + Color indicator
- Search functionality
- Filter by investment type
- Sort options
```

#### 2.2 Fund Detail Component
```typescript
// components/fund/FundDetailScreen.tsx
- Fund information
- NAV history chart
- YTD performance
- Investment options (Buy/Sell)
- Fund description
- Risk indicators
```

#### 2.3 Fund Buy Component
```typescript
// components/fund/FundBuyScreen.tsx
- Amount input
- Units calculation
- Fee calculation
- Investment type selection (Flex/SIP)
- Confirmation screen
- Result screen
```

#### 2.4 Fund Sell Component
```typescript
// components/fund/FundSellScreen.tsx
- Units input
- Amount calculation
- Current holdings display
- Confirmation screen
- Result screen
```

#### 2.5 Fund Compare Component
```typescript
// components/fund/FundCompareScreen.tsx
- Multiple fund selection
- Performance comparison chart
- Side-by-side metrics
- Risk comparison
```

### 📊 **3. Portfolio Components**

#### 3.1 Portfolio Overview Component
```typescript
// components/portfolio/PortfolioOverviewScreen.tsx
- Total investment value
- Current portfolio value
- Profit/Loss percentage
- Asset allocation chart
- Top performing funds
- Recent transactions
```

#### 3.2 Investment Portfolio Component
```typescript
// components/portfolio/InvestmentPortfolioScreen.tsx
- Holdings list
- Fund performance
- Units owned
- Current value
- Profit/Loss per fund
- Color-coded performance
```

#### 3.3 Portfolio Chart Component
```typescript
// components/portfolio/PortfolioChartScreen.tsx
- Pie chart for asset allocation
- Line chart for portfolio growth
- Performance over time
- Interactive charts
```

### 💰 **4. Transaction Components**

#### 4.1 Transaction History Component
```typescript
// components/transaction/TransactionHistoryScreen.tsx
- Transaction list
- Date and time
- Transaction type (Buy/Sell)
- Amount/Units
- Status indicators
- Filter options
```

#### 4.2 Pending Transactions Component
```typescript
// components/transaction/PendingTransactionsScreen.tsx
- Pending orders list
- Order details
- Cancel option
- Status updates
```

#### 4.3 Periodic Investment Component
```typescript
// components/transaction/PeriodicInvestmentScreen.tsx
- SIP setup form
- Frequency selection
- Amount input
- Fund selection
- Schedule management
```

### 👤 **5. Profile Components**

#### 5.1 Personal Profile Component
```typescript
// components/profile/PersonalProfileScreen.tsx
- Personal information
- ID documents
- Profile picture
- Edit functionality
- Verification status
```

#### 5.2 Bank Account Component
```typescript
// components/profile/BankAccountScreen.tsx
- Bank account list
- Add new account
- Account verification
- Default account selection
```

#### 5.3 Address Component
```typescript
// components/profile/AddressScreen.tsx
- Address information
- Multiple addresses
- Address verification
- Default address
```

#### 5.4 Verification Component
```typescript
// components/profile/VerificationScreen.tsx
- Document upload
- Verification status
- Progress tracking
- Re-upload option
```

### 📱 **6. Navigation Components**

#### 6.1 Bottom Tab Navigator
```typescript
// navigation/BottomTabNavigator.tsx
- Home/Dashboard
- Funds
- Portfolio
- Transactions
- Profile
```

#### 6.2 Header Component
```typescript
// components/common/Header.tsx
- User avatar
- Notifications
- Settings menu
- Search functionality
```

### 🎨 **7. Common UI Components**

#### 7.1 Fund Card Component
```typescript
// components/common/FundCard.tsx
- Fund information display
- Performance indicators
- Action buttons
- Color themes
```

#### 7.2 Transaction Card Component
```typescript
// components/common/TransactionCard.tsx
- Transaction details
- Status indicators
- Amount display
- Date formatting
```

#### 7.3 Chart Components
```typescript
// components/common/Charts/
- LineChart.tsx
- PieChart.tsx
- BarChart.tsx
- PerformanceChart.tsx
```

#### 7.4 Form Components
```typescript
// components/common/Forms/
- InputField.tsx
- SelectField.tsx
- DatePicker.tsx
- AmountInput.tsx
- OTPInput.tsx
```

---

## 🚀 **API Endpoints cần thiết**

### Authentication APIs
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`

### Fund APIs
- `GET /api/funds` - Danh sách quỹ
- `GET /api/funds/{id}` - Chi tiết quỹ
- `POST /api/funds/buy` - Mua quỹ
- `POST /api/funds/sell` - Bán quỹ
- `GET /api/funds/compare` - So sánh quỹ

### Portfolio APIs
- `GET /api/portfolio/overview` - Tổng quan danh mục
- `GET /api/portfolio/holdings` - Danh mục đầu tư
- `GET /api/portfolio/performance` - Hiệu suất danh mục

### Transaction APIs
- `GET /api/transactions` - Lịch sử giao dịch
- `GET /api/transactions/pending` - Giao dịch chờ xử lý
- `POST /api/transactions/periodic` - Đầu tư định kỳ

### Profile APIs
- `GET /api/profile` - Thông tin cá nhân
- `PUT /api/profile` - Cập nhật thông tin
- `POST /api/profile/bank-accounts` - Thêm tài khoản ngân hàng
- `POST /api/profile/addresses` - Thêm địa chỉ
- `POST /api/profile/verify` - Xác thực hồ sơ

---

## 📁 **Cấu trúc thư mục đề xuất**

```
my-app/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── OTPVerification.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── fund/
│   │   │   ├── FundListScreen.tsx
│   │   │   ├── FundDetailScreen.tsx
│   │   │   ├── FundBuyScreen.tsx
│   │   │   ├── FundSellScreen.tsx
│   │   │   └── FundCompareScreen.tsx
│   │   ├── portfolio/
│   │   │   ├── PortfolioOverviewScreen.tsx
│   │   │   ├── InvestmentPortfolioScreen.tsx
│   │   │   └── PortfolioChartScreen.tsx
│   │   ├── transaction/
│   │   │   ├── TransactionHistoryScreen.tsx
│   │   │   ├── PendingTransactionsScreen.tsx
│   │   │   └── PeriodicInvestmentScreen.tsx
│   │   ├── profile/
│   │   │   ├── PersonalProfileScreen.tsx
│   │   │   ├── BankAccountScreen.tsx
│   │   │   ├── AddressScreen.tsx
│   │   │   └── VerificationScreen.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── FundCard.tsx
│   │       ├── TransactionCard.tsx
│   │       ├── Charts/
│   │       └── Forms/
│   ├── navigation/
│   │   ├── BottomTabNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── fundService.ts
│   │   ├── portfolioService.ts
│   │   └── transactionService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFunds.ts
│   │   └── usePortfolio.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── formatters.ts
│   └── types/
│       ├── auth.ts
│       ├── fund.ts
│       ├── portfolio.ts
│       └── transaction.ts
```

---

## 🎨 **Design System**

### Colors
- Primary: #2B4BFF (Blue)
- Secondary: #FF5733 (Orange)
- Success: #33FF57 (Green)
- Warning: #FFD700 (Gold)
- Error: #DC143C (Crimson)
- Background: #F8F9FA
- Text: #212529

### Typography
- Headings: Inter, Bold
- Body: Inter, Regular
- Captions: Inter, Medium

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

---

## 📱 **Features chính**

### 1. **Authentication & Security**
- Login/Logout
- OTP verification
- Biometric authentication
- Session management

### 2. **Fund Management**
- Browse funds
- Fund details
- Buy/Sell funds
- Fund comparison
- Performance tracking

### 3. **Portfolio Management**
- Portfolio overview
- Holdings management
- Performance charts
- Asset allocation

### 4. **Transaction Management**
- Transaction history
- Pending transactions
- Periodic investments
- Order management

### 5. **Profile Management**
- Personal information
- Bank accounts
- Addresses
- Document verification

### 6. **Notifications**
- Transaction updates
- Market alerts
- Portfolio notifications
- System messages

---

## 🔧 **Technical Stack**

### Core
- React Native
- Expo
- TypeScript
- React Navigation

### State Management
- React Context API
- AsyncStorage

### UI Components
- React Native Elements
- React Native Paper
- Victory Native (Charts)

### API
- Axios
- React Query

### Development
- ESLint
- Prettier
- Husky 