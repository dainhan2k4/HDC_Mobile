const express = require('express');
const PortfolioController = require('../controllers/portfolioController');
const config = require('../config/config');

const router = express.Router();
const portfolioController = new PortfolioController();

// Portfolio overview endpoint
router.get('/overview', async (req, res) => {
  await portfolioController.getOverview(req, res);
});

// Get all investments
router.get('/investments', async (req, res) => {
  await portfolioController.getInvestments(req, res);
});

// Get all funds
router.get('/funds', async (req, res) => {
  await portfolioController.getFunds(req, res);
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  await portfolioController.getPerformance(req, res);
});

// Refresh data cache
router.post('/refresh', async (req, res) => {
  await portfolioController.refresh(req, res);
});

/**
 * @route POST /api/v1/portfolio/clear-cache
 * @desc Clear all portfolio-related cache  
 * @returns { success: boolean, message: string }
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('🗑️ [Portfolio] Clearing all portfolio cache...');
    
    // Clear all portfolio-related cache
    portfolioController.odooService.dataCache.del('investments_data');
    portfolioController.odooService.dataCache.del('portfolio_data');
    portfolioController.odooService.dataCache.del('overview_data');
    portfolioController.odooService.dataCache.del('funds_data');
    
    console.log('✅ [Portfolio] Cache cleared successfully');
    
    res.json({
      success: true,
      message: 'Portfolio cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ [Portfolio] Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// Debug endpoint to check configuration
router.get('/debug/config', (req, res) => {
  console.log('🔧 [Debug] Current config:', config.odoo);
  console.log('🔧 [Debug] Environment variables:', {
    ODOO_BASE_URL: process.env.ODOO_BASE_URL,
    ODOO_DATABASE: process.env.ODOO_DATABASE,
    NODE_ENV: process.env.NODE_ENV
  });
  
  res.json({
    success: true,
    config: config.odoo,
    env_vars: {
      ODOO_BASE_URL: process.env.ODOO_BASE_URL,
      ODOO_DATABASE: process.env.ODOO_DATABASE,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

module.exports = router; 