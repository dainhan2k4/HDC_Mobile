# Transaction Management Screens

Quản lý giao dịch với integration API từ middleware service.

## 📁 Cấu trúc Files

```
transaction/
├── TransactionManagementScreen.tsx    # Main screen với API integration  
├── TransactionManagementContainer.tsx # Container wrapper
└── README.md                         # Documentation
```

## 🔧 TransactionManagementScreen

### Tính năng chính:
- **3 Tabs:** Lệnh chờ mua, Lịch sử giao dịch, Lệnh chờ chuyển đổi
- **API Integration:** Sử dụng `transactionApi` từ middleware
- **Real-time Data:** Tự động load data khi switch tabs
- **Pull-to-refresh:** Refresh data với gesture
- **Status Display:** Hiển thị trạng thái với màu sắc khác nhau
- **Error Handling:** Alert khi có lỗi API

### API Endpoints sử dụng:

```typescript
// Lệnh chờ xử lý
transactionApi.getPendingTransactions()

// Lịch sử giao dịch  
transactionApi.getTransactionHistory()

// Lệnh định kỳ (TODO)
transactionApi.getPeriodicTransactions()
```

## 📊 Transaction Data Structure

```typescript
interface Transaction {
  id: number;
  fund_name: string;
  transaction_type: 'buy' | 'sell';
  amount: number;
  units?: number;
  status: string;
  date: string;
}
```

## 🎨 UI Components

### TransactionItem
- Hiển thị thông tin quỹ, số tiền, trạng thái
- Status badge với màu sắc theo trạng thái:
  - 🟠 **Pending**: Chờ khớp lệnh  
  - 🟢 **Completed**: Hoàn thành
  - 🔴 **Cancelled**: Đã hủy
  - 🔵 **Processing**: Đang xử lý

### Tab Navigation
- Tab switching với animation
- Active tab highlighting
- Responsive design

## 📱 Usage

```typescript
import { TransactionManagementContainer } from '../../screens/transaction/TransactionManagementContainer';

// Sử dụng trong navigation
<TransactionManagementContainer />
```

## 🔄 State Management

```typescript
const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'recurring'>('pending');
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [loading, setLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
```

## 🚀 TODO Features

- [ ] Transaction detail screen navigation
- [ ] Create order screen integration  
- [ ] Recurring transactions API
- [ ] Filtering & search functionality
- [ ] Pagination for large datasets
- [ ] Transaction statistics
- [ ] Export to PDF/Excel

## 🐛 Error Handling

Screen xử lý các lỗi phổ biến:
- Network errors
- API timeout
- Invalid response data
- Empty states

## 🔗 Dependencies

```typescript
// API
import { transactionApi } from '../../api/transactionApi';

// Formatting
import { formatVND } from '../../hooks/formatCurrency';

// Types
import { Transaction } from '../../api/transactionApi';
```

## 📝 Notes

- Screen tương thích với màn hình giao diện hiện có của Odoo
- Sử dụng pull-to-refresh để cập nhật data
- Loading states được xử lý đúng cách
- Empty states có thông báo phù hợp
- Responsive design cho các kích thước màn hình khác nhau 