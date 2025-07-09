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

/**
 * @route GET /api/v1/transaction/pending
 * @desc Get pending transactions
 * @query { userId?: number, page?: number, limit?: number }
 * @returns { success: boolean, message: string, data: Array, pagination: Object }
 */
router.get('/pending', async (req, res) => {
  await transactionController.getPendingTransactions(req, res);
});

/**
 * @route GET /api/v1/transaction/history
 * @desc Get transaction history with filters
 * @query { userId?: number, status?: string, page?: number, limit?: number, startDate?: string, endDate?: string }
 * @returns { success: boolean, message: string, data: Array, pagination: Object }
 */
router.get('/history', async (req, res) => {
  await transactionController.getTransactionHistory(req, res);
});

/**
 * @route GET /api/v1/transaction/stats
 * @desc Get transaction statistics
 * @query { userId?: number, period?: string }
 * @returns { success: boolean, message: string, data: Object }
 */
router.get('/stats', async (req, res) => {
  await transactionController.getTransactionStats(req, res);
});

/**
 * @route GET /api/v1/transaction/:id
 * @desc Get specific transaction by ID
 * @param { id: number }
 * @returns { success: boolean, message: string, data: Object }
 */
router.get('/:id', async (req, res) => {
  await transactionController.getTransactionById(req, res);
});

module.exports = router; 