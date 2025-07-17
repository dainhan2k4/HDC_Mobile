import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';
import { PortfolioOverview } from '../types/portfolio';
import { Fund, Investment } from '../types/fund';
import { profile } from '../types/profile';

export interface MiddlewareApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
  message?: string;
}

export interface PortfolioOverviewResponse {
  overview: {
    totalInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    investmentCount: number;
  };
  funds: Array<{
    fund: Fund;
    investments: Investment[];
    totalAmount: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    profitLossPercentage: number;
  }>;
  allocation: Array<{
    fund_ticker: string;
    fund_name: string;
    investment_type: string;
    value: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

export interface PerformanceData {
  overall: {
    totalInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    investmentCount: number;
  };
  byType: Array<{
    type: string;
    count: number;
    investment: number;
    currentValue: number;   
    profitLoss: number;
    profitLossPercentage: number;
  }>;
  topPerformers: Investment[];
  recentActivity: Array<{
    type: string;
    fund_name: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

class MiddlewareApiService {
  private static instance: MiddlewareApiService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('🔥 [MiddlewareAPI] Request failed:', error);
        
        // Transform error to consistent format
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Unknown error occurred';
                           
        throw new Error(errorMessage);
      }
    );
  }

  static getInstance(): MiddlewareApiService {
    if (!MiddlewareApiService.instance) {
      MiddlewareApiService.instance = new MiddlewareApiService();
    }
    return MiddlewareApiService.instance;
  }

  /**
   * Generic method để call middleware API
   */
  private async call<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
    try {
      console.log(`📡 [MiddlewareAPI] ${method} ${endpoint}`);
      
      const response = await this.client.request({
        url: endpoint,
        method,
        data
      });

      const responseData: MiddlewareApiResponse<T> = response.data;
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'API call failed');
      }

      console.log(`✅ [MiddlewareAPI] ${method} ${endpoint} - Success`);
      return responseData.data;
    } catch (error: any) {
      console.error(`❌ [MiddlewareAPI] ${method} ${endpoint} - Error:`, error.message);
      throw error;
    }
  }

  /**
   * Get portfolio overview với tất cả metrics đã tính sẵn
   */
  async getPortfolioOverview(): Promise<PortfolioOverviewResponse> {
    return this.call<PortfolioOverviewResponse>(API_ENDPOINTS.PORTFOLIO.OVERVIEW);
  }

  /**
   * Get all user investments
   */
  async getInvestments(): Promise<Investment[]> {
    return this.call<Investment[]>(API_ENDPOINTS.PORTFOLIO.INVESTMENTS);
  }

  /**
   * Get all available funds
   */
  async getFunds(): Promise<Fund[]> {
    return this.call<Fund[]>(API_ENDPOINTS.PORTFOLIO.FUNDS);
  }

  /**
   * Get performance metrics with detailed analytics
   */
  async getPerformance(): Promise<PerformanceData> {
    return this.call<PerformanceData>(API_ENDPOINTS.PORTFOLIO.PERFORMANCE);
  }

  /**
   * Refresh data cache on middleware server
   */
  async refreshData(): Promise<{ investments: number; funds: number; refreshedAt: string }> {
    return this.call(API_ENDPOINTS.PORTFOLIO.REFRESH, 'POST');
  }

  /**
   * Health check middleware server
   */
  async healthCheck(): Promise<{ 
    message: string; 
    timestamp: string; 
    uptime: number; 
    environment: string; 
    version: string; 
  }> {
    return this.call(API_ENDPOINTS.HEALTH);
  }

  /**
   * Transform data từ middleware format về legacy format để compatible với existing UI
   */
  transformToLegacyPortfolio(middlewareData: any): PortfolioOverview {
    console.log('🔄 [MiddlewareAPI] Transforming middleware data:', middlewareData);
    
    // Handle both nested and flat format
    const overview = middlewareData.overview || middlewareData;
    const funds = middlewareData.funds || [];
    
    
    const result = {
      total_investment: overview.totalInvestment || overview.total_investment,
      total_current_value: overview.totalCurrentValue || overview.total_current_value,
      total_profit_loss: overview.totalProfitLoss || overview.total_profit_loss,
      total_profit_loss_percentage: overview.totalProfitLossPercentage || overview.total_profit_loss_percentage,
      funds: Array.isArray(funds) ? funds.map((fund: any) => ({
        id: fund.id || 0,
        name: fund.name || 'Unknown Fund',
        ticker: fund.ticker || 'UNK',
        current_nav: fund.current_nav || 0,
        investment_type: fund.investment_type || 'equity',
        description: fund.description || '',
        current_ytd: fund.current_ytd || 0,
        total_amount: 0, // Middleware doesn't provide this per fund
        total_current_value: 0, // Middleware doesn't provide this per fund
        profit_loss: 0, // Middleware doesn't provide this per fund
        profit_loss_percentage: 0, // Middleware doesn't provide this per fund
        // Default values for fields not provided by middleware
        is_shariah: false,
        status: 'active' as const,
        launch_price: fund.current_nav,
        currency_id: 1,
        total_units: 0,
        total_investment: 0, // Not provided by middleware per fund
        current_value: 0, // Not provided by middleware per fund  
        flex_sip_percentage: 0,
        color: '#2B4BFF',
        previous_nav: fund.current_nav,
        flex_units: 0,
        sip_units: 0,
        last_update: new Date().toISOString(),
        investment_count: 0, // Not provided by middleware per fund
      } as Fund)) : [],
      transactions: [], // Có thể extend sau
      comparisons: [], // Có thể extend sau
    };
    
    return result;
  }

  /**
   * Get portfolio data theo legacy format để tương thích với existing UI
   */
  async getLegacyPortfolioData(): Promise<{
    portfolio: PortfolioOverview;
    investments: Investment[];
  }> {
    try {
      console.log('🔄 [MiddlewareAPI] Loading portfolio data via middleware...');
      
      // Get data from middleware
      const [portfolioData, investments] = await Promise.all([
        this.getPortfolioOverview(),
        this.getInvestments()
      ]);

      // Transform to legacy format
      const portfolio = this.transformToLegacyPortfolio(portfolioData);

      console.log('✅ [MiddlewareAPI] Portfolio data loaded successfully');
      return { portfolio, investments };
    } catch (error: any) {
      console.error('❌ [MiddlewareAPI] Failed to load portfolio data:', error);
      throw error;
    }
  }

  // Get profile data
  async getProfile(): Promise<profile> {
    console.log('🔄 [MiddlewareAPI] Getting profile data via middleware...');
    try {
      const response = await this.call<profile>(API_ENDPOINTS.PROFILE.PERSONAL_DATA);
      console.log('✅ [MiddlewareAPI] Profile data loaded successfully');
      return response;
    } catch (error: any) {
      console.error('❌ [MiddlewareAPI] Failed to load profile data:', error);
      throw error;
    }
  }

  // Get asset management data
  async getAssetManagement(): Promise<any> {
    return this.call<any>(API_ENDPOINTS.ASSET.MANAGEMENT);
  }
}

// Singleton export
export const middlewareApiService = MiddlewareApiService.getInstance(); 