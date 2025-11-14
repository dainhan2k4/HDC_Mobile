const BaseOdooService = require('./BaseOdooService');

class OTPService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
  }

  /**
   * Get OTP config - Lấy thông tin cấu hình OTP
   */
  async getOTPConfig() {
    try {
      console.log('📱 [OTPService] Getting OTP config...');
      
      await this.authService.getValidSession();
      
      const response = await this.apiCall('/api/otp/config', {
        method: 'POST',
        requireAuth: true,
        data: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {}
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 [OTPService] Raw OTP config response:', typeof response, response);
      
      // Parse response if string
      let parsedResponse = response;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch (parseError) {
          console.warn('⚠️ [OTPService] Failed to parse config response as JSON:', parseError.message);
          return { success: false, message: response };
        }
      }
      
      // Handle JSON-RPC format
      if (parsedResponse.result) {
        parsedResponse = parsedResponse.result;
      }
      
      console.log('✅ [OTPService] OTP config retrieved:', parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error('❌ [OTPService] Failed to get OTP config:', error.message);
      throw error;
    }
  }

  /**
   * Verify OTP - Xác thực mã OTP
   */
  async verifyOTP(otp, debugMode = false) {
    try {
      console.log('🔐 [OTPService] Verifying OTP...', { 
        otp: otp ? otp.substring(0, 2) + '****' : 'empty',
        debugMode 
      });
      
      await this.authService.getValidSession();
      
      const response = await this.apiCall('/api/otp/verify', {
        method: 'POST',
        requireAuth: true,
        data: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            otp: otp || '',
            debug: debugMode || false
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 [OTPService] Raw OTP verify response:', typeof response, response);
      
      // Parse response if string
      let parsedResponse = response;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch (parseError) {
          console.warn('⚠️ [OTPService] Failed to parse verify response as JSON:', parseError.message);
          return { success: false, message: response };
        }
      }
      
      // Handle JSON-RPC format
      if (parsedResponse.result) {
        parsedResponse = parsedResponse.result;
      }
      
      if (parsedResponse.success) {
        console.log('✅ [OTPService] OTP verified successfully');
      } else {
        console.warn('⚠️ [OTPService] OTP verification failed:', parsedResponse.message);
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('❌ [OTPService] Failed to verify OTP:', error.message);
      throw error;
    }
  }
}

module.exports = OTPService;

