const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const OdooService = require('../services/OdooService');

const router = express.Router();

// Initialize services and controllers
const odooService = new OdooService();
const paymentController = new PaymentController(odooService);

/**
 * @route POST /api/v1/payment/create
 * @desc Create PayOS payment link
 * @body { transaction_id?: number, amount: number, units: number, description?: string }
 * @returns { success: boolean, data?: { checkoutUrl, qrCode, accountNumber, amount, description }, error?: string }
 */
router.post('/create', async (req, res) => {
  console.log('📥 [PaymentRoutes] POST /create hit');
  await paymentController.createPayment(req, res);
});

module.exports = router;

