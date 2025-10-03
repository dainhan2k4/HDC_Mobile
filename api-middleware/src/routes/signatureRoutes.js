const express = require('express');
const router = express.Router();
const SignatureController = require('../controllers/SignatureController');

const signatureController = new SignatureController();

/**
 * POST /api/v1/signature/validate
 * Validate chữ ký (tay hoặc số)
 */
router.post('/validate', async (req, res) => {
  await signatureController.validateSignature(req, res);
});

/**
 * GET /api/v1/signature/history
 * Lấy lịch sử chữ ký
 */
router.get('/history', async (req, res) => {
  await signatureController.getSignatureHistory(req, res);
});

module.exports = router;

