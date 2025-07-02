// Environment-based API Configuration
const getBaseUrl = () => {
  // Kiểm tra environment
  if (__DEV__) {
    // Development: sử dụng localhost với port cụ thể
    return 'http://localhost:10018';
  } else {
    // Production: sử dụng đường dẫn tương đối
    return '';
  }
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH_TOKEN: '/api/auth/refresh',
  },

  // Fund Management
  FUNDS: {
    LIST: '/api/funds',
    DETAIL: (id: number) => `/api/funds/${id}`,
    BUY: '/api/funds/buy',
    SELL: '/api/funds/sell',
  },

  // Portfolio
  PORTFOLIO: {
    OVERVIEW: '/api/portfolio',
    INVESTMENTS: '/api/portfolio/investments',
  },

  // Transactions
  TRANSACTIONS: {
    LIST: '/api/transactions',
    PENDING: '/api/transactions/pending',
    DETAIL: (id: number) => `/api/transactions/${id}`,
  },

  // Profile
  PROFILE: {
    INFO: '/api/profile',
    ADDRESS: '/api/profile/address',
    BANK_ACCOUNTS: '/api/profile/bank-accounts',
    VERIFY: '/api/profile/verify',
  },

  // Account Balance
  ACCOUNT: {
    BALANCE: '/api/account/balance',
    BALANCE_HISTORY: '/api/account/balance-history',
  },
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
  details?: Record<string, string>;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Error Codes
export const API_ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  FUND_NOT_AVAILABLE: 'FUND_NOT_AVAILABLE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// API Service Class
export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

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

  // Clear tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Get headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...API_CONFIG.HEADERS };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
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

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
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
    return this.get(API_ENDPOINTS.PORTFOLIO.INVESTMENTS);
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