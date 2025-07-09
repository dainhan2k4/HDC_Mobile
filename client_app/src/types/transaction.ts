export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'processing';
export type TransactionType = 'purchase' | 'sale' | 'exchange';

export interface Transaction {
  id: number;
  name: string;
  account_number: string;
  fund_name: string;
  fund_id: number;
  order_date: string;
  order_code: string;
  amount: number;
  session_date: string;
  status: string;
  status_detail: string;
  transaction_type: string;
  units: number;
  currency: string;
  raw_status: string;
  raw_transaction_type: string;
  // Optional fields for backward compatibility
  user_id?: number;
  investment_type?: 'stock' | 'bond';
  created_at?: string;
  transaction_date?: string;
  reference?: string;
  currency_id?: number;
  fund?: {
    id: number;
    name: string;
    ticker: string;
  };
}

export interface PendingTransaction {
  id: number;
  user_id: number;
  fund_id: number;
  transaction_type: 'purchase' | 'sale';
  amount: number;
  units: number;
  status: 'pending';
  created_at: string;
  fund: {
    id: number;
    name: string;
    ticker: string;
  };
}

export interface PeriodicInvestment {
  id: number;
  user_id: number;
  fund_id: number;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'inactive';
  next_execution: string;
  fund: {
    id: number;
    name: string;
    ticker: string;
  };
} 