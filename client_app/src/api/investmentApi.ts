import { apiService } from '../config/apiService';
import { ApiResponse } from '../types/api';

// Investment types
export interface Investment {
  id: number;
  fund_id: number;
  fund_name: string;
  fund_ticker: string;
  units: number;
  amount: number;
  current_nav: number;
  investment_type: string;
  current_value?: number;
  profit_loss?: number;
}

export interface CreateInvestmentData {
  fund_id: number;
  amount: number;
  units: number;
}

export interface SellInvestmentData {
  investment_id: number;
  quantity: number;
  estimated_value?: number;
  debug?: boolean;
}

// Get all investments - dùng middleware endpoint
export const getInvestments = async (): Promise<Investment[]> => {
  try {
    const response = await apiService.getInvestments();
    return (response.data as Investment[]) || [];
  } catch (error) {
    console.error('Error fetching investments:', error);
    throw error;
  }
};

// Create new investment - dùng middleware transaction/buy endpoint
export const createInvestment = async (data: CreateInvestmentData): Promise<ApiResponse> => {
  try {
    const response = await apiService.buyFund({
      fundId: data.fund_id,
      amount: data.amount,
      units: data.units
    });
    return response;
  } catch (error) {
    console.error('Error creating investment:', error);
    throw error;
  }
};

// Sell investment - dùng middleware transaction/sell endpoint
export const sellInvestment = async (data: SellInvestmentData): Promise<ApiResponse> => {
  try {
    if (typeof data.estimated_value !== 'number') {
      throw new Error('estimated_value is required for selling investment');
    }

    const response = await apiService.sellFund({
      investmentId: data.investment_id,
      quantity: data.quantity,
      estimatedValue: data.estimated_value,
      debug: data.debug,
    });
    return response;
  } catch (error) {
    console.error('Error selling investment:', error);
    throw error;
  }
};

// Get investments by fund ID
export const getInvestmentsByFund = async (fundId: number): Promise<Investment[]> => {
  try {
    const response = await apiService.getInvestmentsByFund(fundId);
    return (response.data as Investment[]) || [];
  } catch (error) {
    console.error('Error fetching investments by fund:', error);
    throw error;
  }
};

// Investment API object for easier importing
export const investmentApi = {
  getInvestments,
  createInvestment,
  sellInvestment,
  getInvestmentsByFund,
};


