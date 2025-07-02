import { Fund } from './fund';
import { Transaction } from './transaction';

export interface Investment {
  id: number;
  fund_id: number;
  user_id: number;
  amount: number;
  units: number;
  investment_type: 'stock' | 'bond';
  status: 'active' | 'inactive';
  created_at: string;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  fund: Fund;
}

export interface PortfolioOverview {
  total_investment: number;
  total_current_value: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  funds: Fund[];
  transactions: Transaction[];
  comparisons: Comparison[];
}

export interface PortfolioChart {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
}

export interface Comparison {
  id: number;
  name: string;
  total_investment: number;
  total_return: number;
  return_percentage: number;
  comparison_type: string;
  last_update: string;
} 