import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { ApiResponse } from '../types/api';
import { API_CONFIG, API_ENDPOINTS } from './apiConfig';

// API Service Class
export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private sessionId: string | null = null; // We still expose this for AuthContext logic

  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: { ...API_CONFIG.HEADERS },
      maxRedirects: 5, // Follow redirects
      validateStatus: (status) => status < 500, // Accept redirects
    });

    // Request interceptor to attach session cookie
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Add ngrok-specific headers
      config.headers = {
        ...(config.headers || {}),
        'ngrok-skip-browser-warning': 'true',
      } as any;
      
      // Attach session cookie if available (for authenticated endpoints)
      if (this.sessionId) {
        config.headers = {
          ...(config.headers || {}),
          'Cookie': `session_id=${this.sessionId}`,
        } as any;
        
        console.log(`🔐 [ApiService] Adding session cookie: session_id=${this.sessionId.substring(0, 10)}...`);
      } else {
        console.log('⚠️ [ApiService] No session ID available for request to:', config.url);
      }
      
      return config;
    });
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /* ----------------------------- AUTH HELPERS ---------------------------- */

  // Set tokens
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Set session ID manually (optional fallback)
  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Clear tokens and session
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.sessionId = null;
  }

  // Get authentication status
  getAuthStatus() {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      hasSessionId: !!this.sessionId,
    };
  }

  // Test if current session is valid by calling a simple authenticated endpoint
  async testSessionValidity(): Promise<boolean> {
    if (!this.sessionId) {
      console.log('🔐 [ApiService] No session ID to test');
      return false;
    }

    try {
      console.log('🔐 [ApiService] Testing session validity...');
      const response = await this.post('/web/session/get_session_info', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });
      
      const sessionInfo = response?.data as any;
      const isValid = sessionInfo && sessionInfo.uid && sessionInfo.uid !== false;
      
      console.log(`🔐 [ApiService] Session test result:`, isValid ? 'VALID' : 'INVALID');
      if (isValid) {
        console.log(`🔐 [ApiService] User ID: ${sessionInfo.uid}, DB: ${sessionInfo.db}`);
      }
      
      return isValid;
    } catch (error) {
      console.log('❌ [ApiService] Session test failed:', error);
      return false;
    }
  }

  /* ---------------------------- CORE REQUEST ----------------------------- */

  private async makeRequest<T = any>(
    endpoint: string,
    config: AxiosRequestConfig = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      // Attach auth header if available
      const headers: Record<string, string> = {};
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      // Merge headers
      config.headers = { ...(config.headers || {}), ...headers };

      const response: AxiosResponse = await this.axiosInstance.request({
        url: endpoint,
        ...config,
      });

      // Axios already parses JSON when possible
      const data = response.data;

      // Handle Odoo JSON-RPC response format
      if (data && data.jsonrpc && data.jsonrpc === "2.0") {
        if (data.error) {
          throw new Error(data.error.data?.message || data.error.message || 'API Error');
        }
        return { success: true, data: data.result as T, rawResponse: response as any };
      }

      // If data is an array, wrap into ApiResponse format
      if (Array.isArray(data)) {
        return { success: true, data: data as T, rawResponse: response as any };
      }

      return { ...(data as ApiResponse<T>), rawResponse: response as any };
    } catch (error: any) {
      // Handle 429 rate limit errors with retry
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.warn(`⏰ [ApiService] Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, config, retryCount + 1);
      }

      console.error('🔥 [ApiService] Request failed:', error);
      throw error;
    }
  }

  /* ------------------------------ HTTP VERBS ----------------------------- */

  async get<T>(endpoint: string, params?: Record<string, any>, forceRefresh = false): Promise<ApiResponse<T>> {
    const headers = forceRefresh ? { 'X-Force-Refresh': 'true' } : {};
    return this.makeRequest<T>(endpoint, { method: 'GET', params, headers });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'POST', data });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PUT', data });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  /* ----------------------------- API ENDPOINTS --------------------------- */

  // Authentication methods
  async login(email: string, password: string, database?: string): Promise<ApiResponse<any>> {
    console.log(`🔐 [ApiService] Starting login process (middleware: ${API_CONFIG.USE_MIDDLEWARE})`);
    
    // If using middleware, skip authentication - middleware handles it internally
    if (API_CONFIG.USE_MIDDLEWARE) {
      console.log('✅ [ApiService] Using middleware - no client authentication needed');
      // Set dummy session for compatibility
      this.sessionId = 'middleware-session';
      return { 
        success: true, 
        data: { 
          result: { 
            db: 'p2p2', 
            uid: 1, 
            session_id: 'middleware-session',
            username: email 
          } 
        }
      };
    }
    
    // Direct Odoo authentication
    return this.loginDirectOdoo(email, password, database);
  }

  // Direct Odoo authentication method
  private async loginDirectOdoo(email: string, password: string, database?: string): Promise<ApiResponse<any>> {
    // Try different databases if not specified
    const databasesToTry = ['p2p', 'odoo18', 'postgres', 'odoo'];
    
    for (const db of databasesToTry) {
      try {
        console.log(`🔐 [ApiService] Trying login with database: ${db}`);
        
        // Use JSON-RPC format for Odoo authentication
        const res = await this.post(API_ENDPOINTS.LEGACY_ODOO.AUTH.LOGIN, {
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: db,
            login: email,
            password: password
          }
        });

        console.log(`🔐 [ApiService] Response:`, res);

        // If successful, extract session_id from Set-Cookie header
        const setCookie = (res.rawResponse?.headers as any)?.['set-cookie'] || (res.rawResponse?.headers as any)?.['Set-Cookie'];
        
        if (setCookie) {
          let sessionId = null;
          
          if (Array.isArray(setCookie)) {
            console.log(`🔐 [ApiService] Processing ${setCookie.length} cookies`);
            for (const cookie of setCookie) {
              console.log(`🔐 [ApiService] Checking cookie: ${cookie}`);
              const match = /session_id=([^;]+)/.exec(cookie);
              if (match) {
                sessionId = match[1];
                console.log(`🔐 [ApiService] Found session_id: ${sessionId}`);
                break;
              }
            }
          } else if (typeof setCookie === 'string') {
            console.log(`🔐 [ApiService] Processing single cookie: ${setCookie}`);
            const match = /session_id=([^;]+)/.exec(setCookie);
            if (match) {
              sessionId = match[1];
              console.log(`🔐 [ApiService] Found session_id: ${sessionId}`);
            }
          }
          
          if (sessionId) {
            this.sessionId = sessionId;
            console.log(`✅ [ApiService] Login successful with database: ${db}, session: ${sessionId}`);
            return { 
              success: true, 
              data: { result: { db: db, uid: 1, session_id: sessionId } }
            };
          }
        }

        // Check if login was successful from JSON-RPC response
        const responseData = res.data as any;
        if (responseData && responseData.result && !responseData.error) {
          console.log(`✅ [ApiService] Login successful with database: ${db} (JSON-RPC response)`);
          // Even without session_id in headers, the login might be successful
          return { 
            success: true, 
            data: responseData
          };
        }

        // Check for error in JSON-RPC response
        if (responseData && responseData.error) {
          console.log(`❌ [ApiService] Login error for database ${db}:`, responseData.error);
          continue;
        }
        
      } catch (error: any) {
        console.log(`❌ [ApiService] Login failed with database: ${db}`, error.message);
        continue;
      }
    }
    
    throw new Error('Login failed with all available databases');
  }

  // Test database connection
  async testDatabaseConnection() {
    try {
      const dbList = await this.post('/web/database/list', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });
      console.log('📊 [ApiService] Available databases:', dbList.data);
      return dbList.data;
    } catch (error) {
      console.log('❌ [ApiService] Database list failed:', error);
      throw error;
    }
  }

  async signup(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
  }) {
    return this.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
  }

  async verifyOtp(otp: string) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { otp });
  }

  async resetPassword(email: string) {
    return this.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email });
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refresh_token: this.refreshToken,
    });
  }

  // Fund methods
  async getFunds(params?: {
    page?: number;
    limit?: number;
    search?: string;
    investment_type?: string;
  }) {
    return this.get(API_ENDPOINTS.FUNDS.LIST, params);
  }

  async getFundDetail(id: number) {
    return this.get(API_ENDPOINTS.FUNDS.DETAIL(id));
  }

  // Get user's fund data
  async getUserFundData() {
    return this.get(API_ENDPOINTS.FUNDS.USER_DATA);
  }

  async getFundData() {
    return this.get('/portfolio/funds');
  }

  async getFundDataDetail(id: number) {
    return this.get(API_ENDPOINTS.FUNDS.DETAIL(id));
  }

  // Investment methods
  async createInvestment(data: {
    fund_id: number;
    amount: number;
    units: number;
  }) {
    return this.post(API_ENDPOINTS.INVESTMENTS.CREATE, data);
  }

  async buyFund(data: {
    fund_id: number;
    amount: number;
    units: number;
    transaction_type: 'purchase';
  }) {
    return this.post(API_ENDPOINTS.INVESTMENTS.CREATE, data);
  }

  async sellFund(data: {
    fund_id: number;
    units: number;
    transaction_type: 'sale';
  }) {
    return this.post(API_ENDPOINTS.INVESTMENTS.SELL, data);
  }

  // Portfolio methods
  async getPortfolioOverview() {
    return this.get(API_ENDPOINTS.PORTFOLIO.DASHBOARD);
  }

  async getInvestments() {
    return this.get('/data_investment');
  }

  async getInvestmentsByFund(fundId: number) {
    return this.get(API_ENDPOINTS.INVESTMENTS.BY_FUND(fundId));
  }

  // Transaction methods
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    transaction_type?: string;
    fund_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get(API_ENDPOINTS.TRANSACTIONS.ORDER, params);
  }

  async getPendingTransactions() {
    return this.get(API_ENDPOINTS.TRANSACTIONS.PENDING);
  }

  // Profile methods
  async getProfile() {
    return this.get(API_ENDPOINTS.PROFILE.PERSONAL_DATA);
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.PERSONAL_SAVE, data);
  }

  async getAddress() {
    return this.get(API_ENDPOINTS.PROFILE.ADDRESS_DATA);
  }

  async updateAddress(data: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    address_type: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.ADDRESS_SAVE, data);
  }

  async getBankAccounts() {
    return this.get(API_ENDPOINTS.PROFILE.BANK_DATA);
  }

  async addBankAccount(data: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    branch: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.BANK_SAVE, data);
  }

  async verifyAccount(data: {
    id_number: string;
    id_type: string;
    id_issue_date: string;
    id_issue_place: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.SAVE_ALL, data);
  }

  // Account Balance methods
  async getBalance() {
    return this.get(API_ENDPOINTS.ACCOUNT.BALANCE);
  }

  async getBalanceHistory(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get(API_ENDPOINTS.ACCOUNT.BALANCE_HISTORY, params);
  }

  // Reference Data methods
  async getCountries() {
    return this.get(API_ENDPOINTS.REFERENCE.COUNTRIES);
  }

  async getCurrencies() {
    return this.get(API_ENDPOINTS.REFERENCE.CURRENCIES);
  }

  async getStatusInfo() {
    return this.get(API_ENDPOINTS.REFERENCE.STATUS_INFO);
  }

  // Asset Management methods
  async getAssetManagement() {
    return this.get(API_ENDPOINTS.ASSET.MANAGEMENT);
  }

  // Odoo Dataset API methods for direct model access
  async searchReadModel(modelName: string, fields: string[] = ['name', 'id'], domain: any[] = [], limit: number = 10) {
    return this.post('/web/dataset/search_read', {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: modelName,
        fields: fields,
        domain: domain,
        limit: limit
      }
    });
  }

  // Get fund data directly from Odoo models  
  async getFundDataFromModel() {
    const possibleModels = [
      'fund.fund',
      'fund_management.fund', 
      'asset_management.fund',
      'investment.fund'
    ];

    for (const modelName of possibleModels) {
      try {
        const response = await this.searchReadModel(
          modelName,
          ['name', 'id', 'current_nav', 'investment_type', 'description'],
          [],
          20
        );
        if (response.data && (response.data as any).records?.length > 0) {
          return response;
        }
      } catch (error) {
        continue; // Try next model
      }
    }
    throw new Error('No fund model found');
  }

  // Get investment data directly from Odoo models
  async getInvestmentDataFromModel() {
    const possibleModels = [
      'investment.investment',
      'fund_management.investment',
      'asset_management.investment', 
      'portfolio.investment'
    ];

    for (const modelName of possibleModels) {
      try {
        const response = await this.searchReadModel(
          modelName,
          ['name', 'id', 'amount', 'fund_id', 'current_value', 'profit_loss'],
          [],
          20
        );
        if (response.data && (response.data as any).records?.length > 0) {
          return response;
        }
      } catch (error) {
        continue;
      }
    }
    throw new Error('No investment model found');
  }

  // Get user portfolio data
  async getPortfolioDataFromModel() {
    try {
      // Try to get current user's investments
      const userContext = await this.post('/web/session/get_session_info', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });
      
      const userId = (userContext.data as any)?.result?.uid;
      if (userId) {
        // Search for user's investments
        return this.searchReadModel(
          'investment.investment',
          ['name', 'amount', 'current_value', 'profit_loss', 'fund_id'],
          [['user_id', '=', userId]],
          50
        );
      }
    } catch (error) {
      console.log('Could not get user portfolio data:', error);
    }
    throw new Error('No portfolio data found');
  }
}

// Singleton export
export const apiService = ApiService.getInstance(); 