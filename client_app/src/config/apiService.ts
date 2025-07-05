import { ApiResponse } from '../types/api';
import { API_CONFIG, API_ENDPOINTS } from './apiConfig';

// API Service Class
export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private sessionId: string | null = null;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Set tokens
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Set session ID for Odoo authentication
  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Clear tokens and session
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.sessionId = null;
  }

  // Get headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...API_CONFIG.HEADERS };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add session ID for Odoo authentication
    if (this.sessionId) {
      headers['Cookie'] = `session_id=${this.sessionId}`;
      // Also add as X-Session-ID header as backup
      headers['X-Session-ID'] = this.sessionId;
    }
    
    return headers;
  }

  // Make API request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const headers = this.getHeaders();

      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        headers,
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'include', // Important for sending cookies
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('Response text (first 200 chars):', responseText.substring(0, 200));

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error. Full response:', responseText);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }

      // For direct data endpoints, return the data directly
      if (Array.isArray(data)) {
        return { success: true, data: data as T, rawResponse: response };
      }

      return { ...data, rawResponse: response };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.makeRequest<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
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

  // Fund data methods (for direct data access)
  async getFundData() {
    return this.get(API_ENDPOINTS.FUNDS.DATA);
  }

  async getFundDataDetail(id: number) {
    return this.get(API_ENDPOINTS.FUNDS.DATA_DETAIL(id));
  }

  async buyFund(data: {
    fund_id: number;
    amount: number;
    units: number;
    transaction_type: 'purchase';
  }) {
    return this.post(API_ENDPOINTS.FUNDS.BUY, data);
  }

  async sellFund(data: {
    fund_id: number;
    units: number;
    transaction_type: 'sale';
  }) {
    return this.post(API_ENDPOINTS.FUNDS.SELL, data);
  }

  // Portfolio methods
  async getPortfolioOverview() {
    return this.get(API_ENDPOINTS.PORTFOLIO.OVERVIEW);
  }

  async getInvestments() {
    return this.get(API_ENDPOINTS.INVESTMENTS.LIST);
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
    return this.get(API_ENDPOINTS.TRANSACTIONS.LIST, params);
  }

  async getPendingTransactions() {
    return this.get(API_ENDPOINTS.TRANSACTIONS.PENDING);
  }

  async getTransactionDetail(id: number) {
    return this.get(API_ENDPOINTS.TRANSACTIONS.DETAIL(id));
  }

  // Profile methods
  async getProfile() {
    return this.get(API_ENDPOINTS.PROFILE.INFO);
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
  }) {
    return this.put(API_ENDPOINTS.PROFILE.INFO, data);
  }

  async getAddress() {
    return this.get(API_ENDPOINTS.PROFILE.ADDRESS);
  }

  async updateAddress(data: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    address_type: string;
  }) {
    return this.put(API_ENDPOINTS.PROFILE.ADDRESS, data);
  }

  async getBankAccounts() {
    return this.get(API_ENDPOINTS.PROFILE.BANK_ACCOUNTS);
  }

  async addBankAccount(data: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    branch: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.BANK_ACCOUNTS, data);
  }

  async verifyAccount(data: {
    id_number: string;
    id_type: string;
    id_issue_date: string;
    id_issue_place: string;
  }) {
    return this.post(API_ENDPOINTS.PROFILE.VERIFY, data);
  }

  // Account balance methods
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
}

// Export singleton instance
export const apiService = ApiService.getInstance(); 