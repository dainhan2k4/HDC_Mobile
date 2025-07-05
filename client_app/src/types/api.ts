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
    RESET_PASSWORD: string;
    REFRESH_TOKEN: string;
  };
  FUNDS: {
    LIST: string;
    DETAIL: (id: number) => string;
    BUY: string;
    SELL: string;
    DATA: string;
    DATA_DETAIL: (id: number) => string;
  };
  INVESTMENTS: {
    LIST: string;
    BY_FUND: (fundId: number) => string;
  };
  PORTFOLIO: {
    OVERVIEW: string;
    INVESTMENTS: string;
  };
  TRANSACTIONS: {
    LIST: string;
    PENDING: string;
    DETAIL: (id: number) => string;
  };
  PROFILE: {
    INFO: string;
    ADDRESS: string;
    BANK_ACCOUNTS: string;
    VERIFY: string;
  };
  ACCOUNT: {
    BALANCE: string;
    BALANCE_HISTORY: string;
  };
} 