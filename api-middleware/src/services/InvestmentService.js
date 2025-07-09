const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class InvestmentService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Get user investments with caching
   */
  async getInvestments() {
    const cacheKey = 'investments_data';
    let cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📦 [InvestmentService] Returning cached investments data');
      return cached;
    }

    try {
      console.log('🔗 [InvestmentService] Calling /data_investment endpoint (requires auth)...');
      const data = await this.apiCall('/data_investment', { requireAuth: true });
      console.log('📊 [InvestmentService] Raw investments response:', data);
      
      // Transform data to consistent format
      const investments = Array.isArray(data) ? data.map(inv => ({
        id: inv.id,
        fund_id: inv.fund_id,
        fund_name: inv.fund_name,
        fund_ticker: inv.fund_ticker,
        units: parseFloat(inv.units) || 0,
        amount: parseFloat(inv.amount) || 0,
        current_nav: parseFloat(inv.current_nav) || 0,
        investment_type: inv.investment_type || 'equity',
        current_value: (parseFloat(inv.units) || 0) * (parseFloat(inv.current_nav) || 0),
        profit_loss: ((parseFloat(inv.units) || 0) * (parseFloat(inv.current_nav) || 0)) - (parseFloat(inv.amount) || 0)
      })) : [];

      this.setCachedData(cacheKey, investments);
      console.log(`✅ [InvestmentService] Investments data cached: ${investments.length} items`);
      return investments;
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investments:', error.message);
      console.error('❌ [InvestmentService] Error details:', error);
      return [];
    }
  }

  /**
   * Get investment portfolio summary
   */
  async getPortfolioSummary() {
    try {
      console.log('📊 [InvestmentService] Getting portfolio summary...');
      
      const investments = await this.getInvestments();
      
      if (investments.length === 0) {
        return {
          total_value: 0,
          total_investment: 0,
          total_profit_loss: 0,
          profit_loss_percentage: 0,
          fund_count: 0,
          investments: []
        };
      }

      const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
      const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const profitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

      return {
        total_value: totalValue,
        total_investment: totalInvestment,
        total_profit_loss: totalProfitLoss,
        profit_loss_percentage: profitLossPercentage,
        fund_count: investments.length,
        investments: investments,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get portfolio summary:', error.message);
      throw error;
    }
  }

  /**
   * Get investment by fund ID
   */
  async getInvestmentByFundId(fundId) {
    try {
      console.log(`🔍 [InvestmentService] Getting investment for fund ID: ${fundId}`);
      
      const investments = await this.getInvestments();
      const investment = investments.find(inv => inv.fund_id === fundId);
      
      if (!investment) {
        return null;
      }

      return investment;
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investment by fund ID:', error.message);
      throw error;
    }
  }

  /**
   * Get investment allocations (percentage breakdown)
   */
  async getInvestmentAllocations() {
    try {
      console.log('📊 [InvestmentService] Getting investment allocations...');
      
      const investments = await this.getInvestments();
      const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
      
      if (totalValue === 0) {
        return [];
      }

      return investments.map(inv => ({
        fund_id: inv.fund_id,
        fund_name: inv.fund_name,
        fund_ticker: inv.fund_ticker,
        value: inv.current_value,
        percentage: (inv.current_value / totalValue) * 100,
        investment_type: inv.investment_type
      }));
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investment allocations:', error.message);
      return [];
    }
  }

  /**
   * Get investment performance over time
   */
  async getInvestmentPerformance(period = 'month') {
    try {
      console.log(`📈 [InvestmentService] Getting investment performance for period: ${period}`);
      
      await this.authService.getValidSession();
      
      // Build date range based on period
      const endDate = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      }

      // Get historical data from portfolio transactions
      const domain = [
        ['investment_type', '=', 'fund_certificate'],
        ['status', '=', 'completed'],
        ['transaction_date', '>=', startDate.toISOString().split('T')[0]],
        ['transaction_date', '<=', endDate.toISOString().split('T')[0]]
      ];

      const transactions = await this.searchRecords(
        "portfolio.transaction",
        domain,
        ['transaction_date', 'amount', 'transaction_type'],
        { order: 'transaction_date asc', limit: 1000 }
      );

      // Calculate daily performance
      const performanceData = this.calculatePerformanceFromTransactions(transactions, startDate, endDate);
      
      return {
        period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        data: performanceData
      };
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investment performance:', error.message);
      return {
        period,
        start_date: null,
        end_date: null,
        data: []
      };
    }
  }

  /**
   * Calculate performance from transaction data
   */
  calculatePerformanceFromTransactions(transactions, startDate, endDate) {
    const dailyData = {};
    let runningValue = 0;

    // Group transactions by date
    transactions.forEach(transaction => {
      const date = transaction.transaction_date;
      if (!dailyData[date]) {
        dailyData[date] = { purchases: 0, sales: 0, netFlow: 0 };
      }

      const amount = parseFloat(transaction.amount) || 0;
      if (transaction.transaction_type === 'purchase') {
        dailyData[date].purchases += amount;
        dailyData[date].netFlow += amount;
      } else if (transaction.transaction_type === 'sale') {
        dailyData[date].sales += amount;
        dailyData[date].netFlow -= amount;
      }
    });

    // Generate daily performance array
    const performanceArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData[dateStr] || { purchases: 0, sales: 0, netFlow: 0 };
      
      runningValue += dayData.netFlow;
      
      performanceArray.push({
        date: dateStr,
        value: runningValue,
        purchases: dayData.purchases,
        sales: dayData.sales,
        net_flow: dayData.netFlow
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return performanceArray;
  }

  /**
   * Get investment statistics
   */
  async getInvestmentStats() {
    try {
      console.log('📊 [InvestmentService] Getting investment statistics...');
      
      const [investments, portfolioSummary] = await Promise.all([
        this.getInvestments(),
        this.getPortfolioSummary()
      ]);

      // Calculate additional statistics
      const stats = {
        ...portfolioSummary,
        best_performer: this.getBestPerformer(investments),
        worst_performer: this.getWorstPerformer(investments),
        average_return: this.getAverageReturn(investments),
        investment_types: this.getInvestmentTypeBreakdown(investments)
      };

      return stats;
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investment statistics:', error.message);
      throw error;
    }
  }

  /**
   * Get best performing investment
   */
  getBestPerformer(investments) {
    if (investments.length === 0) return null;
    
    return investments.reduce((best, current) => {
      const currentReturn = current.amount > 0 ? (current.profit_loss / current.amount) * 100 : 0;
      const bestReturn = best.amount > 0 ? (best.profit_loss / best.amount) * 100 : 0;
      return currentReturn > bestReturn ? current : best;
    });
  }

  /**
   * Get worst performing investment
   */
  getWorstPerformer(investments) {
    if (investments.length === 0) return null;
    
    return investments.reduce((worst, current) => {
      const currentReturn = current.amount > 0 ? (current.profit_loss / current.amount) * 100 : 0;
      const worstReturn = worst.amount > 0 ? (worst.profit_loss / worst.amount) * 100 : 0;
      return currentReturn < worstReturn ? current : worst;
    });
  }

  /**
   * Get average return across all investments
   */
  getAverageReturn(investments) {
    if (investments.length === 0) return 0;
    
    const returns = investments.map(inv => {
      return inv.amount > 0 ? (inv.profit_loss / inv.amount) * 100 : 0;
    });
    
    return returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  }

  /**
   * Get investment breakdown by type
   */
  getInvestmentTypeBreakdown(investments) {
    const breakdown = {};
    
    investments.forEach(inv => {
      const type = inv.investment_type || 'unknown';
      if (!breakdown[type]) {
        breakdown[type] = {
          count: 0,
          total_value: 0,
          total_investment: 0,
          funds: []
        };
      }
      
      breakdown[type].count += 1;
      breakdown[type].total_value += inv.current_value;
      breakdown[type].total_investment += inv.amount;
      breakdown[type].funds.push({
        fund_id: inv.fund_id,
        fund_name: inv.fund_name,
        value: inv.current_value
      });
    });
    
    return breakdown;
  }

  /**
   * Clear investment-related caches
   */
  clearInvestmentCache() {
    this.deleteCachedData('investments_data');
    this.deleteCachedData('portfolio_data');
    this.deleteCachedData('overview_data');
    console.log('🧹 [InvestmentService] Investment cache cleared');
  }

  /**
   * Get investment details with fund information
   */
  async getInvestmentDetails() {
    try {
      console.log('📋 [InvestmentService] Getting detailed investment information...');
      
      const investments = await this.getInvestments();
      
      // Enhance with additional calculations
      const detailedInvestments = investments.map(inv => ({
        ...inv,
        return_percentage: inv.amount > 0 ? (inv.profit_loss / inv.amount) * 100 : 0,
        return_color: inv.profit_loss >= 0 ? 'green' : 'red',
        formatted_profit_loss: this.formatCurrency(inv.profit_loss),
        formatted_current_value: this.formatCurrency(inv.current_value),
        formatted_amount: this.formatCurrency(inv.amount)
      }));

      return detailedInvestments;
    } catch (error) {
      console.error('❌ [InvestmentService] Failed to get investment details:', error.message);
      throw error;
    }
  }
}

module.exports = InvestmentService; 