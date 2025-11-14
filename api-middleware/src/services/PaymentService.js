const BaseOdooService = require('./BaseOdooService');

class PaymentService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
  }

  /**
   * Create PayOS payment link
   * Calls Odoo endpoint /api/payment/create
   */
  async createPayOSPayment({ transaction_id, amount, units, description }) {
    try {
      console.log(`🔄 [PaymentService] Creating PayOS payment:`, {
        transaction_id,
        amount,
        units,
        description
      });

      // Ensure valid session
      await this.authService.getValidSession();

      // Prepare JSON payload (Odoo endpoint supports both JSON and form data)
      const payload = {
        transaction_id: transaction_id || 0,
        amount: parseFloat(amount),
        units: parseFloat(units),
        description: description || `Nap tien TK${transaction_id ? String(transaction_id).slice(-4) : '****'} tai HDC`,
        cancel_url: '/fund_buy', // Default cancel URL
        return_url: '/payment/success' // Default return URL
      };

      const response = await this.apiCall('/api/payment/create', {
        method: 'POST',
        requireAuth: true,
        data: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 [PaymentService] /api/payment/create response:', response);

      // Check response format from Odoo
      // Odoo returns: { success: true, checkout_url, qr_code, order_code, data: {...}, bank_info: {...} }
      if (response && response.success === true) {
        const checkoutUrl = response.checkout_url || response.checkoutUrl;
        // PayOS có thể trả về qrCodeUrl (URL hình ảnh) hoặc qrCode (base64/VietQR string)
        const qrCodeUrl = (response.data && response.data.qrCodeUrl) || 
                         (response.data && response.data.qr_code_url) ||
                         response.qrCodeUrl || response.qr_code_url;
        const qrCode = response.qr_code || response.qrCode || 
                      (response.data && (response.data.qr_code || response.data.qrCode)) ||
                      qrCodeUrl; // Ưu tiên URL nếu có
        const accountNumber = (response.bank_info && response.bank_info.account_number) || 
                             (response.data && response.data.account_number) ||
                             (response.order_code ? String(response.order_code).slice(-4) : '****');
        
        console.log('📊 [PaymentService] Parsed payment data:', {
          hasCheckoutUrl: !!checkoutUrl,
          hasQrCode: !!qrCode,
          qrCodeType: qrCode ? (qrCode.startsWith('http') ? 'URL' : qrCode.startsWith('data:') ? 'DataURI' : 'String') : 'None',
          accountNumber
        });
        
        return {
          success: true,
          data: {
            checkoutUrl: checkoutUrl,
            qrCode: qrCode, // Có thể là URL hoặc base64 string
            accountNumber: accountNumber,
            amount: amount,
            description: description
          }
        };
      }

      // If response has error
      if (response && response.success === false) {
        throw new Error(response.error || response.message || 'Failed to create PayOS payment');
      }

      // If response doesn't have expected format
      throw new Error(response.error || response.message || 'Unexpected response format from Odoo');
    } catch (error) {
      console.error('❌ [PaymentService] Failed to create PayOS payment:', error.message);
      throw error;
    }
  }
}

module.exports = PaymentService;

