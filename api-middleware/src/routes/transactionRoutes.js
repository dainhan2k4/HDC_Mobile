const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const OdooService = require('../services/OdooService');

const router = express.Router();

// Initialize services and controllers
const odooService = new OdooService();
const transactionController = new TransactionController(odooService);

/**
 * Controller-proxy routes to match Odoo controller endpoints exactly,
 * while keeping middleware response format { success, data, count }
 */
router.get('/controller/order', async (_req, res) => {
  try {
    const data = await odooService.getOrdersFromController();
    res.json({ success: true, data, count: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to proxy order list' });
  }
});

router.get('/controller/pending', async (_req, res) => {
  try {
    const data = await odooService.getPendingFromController();
    res.json({ success: true, data, count: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to proxy pending list' });
  }
});

router.get('/controller/periodic', async (_req, res) => {
  try {
    const data = await odooService.getPeriodicFromController();
    res.json({ success: true, data, count: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to proxy periodic list' });
  }
});

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

// ==== Transaction List (proxy to Odoo controllers) ====
router.post('/list/data', async (req, res) => {
  await transactionController.getTransactionListData(req, res);
});

router.post('/list/stats', async (req, res) => {
  await transactionController.getTransactionListStats(req, res);
});

router.get('/list/details/:id', async (req, res) => {
  await transactionController.getTransactionDetailsFromController(req, res);
});

// ==== Order Book ====
router.post('/order-book', async (req, res) => {
  await transactionController.getOrderBook(req, res);
});

router.post('/order-book/funds', async (req, res) => {
  await transactionController.getOrderBookFunds(req, res);
});

router.post('/order-book/completed', async (req, res) => {
  await transactionController.getCompletedOrders(req, res);
});

router.post('/order-book/negotiated', async (req, res) => {
  await transactionController.getNegotiatedOrders(req, res);
});

// ==== Partial Matching ====
router.post('/partial-matching/create-engine', async (req, res) => {
  await transactionController.pmCreateEngine(req, res);
});

router.post('/partial-matching/add-order', async (req, res) => {
  await transactionController.pmAddOrder(req, res);
});

router.post('/partial-matching/process-all', async (req, res) => {
  await transactionController.pmProcessAll(req, res);
});

router.post('/partial-matching/queue-status', async (req, res) => {
  await transactionController.pmQueueStatus(req, res);
});

router.post('/partial-matching/clear-queue', async (req, res) => {
  await transactionController.pmClearQueue(req, res);
});

router.get('/partial-matching/engines', async (req, res) => {
  await transactionController.pmListEngines(req, res);
});

router.post('/partial-matching/cleanup', async (req, res) => {
  await transactionController.pmCleanup(req, res);
});

// ==== Contract ====
router.get('/contract/:id', async (req, res) => {
  await transactionController.downloadContract(req, res);
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