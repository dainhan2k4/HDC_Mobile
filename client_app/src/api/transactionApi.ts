import { apiService } from '../config/apiService';
import { ApiResponse } from '../types/api';


export interface Transaction {
  id: number;
  name: string;
  account_number: string;
  fund_name: string;
  fund_id: number;
  order_date: string;
  order_code: string;
  amount: number | string;
  session_date: string;
  status: string;
  status_detail: string;
  transaction_type: string;
  units: number | string;
  currency: string;
  raw_status: string;
  raw_transaction_type: string;
  previous_nav?: number | string; // NAV kỳ trước
  nav?: number | string; // NAV hiện tại (alias cho previous_nav)
  orderDate?: string; // legacy camelCase
  sessionDate?: string;
  amount_text?: string;
  amount_display?: string;
  transaction_date?: string;
  created_at?: string;
  // Optional legacy fields
  type?: string;
  date?: string;
}

export interface BalanceInfo {
  available_balance: number;
  invested_amount: number;
  pending_transactions: number;
  total_portfolio_value: number;
  currency: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
}

// Transaction methods

// Get transaction orders - all transactions with filters
export const getTransactionOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  transaction_type?: string;
  fund_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<Transaction[]> => {
  try {
    console.log('🔗 [TransactionApi] Getting all transactions with params:', params);
    const response = await apiService.getTransactions(params);
    console.log('✅ [TransactionApi] Transactions response:', response);
    return (response.data as Transaction[]) || [];
  } catch (error) {
    console.error('❌ [TransactionApi] Error fetching transaction orders:', error);
    throw error;
  }
};

// Get pending transactions - dùng middleware endpoint
const extractTransactionArray = (response: any, context: string): Transaction[] => {
  if (!response) {
    console.warn(`⚠️ [TransactionApi] ${context}: response is empty`);
    return [];
  }

  const candidates = [
    response?.data,
    response?.data?.data,
    response?.data?.result,
    response?.data?.result?.data,
    response?.result,
    response?.result?.data,
    response?.rawResponse?.data,
    response?.rawResponse?.data?.data,
    response?.rawResponse?.data?.result
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Transaction[];
    }
  }

  console.warn(`⚠️ [TransactionApi] ${context}: unexpected response format`, {
    keys: Object.keys(response || {}),
    dataKeys: response?.data ? Object.keys(response.data) : null,
  });
  return [];
};

export const getPendingTransactions = async (forceRefresh = false): Promise<Transaction[]> => {
  try {
    console.log(`🔗 [TransactionApi] Getting pending transactions${forceRefresh ? ' (force refresh)' : ''}...`);
    const response = await apiService.getPendingTransactions(forceRefresh);
    return extractTransactionArray(response, 'PendingTransactions');
  } catch (error) {
    console.error('❌ [TransactionApi] Error fetching pending transactions:', error);
    throw error;
  }
};

// Get periodic transactions using /transaction_management/periodic
export const getPeriodicTransactions = async (): Promise<Transaction[]> => {
  try {
    console.log('🔗 [TransactionApi] Getting periodic transactions...');
    const response = await apiService.getPeriodicTransactions();
    return (response.data as Transaction[]) || [];
  } catch (error) {
    console.error('❌ [TransactionApi] Error fetching periodic transactions:', error);
    throw error;
  }
};

// Account Balance methods

// Get account balance using /account_balance
export const getAccountBalance = async (): Promise<BalanceInfo> => {
  try {
    const response = await apiService.getBalance();
    return response.data as BalanceInfo;
  } catch (error) {
    console.error('Error fetching account balance:', error);
    throw error;
  }
};

// Get balance history using /account_balance/history
export const getBalanceHistory = async (params?: {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}): Promise<any[]> => {
  try {
    const response = await apiService.getBalanceHistory(params);
    return (response.data as any[]) || [];
  } catch (error) {
    console.error('Error fetching balance history:', error);
    throw error;
  }
};

// Get transaction history - dùng middleware endpoint
export const getTransactionHistory = async (forceRefresh = false, params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> => {
  try {
    console.log(`🔗 [TransactionApi] Getting transaction history${forceRefresh ? ' (force refresh)' : ''}...`);
    const queryParams = params ? new URLSearchParams({
      ...params,
      startDate: params.startDate || '',
      endDate: params.endDate || ''
    } as any).toString() : '';
    const url = `/transaction/history${queryParams ? `?${queryParams}` : ''}`;
    const response = await apiService.get(url, undefined, forceRefresh);
    return extractTransactionArray(response, 'TransactionHistory');
  } catch (error) {
    console.error('❌ [TransactionApi] Error fetching transaction history:', error);
    // Trả về empty array thay vì throw error để tránh crash
    return [];
  }
};

// Reference Data methods

// Get countries using /get_countries
export const getCountries = async (): Promise<Country[]> => {
  try {
    const response = await apiService.getCountries();
    return (response.data as Country[]) || [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

// Get currencies using /get_currencies
export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    const response = await apiService.getCurrencies();
    return (response.data as Currency[]) || [];
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw error;
  }
};

// Get status info using /get_status_info
export const getStatusInfo = async (): Promise<any> => {
  try {
    const response = await apiService.getStatusInfo();
    return response.data;
  } catch (error) {
    console.error('Error fetching status info:', error);
    throw error;
  }
};

// Get portfolio widget using /portfolio_widget
export const getPortfolioWidget = async () => {
  try {
    const response = await apiService.getPortfolioWidget();
    return response;
  } catch (error) {
    console.error('Error fetching portfolio widget:', error);
    throw error;
  }
};

// Asset Management methods

// Get asset management using /asset-management
export const getAssetManagement = async (): Promise<any> => {
  try {
    const response = await apiService.getAssetManagement();
    return response.data;
  } catch (error) {
    console.error('Error fetching asset management:', error);
    throw error;
  }
};

// Transaction API object for easier importing
export const transactionApi = {
  getTransactionOrders,
  getPendingTransactions,
  getPeriodicTransactions,
  getTransactionHistory,
  getAccountBalance,
  getBalanceHistory,
  getCountries,
  getCurrencies,
  getStatusInfo,
  getAssetManagement,
  getPortfolioWidget,
}; 