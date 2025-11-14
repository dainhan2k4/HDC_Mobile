import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

import { ApiResponse } from '../types/api';
import { API_CONFIG, API_ENDPOINTS } from './apiConfig';
import { PersonalInfo } from '../types/profile';

// API Service Class
export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private sessionId: string | null = null;

  private axiosInstance: AxiosInstance;

  private constructor() {
    console.log('🔧 [ApiService] Initializing with BASE_URL:', API_CONFIG.BASE_URL);
    console.log('🔧 [ApiService] LOCAL_HOST:', API_CONFIG.LOCAL_HOST);
    
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: { ...API_CONFIG.HEADERS },
      maxRedirects: 5, // Follow redirects
      validateStatus: (status) => status < 500, // Accept redirects
    });

    // Request interceptor to attach session cookie
    this.axiosInstance.interceptors.request.use(async (config) => {
      console.log(`📤 [ApiService] Making request to: ${config.url}`);
      console.log(`📤 [ApiService] Full URL: ${config.baseURL}${config.url}`);
      console.log(`📤 [ApiService] Request config:`, {
        method: config.method,
        headers: Object.keys(config.headers || {})
      });
      
      // Add ngrok-specific headers
      config.headers = {
        ...(config.headers || {}),
        'ngrok-skip-browser-warning': 'true',
      } as any;
      
      // Attach session cookie if available (for authenticated endpoints)
      // Skip Cookie header on web to avoid browser blocking (CORS/unsafe header)
      // Use Platform.OS to detect web, not typeof checks (more reliable)
      const isWeb = Platform.OS === 'web';
      
      if (this.sessionId) {
        if (!isWeb) {
          // Native platforms (iOS/Android) can use Cookie header
          config.headers = {
            ...(config.headers || {}),
            'Cookie': `session_id=${this.sessionId}`,
          } as any;
          
          console.log(`🔐 [ApiService] Adding session cookie: session_id=${this.sessionId.substring(0, 10)}...`);
        } else {
          console.log('⚠️ [ApiService] Web platform - Cookie header skipped (CORS restriction)');
          // For web, we might need to use a different auth method
        }
      } else {
        console.log('⚠️ [ApiService] No session ID available for request to:', config.url);
      }
      
      return config;
    });
    
    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ [ApiService] Response from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        if (error.code === 'ECONNABORTED') {
          console.error(`⏱️ [ApiService] Request timeout to ${error.config?.url}`);
          console.error(`⏱️ [ApiService] Base URL: ${error.config?.baseURL}`);
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.error(`🔌 [ApiService] Connection error to ${error.config?.url}`);
          console.error(`🔌 [ApiService] Base URL: ${error.config?.baseURL}`);
          console.error(`🔌 [ApiService] Error: ${error.message}`);
        } else {
          console.error(`❌ [ApiService] Request error to ${error.config?.url}:`, error.message);
        }
        return Promise.reject(error);
      }
    );
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

  // Get session ID
  getSessionId(): string | null {
    return this.sessionId;
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

  // Test if current session is valid - gọi trực tiếp Odoo
  async testSessionValidity(): Promise<boolean> {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      return false;
    }

    try {
      const odooBaseUrl = `http://${API_CONFIG.LOCAL_HOST}:11018`;
      const authClient = axios.create({
        baseURL: odooBaseUrl,
        timeout: API_CONFIG.TIMEOUT,
        headers: { 
          ...API_CONFIG.HEADERS,
          'Cookie': `session_id=${sessionId}`
        },
      });
      
      const response = await authClient.post('/web/session/get_session_info', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });
      
      const sessionInfo = response?.data?.result as any;
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

  private addSessionCookie(config: AxiosRequestConfig): void {
    const sessionId = this.getSessionId();
    if (sessionId) {
      config.headers = config.headers || {};
      config.headers.Cookie = `session_id=${sessionId}`;
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

      console.log('📤 [ApiService] Making request to:', endpoint);
      // Only log id_type if it's actually present (for KYC/verification endpoints)
      if (config.data && config.data.id_type !== undefined) {
        console.log('🔍 [ApiService] id_type in request config:', config.data.id_type);
      }
      
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
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, config, retryCount + 1);
      }

      throw error;
    }
  }

  /* ------------------------------ HTTP VERBS ----------------------------- */

  async get<T>(endpoint: string, params?: Record<string, any>, forceRefresh = false): Promise<ApiResponse<T>> {
    const headers = forceRefresh ? { 'X-Force-Refresh': 'true' } : {};
    return this.makeRequest<T>(endpoint, { method: 'GET', params, headers });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log('📤 [ApiService] POST request to:', endpoint);
    // Only log id_type if it's actually present (for KYC/verification endpoints)
    if (data && data.id_type !== undefined) {
      console.log('🔍 [ApiService] id_type in POST data:', data.id_type);
    }
    return this.makeRequest<T>(endpoint, { method: 'POST', data });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PUT', data });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  /* ----------------------------- API ENDPOINTS --------------------------- */

  // Authentication methods - vẫn gọi trực tiếp Odoo vì middleware chưa có auth endpoint
  async login(email: string, password: string, database?: string): Promise<ApiResponse<any>> {
    console.log(`🔐 [ApiService] Starting login process - gọi trực tiếp Odoo cho authentication`);
    
    // Authentication vẫn gọi trực tiếp Odoo (chưa có middleware endpoint)
    // Tạm thời dùng Odoo base URL trực tiếp cho auth
    const odooBaseUrl = `http://${API_CONFIG.LOCAL_HOST}:11018`;
    
    return this.loginDirectOdoo(email, password, database, odooBaseUrl);
  }

  // Direct Odoo authentication method (chỉ dùng cho auth)
  private async loginDirectOdoo(email: string, password: string, database?: string, baseUrl?: string): Promise<ApiResponse<any>> {
    // Tạo axios instance riêng cho Odoo auth
    const authClient = axios.create({
      baseURL: baseUrl || `http://${API_CONFIG.LOCAL_HOST}:11018`,
      timeout: API_CONFIG.TIMEOUT,
      headers: { ...API_CONFIG.HEADERS },
    });
    // Try different databases if not specified
    const databasesToTry = database ? [database] : ['anfan'];
    
    for (const db of databasesToTry) {
      try {
        console.log(`🔐 [ApiService] Trying login with database: ${db}`);
        
        // Use JSON-RPC format for Odoo authentication
        const res = await authClient.post(API_ENDPOINTS.AUTH.LOGIN, {
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
        const setCookie = (res.headers as any)?.['set-cookie'] || (res.headers as any)?.['Set-Cookie'];
        
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
              data: { result: { db: db, uid: 1, session_id: sessionId } },
              rawResponse: res as any
            };
          }
        }

        // Check if login was successful from JSON-RPC response
        const responseData = res.data as any;
        
        // Wrap response in ApiResponse format
        const apiResponse: ApiResponse<any> = {
          success: true,
          data: responseData,
          rawResponse: res as any
        };
        if (responseData && responseData.result && !responseData.error) {
          console.log(`✅ [ApiService] Login successful with database: ${db} (JSON-RPC response)`);
          // Even without session_id in headers, the login might be successful
          return apiResponse;
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

  // Test database connection - chỉ dùng cho debugging, gọi trực tiếp Odoo
  async testDatabaseConnection() {
    try {
      const odooBaseUrl = `http://${API_CONFIG.LOCAL_HOST}:11018`;
      const authClient = axios.create({
        baseURL: odooBaseUrl,
        timeout: API_CONFIG.TIMEOUT,
        headers: { ...API_CONFIG.HEADERS },
      });
      const dbList = await authClient.post('/web/database/list', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });
      console.log('📊 [ApiService] Available databases:', dbList.data);
      return { success: true, data: dbList.data };
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

  async requestSignupOtp(email: string) {
    return this.post(API_ENDPOINTS.AUTH.SIGNUP_OTP, { email });
  }

  async verifyOtp(email: string, otp: string) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
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

  // Fund methods - dùng middleware endpoints
  async getFunds(params?: {
    page?: number;
    limit?: number;
    search?: string;
    investment_type?: string;
  }) {
    return this.get(API_ENDPOINTS.PORTFOLIO.FUNDS, params);
  }

  async getFundDetail(id: number) {
    // Tạm thời lấy từ danh sách funds và filter
    const funds = await this.getFunds();
    const fund = (funds.data as any[])?.find((f: any) => f.id === id);
    if (!fund) {
      throw new Error('Fund not found');
    }
    return { success: true, data: fund };
  }

  async getFundChart(fundId: number, timeRange: string = '1M') {
    return this.get(API_ENDPOINTS.PORTFOLIO.FUND_CHART(fundId, timeRange));
  }

  async getTermRates(): Promise<ApiResponse<Array<{ month: number; interest_rate: number }>>> {
    try {
      const response = await this.axiosInstance.get(API_ENDPOINTS.PORTFOLIO.TERM_RATES);
      return response.data;
    } catch (error: any) {
      console.error('❌ [ApiService] Failed to get term rates:', error);
      throw error;
    }
  }

  async getFundOHLC(fundId: number, timeRange: string = '1D') {
    return this.get(API_ENDPOINTS.PORTFOLIO.FUND_OHLC(fundId, timeRange));
  }

  async getFundComparison(fundIds: number[]) {
    const idsParam = fundIds.join(',');
    return this.get(`${API_ENDPOINTS.PORTFOLIO.FUND_COMPARE}?ids=${idsParam}`);
  }

  // Investment methods - dùng middleware endpoints
  async getInvestments() {
    return this.get(API_ENDPOINTS.PORTFOLIO.INVESTMENTS);
  }

  async buyFund(data: {
    fundId: number;
    amount: number;
    units: number;
  }) {
    return this.post(API_ENDPOINTS.TRANSACTIONS.BUY, data);
  }

  async sellFund(data: {
    investmentId: number;
    quantity: number;
    estimatedValue?: number;
    debug?: boolean;
  }) {
    return this.post(API_ENDPOINTS.PORTFOLIO.FUND_SELL, data);
  }

  // Portfolio methods - dùng middleware endpoints
  async getPortfolioOverview() {
    return this.get(API_ENDPOINTS.PORTFOLIO.OVERVIEW);
  }

  async getInvestmentsByFund(fundId: number) {
    // Lấy tất cả investments và filter theo fundId
    const investments = await this.getInvestments();
    const filtered = (investments.data as any[])?.filter((inv: any) => inv.fund_id === fundId) || [];
    return { success: true, data: filtered };
  }

  // Transaction methods - dùng middleware endpoints
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    transaction_type?: string;
    fund_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get(API_ENDPOINTS.TRANSACTIONS.CONTROLLER.ORDER, params);
  }

  async getPendingTransactions(forceRefresh = false) {
    return this.get(API_ENDPOINTS.TRANSACTIONS.PENDING, undefined, forceRefresh);
  }

  async getPeriodicTransactions(forceRefresh = false) {
    return this.get(API_ENDPOINTS.TRANSACTIONS.CONTROLLER.PERIODIC, undefined, forceRefresh);
  }

  // Profile methods - dùng middleware endpoints
  async getProfile(): Promise<ApiResponse<any>> {
    return this.get<any>(API_ENDPOINTS.PROFILE.PERSONAL_DATA);
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

  async getVerificationData() {
    return this.get(API_ENDPOINTS.PROFILE.VERIFICATION_DATA);
  }

  async getStatusInfo() {
    return this.get(API_ENDPOINTS.PROFILE.STATUS_INFO);
  }

  async linkSSIAccount(data: {
    consumer_id: string;
    consumer_secret: string;
    account: string;
    private_key: string;
  }): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.PROFILE.LINK_SSI_ACCOUNT, data);
  }

  async getAccountBalance(): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.PROFILE.GET_ACCOUNT_BALANCE, {});
  }

  async uploadIdImage(formData: FormData) {
    return this.makeRequest(API_ENDPOINTS.PROFILE.UPLOAD_ID, {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Reference Data methods - các endpoint này chưa có trong middleware, tạm thời giữ nguyên
  async getCountries() {
    // Tạm thời gọi trực tiếp Odoo (chưa có middleware endpoint)
    const odooBaseUrl = `http://${API_CONFIG.LOCAL_HOST}:11018`;
    const authClient = axios.create({
      baseURL: odooBaseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: { ...API_CONFIG.HEADERS },
    });
    if (this.sessionId) {
      authClient.defaults.headers.common['Cookie'] = `session_id=${this.sessionId}`;
    }
    const response = await authClient.get('/get_countries');
    return { success: true, data: response.data };
  }

  async getCurrencies() {
    // Tạm thời gọi trực tiếp Odoo (chưa có middleware endpoint)
    const odooBaseUrl = `http://${API_CONFIG.LOCAL_HOST}:11018`;
    const authClient = axios.create({
      baseURL: odooBaseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: { ...API_CONFIG.HEADERS },
    });
    if (this.sessionId) {
      authClient.defaults.headers.common['Cookie'] = `session_id=${this.sessionId}`;
    }
    const response = await authClient.get('/get_currencies');
    return { success: true, data: response.data };
  }

  // Asset Management methods - dùng middleware endpoints
  async getAssetManagement() {
    return this.get(API_ENDPOINTS.ASSET.MANAGEMENT);
  }

  // OTP methods - dùng middleware endpoints
  async getOTPConfig(): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.OTP.CONFIG);
  }

  async verifyOTP(otp: string, debugMode: boolean = false): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.OTP.VERIFY, { otp, debugMode });
  }

  // Payment methods - dùng middleware endpoints
  async createPayOSPayment(data: {
    transaction_id?: number;
    amount: number;
    units: number;
    description?: string;
  }): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.PAYMENT.CREATE, data);
  }
}

// Singleton export
export const apiService = ApiService.getInstance(); 