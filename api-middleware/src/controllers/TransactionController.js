class TransactionController {
  constructor(odooService) {
    this.odooService = odooService;
  }

  async buyFund(req, res) {
    console.log('📈 [TransactionController] Processing fund purchase request...');
    
    try {
      // Debug: Check transaction model availability
      const fields = await this.odooService.testTransactionMethods();
      console.log('🔍 [TransactionController] Transaction model available:', !!fields);
      
      const { fundId, amount, units } = req.body;

      // Validation
      if (!fundId || !amount || !units) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fundId, amount, units'
        });
      }

      if (amount < 100000) {
        return res.status(400).json({
          success: false,
          message: 'Minimum investment amount is 100,000 VND'
        });
      }

      let result;
      try {
        // Try the custom create_transaction method first
        result = await this.odooService.buyFund(
          parseInt(fundId),
          parseFloat(amount),
          parseFloat(units)
        );
      } catch (customMethodError) {
        console.log('⚠️ [TransactionController] Custom method failed, trying direct create...');
        // Fallback to direct create method
        result = await this.odooService.buyFundDirect(
          parseInt(fundId),
          parseFloat(amount),
          parseFloat(units)
        );
      }

      console.log('✅ [TransactionController] Fund purchase completed:', result);

      // Clear cache to ensure fresh data on next request
      this.odooService.clearCache();
      console.log('🧹 [TransactionController] Cache cleared after successful purchase');

      // Clear response cache explicitly
      if (req.app && req.app.clearResponseCache) {
        req.app.clearResponseCache('transaction');
        req.app.clearResponseCache('portfolio');
        console.log('🧹 [TransactionController] Response cache cleared for transaction and portfolio');
      }

      res.json({
        success: true,
        message: 'Fund purchase completed successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ [TransactionController] Fund purchase failed:', error.message);
      console.error('❌ [TransactionController] Error details:', error);
      
      const errorMessage = error.message || 'Failed to process fund purchase';
      const isOdooError = error.response?.data?.error;
      
      res.status(500).json({
        success: false,
        message: isOdooError ? 'Backend transaction error - please check Odoo configuration' : errorMessage,
        error: isOdooError ? error.response.data.error.message : errorMessage,
        ...(isOdooError && { odooError: error.response.data.error })
      });
    }
  }

  async sellFund(req, res) {
    console.log('📉 [TransactionController] Processing fund sale request...');
    
    try {
      const { fundId, units } = req.body;

      // Validation
      if (!fundId || !units) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fundId, units'
        });
      }

      if (units <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Units to sell must be greater than 0'
        });
      }

      let result;
      try {
        // Try the custom create_transaction method first
        result = await this.odooService.sellFund(
          parseInt(fundId),
          parseFloat(units)
        );
      } catch (customMethodError) {
        console.log('⚠️ [TransactionController] Custom sell method failed, trying direct create...');
        // Fallback to direct create method
        result = await this.odooService.sellFundDirect(
          parseInt(fundId),
          parseFloat(units)
        );
      }

      console.log('✅ [TransactionController] Fund sale completed:', result);

      // Clear cache to ensure fresh data on next request
      this.odooService.clearCache();
      console.log('🧹 [TransactionController] Cache cleared after successful sale');

      // Clear response cache explicitly
      if (req.app && req.app.clearResponseCache) {
        req.app.clearResponseCache('transaction');
        req.app.clearResponseCache('portfolio');
        console.log('🧹 [TransactionController] Response cache cleared for transaction and portfolio');
      }

      res.json({
        success: true,
        message: 'Fund sale completed successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ [TransactionController] Fund sale failed:', error.message);
      console.error('❌ [TransactionController] Error details:', error);
      
      const errorMessage = error.message || 'Failed to process fund sale';
      const isOdooError = error.response?.data?.error;
      
      res.status(500).json({
        success: false,
        message: isOdooError ? 'Backend transaction error - please check Odoo configuration' : errorMessage,
        error: isOdooError ? error.response.data.error.message : errorMessage,
        ...(isOdooError && { odooError: error.response.data.error })
      });
    }
  }

  // ===== TRANSACTION DATA RETRIEVAL METHODS =====

  async getPendingTransactions(req, res) {
    console.log('📋 [TransactionController] Getting pending transactions...');
    
    try {
      const { userId, page = 1, limit = 20 } = req.query;
      
      // Get pending transactions
      const transactions = await this.odooService.getTransactions({
        status: 'pending',
        userId: userId ? parseInt(userId) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      console.log(`✅ [TransactionController] Found ${transactions.length} pending transactions`);

      res.json({
        success: true,
        message: 'Pending transactions retrieved successfully',
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      });

    } catch (error) {
      console.error('❌ [TransactionController] Get pending transactions failed:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending transactions',
        error: error.message
      });
    }
  }

  async getTransactionHistory(req, res) {
    console.log('📜 [TransactionController] Getting transaction history...');
    
    try {
      const { userId, status, page = 1, limit = 20, startDate, endDate } = req.query;
      
      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        status: status,
        page: parseInt(page),
        limit: parseInt(limit),
        startDate: startDate,
        endDate: endDate
      };

      // Get transaction history
      const transactions = await this.odooService.getTransactions(filters);

      console.log(`✅ [TransactionController] Found ${transactions.length} transactions in history`);

      res.json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      });

    } catch (error) {
      console.error('❌ [TransactionController] Get transaction history failed:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction history',
        error: error.message
      });
    }
  }

  async getTransactionById(req, res) {
    console.log('🔍 [TransactionController] Getting transaction by ID...');
    
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
      }

      // Get specific transaction
      const transaction = await this.odooService.getTransactionById(parseInt(id));

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      console.log('✅ [TransactionController] Transaction found:', transaction.name);

      res.json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction
      });

    } catch (error) {
      console.error('❌ [TransactionController] Get transaction by ID failed:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: error.message
      });
    }
  }

  async getTransactionStats(req, res) {
    console.log('📊 [TransactionController] Getting transaction statistics...');
    
    try {
      const { userId, period = 'month' } = req.query;
      
      // Get transaction statistics
      const stats = await this.odooService.getTransactionStats({
        userId: userId ? parseInt(userId) : undefined,
        period: period
      });

      console.log('✅ [TransactionController] Transaction stats retrieved');

      res.json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('❌ [TransactionController] Get transaction stats failed:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction statistics',
        error: error.message
      });
    }
  }

  // ===== Transaction List via Odoo Controllers =====

  async getTransactionListData(req, res) {
    console.log('📋 [TransactionController] Proxy transaction-list data...');
    try {
      const data = await this.odooService.transactionService.getTransactionListData(req.body || {});
      res.json({ success: true, data, count: Array.isArray(data) ? data.length : undefined });
    } catch (error) {
      console.error('❌ [TransactionController] transaction-list data error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get transaction list data' });
    }
  }

  async getTransactionListStats(req, res) {
    console.log('📊 [TransactionController] Proxy transaction-list stats...');
    try {
      const data = await this.odooService.transactionService.getTransactionListStats(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] transaction-list stats error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get transaction list stats' });
    }
  }

  async getTransactionDetailsFromController(req, res) {
    console.log('🔍 [TransactionController] Proxy get-transaction-details...');
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Transaction ID is required' });
      }
      const data = await this.odooService.transactionService.getTransactionDetailsFromController(parseInt(id));
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] transaction-details error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get transaction details' });
    }
  }

  // ===== Order Book =====
  async getOrderBook(req, res) {
    console.log('📒 [TransactionController] Proxy order-book...');
    try {
      const data = await this.odooService.transactionService.getOrderBook(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] order-book error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get order book' });
    }
  }

  async getOrderBookFunds(req, res) {
    console.log('💰 [TransactionController] Proxy order-book funds...');
    try {
      const data = await this.odooService.transactionService.getOrderBookFunds(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] order-book funds error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get order book funds' });
    }
  }

  async getCompletedOrders(req, res) {
    console.log('✅ [TransactionController] Proxy completed orders...');
    try {
      const data = await this.odooService.transactionService.getCompletedOrders(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] completed orders error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get completed orders' });
    }
  }

  async getNegotiatedOrders(req, res) {
    console.log('🤝 [TransactionController] Proxy negotiated orders...');
    try {
      const data = await this.odooService.transactionService.getNegotiatedOrders(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] negotiated orders error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get negotiated orders' });
    }
  }

  // ===== Partial Matching =====
  async pmCreateEngine(req, res) {
    try {
      const data = await this.odooService.transactionService.pmCreateEngine(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmCreateEngine error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create engine' });
    }
  }

  async pmAddOrder(req, res) {
    try {
      const data = await this.odooService.transactionService.pmAddOrder(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmAddOrder error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to add order' });
    }
  }

  async pmProcessAll(req, res) {
    try {
      const data = await this.odooService.transactionService.pmProcessAll(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmProcessAll error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to process all' });
    }
  }

  async pmQueueStatus(req, res) {
    try {
      const data = await this.odooService.transactionService.pmQueueStatus(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmQueueStatus error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to get queue status' });
    }
  }

  async pmClearQueue(req, res) {
    try {
      const data = await this.odooService.transactionService.pmClearQueue(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmClearQueue error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to clear queue' });
    }
  }

  async pmListEngines(_req, res) {
    try {
      const data = await this.odooService.transactionService.pmListEngines();
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmListEngines error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to list engines' });
    }
  }

  async pmCleanup(req, res) {
    try {
      const data = await this.odooService.transactionService.pmCleanup(req.body || {});
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] pmCleanup error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to cleanup' });
    }
  }

  // ===== Contract Download =====
  async downloadContract(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Transaction ID is required' });
      }
      const data = await this.odooService.transactionService.downloadContract(parseInt(id));
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [TransactionController] downloadContract error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to download contract' });
    }
  }
}

module.exports = TransactionController; 