import { apiService } from '../config/apiService';
import { Investment } from '../types/portfolio';
import { Fund } from '../types/fund';
import { ApiResponse } from '../types/api';

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

// Get fund data - map đến getFunds() từ middleware
export const getFundData = async (): Promise<FundData[]> => {
  try {
    // Dùng middleware endpoint /portfolio/funds
    const response = await apiService.get('/portfolio/funds');
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

// Get user's fund data - map đến getFunds() từ middleware
export const getUserFundData = async (): Promise<FundData[]> => {
  try {
    // Dùng middleware endpoint /portfolio/funds
    const response = await apiService.get('/portfolio/funds');
    return (response.data as FundData[]) || [];
  } catch (error) {
    console.error('Error fetching user fund data:', error);
    throw error;
  }
};

// Create new investment - map đến buyFund từ middleware
export const createInvestment = async (data: {
  fund_id: number;
  amount: number;
  units: number;
}) => {
  try {
    // Transform fund_id thành fundId và gọi buyFund
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

// Buy fund using ApiService methods
export const buyFund = async (data: {
  fund_id: number;
  amount: number;
  units: number;
  transaction_type?: 'purchase';
}) => {
  try {
    // Transform fund_id thành fundId (camelCase) cho apiService
    const response = await apiService.buyFund({
      fundId: data.fund_id,
      amount: data.amount,
      units: data.units
    });
    return response;
  } catch (error) {
    console.error('Error buying fund:', error);
    throw error;
  }
};

// Sell fund using ApiService methods
export const sellFund = async (data: {
  investment_id: number;
  quantity: number;
  estimated_value?: number;
  debug?: boolean;
}): Promise<ApiResponse> => {
  try {
    const response = await apiService.sellFund({
      investmentId: data.investment_id,
      quantity: data.quantity,
      estimatedValue: data.estimated_value,
      debug: data.debug,
    });
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

// Fund widget page - TODO: implement in apiService if needed
export const getFundWidget = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_widget');
    throw new Error('getFundWidget not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund widget:', error);
    throw error;
  }
};

// Fund compare page - TODO: implement in apiService if needed
export const getFundCompare = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_compare');
    throw new Error('getFundCompare not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund compare:', error);
    throw error;
  }
};

// Fund buy page - TODO: implement in apiService if needed
export const getFundBuyPage = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_buy');
    throw new Error('getFundBuyPage not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund buy page:', error);
    throw error;
  }
};

// Fund buy confirm page - TODO: implement in apiService if needed
export const getFundBuyConfirm = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_buy_confirm');
    throw new Error('getFundBuyConfirm not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund buy confirm:', error);
    throw error;
  }
};

// Fund buy result page - TODO: implement in apiService if needed
export const getFundBuyResult = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_buy_result');
    throw new Error('getFundBuyResult not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund buy result:', error);
    throw error;
  }
};

// Fund sell page - TODO: implement in apiService if needed
export const getFundSellPage = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_sell');
    throw new Error('getFundSellPage not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund sell page:', error);
    throw error;
  }
};

// Fund sell confirm page - TODO: implement in apiService if needed
export const getFundSellConfirm = async () => {
  try {
    // TODO: Add endpoint to apiService if needed
    // const response = await apiService.get('/fund_sell_confirm');
    throw new Error('getFundSellConfirm not yet implemented in middleware');
  } catch (error) {
    console.error('Error fetching fund sell confirm:', error);
    throw error;
  }
};

export const fundApi = {
  // Get all funds - dùng middleware endpoint
  getFunds: async (): Promise<Fund[]> => {
    const response = await apiService.get('/portfolio/funds');
    return (response.data as Fund[]) || [];
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

  // Buy fund transaction - dùng middleware endpoint
  buyFund: async (fundId: number, amount: number, units: number) => {
    try {
      const response = await apiService.buyFund({
        fundId,
        amount, 
        units
      });
      
      // Clear cache after successful transaction
      await fundApi.clearCache();
      
      return response.data;
    } catch (error: any) {
      console.error('Buy fund error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to buy fund');
    }
  },

  // Sell fund transaction - dùng middleware endpoint
  sellFund: async (options: {
    investment_id: number;
    quantity: number;
    estimated_value?: number;
    debug?: boolean;
  }): Promise<ApiResponse> => {
    return sellFund(options);
  },

  // Fund widget page
  getFundWidget,
  
  // Fund compare page
  getFundCompare,
  
  // Fund buy pages
  getFundBuyPage,
  getFundBuyConfirm,
  getFundBuyResult,
  
  // Fund sell pages
  getFundSellPage,
  getFundSellConfirm,
};

