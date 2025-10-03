# Cập nhật Transaction API - Gọi HTTP Endpoints thay vì JSON-RPC

## Tổng quan

Đã cập nhật `FundService` để gọi trực tiếp HTTP REST endpoints của Odoo thay vì dùng JSON-RPC `createRecord` gây lỗi 500.

## Các thay đổi

### 1. Buy Fund Transaction

**Trước (JSON-RPC):**
```javascript
const transactionData = {
  user_id: userId,
  fund_id: fundId,
  transaction_type: 'purchase',
  units: units,
  amount: amount,
  status: 'pending',
  investment_type: 'fund_certificate',
  transaction_date: new Date().toISOString().split('T')[0]
};

const transactionId = await this.createRecord("portfolio.transaction", transactionData);
// ❌ Lỗi: Odoo Server Error
```

**Sau (HTTP REST):**
```javascript
const response = await this.apiCall('/create_investment', {
  method: 'POST',
  requireAuth: true,
  data: new URLSearchParams({
    fund_id: fundId.toString(),
    units: units.toString(),
    amount: amount.toString()
  }).toString(),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});
// ✅ Success: Returns { success: true, id: investmentId, tx_id: transactionId }
```

**Odoo Endpoint:**
- URL: `POST /create_investment`
- Auth: `user` (requires login)
- Body: form-urlencoded với `fund_id`, `units`, `amount`
- Response: `{ success: true, message: "...", id: <investment_id>, tx_id: <transaction_id> }`

**Business Logic (Odoo tự động xử lý):**
1. Validate fund existence và user session
2. Calculate fee, effective unit price
3. MROUND 50 cho amount, fee, price
4. Idempotent guard (chống double-click trong 2 phút)
5. Tạo/update `portfolio.investment`
6. Tạo `portfolio.transaction` với status pending
7. Lưu contract PDF path từ session

### 2. Sell Fund Transaction

**Trước (JSON-RPC):**
```javascript
const transactionData = {
  user_id: userId,
  fund_id: fundId,
  transaction_type: 'sale',
  units: units,
  amount: amount,
  status: 'pending',
  investment_type: 'fund_certificate',
  transaction_date: new Date().toISOString().split('T')[0]
};

const transactionId = await this.createRecord("portfolio.transaction", transactionData);
// ❌ Lỗi: Odoo Server Error
```

**Sau (HTTP REST):**
```javascript
// 1. Lấy investment_id từ user's investments
const investments = await this.apiCall('/data_investment', { requireAuth: true });
const investment = investments.find(inv => inv.fund_id === fundId);

if (!investment) {
  throw new Error('No investment found. Cannot sell fund you don't own.');
}

// 2. Validate units
if (investment.units < units) {
  throw new Error('Insufficient units');
}

// 3. Calculate estimated value
const fund = await this.getFundById(fundId);
const estimatedValue = units * fund.current_nav;

// 4. Submit sell request
const response = await this.apiCall('/submit_fund_sell', {
  method: 'POST',
  requireAuth: true,
  data: new URLSearchParams({
    investment_id: investment.id.toString(),
    quantity: units.toString(),
    estimated_value: estimatedValue.toString()
  }).toString(),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});
// ✅ Success: Returns { success: true, message: "Cập nhật investment thành công" }
```

**Odoo Endpoint:**
- URL: `POST /submit_fund_sell`
- Auth: `user` (requires login)
- Body: form-urlencoded với `investment_id`, `quantity`, `estimated_value`
- Response: `{ success: true, message: "..." }`

**Business Logic (Odoo tự động xử lý):**
1. Validate investment existence
2. Get CCQ price từ inventory (fallback current_nav)
3. MROUND 50 cho price
4. Calculate capital cost
5. Update `portfolio.investment` (giảm units)
6. Tạo `portfolio.transaction` với type='sell'

## API Mapping Table

| Operation | Old Method | New Method | Odoo Endpoint |
|-----------|-----------|-----------|---------------|
| Buy Fund | JSON-RPC `createRecord` | HTTP POST | `/create_investment` |
| Sell Fund | JSON-RPC `createRecord` | HTTP POST | `/submit_fund_sell` |
| Get Funds | JSON-RPC `search_read` | HTTP GET | `/data_fund` |
| Get Investments | JSON-RPC `search_read` | HTTP GET | `/data_investment` |

## Benefits

1. **Đơn giản hơn:** HTTP form data thay vì JSON-RPC wrapper
2. **Ít lỗi hơn:** Không còn "Odoo Server Error" từ JSON-RPC
3. **Business logic đúng:** Odoo controller xử lý fee, MROUND, idempotent guard
4. **Validation tốt hơn:** Middleware check units available trước khi sell
5. **Response rõ ràng:** JSON response với success/error message

## Breaking Changes

### Response Format

**Buy Fund:**
```javascript
// Trước
return transactionId; // integer

// Sau
return {
  investmentId: response.id,
  transactionId: response.tx_id,
  message: response.message
};
```

**Sell Fund:**
```javascript
// Trước
return transactionId; // integer

// Sau
return {
  success: true,
  message: response.message
};
```

**TransactionController** vẫn trả về format cũ để backward compatible:
```javascript
res.json({
  success: true,
  message: 'Fund purchase completed successfully',
  data: result // { investmentId, transactionId, message }
});
```

## Testing

### Buy Fund Test
```bash
curl -X POST http://192.168.50.104:3001/api/v1/transaction/buy \
  -H "Content-Type: application/json" \
  -d '{
    "fundId": 2,
    "amount": 1111111,
    "units": 111.1111
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Fund purchase completed successfully",
  "data": {
    "investmentId": 123,
    "transactionId": 456,
    "message": "Đã tạo investment thành công"
  }
}
```

### Sell Fund Test
```bash
curl -X POST http://192.168.50.104:3001/api/v1/transaction/sell \
  -H "Content-Type: application/json" \
  -d '{
    "fundId": 2,
    "units": 50
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Fund sale completed successfully",
  "data": {
    "success": true,
    "message": "Cập nhật investment thành công."
  }
}
```

## Rollback Plan

Nếu cần rollback về JSON-RPC:
1. Git revert commit này
2. Hoặc comment out HTTP method, uncomment JSON-RPC method
3. Restart middleware

## Notes

- ✅ Middleware đã được cập nhật
- ✅ TransactionController giữ nguyên interface
- ✅ Mobile app không cần thay đổi
- ⚠️ Cần install Odoo addons trước: chạy `install_addons.bat`
- ⚠️ Endpoints yêu cầu authentication (session cookie)

## Related Files

- `api-middleware/src/services/FundService.js` - Buy/Sell implementation
- `api-middleware/src/controllers/TransactionController.js` - HTTP handlers
- `odoo-18-docker-compose/addons/fund_management/controller/investment_controller.py` - Odoo endpoints

