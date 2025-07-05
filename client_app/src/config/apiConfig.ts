import { ApiConfig, ApiEndpoints } from '../types/api';

// Environment-based API Configuration
const getBaseUrl = () => {
  // Kiểm tra environment
  if (__DEV__) {
    // Development: sử dụng localhost với port cụ thể
    return 'http://192.168.50.104:11018';
  } else {
    // Production: sử dụng đường dẫn tương đối
    return '';
  }
};

// API Configuration
export const API_CONFIG: ApiConfig = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS: ApiEndpoints = {
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
    DATA: '/data_fund',
    DATA_DETAIL: (id: number) => `/data_fund/${id}`,
  },

  // Investment Data
  INVESTMENTS: {
    LIST: '/data_investment',
    BY_FUND: (fundId: number) => `/data_investment?fund_id=${fundId}`,
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