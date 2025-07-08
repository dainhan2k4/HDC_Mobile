const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/config');

class OdooService {
  constructor() {
    this.baseUrl = config.odoo.baseUrl;
    this.database = config.odoo.database;
    this.username = config.odoo.username;
    this.password = config.odoo.password;
    this.timeout = config.odoo.timeout;
    
    // Session cache - store session_id for reuse
    this.sessionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour
    
    // Data cache - cache API responses
    this.dataCache = new NodeCache({ 
      stdTTL: config.cache.ttl, 
      checkperiod: config.cache.checkPeriod 
    });

    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    // Add request interceptor for session cookies
    this.client.interceptors.request.use((config) => {
      const sessionId = this.getSessionId();
      if (sessionId) {
        config.headers.Cookie = `session_id=${sessionId}`;
      }
      return config;
    });
  }

  /**
   * Authenticate with Odoo and get session_id
   * Inspired by Simpos's authentication approach
   */
  async authenticate() {
    try {
      console.log(`🔐 [OdooService] Authenticating with database: ${this.database}`);
      
      const response = await this.client.post('/web/session/authenticate', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: this.database,
          login: this.username,
          password: this.password
        }
      });

      console.log('🔐 [OdooService] Auth response status:', response.status);
      console.log('🔐 [OdooService] Auth response data:', response.data);
      console.log('🔐 [OdooService] Auth response headers:', response.headers);

      const data = response.data;
      
      // Check for session_id in response result first
      if (data.result && data.result.session_id) {
        this.sessionCache.set('session_id', data.result.session_id);
        console.log(`✅ [OdooService] Authentication successful via result, session: ${data.result.session_id}`);
        return { success: true, sessionId: data.result.session_id };
      }

