const OdooService = require('../services/OdooService');

class OTPController {
  constructor() {
    this.odooService = new OdooService();
  }

  /**
   * Get OTP config
   */
  async getOTPConfig(req, res) {
    try {
      console.log('📱 [OTPController] Getting OTP config...');
      const data = await this.odooService.otpService.getOTPConfig();
      
      res.json({
        success: data.success !== false,
        data: data,
        message: data.message || 'Lấy cấu hình OTP thành công'
      });
    } catch (error) {
      console.error('❌ [OTPController] Get OTP config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy cấu hình OTP',
        error: error.message
      });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req, res) {
    try {
      console.log('🔐 [OTPController] Verifying OTP...', { 
        hasOtp: !!req.body.otp,
        debugMode: req.body.debugMode 
      });
      
      const { otp, debugMode } = req.body;
      
      if (!otp && !debugMode) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu mã OTP'
        });
      }
      
      const data = await this.odooService.otpService.verifyOTP(otp || '', debugMode || false);
      
      res.json({
        success: data.success === true,
        data: data,
        message: data.message || (data.success ? 'Xác thực OTP thành công' : 'Xác thực OTP thất bại')
      });
    } catch (error) {
      console.error('❌ [OTPController] Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể xác thực OTP',
        error: error.message
      });
    }
  }
}

module.exports = OTPController;

