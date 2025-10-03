# Tích hợp chữ ký số/ký tay cho giao dịch CCQ

## Tổng quan

Hệ thống hỗ trợ 2 loại chữ ký:
1. **Ký tay**: Người dùng vẽ chữ ký trên canvas, hệ thống chụp ảnh và gửi lên Odoo
2. **Ký số**: Gọi Flask service để tạo chữ ký số (crypto signature)

## Kiến trúc

```
Client App (React Native)
    ↓ (1) Hiển thị SignatureModal
    ↓ (2) Thu thập chữ ký
    ↓
API Middleware (Express)
    ↓ (3) Validate signature qua /api/v1/signature/validate
    ↓
Odoo Backend
    ↓ (4) Endpoint /validate_signature
    ↓ (5) Lưu vào model signature.record
    ↓ (6) Trả về valid: true/false
    ↓
API Middleware
    ↓ (7) Nhận kết quả validation
    ↓
Client App
    ↓ (8) Nếu valid → gọi buyFundDirect/sellFundDirect với signature data
```

## Files đã tạo/cập nhật

### 1. Client App

**Đã tạo:**
- `client_app/src/components/signature/SignatureModal.tsx`
  - Modal cho ký tay/ký số
  - Canvas drawing với @shopify/react-native-skia
  - Integration với API validation

**Cần cập nhật:**
- `client_app/src/screens/transaction/TransactionManagementScreen.tsx`
  - Import SignatureModal
  - Thêm state cho signature
  - Gọi modal trước khi buy/sell
  - Chỉ submit khi có signature hợp lệ

### 2. API Middleware

**Đã tạo:**
- `api-middleware/src/controllers/SignatureController.js`
  - `validateSignature()`: Validate chữ ký qua Odoo
  - `getSignatureHistory()`: Lấy lịch sử chữ ký

- `api-middleware/src/routes/signatureRoutes.js`
  - `POST /api/v1/signature/validate`
  - `GET /api/v1/signature/history`

**Đã cập nhật:**
- `api-middleware/src/services/FundService.js`
  - `buyFundDirect(fundId, amount, units, signature = {})`
  - `sellFundDirect(fundId, units, signature = {})`
  - Thêm các trường: signature_type, signature_value, signed_pdf_path, signer_email

- `api-middleware/src/server.js`
  - Import signatureRoutes
  - Mount `/api/v1/signature` endpoint

### 3. Odoo Backend (CẦN TẠO)

**Cần tạo addon mới: `signature_management`**

**File: `addons/signature_management/models/signature_record.py`**
```python
from odoo import models, fields, api
from datetime import datetime

class SignatureRecord(models.Model):
    _name = 'signature.record'
    _description = 'Digital/Hand Signature Record'

    user_id = fields.Many2one('res.users', string='User', required=True)
    signature_type = fields.Selection([
        ('hand', 'Ký tay'),
        ('digital', 'Ký số')
    ], required=True)
    signature_value = fields.Text(string='Signature Data', required=True)
    signed_pdf_path = fields.Char(string='Signed PDF Path')
    signer_email = fields.Char(string='Signer Email', required=True)
    transaction_type = fields.Char(string='Transaction Type')
    is_valid = fields.Boolean(string='Valid', default=False)
    validated_at = fields.Datetime(string='Validated At')
    created_at = fields.Datetime(string='Created At', default=fields.Datetime.now)
```

