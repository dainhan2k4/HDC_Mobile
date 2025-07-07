import { ApiConfig, ApiEndpoints } from '../types/api';


// using command "npx ngrok http 11018" to get the ngrok tunnel to Odoo server
const API_BASE_URL = 'https://10f4-2402-800-63b7-c44d-4515-76a-c994-4d87.ngrok-free.app'; // ngrok tunnel to Odoo server

// API Configuration
export const API_CONFIG: ApiConfig = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ReactNative/1.0',
  },
};

// API Endpoints
export const API_ENDPOINTS: ApiEndpoints = {
  // Authentication - Sử dụng standard Odoo web endpoints
  AUTH: {
    LOGIN: '/web/session/authenticate',
    SIGNUP: '/web/signup/otp',
    RESET_PASSWORD: '/web/reset_password',
    REFRESH_TOKEN: '/web/session/refresh',
  },

  // Fund Management - Dựa trên documentation backend
  FUNDS: {
    LIST: '/api/funds',
    DETAIL: (id: number) => `/api/funds/${id}`,
    BUY: '/create_investment',
    SELL: '/submit_fund_sell',
    DATA: '/api/funds',
    DATA_DETAIL: (id: number) => `/api/funds/${id}`,
  },

  // Investment Data - Dựa trên backend controllers
  INVESTMENTS: {
    LIST: '/data_investment',
    BY_FUND: (fundId: number) => `/data_investment?fund_id=${fundId}`,
  },

  // Portfolio - Sử dụng API endpoints mới
  PORTFOLIO: {
    OVERVIEW: '/api/portfolio/overview',
    INVESTMENTS: '/api/investments',
  },

  // Transactions - Dựa trên transaction management
  TRANSACTIONS: {
    LIST: '/transaction_management/order',
    PENDING: '/transaction_management/pending',
    DETAIL: (id: number) => `/transaction_management/order/${id}`,
  },

  // Profile - Sử dụng API endpoint mới
  PROFILE: {
    INFO: '/api/profile',
    ADDRESS: '/api/profile',
    BANK_ACCOUNTS: '/api/profile',
    VERIFY: '/api/profile',
  },

  // Account Balance - Dựa trên backend endpoint
  ACCOUNT: {
    BALANCE: '/account_balance',
    BALANCE_HISTORY: '/account_balance/history',
  },
}; 