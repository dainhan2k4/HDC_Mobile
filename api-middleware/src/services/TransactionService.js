const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class TransactionService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Transaction List - Data (Odoo controller, type='json')
   */
  async getTransactionListData(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/data (POST, auth)...');
      const data = await this.apiCall('/api/transaction-list/data', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction list data:', error.message);
      throw error;
    }
  }

  /**
   * Transaction List - Stats (Odoo controller, type='json')
   */
  async getTransactionListStats(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/stats (POST, auth)...');
      const data = await this.apiCall('/api/transaction-list/stats', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction list stats:', error.message);
      throw error;
    }
  }

  /**
   * Transaction List - Get details (HTTP GET)
   */
  async getTransactionDetailsFromController(transactionId) {
    try {
      console.log(`🔗 [TransactionService] Calling /api/transaction-list/get-transaction-details/${transactionId} (GET, auth)...`);
      const data = await this.apiCall(`/api/transaction-list/get-transaction-details/${transactionId}`, {
        method: 'GET',
        requireAuth: true
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get transaction details from controller:', error.message);
      throw error;
    }
  }

  /**
   * Order Book - get order book (public POST)
   */
  async getOrderBook(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/order-book (POST, public)...');
      const data = await this.apiCall('/api/transaction-list/order-book', {
        method: 'POST',
        data: payload,
        requireAuth: false
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get order book:', error.message);
      throw error;
    }
  }

  /**
   * Order Book - get funds (public POST)
   */
  async getOrderBookFunds(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/funds (POST, public)...');
      const data = await this.apiCall('/api/transaction-list/funds', {
        method: 'POST',
        data: payload,
        requireAuth: false
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get order book funds:', error.message);
      throw error;
    }
  }

  /**
   * Order Book - completed transactions (user POST)
   */
  async getCompletedOrders(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/completed (POST, auth)...');
      const data = await this.apiCall('/api/transaction-list/completed', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get completed orders:', error.message);
      throw error;
    }
  }

  /**
   * Order Book - negotiated (user POST)
   */
  async getNegotiatedOrders(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/negotiated (POST, auth)...');
      const data = await this.apiCall('/api/transaction-list/negotiated', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
      return data;
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get negotiated orders:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - create engine
   */
  async pmCreateEngine(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/create-engine (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/create-engine', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmCreateEngine failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - add order
   */
  async pmAddOrder(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/add-order (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/add-order', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmAddOrder failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - process all
   */
  async pmProcessAll(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/process-all (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/process-all', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmProcessAll failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - queue status
   */
  async pmQueueStatus(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/queue-status (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/queue-status', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmQueueStatus failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - clear queue
   */
  async pmClearQueue(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/clear-queue (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/clear-queue', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmClearQueue failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - list engines (GET)
   */
  async pmListEngines() {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/engines (GET, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/engines', {
        method: 'GET',
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmListEngines failed:', error.message);
      throw error;
    }
  }

  /**
   * Partial Matching - cleanup
   */
  async pmCleanup(payload = {}) {
    try {
      console.log('🔗 [TransactionService] Calling /api/transaction-list/partial-matching/cleanup (POST, auth)...');
      return await this.apiCall('/api/transaction-list/partial-matching/cleanup', {
        method: 'POST',
        data: payload,
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] pmCleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Contract download (HTTP GET)
   */
  async downloadContract(transactionId) {
    try {
      console.log(`🔗 [TransactionService] Calling /api/transaction-list/contract/${transactionId} (GET, auth)...`);
      return await this.apiCall(`/api/transaction-list/contract/${transactionId}`, {
        method: 'GET',
        requireAuth: true
      });
    } catch (error) {
      console.error('❌ [TransactionService] downloadContract failed:', error.message);
      throw error;
    }
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
      
      const startDate = typeof filters.startDate === 'string' ? filters.startDate.trim() : filters.startDate;
      if (startDate) {
        domain.push(['transaction_date', '>=', startDate]);
      }
      
      const endDate = typeof filters.endDate === 'string' ? filters.endDate.trim() : filters.endDate;
      if (endDate) {
        domain.push(['transaction_date', '<=', endDate]);
      }

      const parsedLimit = Number(filters.limit);
      const parsedPage = Number(filters.page);

      const options = {
        order: 'create_date desc',
        limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100,
        page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
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
   * Get orders từ Odoo controller /transaction_management/order
   */
  async getOrdersFromController() {
    try {
      console.log('🔗 [TransactionService] Calling /transaction_management/order endpoint...');
      const data = await this.apiCall('/transaction_management/order', { requireAuth: true });
      console.log(`✅ [TransactionService] /transaction_management/order OK: ${Array.isArray(data) ? data.length : 0} items`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get /transaction_management/order:', error.message);
      return [];
    }
  }

  /**
   * Get pending từ Odoo controller /transaction_management/pending
   * Parse HTML để extract orders_json từ template
   */
  async getPendingFromController() {
    try {
      console.log('🔗 [TransactionService] Calling /transaction_management/pending endpoint...');
      const html = await this.apiCall('/transaction_management/pending', { requireAuth: true });
      
      // Nếu response là array trực tiếp (JSON), trả về luôn
      if (Array.isArray(html)) {
        console.log(`✅ [TransactionService] /transaction_management/pending OK: ${html.length} items (direct array)`);
        return html;
      }
      
      // Nếu response là string (HTML), parse để extract JSON
      if (typeof html === 'string') {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        
        // Ưu tiên lấy data từ attribute data-orders của container
        const pendingContainer = dom.window.document.querySelector('#pending-widget-container');
        const globalContainer = dom.window.document.querySelector('[data-orders]');
        const dataAttr = pendingContainer?.getAttribute('data-orders') || pendingContainer?.dataset?.orders ||
          globalContainer?.getAttribute('data-orders') || globalContainer?.dataset?.orders;
        
        if (dataAttr) {
          try {
            // dataset.* trả về string đã decode, còn getAttribute có thể chứa &quot;
            const normalized = dataAttr
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&');
            const orders = JSON.parse(normalized);
            console.log(`✅ [TransactionService] /transaction_management/pending OK: ${orders.length} items (parsed from data-orders attribute)`);
            return Array.isArray(orders) ? orders : [];
          } catch (parseError) {
            console.warn('⚠️ [TransactionService] Failed to parse data-orders attribute:', parseError.message);
          }
        }
        
        // Fallback: tìm trong script tags
        const scripts = dom.window.document.querySelectorAll('script');
        for (const script of scripts) {
          if (!script.textContent || !script.textContent.includes('orders_json')) {
            continue;
          }
          
          // Tìm pattern: orders_json = [...];
          const match = script.textContent.match(/orders_json\s*=\s*(\[[\s\S]*?\]);?\s*$/m);
          if (match && match[1]) {
            try {
              const orders = JSON.parse(match[1]);
              console.log(`✅ [TransactionService] /transaction_management/pending OK: ${orders.length} items (parsed from script)`);
              return Array.isArray(orders) ? orders : [];
            } catch (parseError) {
              console.warn('⚠️ [TransactionService] Failed to parse orders_json from script:', parseError.message);
            }
          }
        }
        
        console.warn('⚠️ [TransactionService] orders_json not found in HTML, returning empty array');
        return [];
      }
      
      // Nếu không phải HTML và không phải array, thử parse như JSON
      if (typeof html === 'string') {
        try {
          const parsed = JSON.parse(html);
          if (Array.isArray(parsed)) {
            console.log(`✅ [TransactionService] /transaction_management/pending OK: ${parsed.length} items (parsed JSON)`);
            return parsed;
          }
        } catch (e) {
          // Không phải JSON
        }
      }
      
      console.warn('⚠️ [TransactionService] Unexpected response format, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get /transaction_management/pending:', error.message);
      return [];
    }
  }

  /**
   * Get periodic từ Odoo controller /transaction_management/periodic
   */
  async getPeriodicFromController() {
    try {
      console.log('🔗 [TransactionService] Calling /transaction_management/periodic endpoint...');
      const data = await this.apiCall('/transaction_management/periodic', { requireAuth: true });
      console.log(`✅ [TransactionService] /transaction_management/periodic OK: ${Array.isArray(data) ? data.length : 0} items`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ [TransactionService] Failed to get /transaction_management/periodic:', error.message);
      return [];
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
    // Parse NAV từ nhiều format có thể có
    let previousNav = null;
    if (transaction.nav !== undefined && transaction.nav !== null) {
      // Nếu nav là string như "29,850đ", parse nó
      if (typeof transaction.nav === 'string') {
        const navStr = transaction.nav.replace(/[^\d.,]/g, '').replace(/,/g, '');
        previousNav = parseFloat(navStr) || null;
      } else {
        previousNav = parseFloat(transaction.nav) || null;
      }
    } else if (transaction.previous_nav !== undefined && transaction.previous_nav !== null) {
      if (typeof transaction.previous_nav === 'string') {
        const navStr = transaction.previous_nav.replace(/[^\d.,]/g, '').replace(/,/g, '');
        previousNav = parseFloat(navStr) || null;
      } else {
        previousNav = parseFloat(transaction.previous_nav) || null;
      }
    } else if (transaction.current_nav !== undefined && transaction.current_nav !== null) {
      previousNav = parseFloat(transaction.current_nav) || null;
    }

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
      raw_transaction_type: transaction.transaction_type,
      previous_nav: previousNav,
      nav: previousNav // Alias cho compatibility
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