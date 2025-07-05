import { apiService } from '../config/apiService';
import { Investment } from '../types/portfolio';
import { Fund } from '../types/fund';

// Type aliases for better clarity
export type InvestmentData = Investment;
export type FundData = Fund;

// Get all funds using ApiService methods
export const getFunds = async (): Promise<FundData[]> => {
  try {
    const response = await apiService.getFundData();
    return (response.data as FundData[]) || [];
  } catch (error) {
    console.error('Error fetching funds:', error);
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
    const response = await apiService.getFundDataDetail(fundId);
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

