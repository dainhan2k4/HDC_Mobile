const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/config');

// Global session cache - shared across all instances
const GLOBAL_SESSION_CACHE = new NodeCache({ stdTTL: 36000 }); // 10 hours

class BaseOdooService {
  constructor(authService = null) {
    this.baseUrl = config.odoo.baseUrl;
    this.database = config.odoo.database;
    this.username = config.odoo.username;
    this.password = config.odoo.password;
    this.timeout = config.odoo.timeout;
    
    // Reference to AuthService for authentication
    this.authService = authService;
    
    // Use global session cache instead of instance cache
    this.sessionCache = GLOBAL_SESSION_CACHE;
    
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
      let sessionId = this.getSessionId();
      
      // If no session in this instance, try to get from AuthService
      if (!sessionId && this.authService) {
        sessionId = this.authService.getSessionId();
      }
      
      if (sessionId) {
        config.headers.Cookie = `session_id=${sessionId}`;
        console.log(`🍪 [BaseOdooService] Adding Cookie header: session_id=${sessionId.substring(0, 20)}...`);
      } else {
        console.log(`⚠️ [BaseOdooService] No session ID available for request to ${config.url}`);
      }
      
      return config;
    });
  }

  /**
   * Get session_id from global cache
   */
  getSessionId() {
    return GLOBAL_SESSION_CACHE.get('session_id');
  }

  /**
   * Set session_id in global cache
   */
  setSessionId(sessionId) {
    GLOBAL_SESSION_CACHE.set('session_id', sessionId);
    console.log(`🔧 [BaseOdooService] Session saved to global cache: ${sessionId.substring(0, 20)}...`);
    // Also update AuthService if available
    if (this.authService && this.authService.setSessionId) {
      this.authService.setSessionId(sessionId);
    }
  }

  /**
   * Make authenticated API call
   */
  async apiCall(endpoint, options = {}) {
    const { method = 'GET', data, params, requireAuth = false } = options;
    
    try {
      // Ensure valid session for authenticated calls
      if (requireAuth && this.authService) {
        await this.authService.getValidSession();
      }

      console.log(`🔗 [BaseOdooService] Making ${method} request to: ${this.baseUrl}${endpoint}`);
      console.log(`🔗 [BaseOdooService] Headers:`, this.client.defaults.headers);
      console.log(`🔗 [BaseOdooService] Session ID:`, this.getSessionId());

      const response = await this.client.request({
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Cookie': `session_id=${this.getSessionId()}`
        },
        url: endpoint,
        method,
        data,
        params
      });

      console.log(`✅ [BaseOdooService] Success response from ${endpoint}:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`❌ [BaseOdooService] API call failed: ${endpoint}`, error.message);
      if (error.response) {
        console.error(`❌ [BaseOdooService] Response status:`, error.response.status);
        console.error(`❌ [BaseOdooService] Response data:`, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Make JSON-RPC call to Odoo
   */
  async jsonRpcCall(method, params = {}) {
    try {
      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: "2.0",
        method: "call",
        params
      });

      // Check for Odoo errors in response
      if (response.data.error) {
        console.error('❌ [BaseOdooService] Odoo returned error:', response.data.error);
        throw new Error(response.data.error.message || 'Odoo backend error');
      }

      return response.data.result;
    } catch (error) {
      console.error(`❌ [BaseOdooService] JSON-RPC call failed: ${method}`, error.message);
      throw error;
    }
  }

  /**
   * Search records in a model
   */
  async searchRecords(model, domain = [], fields = [], options = {}) {
    try {
      const params = {
        model,
        method: "search_read",
        args: [domain],
        kwargs: {
          fields,
          order: options.order || 'create_date desc',
          limit: options.limit || 20,
          offset: ((options.page || 1) - 1) * (options.limit || 20),
          ...options.kwargs
        }
      };

      return await this.jsonRpcCall('search_read', params);
    } catch (error) {
      console.error(`❌ [BaseOdooService] Failed to search records in ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Read specific records by IDs
   */
  async readRecords(model, ids, fields = []) {
    try {
      const params = {
        model,
        method: "read",
        args: [ids],
        kwargs: { fields }
      };

      return await this.jsonRpcCall('read', params);
    } catch (error) {
      console.error(`❌ [BaseOdooService] Failed to read records from ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async createRecord(model, values) {
    try {
      const params = {
        model,
        method: "create",
        args: [values],
        kwargs: {}
      };

      return await this.jsonRpcCall('create', params);
    } catch (error) {
      console.error(`❌ [BaseOdooService] Failed to create record in ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Call a specific method on a model
   */
  async callModelMethod(model, method, args = [], kwargs = {}) {
    try {
      const params = {
        model,
        method,
        args,
        kwargs
      };

      return await this.jsonRpcCall(method, params);
    } catch (error) {
      console.error(`❌ [BaseOdooService] Failed to call ${method} on ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Get cached data or fetch from cache key
   */
  getCachedData(cacheKey) {
    return this.dataCache.get(cacheKey);
  }

  /**
   * Set data in cache
   */
  setCachedData(cacheKey, data) {
    this.dataCache.set(cacheKey, data);
  }

  /**
   * Delete data from cache
   */
  deleteCachedData(cacheKey) {
    this.dataCache.del(cacheKey);
  }

  /**
   * Clear all data cache
   */
  clearDataCache() {
    this.dataCache.flushAll();
    console.log('🧹 [BaseOdooService] Data cache cleared');
  }

  /**
   * Clear session from global cache
   */
  clearSession() {
    GLOBAL_SESSION_CACHE.del('session_id');
    console.log('🧹 [BaseOdooService] Session cleared from global cache');
    // Also clear from AuthService if available
    if (this.authService && this.authService.clearSession) {
      this.authService.clearSession();
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.clearDataCache();
    this.clearSession();
  }

  /**
   * Helper method to convert status to display text
   */
  getStatusDisplay(status) {
    const statusMap = {
      'pending': 'Chờ khớp lệnh',
      'completed': 'Đã khớp lệnh',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  /**
   * Helper method to convert transaction type to display text
   */
  getTransactionTypeDisplay(type) {
    const typeMap = {
      'purchase': 'Mua',
      'sale': 'Bán',
      'exchange': 'Hoán đổi'
    };
    return typeMap[type] || type;
  }

  /**
   * Format currency values
   */
  formatCurrency(amount, currency = 'VND') {
    return `${parseFloat(amount).toLocaleString('vi-VN')} ${currency}`;
  }

  /**
   * Format date values
   */
  formatDate(dateString, locale = 'vi-VN') {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale);
  }

  /**
   * Format datetime values
   */
  formatDateTime(dateString, locale = 'vi-VN') {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(locale);
  }
}

module.exports = BaseOdooService; 