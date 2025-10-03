const BaseOdooService = require('../services/BaseOdooService');
const AuthService = require('../services/AuthService');
const axios = require('axios');

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
   * Thực hiện ký số - Gọi Flask service có sẵn trong Odoo
   */
  async performDigitalSignature(req, res) {
    try {
      const {
        signer_email,
        transaction_type,
        fund_id,
        fund_name,
        amount,
        units,
        investor_name,
        investor_id_card,
        investor_phone
      } = req.body;

      console.log('🔐 [SignatureController] Performing digital signature:', {
        signer_email,
        transaction_type,
        fund_id,
        fund_name,
        amount
      });

      // Validate input
      if (!signer_email) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin email'
        });
      }

      // Gọi Flask service ký số có sẵn trong Odoo (chạy trên port 5000)
      // Tạo document giả để Flask service không trả về lỗi thiếu dữ liệu
      const dummyDocument = Buffer.from(`Transaction: ${transaction_type}\nFund: ${fund_name}\nAmount: ${amount}`).toString('base64');
      
      const flaskResponse = await axios.post('http://127.0.0.1:5000/api/sign', {
        document_base64: dummyDocument,
        signer: signer_email
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ [SignatureController] Flask service response:', flaskResponse.data);

      if (flaskResponse.data && flaskResponse.data.success) {
        return res.json({
          success: true,
          signature_id: flaskResponse.data.signature,
          timestamp: flaskResponse.data.timestamp,
          message: 'Ký số thành công'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Ký số thất bại'
        });
      }

    } catch (error) {
      console.error('❌ [SignatureController] Digital signature error:', error.message);
      
      // Log chi tiết lỗi
      if (error.response) {
        console.error('Flask service error response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('Flask service no response:', error.request);
      } else {
        console.error('Flask service request setup error:', error.message);
      }
      
      // Kiểm tra xem Flask service có đang chạy không
      let errorMessage = 'Lỗi khi thực hiện ký số';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Flask service không chạy. Vui lòng kiểm tra service trên port 5000.';
      } else if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Flask service trả về lỗi';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message
      });
    }
  }

  /**
   * Xử lý ký tay
   */
  async processHandSignature(req, res) {
    try {
      const {
        signature_image,
        signer_email,
        transaction_type,
        fund_id,
        fund_name,
        amount,
        units
      } = req.body;

      console.log('✍️ [SignatureController] Processing hand signature:', {
        signer_email,
        transaction_type,
        fund_id,
        signature_length: signature_image?.length || 0
      });

      // Validate input
      if (!signature_image || !signer_email) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu ảnh chữ ký hoặc email'
        });
      }

      // Ensure authenticated session
      const session = await this.authService.getValidSession();
      
      // Gọi Odoo API để xử lý ký tay
      const response = await this.odooService.apiCall('/hand_signature', {
        method: 'POST',
        requireAuth: true,
        data: new URLSearchParams({
          signature_image,
          signer_email,
          transaction_type: transaction_type || 'general',
          fund_id: fund_id || '',
          fund_name: fund_name || '',
          amount: amount || 0,
          units: units || 0
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('✅ [SignatureController] Hand signature response:', response);

      if (response && response.success) {
        return res.json({
          success: true,
          signature_id: response.signature_id,
          timestamp: response.timestamp || new Date().toISOString(),
          message: response.message || 'Xử lý chữ ký tay thành công'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: response.message || 'Xử lý chữ ký tay thất bại'
        });
      }

    } catch (error) {
      console.error('❌ [SignatureController] Hand signature error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý chữ ký tay'
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

