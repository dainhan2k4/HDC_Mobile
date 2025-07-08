const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const OdooService = require('../services/OdooService');

const router = express.Router();

// Initialize services and controllers
const odooService = new OdooService();
const transactionController = new TransactionController(odooService);

/**
 * @route POST /api/v1/transaction/buy
 * @desc Create a fund purchase transaction
 * @body { fundId: number, amount: number, units: number }
 * @returns { success: boolean, message: string, data?: any }
 */
router.post('/buy', async (req, res) => {
  await transactionController.buyFund(req, res);
});

/**
 * @route POST /api/v1/transaction/sell  
 * @desc Create a fund sale transaction
 * @body { fundId: number, units: number }
 * @returns { success: boolean, message: string, data?: any }
 */
router.post('/sell', async (req, res) => {
  await transactionController.sellFund(req, res);
});

module.exports = router; 