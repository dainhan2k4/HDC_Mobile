export interface Fund {
  id: number;
  ticker: string;
  name: string;
  description: string;
  current_ytd: number;
  current_nav: number;
  investment_type: 'equity' | 'fixed_income' | 'balanced' | 'money_market' | 'real_estate' | 'commodity' | 'crypto' | 'multi_asset' | 'alternative';
  is_shariah: boolean;
  status: 'active' | 'inactive' | 'closed';
  launch_price: number;
  currency_id: number;
  total_units: number;
  total_investment: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  flex_sip_percentage: number;
  color: string;
  previous_nav: number;
  flex_units: number;
  sip_units: number;
  last_update: string;
  investment_count: number;
}

export interface FundBuyRequest {
  fund_id: number;
  amount: number;
  investment_type: 'stock' | 'bond';
}

export interface FundSellRequest {
  fund_id: number;
  units: number;
}

export interface FundComparison {
  funds: Fund[];
  comparison_type: string;
  total_investment: number;
  total_return: number;
  return_percentage: number;
} 

export interface Investment {
    id: number;
    fund_id: number;
    fund_name: string;
    fund_ticker: string;
    units: number;
    amount: number;
    current_nav: number;
    investment_type: string;
}

export interface FundContractProps {
  fund: Fund;
  contract: string;
}

