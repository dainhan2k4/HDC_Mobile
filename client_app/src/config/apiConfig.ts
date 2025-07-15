import { ApiConfig, ApiEndpoints } from '../types/api';


// API Configuration for different environments
const ENVIRONMENTS = {
  // Direct Odoo (old approach) 
  ODOO_DIRECT: 'http://localhost:11018', // Fixed to localhost instead of ngrok
  
  // API Middleware (new approach - recommended)
  // ipconfig | findstr IPv4
  MIDDLEWARE_LOCAL: 'http://192.168.50.104:3001/api/v1',  
  MIDDLEWARE_PRODUCTION: '', 
};

// Choose environment - change this to switch between direct Odoo vs middleware
const USE_MIDDLEWARE = true; // Re-enabled to avoid direct Odoo connection issues

// Environment configuration
const IS_PRODUCTION = false; // Change to true for producti on

export const API_CONFIG = {
  // Base URL configuration
  BASE_URL: USE_MIDDLEWARE 
    ? (IS_PRODUCTION ? ENVIRONMENTS.MIDDLEWARE_PRODUCTION : ENVIRONMENTS.MIDDLEWARE_LOCAL)
    : ENVIRONMENTS.ODOO_DIRECT,
    
  // Use middleware or direct Odoo
  USE_MIDDLEWARE,
  
  // Request configuration
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
};

// API Endpoints - now clean REST endpoints thanks to middleware
export const API_ENDPOINTS = {
  // Portfolio endpoints (via middleware)
  PORTFOLIO: {
    OVERVIEW: '/portfolio/overview',
    INVESTMENTS: '/portfolio/investments',
    FUNDS: '/portfolio/funds',
    PERFORMANCE: '/portfolio/performance',
    REFRESH: '/portfolio/refresh',
    DASHBOARD: '/portfolio/overview', // Alias for overview
  },
  
  // Authentication endpoints
  AUTH: {
    LOGIN: '/web/session/authenticate',
    SIGNUP: '/web/signup',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh',
  },
  
  // Fund endpoints
  FUNDS: {
    LIST: '/data_fund',
    DETAIL: (id: number) => `/funds/${id}`,
    USER_DATA: '/user/funds',
  },
  
  // Investment endpoints
  INVESTMENTS: {
    CREATE: '/investments',
    SELL: '/investments/sell',
    BY_FUND: (id: number) => `/investments/fund/${id}`,
  },
  
  // Transaction endpoints
  TRANSACTIONS: {
    ORDER: '/transactions/order',
    PENDING: '/transactions/pending',
  },
  
  // Profile endpoints
  PROFILE: {
    PERSONAL_DATA: '/profile/personal',
    PERSONAL_SAVE: '/profile/personal/save',
    ADDRESS_DATA: '/profile/address',
    ADDRESS_SAVE: '/profile/address/save',
    BANK_DATA: '/profile/bank',
    BANK_SAVE: '/profile/bank/save',
    SAVE_ALL: '/profile/save-all',
  },
  
  // Account endpoints
  ACCOUNT: {
    BALANCE: '/account/balance',
    HISTORY: '/account/history',
  },
  
  // Reference data endpoints
  REFERENCE: {
    COUNTRIES: '/reference/countries',
    CURRENCIES: '/reference/currencies',
  },
  
  // Health check
  HEALTH: '/health',
  
  // Legacy Odoo endpoints (fallback when not using middleware)
  LEGACY_ODOO: {
    AUTH: {
      LOGIN: '/web/session/authenticate',
      SESSION_INFO: '/web/session/get_session_info',
    },
    DATA: {
      FUNDS: '/data_fund',
      INVESTMENTS: '/data_investment',
    }
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Configuration summary for debugging
export const CONFIG_SUMMARY = {
  baseUrl: API_CONFIG.BASE_URL,
  useMiddleware: USE_MIDDLEWARE,
  environment: IS_PRODUCTION ? 'production' : 'development',
  timeout: API_CONFIG.TIMEOUT,
}; 