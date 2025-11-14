const express = require('express');
const OTPController = require('../controllers/otpController');

const router = express.Router();
const otpController = new OTPController();

/**
 * @route GET /api/v1/otp/config
 * @desc Get OTP configuration
 * @returns { success: boolean, data: { otp_type, has_valid_write_token, write_token_expires_in } }
 */
router.get('/config', async (req, res) => {
  console.log('📱 [OTPRoutes] GET /config route hit');
  await otpController.getOTPConfig(req, res);
});

/**
 * @route POST /api/v1/otp/verify
 * @desc Verify OTP code
 * @body { otp: string, debugMode: boolean }
 * @returns { success: boolean, data: { message, write_token } }
 */
router.post('/verify', async (req, res) => {
  console.log('🔐 [OTPRoutes] POST /verify route hit');
  await otpController.verifyOTP(req, res);
});

module.exports = router;

