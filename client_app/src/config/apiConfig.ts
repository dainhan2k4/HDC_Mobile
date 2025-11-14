import { ApiConfig, ApiEndpoints } from '../types/api';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Helper function to get the local IP address
// For mobile: use localhost for emulator, IP for physical device
// For web: use localhost or IP from environment
const getLocalHost = (): string => {
  // Check if we're in Expo Go or development
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const isDev = __DEV__;
  
  // Try to get IP from environment variables first
  const envIp = process.env.EXPO_PUBLIC_API_IP || Constants.expoConfig?.extra?.apiIp;
  
  if (envIp) {
    return envIp; 
  }
  
  // For Android emulator, use 10.0.2.2 to access host machine
  if (Platform.OS === 'android' && isDev) {
    return '10.0.2.2';
  }
  
  // For iOS simulator, use localhost (simulator can access host via localhost)
  // iOS simulator shares network with host machine, so localhost works
  if (Platform.OS === 'ios' && isDev) {
    // iOS simulator can access host machine via localhost
    // User can override with EXPO_PUBLIC_API_IP if needed
    return envIp || 'localhost';
  }
  
  // For physical devices, default to Wi-Fi IP address
  // User should set EXPO_PUBLIC_API_IP in .env or app.json
  // Current Wi-Fi IP: 10.10.3.47 (from ipconfig)
  return '10.10.3.47';
};

// Get base host
const LOCAL_HOST = getLocalHost();

// API Configuration - chỉ dùng API Middleware
const ENVIRONMENTS = {
  // KYC Service (riêng biệt)
  KYC_DIRECT: `http://${LOCAL_HOST}:8000`, 

  // API Middleware (duy nhất)
  MIDDLEWARE_LOCAL: `http://${LOCAL_HOST}:3001/api/v1`,
  MIDDLEWARE_PRODUCTION: process.env.EXPO_PUBLIC_API_URL || '', 
};

// Environment configuration
const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production' || false;

export const API_CONFIG = {
  // Base URL configuration - chỉ dùng middleware
  BASE_URL: IS_PRODUCTION ? ENVIRONMENTS.MIDDLEWARE_PRODUCTION : ENVIRONMENTS.MIDDLEWARE_LOCAL,
    
  // Request configuration
  TIMEOUT: 30000, // 30 giây timeout
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
  
  // Local host info for debugging
  LOCAL_HOST,
  PLATFORM: Platform.OS,
};

// API Endpoints - chỉ dùng middleware endpoints
export const API_ENDPOINTS = {
  // Portfolio endpoints (via middleware)
  PORTFOLIO: {
    OVERVIEW: '/portfolio/overview',
    INVESTMENTS: '/portfolio/investments',
    FUNDS: '/portfolio/funds',
            FUND_CHART: (id: number, timeRange: string = '1M') => `/portfolio/funds/${id}/chart?timeRange=${timeRange}`,
            FUND_OHLC: (id: number, timeRange: string = '1D') => `/portfolio/funds/${id}/ohlc?timeRange=${timeRange}`,
            FUND_COMPARE: '/portfolio/funds/compare',
    FUND_SELL: '/portfolio/funds/sell',
    TERM_RATES: '/portfolio/term-rates',
    PERFORMANCE: '/portfolio/performance',
    REFRESH: '/portfolio/refresh',
    CLEAR_CACHE: '/portfolio/clear-cache',
  },
  
  // Authentication endpoints (vẫn gọi trực tiếp Odoo cho auth)
  AUTH: {
    LOGIN: '/web/session/authenticate',
    SIGNUP_OTP: '/web/signup/otp',
    VERIFY_OTP: '/web/signup/verify-otp',
  },
  
  // Transaction endpoints (via middleware)
  TRANSACTIONS: {
    BUY: '/transaction/buy',
    SELL: '/transaction/sell',
    PENDING: '/transaction/pending',
    HISTORY: '/transaction/history',
    STATS: '/transaction/stats',
    BY_ID: (id: number) => `/transaction/${id}`,
    
    // Controller proxy endpoints
    CONTROLLER: {
      ORDER: '/transaction/controller/order',
      PENDING: '/transaction/controller/pending',
      PERIODIC: '/transaction/controller/periodic',
    },
    
    // Transaction List endpoints (mới)
    LIST: {
      DATA: '/transaction/list/data',
      STATS: '/transaction/list/stats',
      DETAILS: (id: number) => `/transaction/list/details/${id}`,
      ORDER_BOOK: '/transaction/order-book',
      ORDER_BOOK_FUNDS: '/transaction/order-book/funds',
      COMPLETED: '/transaction/order-book/completed',
      NEGOTIATED: '/transaction/order-book/negotiated',
      CONTRACT: (id: number) => `/transaction/contract/${id}`,
    },
    
    // Partial Matching endpoints
    PARTIAL_MATCHING: {
      CREATE_ENGINE: '/transaction/partial-matching/create-engine',
      ADD_ORDER: '/transaction/partial-matching/add-order',
      PROCESS_ALL: '/transaction/partial-matching/process-all',
      QUEUE_STATUS: '/transaction/partial-matching/queue-status',
      CLEAR_QUEUE: '/transaction/partial-matching/clear-queue',
      LIST_ENGINES: '/transaction/partial-matching/engines',
      CLEANUP: '/transaction/partial-matching/cleanup',
    },
  },
  
  // Profile endpoints (via middleware)
  PROFILE: {
    PERSONAL: '/profile/personal',
    PERSONAL_DATA: '/profile/data_personal_profile',
    PERSONAL_SAVE: '/profile/save_personal_profile',
    ADDRESS_DATA: '/profile/data_address_info',
    ADDRESS_SAVE: '/profile/save_address_info',
    BANK_DATA: '/profile/data_bank_info',
    BANK_SAVE: '/profile/save_bank_info',
    STATUS_INFO: '/profile/get_status_info',
    VERIFICATION_DATA: '/profile/data_verification',
    SAVE_ALL: '/profile/save_all_profile_data',
    LINK_SSI_ACCOUNT: '/profile/link_ssi_account',
    GET_ACCOUNT_BALANCE: '/profile/get_account_balance',
  },

  // Asset endpoints (via middleware)
  ASSET: {
    MANAGEMENT: '/asset/management',
  },
  
  // OTP endpoints (via middleware)
  OTP: {
    CONFIG: '/otp/config',
    VERIFY: '/otp/verify',
  },
  
  // Health check
  HEALTH: '/health',

  // KYC endpoints - gọi trực tiếp đến eKYC service (riêng biệt)
  KYC: {
    BASE_URL: `http://${LOCAL_HOST}:8000`,
    HEALTH: '/api/health-check',
    FRONT_ID: '/api/ekyc/frontID',
    BACK_ID: '/api/ekyc/backID',
    DETECTION: '/api/ekyc/detection',
    PROCESS: '/api/ekyc-process',
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Configuration summary for debugging
export const CONFIG_SUMMARY = {
  baseUrl: API_CONFIG.BASE_URL,
  environment: IS_PRODUCTION ? 'production' : 'development',
  timeout: API_CONFIG.TIMEOUT,
}; 