      // Extract session_id from cookies as fallback
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        console.log('🍪 [OdooService] Checking cookies:', setCookie);
        const sessionMatch = setCookie.find(cookie => cookie.includes('session_id='));
        if (sessionMatch) {
          const sessionId = sessionMatch.match(/session_id=([^;]+)/)?.[1];
          if (sessionId) {
            this.sessionCache.set('session_id', sessionId);
            console.log(`✅ [OdooService] Authentication successful via cookies, session: ${sessionId}`);
            return { success: true, sessionId };
          }
        }
      }

      throw new Error('No session_id found in response or cookies');
    } catch (error) {
      console.error('❌ [OdooService] Authentication failed:', error.message);
      console.error('❌ [OdooService] Full error:', error);
      throw error;
    }
  }

  /**
   * Get cached session_id or authenticate if needed
   */
  async getValidSession() {
    let sessionId = this.getSessionId();
    
    if (!sessionId) {
      await this.authenticate();
      sessionId = this.getSessionId();
    }

    // Test session validity
    try {
      await this.testSession();
      return sessionId;
    } catch (error) {
      // Session invalid, re-authenticate
      console.log('🔄 [OdooService] Session invalid, re-authenticating...');
      await this.authenticate();
      return this.getSessionId();
    }
  }

  /**
   * Get session_id from cache
   */
  getSessionId() {
    return this.sessionCache.get('session_id');
  }

  /**
   * Test if current session is valid
   */
  async testSession() {
    const response = await this.client.post('/web/session/get_session_info', {
      jsonrpc: "2.0",
      method: "call",
      params: {}
    });

    const sessionInfo = response.data;
    if (!sessionInfo || !sessionInfo.uid || sessionInfo.uid === false) {
      throw new Error('Invalid session');
    }

    return sessionInfo;
  }

  /**
   * Make authenticated API call
   */
  async apiCall(endpoint, options = {}) {
    const { method = 'GET', data, params, requireAuth = false } = options;
    
    try {
      // Ensure valid session for authenticated calls
      if (requireAuth) {
        await this.getValidSession();
      }

      const response = await this.client.request({
        url: endpoint,
        method,
        data,
        params
      });

      return response.data;
    } catch (error) {
      console.error(`❌ [OdooService] API call failed: ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Get funds data with caching
   */
  async getFunds() {
    const cacheKey = 'funds_data';
    let cached = this.dataCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 [OdooService] Returning cached funds data');
      return cached;
    }

    try {
      console.log('🔗 [OdooService] Calling /data_fund endpoint...');
      const data = await this.apiCall('/data_fund');
      console.log('📊 [OdooService] Raw funds response:', data);
      
      // Transform data to consistent format
      const funds = Array.isArray(data) ? data.map(fund => ({
        id: fund.id,
        name: fund.name,
        ticker: fund.ticker,
        description: fund.description,
        current_nav: parseFloat(fund.current_nav) || 0,
        current_ytd: parseFloat(fund.current_ytd) || 0,
        investment_type: fund.investment_type || 'equity'
      })) : [];

      this.dataCache.set(cacheKey, funds);
      console.log(`✅ [OdooService] Funds data cached: ${funds.length} items`);
      return funds;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get funds:', error.message);
      return [];
    }
  }

  /**
   * Get user investments with caching
   */
  async getInvestments() {
    const cacheKey = 'investments_data';
    let cached = this.dataCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 [OdooService] Returning cached investments data');
      return cached;
    }

    try {
      console.log('🔗 [OdooService] Calling /data_investment endpoint (requires auth)...');
      const data = await this.apiCall('/data_investment', { requireAuth: true });
      console.log('📊 [OdooService] Raw investments response:', data);
      
      // Transform data to consistent format
      const investments = Array.isArray(data) ? data.map(inv => ({
        id: inv.id,
        fund_id: inv.fund_id,
        fund_name: inv.fund_name,
        fund_ticker: inv.fund_ticker,
        units: parseFloat(inv.units) || 0,
        amount: parseFloat(inv.amount) || 0,
        current_nav: parseFloat(inv.current_nav) || 0,
        investment_type: inv.investment_type || 'equity',
        current_value: (parseFloat(inv.units) || 0) * (parseFloat(inv.current_nav) || 0),
        profit_loss: ((parseFloat(inv.units) || 0) * (parseFloat(inv.current_nav) || 0)) - (parseFloat(inv.amount) || 0)
      })) : [];

      this.dataCache.set(cacheKey, investments);
      console.log(`✅ [OdooService] Investments data cached: ${investments.length} items`);
      return investments;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get investments:', error.message);
      console.error('❌ [OdooService] Error details:', error);
      return [];
    }
  }

  // Get profile data (legacy - kept for compatibility)
  async getProfile() {
    return this.getPersonalProfile();
  }

  // Get personal profile data
  async getPersonalProfile() {
    const cacheKey = 'personal_profile_data';
    let cached = this.dataCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 [OdooService] Returning cached personal profile data');
      return cached;
    }

    try {
      console.log('🔗 [OdooService] Calling /data_personal_profile endpoint (requires auth)...');
      const data = await this.apiCall('/data_personal_profile', { requireAuth: true });
      console.log('📊 [OdooService] Raw personal profile response:', data);

      // Return data as-is (should be array from Odoo)
      this.dataCache.set(cacheKey, data);
      console.log(`✅ [OdooService] Personal profile data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get personal profile:', error.message);
      console.error('❌ [OdooService] Error details:', error);
      return [];
    }
  }

  // Get bank info data
  async getBankInfo() {
    const cacheKey = 'bank_info_data';
    let cached = this.dataCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 [OdooService] Returning cached bank info data');
      return cached;
    }

    try {
      console.log('🔗 [OdooService] Calling /data_bank_info endpoint (requires auth)...');
      const data = await this.apiCall('/data_bank_info', { requireAuth: true });
      console.log('📊 [OdooService] Raw bank info response:', data);

      // Return data as-is (should be array from Odoo)
      this.dataCache.set(cacheKey, data);
      console.log(`✅ [OdooService] Bank info data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get bank info:', error.message);
      console.error('❌ [OdooService] Error details:', error);
      return [];
    }
  }

  // Get address info data
  async getAddressInfo() {
    const cacheKey = 'address_info_data';
    let cached = this.dataCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 [OdooService] Returning cached address info data');
      return cached;
    }

    try {
      console.log('🔗 [OdooService] Calling /data_address_info endpoint (requires auth)...');
      const data = await this.apiCall('/data_address_info', { requireAuth: true });
      console.log('📊 [OdooService] Raw address info response:', data);

      // Return data as-is (should be array from Odoo)
      this.dataCache.set(cacheKey, data);
      console.log(`✅ [OdooService] Address info data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get address info:', error.message);
      console.error('❌ [OdooService] Error details:', error);
      return [];
    }
  }

  // Buy fund transaction
  async buyFund(fundId, amount, units) {
    try {
      console.log(`🔄 [OdooService] Creating buy transaction for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session and get user ID
      const session = await this.getValidSession();
      const userId = session.uid || 2; // Use authenticated user ID

      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "create_transaction",
          args: [
            userId,
            fundId,
            'purchase',
            units,
            amount
          ],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Buy transaction created:', response.data);
      
      // Check for Odoo errors in response
      if (response.data.error) {
        console.error('❌ [OdooService] Odoo returned error:', response.data.error);
        throw new Error(response.data.error.message || 'Odoo backend error');
      }
      
      // Clear all portfolio-related cache to force refresh
      this.dataCache.del('investments_data');
      this.dataCache.del('portfolio_data');
      this.dataCache.del('overview_data');
      
      return response.data.result;
    } catch (error) {
      console.error('❌ [OdooService] Failed to create buy transaction:', error.message);
      console.error('❌ [OdooService] Error details:', error.response?.data || error);
      throw error;
    }
  }

  // Sell fund transaction
  async sellFund(fundId, units) {
    try {
      console.log(`🔄 [OdooService] Creating sell transaction for fund ${fundId}:`, { units });
      
      // Ensure valid session and get user ID
      const session = await this.getValidSession();
      const userId = session.uid || 2; // Use authenticated user ID

      // Calculate amount based on current NAV
      const funds = await this.getFunds();
      const fund = funds.find(f => f.id === fundId);
      const amount = fund ? units * fund.current_nav : 0;

      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "create_transaction",
          args: [
            userId,
            fundId,
            'sale',
            units,
            amount
          ],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Sell transaction created:', response.data);
      
      // Check for Odoo errors in response
      if (response.data.error) {
        console.error('❌ [OdooService] Odoo returned error:', response.data.error);
        throw new Error(response.data.error.message || 'Odoo backend error');
      }
      
      // Clear all portfolio-related cache to force refresh
      this.dataCache.del('investments_data');
      this.dataCache.del('portfolio_data');
      this.dataCache.del('overview_data');
      
      return response.data.result;
    } catch (error) {
      console.error('❌ [OdooService] Failed to create sell transaction:', error.message);
      console.error('❌ [OdooService] Error details:', error.response?.data || error);
      throw error;
    }
  }

  // Alternative buy fund using standard create method
  async buyFundDirect(fundId, amount, units) {
    try {
      console.log(`🔄 [OdooService] Creating buy transaction using direct create for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session and get user ID
      const session = await this.getValidSession();
      const userId = session.uid || 2; // Use authenticated user ID

      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "create",
          args: [{
            user_id: userId,
            fund_id: fundId,
            transaction_type: 'purchase',
            units: units,
            amount: amount,
            status: 'pending',
            investment_type: 'fund_certificate',
            transaction_date: new Date().toISOString().split('T')[0]
          }],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Direct buy transaction created:', response.data);

      // Check for Odoo errors in response
      if (response.data.error) {
        console.error('❌ [OdooService] Odoo returned error:', response.data.error);
        throw new Error(response.data.error.message || 'Odoo backend error');
      }

      // Complete the transaction to update investment portfolio
      const transactionId = response.data.result;
      console.log(`🔄 [OdooService] Completing transaction ${transactionId} to update portfolio...`);
      
      const completeResponse = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "action_complete",
          args: [transactionId],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Transaction completed:', completeResponse.data);
      
      // Clear all portfolio-related cache to force refresh
      this.dataCache.del('investments_data');
      this.dataCache.del('portfolio_data');
      this.dataCache.del('overview_data');
      
      return transactionId;
    } catch (error) {
      console.error('❌ [OdooService] Failed to create direct buy transaction:', error.message);
      console.error('❌ [OdooService] Error details:', error.response?.data || error);
      throw error;
    }
  }

  // Alternative sell fund using standard create method
  async sellFundDirect(fundId, units) {
    try {
      console.log(`🔄 [OdooService] Creating sell transaction using direct create for fund ${fundId}:`, { units });
      
      // Ensure valid session and get user ID
      const session = await this.getValidSession();
      const userId = session.uid || 2; // Use authenticated user ID

      // Debug: Check current investments before selling
      console.log(`🔍 [OdooService] Checking current investments for user ${userId} before selling...`);
      const currentInvestments = await this.getInvestments();
      const userInvestment = currentInvestments.find(inv => inv.fund_id === fundId);
      console.log(`🔍 [OdooService] User investment for fund ${fundId}:`, userInvestment);
      
      if (!userInvestment || userInvestment.units < units) {
        const availableUnits = userInvestment ? userInvestment.units : 0;
        console.warn(`⚠️ [OdooService] Insufficient units: User has ${availableUnits}, trying to sell ${units}`);
      }

      // Calculate amount based on current NAV
      const funds = await this.getFunds();
      const fund = funds.find(f => f.id === fundId);
      const amount = fund ? units * fund.current_nav : 0;

      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "create",
          args: [{
            user_id: userId,
            fund_id: fundId,
            transaction_type: 'sale',
            units: units,
            amount: amount,
            status: 'pending',
            investment_type: 'fund_certificate',
            transaction_date: new Date().toISOString().split('T')[0]
          }],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Direct sell transaction created:', response.data);

      // Check for Odoo errors in response
      if (response.data.error) {
        console.error('❌ [OdooService] Odoo returned error:', response.data.error);
        throw new Error(response.data.error.message || 'Odoo backend error');
      }

      // Complete the transaction to update investment portfolio
      const transactionId = response.data.result;
      console.log(`🔄 [OdooService] Completing sell transaction ${transactionId} to update portfolio...`);
      
      const completeResponse = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "action_complete",
          args: [transactionId],
          kwargs: {}
        }
      });

      console.log('✅ [OdooService] Sell transaction completed:', completeResponse.data);
      
      // Clear all portfolio-related cache to force refresh
      this.dataCache.del('investments_data');
      this.dataCache.del('portfolio_data');
      this.dataCache.del('overview_data');
      
      return transactionId;
    } catch (error) {
      console.error('❌ [OdooService] Failed to create direct sell transaction:', error.message);
      console.error('❌ [OdooService] Error details:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.dataCache.flushAll();
    console.log('🧹 [OdooService] Cache cleared');
  }

  /**
   * Clear session cache (force re-authentication)
   */
  clearSession() {
    this.sessionCache.del('session_id');
    console.log('🔐 [OdooService] Session cleared');
  }

  // Test transaction method availability (for debugging)
  async testTransactionMethods() {
    try {
      const session = await this.getValidSession();
      
      // Check model fields and methods
      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "portfolio.transaction",
          method: "fields_get",
          args: [],
          kwargs: {}
        }
      });

      console.log('🔍 [OdooService] Transaction model fields:', Object.keys(response.data.result || {}));
      
      return response.data.result;
    } catch (error) {
      console.error('❌ [OdooService] Failed to get transaction fields:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = OdooService; 