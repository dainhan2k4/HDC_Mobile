import { ApiConfig, ApiEndpoints } from '../types/api';

const API_BASE_URL = 'https://fund-p2p.onrender.com';

// API Configuration
export const API_CONFIG: ApiConfig = {
  BASE_URL: API_BASE_URL,
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