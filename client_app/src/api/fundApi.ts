import { apiService } from '../config/apiService';
import { Investment } from '../types/portfolio';
import { Fund } from '../types/fund';

// Type aliases for better clarity
export type InvestmentData = Investment;
export type FundData = Fund;

// Get all funds using ApiService methods
export const getFunds = async (): Promise<FundData[]> => {
  try {
    const response = await apiService.getFunds();
    return (response.data as FundData[]) || [];
  } catch (error) {
    console.error('Error fetching funds:', error);
    throw error;
  }
};

// Get fund data using new endpoint /data_fund
export const getFundData = async (): Promise<FundData[]> => {
  try {
    const response = await apiService.getFundData();
    return (response.data as FundData[]) || [];
  } catch (error) {
    console.error('Error fetching fund data:', error);
    throw error;
  }
};

// Get investment data using ApiService methods
export const getInvestments = async (): Promise<InvestmentData[]> => {
  try {
    const response = await apiService.getInvestments();
    return (response.data as InvestmentData[]) || [];
  } catch (error) {
    console.error('Error fetching investments:', error);
    throw error;
  }
};

// Get specific fund details using ApiService methods
export const getFundDetail = async (fundId: number): Promise<FundData> => {
  try {
    const response = await apiService.getFundDetail(fundId);
    if (!response.data) {
      throw new Error('Fund not found');
    }
    return response.data as FundData;
  } catch (error) {
    console.error('Error fetching fund detail:', error);
    throw error;
  }
};

// Get investment by fund ID using ApiService methods
export const getInvestmentByFund = async (fundId: number): Promise<InvestmentData[]> => {
  try {
    const response = await apiService.getInvestmentsByFund(fundId);
    return (response.data as InvestmentData[]) || [];
  } catch (error) {
    console.error('Error fetching investment by fund:', error);
    throw error;
  }
};

// Get user's fund data using ApiService methods
export const getUserFundData = async (): Promise<FundData[]> => {
  try {
    const response = await apiService.getUserFundData();
    return (response.data as FundData[]) || [];
  } catch (error) {
    console.error('Error fetching user fund data:', error);
    throw error;
  }
};

// Create new investment using /create_investment endpoint
export const createInvestment = async (data: {
  fund_id: number;
  amount: number;
  units: number;
}) => {
  try {
    const response = await apiService.createInvestment(data);
    return response;
  } catch (error) {
    console.error('Error creating investment:', error);
    throw error;
  }
};

// Buy fund using ApiService methods
export const buyFund = async (data: {
  fund_id: number;
  amount: number;
  units: number;
  transaction_type: 'purchase';
}) => {
  try {
    const response = await apiService.buyFund(data);
    return response;
  } catch (error) {
    console.error('Error buying fund:', error);
    throw error;
  }
};

// Sell fund using /submit_fund_sell endpoint
export const sellFund = async (data: {
  fund_id: number;
  units: number;
  transaction_type: 'sale';
}) => {
  try {
    const response = await apiService.sellFund(data);
    return response;
  } catch (error) {
    console.error('Error selling fund:', error);
    throw error;
  }
};

// Get portfolio overview using /investment_dashboard endpoint
export const getPortfolioOverview = async () => {
  try {
    const response = await apiService.getPortfolioOverview();
    return response;
  } catch (error) {
    console.error('Error fetching portfolio overview:', error);
    throw error;
  }
};

export const fundApi = {
  // Get all funds
  getFunds: async (): Promise<Fund[]> => {
    const response = await apiService.get('/portfolio/funds');
    return response.data as Fund[];
  },

  // Get fund details by ID
  getFundById: async (id: number): Promise<Fund> => {
    const funds = await fundApi.getFunds();
    const fund = funds.find(f => f.id === id);
    if (!fund) {
      throw new Error('Fund not found');
    }
    return fund;
  },

  // Clear cache to force fresh data
  clearCache: async () => {
    try {
      await apiService.post('/portfolio/clear-cache', {});
      console.log('✅ [FundApi] Cache cleared successfully');
      return true;
    } catch (error: any) {
      console.error('❌ [FundApi] Failed to clear cache:', error);
      return false;
    }
  },

  // Buy fund transaction
  buyFund: async (fundId: number, amount: number, units: number) => {
    try {
      const response = await apiService.post('/transaction/buy', {
        fundId,
        amount, 
        units
      });
      
      // Clear cache after successful transaction
      await fundApi.clearCache();
      
      return response.data;
    } catch (error: any) {
      console.error('Buy fund error:', error);
      throw new Error(error.response?.data?.message || 'Failed to buy fund');
    }
  },

  // Sell fund transaction
  sellFund: async (fundId: number, units: number) => {
    try {
      const response = await apiService.post('/transaction/sell', {
        fundId,
        units
      });
      
      // Clear cache after successful transaction
      await fundApi.clearCache();
      
      return response.data;
    } catch (error: any) {
      console.error('Sell fund error:', error);
      throw new Error(error.response?.data?.message || 'Failed to sell fund');
    }
  }
};

