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
      withCredentials: true,
      headers: { ...API_CONFIG.HEADERS },
    });

    // Request interceptor to attach session cookie
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (this.sessionId) {
        config.headers = {
          ...(config.headers || {}),
          Cookie: `session_id=${this.sessionId}`,
        } as any;
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

  /* ---------------------------- CORE REQUEST ----------------------------- */

  private async makeRequest<T = any>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Attach auth header if available
      const headers: Record<string, string> = {};
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      // Merge headers
      config.headers = { ...(config.headers || {}), ...headers };

      // Log request
      console.log('API Request:', {
        url: endpoint,
        method: config.method || 'GET',
        headers: config.headers,
      });

      const response: AxiosResponse = await this.axiosInstance.request({
        url: endpoint,
        ...config,
      });

      // Log response meta
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Axios already parses JSON when possible
      const data = response.data;

      // If data is an array, wrap into ApiResponse format
      if (Array.isArray(data)) {
        return { success: true, data: data as T, rawResponse: response as any };
      }

      return { ...(data as ApiResponse<T>), rawResponse: response as any };
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /* ------------------------------ HTTP VERBS ----------------------------- */

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET', params });
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
  async login(email: string, password: string) {
    const res = await this.post(API_ENDPOINTS.AUTH.LOGIN, {
      db: 'p2p',
      login: email,
      password: password,
      context: {},
    });

    // Try to extract session_id from Set-Cookie header (axios lower-cases headers)
    const setCookie: string | undefined = (res.rawResponse?.headers as any)?.['set-cookie'];
    if (setCookie) {
      const match = /session_id=([^;]+)/.exec(Array.isArray(setCookie) ? setCookie[0] : setCookie);
      if (match) {
        this.sessionId = match[1];
      }
    }
    return res;
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
}

// Singleton export
export const apiService = ApiService.getInstance(); 