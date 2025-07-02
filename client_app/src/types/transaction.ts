export interface Transaction {
  id: number;
  user_id: number;
  fund_id: number;
  transaction_type: 'purchase' | 'sale';
  amount: number;
  units: number;
  status: 'pending' | 'completed' | 'cancelled';
  investment_type: 'stock' | 'bond';
  created_at: string;
  currency_id: number;
  fund: {
    id: number;
    name: string;
    ticker: string;
  };
  currency: {
    id: number;
    symbol: string;
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