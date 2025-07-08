// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
  details?: Record<string, string>;
  rawResponse?: Response;
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

// API Configuration Types
export interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  HEADERS: Record<string, string>;
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

// API Endpoints Type
export interface ApiEndpoints {
  AUTH: {
    LOGIN: string;
    SIGNUP: string;
    VERIFY_OTP: string;
    RESET_PASSWORD: string;
    REFRESH_TOKEN: string;
  };
  FUNDS: {
    LIST: string;
    DETAIL: (id: number) => string;
    WIDGET: string;
    COMPARE: string;
    BUY_PAGE: string;
    SELL_PAGE: string;
    USER_DATA: string;
  };
  INVESTMENTS: {
    LIST: string;
    CREATE: string;
    SELL: string;
    BY_FUND: (fundId: number) => string;
  };
  PORTFOLIO: {
    DASHBOARD: string;
    WIDGET: string;
    OVERVIEW: string;
  };
  PROFILE: {
    PERSONAL_DATA: string;
    PERSONAL_SAVE: string;
    UPLOAD_ID: string;
    SAVE_ALL: string;
    BANK_DATA: string;
    BANK_SAVE: string;
    ADDRESS_DATA: string;
    ADDRESS_SAVE: string;
  };
  TRANSACTIONS: {
    PERIODIC: string;
    ORDER: string;
    PENDING: string;
    DETAIL: (id: number) => string;
  };
  ACCOUNT: {
    BALANCE: string;
    BALANCE_HISTORY: string;
  };
  REFERENCE: {
    COUNTRIES: string;
    CURRENCIES: string;
    STATUS_INFO: string;
  };
  ASSET: {
    MANAGEMENT: string;
  };
} 