**File: `addons/signature_management/controllers/signature_controller.py`**
```python
from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class SignatureController(http.Controller):
    
    @http.route('/validate_signature', type='http', auth='user', methods=['POST'], csrf=False)
    def validate_signature(self, **kwargs):
        """Validate chữ ký từ middleware"""
        try:
            signature_type = kwargs.get('signature_type')
            signature_value = kwargs.get('signature_value')
            signer_email = kwargs.get('signer_email')
            transaction_type = kwargs.get('transaction_type', 'general')

            _logger.info(f"🔍 Validating signature: type={signature_type}, email={signer_email}")

            # Validate input
            if not all([signature_type, signature_value, signer_email]):
                return request.make_json_response({
                    'valid': False,
                    'message': 'Thiếu thông tin chữ ký'
                })

            if signature_type not in ['hand', 'digital']:
                return request.make_json_response({
                    'valid': False,
                    'message': 'Loại chữ ký không hợp lệ'
                })

            # Verify email matches current user
            current_user = request.env.user
            if current_user.email != signer_email:
                return request.make_json_response({
                    'valid': False,
                    'message': 'Email không khớp với người dùng hiện tại'
                })

            # Validate signature based on type
            if signature_type == 'hand':
                # Validate hand signature (check if image data is valid base64)
                if not signature_value.startswith('data:image/'):
                    return request.make_json_response({
                        'valid': False,
                        'message': 'Ảnh chữ ký không hợp lệ'
                    })
            elif signature_type == 'digital':
                # Validate digital signature (check format)
                if len(signature_value) < 20:
                    return request.make_json_response({
                        'valid': False,
                        'message': 'Chữ ký số không hợp lệ'
                    })

            # Create signature record
            signature_record = request.env['signature.record'].sudo().create({
                'user_id': current_user.id,
                'signature_type': signature_type,
                'signature_value': signature_value,
                'signer_email': signer_email,
                'transaction_type': transaction_type,
                'is_valid': True,
                'validated_at': fields.Datetime.now()
            })

            _logger.info(f"✅ Signature validated and recorded: ID={signature_record.id}")

            return request.make_json_response({
                'valid': True,
                'message': 'Chữ ký hợp lệ',
                'signature_id': signature_record.id
            })

        except Exception as e:
            _logger.error(f"❌ Signature validation error: {str(e)}")
            return request.make_json_response({
                'valid': False,
                'message': f'Lỗi xác thực: {str(e)}'
            })
```

## Cách tích hợp vào TransactionManagementScreen

```typescript
import SignatureModal from '../../components/signature/SignatureModal';

// ... trong component

const [showSignatureModal, setShowSignatureModal] = useState(false);
const [pendingTransaction, setPendingTransaction] = useState<{
  type: 'buy' | 'sell';
  fundId: number;
  amount?: number;
  units: number;
} | null>(null);
const [signature, setSignature] = useState<{
  type: 'hand' | 'digital';
  value: string;
  timestamp: string;
} | null>(null);

// Khi user bấm "Mua" hoặc "Bán"
const handleBuyPress = (fundId: number, amount: number, units: number) => {
  setPendingTransaction({ type: 'buy', fundId, amount, units });
  setShowSignatureModal(true);
};

const handleSellPress = (fundId: number, units: number) => {
  setPendingTransaction({ type: 'sell', fundId, units });
  setShowSignatureModal(true);
};

// Callback khi ký xong
const handleSignatureComplete = (sig: any) => {
  setSignature(sig);
  setShowSignatureModal(false);
  
  // Thực hiện giao dịch với chữ ký
  if (pendingTransaction) {
    if (pendingTransaction.type === 'buy') {
      executeBuyWithSignature(
        pendingTransaction.fundId,
        pendingTransaction.amount!,
        pendingTransaction.units,
        sig
      );
    } else {
      executeSellWithSignature(
        pendingTransaction.fundId,
        pendingTransaction.units,
        sig
      );
    }
  }
};

const executeBuyWithSignature = async (
  fundId: number,
  amount: number,
  units: number,
  sig: any
) => {
  try {
    setLoading(true);
    
    const response = await fetch('http://localhost:3000/api/v1/transaction/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fundId,
        amount,
        units,
        signature: {
          signature_type: sig.type,
          signature_value: sig.value,
          signer_email: userEmail, // từ context/state
        },
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      Alert.alert('Thành công', 'Đã mua CCQ thành công');
      // Refresh data
    } else {
      Alert.alert('Lỗi', result.error || 'Giao dịch thất bại');
    }
  } catch (error) {
    Alert.alert('Lỗi', 'Không thể thực hiện giao dịch');
  } finally {
    setLoading(false);
    setPendingTransaction(null);
    setSignature(null);
  }
};

// Tương tự cho executeSellWithSignature

// Render modal
<SignatureModal
  visible={showSignatureModal}
  onClose={() => {
    setShowSignatureModal(false);
    setPendingTransaction(null);
  }}
  onSignatureComplete={handleSignatureComplete}
  transactionType={pendingTransaction?.type || 'buy'}
  userEmail={userEmail}
/>
```

