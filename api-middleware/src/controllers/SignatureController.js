const BaseOdooService = require('../services/BaseOdooService');
const AuthService = require('../services/AuthService');

class SignatureController {
  constructor() {
    this.authService = new AuthService();
    this.odooService = new BaseOdooService(this.authService);
  }

  /**
   * Validate chữ ký (tay hoặc số) qua Odoo
   */
  async validateSignature(req, res) {
    try {
      const {
        signature_type,
        signature_value,
        signer_email,
        transaction_type
      } = req.body;

      console.log('🔍 [SignatureController] Validating signature:', {
        signature_type,
        signer_email,
        transaction_type,
        signature_length: signature_value?.length || 0
      });

      // Validate input
      if (!signature_type || !signature_value || !signer_email) {
        return res.status(400).json({
          valid: false,
          message: 'Thiếu thông tin chữ ký'
        });
      }

      if (!['hand', 'digital'].includes(signature_type)) {
        return res.status(400).json({
          valid: false,
          message: 'Loại chữ ký không hợp lệ'
        });
      }

      // Ensure authenticated session
      const session = await this.authService.getValidSession();
      
      // Gọi Odoo API để validate chữ ký
      const response = await this.odooService.apiCall('/validate_signature', {
        method: 'POST',
        requireAuth: true,
        data: new URLSearchParams({
          signature_type,
          signature_value,
          signer_email,
          transaction_type: transaction_type || 'general'
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('📊 [SignatureController] Odoo validation response:', response);

      if (response && response.valid) {
        return res.json({
          valid: true,
          message: response.message || 'Chữ ký hợp lệ',
          signature_id: response.signature_id
        });
      } else {
        return res.json({
          valid: false,
          message: response.message || 'Chữ ký không hợp lệ'
        });
      }

    } catch (error) {
      console.error('❌ [SignatureController] Validation error:', error.message);
      return res.status(500).json({
        valid: false,
        message: error.message || 'Lỗi xác thực chữ ký'
      });
    }
  }

  /**
   * Lấy lịch sử chữ ký của user
   */
  async getSignatureHistory(req, res) {
    try {
      const session = await this.authService.getValidSession();
      
      const response = await this.odooService.apiCall('/data_signature_history', {
        requireAuth: true
      });

      return res.json(response || []);
    } catch (error) {
      console.error('❌ [SignatureController] Failed to get signature history:', error.message);
      return res.status(500).json({
        error: error.message || 'Không thể lấy lịch sử chữ ký'
      });
    }
  }
}

module.exports = SignatureController;

