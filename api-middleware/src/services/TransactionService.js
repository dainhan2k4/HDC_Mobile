const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class TransactionService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters = {}) {
    try {
      console.log('📋 [TransactionService] Getting transactions with filters:', filters);
      
      await this.authService.getValidSession();
      
      // Build search domain
      const domain = [
        ['investment_type', '=', 'fund_certificate']
      ];
      
      if (filters.status) {
        domain.push(['status', '=', filters.status]);
      }
      
      if (filters.userId) {
        domain.push(['user_id', '=', filters.userId]);
      }
      
      if (filters.startDate) {
        domain.push(['transaction_date', '>=', filters.startDate]);
      }
      
      if (filters.endDate) {
        domain.push(['transaction_date', '<=', filters.endDate]);
      }

      const options = {
        order: 'create_date desc',
        limit: filters.limit || 20,
        page: filters.page || 1
      };

      const fields = [
        'id', 'name', 'user_id', 'fund_id', 'transaction_type', 
        'units', 'amount', 'currency_id', 'created_at', 'status',
        'investment_type', 'transaction_date', 'description', 'reference'
      ];

      const transactions = await this.searchRecords(
        "portfolio.transaction", 
        domain, 
        fields, 
        options
      );

      console.log(`✅ [TransactionService] Found ${transactions.length} transactions`);
      
      // Transform data for frontend
      return transactions.map(transaction => this.transformTransaction(transaction));

    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transactions:', error.message);
      throw error;
    }
  }

  /**
   * Get specific transaction by ID
   */
  async getTransactionById(transactionId) {
    try {
      console.log(`🔍 [TransactionService] Getting transaction by ID: ${transactionId}`);
      
      await this.authService.getValidSession();

      const fields = [
        'id', 'name', 'user_id', 'fund_id', 'transaction_type', 
        'units', 'amount', 'currency_id', 'created_at', 'status',
        'investment_type', 'transaction_date', 'description', 'reference',
        'destination_fund_id', 'destination_units'
      ];

      const transactions = await this.readRecords("portfolio.transaction", [transactionId], fields);
      
      if (!transactions || transactions.length === 0) {
        return null;
      }

      const transaction = transactions[0];
      console.log('✅ [TransactionService] Transaction found:', transaction.name);
      
      return this.transformTransaction(transaction, true);

    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction by ID:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(filters = {}) {
    try {
      console.log('📊 [TransactionService] Getting transaction statistics with filters:', filters);
      
      await this.authService.getValidSession();
      
      // Build domain for stats
      const domain = [
        ['investment_type', '=', 'fund_certificate']
      ];
      
      if (filters.userId) {
        domain.push(['user_id', '=', filters.userId]);
      }
      
      // Date range based on period
      const today = new Date();
      let startDate;
      
      switch (filters.period) {
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Default to month
      }
      
      domain.push(['transaction_date', '>=', startDate.toISOString().split('T')[0]]);

      const transactions = await this.searchRecords(
        "portfolio.transaction",
        domain,
        ['transaction_type', 'amount', 'status'],
        { limit: 1000 } // Get all for stats
      );
      
      // Calculate statistics
      const stats = {
        total_transactions: transactions.length,
        pending_count: transactions.filter(t => t.status === 'pending').length,
        completed_count: transactions.filter(t => t.status === 'completed').length,
        cancelled_count: transactions.filter(t => t.status === 'cancelled').length,
        purchase_count: transactions.filter(t => t.transaction_type === 'purchase').length,
        sale_count: transactions.filter(t => t.transaction_type === 'sale').length,
        exchange_count: transactions.filter(t => t.transaction_type === 'exchange').length,
        total_purchase_amount: transactions
          .filter(t => t.transaction_type === 'purchase')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_sale_amount: transactions
          .filter(t => t.transaction_type === 'sale')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        period: filters.period || 'month'
      };

      console.log('✅ [TransactionService] Transaction statistics calculated:', stats);
      return stats;

    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction statistics:', error.message);
      throw error;
    }
  }

  /**
   * Get pending transactions (specific filter)
   */
  async getPendingTransactions(filters = {}) {
    try {
      const transactions = await this.getTransactions({
        ...filters,
        status: 'pending'
      });
      
      // If no data from Odoo, return mock data for testing
      if (!transactions || transactions.length === 0) {
        console.log('📋 [TransactionService] No pending transactions found, returning mock data');
        return this.getMockPendingTransactions();
      }
      
      return transactions;
    } catch (error) {
      console.error('❌ [TransactionService] Error getting pending transactions, returning mock data:', error.message);
      return this.getMockPendingTransactions();
    }
  }

  /**
   * Get completed transactions (specific filter)
   */
  async getCompletedTransactions(filters = {}) {
    return this.getTransactions({
      ...filters,
      status: 'completed'
    });
  }

  /**
   * Get transaction history with date range
   */
  async getTransactionHistory(filters = {}) {
    try {
      const { startDate, endDate, ...otherFilters } = filters;
      
      const transactions = await this.getTransactions({
        ...otherFilters,
        status: 'completed',
        startDate: startDate || this.getDateDaysAgo(30), // Default last 30 days
        endDate: endDate || new Date().toISOString().split('T')[0]
      });
      
      // If no data from Odoo, return mock data for testing
      if (!transactions || transactions.length === 0) {
        console.log('📋 [TransactionService] No transaction history found, returning mock data');
        return this.getMockTransactionHistory();
      }
      
      return transactions;
    } catch (error) {
      console.error('❌ [TransactionService] Error getting transaction history, returning mock data:', error.message);
      return this.getMockTransactionHistory();
    }
  }

  /**
   * Generate mock pending transactions for testing
   */
  getMockPendingTransactions() {
    return [
      {
        id: 1,
        fund_name: 'VCB Balanced Fund (VCBBF)',
        transaction_type: 'buy',
        amount: 5000000,
        units: 178.57,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        fund_id: 1
      },
      {
        id: 2,
        fund_name: 'FPT Income Fund (FPTIF)',
        transaction_type: 'buy',
        amount: 3000000,
        units: 86.96,
        status: 'pending',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 2
      },
      {
        id: 3,
        fund_name: 'VCB Shariah Equity Fund (VCBSEF)',
        transaction_type: 'sell',
        amount: 2500000,
        units: 50.0,
        status: 'pending',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 3
      }
    ];
  }

  /**
   * Generate mock transaction history for testing
   */
  getMockTransactionHistory() {
    return [
      {
        id: 4,
        fund_name: 'VCB Balanced Fund (VCBBF)',
        transaction_type: 'buy',
        amount: 10000000,
        units: 357.14,
        status: 'completed',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 1
      },
      {
        id: 5,
        fund_name: 'FPT Income Fund (FPTIF)',
        transaction_type: 'buy',
        amount: 8000000,
        units: 231.88,
        status: 'completed',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 2
      },
      {
        id: 6,
        fund_name: 'VCB Shariah Equity Fund (VCBSEF)',
        transaction_type: 'sell',
        amount: 5500000,
        units: 110.0,
        status: 'completed',
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 3
      },
      {
        id: 7,
        fund_name: 'VCB Balanced Fund (VCBBF)',
        transaction_type: 'buy',
        amount: 15000000,
        units: 535.71,
        status: 'completed',
        date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fund_id: 1
      }
    ];
  }

  /**
   * Helper method to get date X days ago
   */
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId, status, description = null) {
    try {
      console.log(`🔄 [TransactionService] Updating transaction ${transactionId} status to ${status}`);
      
      await this.authService.getValidSession();

      const updateData = { status };
      if (description) {
        updateData.description = description;
      }

      const result = await this.callModelMethod(
        "portfolio.transaction",
        "write",
        [[transactionId], updateData]
      );

      console.log('✅ [TransactionService] Transaction status updated');
      return result;

    } catch (error) {
      console.error('❌ [TransactionService] Failed to update transaction status:', error.message);
      throw error;
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId, reason = 'Cancelled by user') {
    return this.updateTransactionStatus(transactionId, 'cancelled', reason);
  }

  /**
   * Complete transaction
   */
  async completeTransaction(transactionId) {
    try {
      console.log(`🔄 [TransactionService] Completing transaction ${transactionId}`);
      
      await this.authService.getValidSession();

      const result = await this.callModelMethod(
        "portfolio.transaction",
        "action_complete",
        [transactionId]
      );

      console.log('✅ [TransactionService] Transaction completed');
      return result;

    } catch (error) {
      console.error('❌ [TransactionService] Failed to complete transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction fields and methods (for debugging)
   */
  async getTransactionMethods() {
    try {
      const session = await this.authService.getValidSession();
      
      const result = await this.callModelMethod(
        "portfolio.transaction",
        "fields_get"
      );

      console.log('🔍 [TransactionService] Transaction model fields:', Object.keys(result || {}));
      
      return result;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction fields:', error.message);
      return null;
    }
  }

  /**
   * Transform transaction data for frontend
   */
  transformTransaction(transaction, includeExtended = false) {
    const transformed = {
      id: transaction.id,
      name: transaction.name,
      account_number: Array.isArray(transaction.user_id) ? transaction.user_id[1] : transaction.user_id,
      fund_name: Array.isArray(transaction.fund_id) ? transaction.fund_id[1] : transaction.fund_id,
      fund_id: Array.isArray(transaction.fund_id) ? transaction.fund_id[0] : transaction.fund_id,
      order_date: transaction.created_at ? this.formatDateTime(transaction.created_at) : '',
      order_code: transaction.name || `TX${transaction.id.toString().padStart(6, '0')}`,
      amount: parseFloat(transaction.amount) || 0,
      session_date: transaction.transaction_date ? this.formatDate(transaction.transaction_date) : '',
      status: this.getStatusDisplay(transaction.status),
      status_detail: transaction.description || 'Chờ xác nhận tiền',
      transaction_type: this.getTransactionTypeDisplay(transaction.transaction_type),
      units: parseFloat(transaction.units) || 0,
      currency: Array.isArray(transaction.currency_id) ? transaction.currency_id[1] : 'VND',
      raw_status: transaction.status,
      raw_transaction_type: transaction.transaction_type
    };

    // Include extended fields for detailed view
    if (includeExtended) {
      transformed.destination_fund_id = transaction.destination_fund_id ? 
        (Array.isArray(transaction.destination_fund_id) ? transaction.destination_fund_id[0] : transaction.destination_fund_id) : null;
      transformed.destination_units = parseFloat(transaction.destination_units) || 0;
      transformed.reference = transaction.reference || '';
      transformed.full_description = transaction.description || '';
    }

    return transformed;
  }

  /**
   * Get transactions grouped by status
   */
  async getTransactionsByStatus(filters = {}) {
    try {
      console.log('📊 [TransactionService] Getting transactions grouped by status');
      
      const allTransactions = await this.getTransactions(filters);
      
      const grouped = {
        pending: allTransactions.filter(t => t.raw_status === 'pending'),
        completed: allTransactions.filter(t => t.raw_status === 'completed'),
        cancelled: allTransactions.filter(t => t.raw_status === 'cancelled')
      };

      return {
        ...grouped,
        summary: {
          total: allTransactions.length,
          pending_count: grouped.pending.length,
          completed_count: grouped.completed.length,
          cancelled_count: grouped.cancelled.length
        }
      };

    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transactions by status:', error.message);
      throw error;
    }
  }

  /**
   * Get transactions grouped by type
   */
  async getTransactionsByType(filters = {}) {
    try {
      console.log('📊 [TransactionService] Getting transactions grouped by type');
      
      const allTransactions = await this.getTransactions(filters);
      
      const grouped = {
        purchase: allTransactions.filter(t => t.raw_transaction_type === 'purchase'),
        sale: allTransactions.filter(t => t.raw_transaction_type === 'sale'),
        exchange: allTransactions.filter(t => t.raw_transaction_type === 'exchange')
      };

      return {
        ...grouped,
        summary: {
          total: allTransactions.length,
          purchase_count: grouped.purchase.length,
          sale_count: grouped.sale.length,
          exchange_count: grouped.exchange.length
        }
      };

    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transactions by type:', error.message);
      throw error;
    }
  }
}

module.exports = TransactionService; 