## API Endpoints

### 1. Validate Signature
```
POST http://localhost:3000/api/v1/signature/validate

Body:
{
  "signature_type": "hand" | "digital",
  "signature_value": "data:image/png;base64,..." hoặc "SignedBy:...",
  "signer_email": "user@example.com",
  "transaction_type": "buy" | "sell"
}

Response:
{
  "valid": true,
  "message": "Chữ ký hợp lệ",
  "signature_id": 123
}
```

### 2. Buy Fund với Signature
```
POST http://localhost:3000/api/v1/transaction/buy

Body:
{
  "fundId": 2,
  "amount": 100000,
  "units": 10,
  "signature": {
    "signature_type": "hand",
    "signature_value": "data:image/png;base64,...",
    "signer_email": "user@example.com"
  }
}
```

### 3. Sell Fund với Signature
```
POST http://localhost:3000/api/v1/transaction/sell

Body:
{
  "fundId": 2,
  "units": 5,
  "signature": {
    "signature_type": "digital",
    "signature_value": "SignedBy:user@example.com@2025-10-03 12:00:00",
    "signer_email": "user@example.com"
  }
}
```

## Flow hoàn chỉnh

1. User mở app → vào màn giao dịch
2. Chọn fund → nhập số lượng/số tiền
3. Bấm "Mua" hoặc "Bán"
4. **SignatureModal hiện ra** với 2 tab: Ký tay / Ký số
5. User chọn loại ký:
   - **Ký tay**: Vẽ chữ ký → bấm "Xác nhận"
   - **Ký số**: Bấm "Thực hiện ký số"
6. App gọi `POST /api/v1/signature/validate` → Odoo validate
7. Nếu `valid: true`:
   - Hiện confirm dialog
   - User bấm "Xác nhận" → gọi buy/sell API với signature data
8. Middleware nhận request → forward signature sang Odoo
9. Odoo xử lý giao dịch + lưu signature_id vào transaction
10. Trả về success → App hiển thị thành công

## Lưu ý

1. **Security**: 
   - Signature validation phải match với current user email
   - Không cho phép reuse signature cũ (check timestamp)

2. **UX**:
   - Cho phép cancel modal signature
   - Hiển thị preview signature trước khi submit
   - Loading state khi validate/submit

3. **Error handling**:
   - Network timeout
   - Invalid signature format
   - User mismatch
   - Transaction failed sau khi ký

4. **Performance**:
   - Canvas drawing mượt mà (60fps)
   - Compress base64 image nếu quá lớn
   - Cache signature trong session (tùy chọn)

## Testing

1. Test ký tay: Vẽ chữ ký → kiểm tra base64 image valid
2. Test ký số: Gọi Flask API → kiểm tra signature format
3. Test validation: Email match, signature type đúng
4. Test buy/sell: Giao dịch thành công sau khi ký
5. Test error cases: Invalid signature, network error, user mismatch

## Next Steps

1. ✅ Tạo SignatureModal component
2. ✅ Tạo middleware validation endpoint
3. ✅ Update FundService để nhận signature
4. ⏳ Tạo Odoo addon `signature_management`
5. ⏳ Tích hợp vào TransactionManagementScreen
6. ⏳ Testing end-to-end
7. ⏳ UI/UX polish

