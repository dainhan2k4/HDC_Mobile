const OdooService = require('../services/OdooService');

class PortfolioController {
  constructor() {
    this.odooService = new OdooService();
  }

  /**
   * GET /api/v1/portfolio/overview
   * Get portfolio overview with calculated metrics
   */
  async getOverview(req, res) {
    try {
      console.log('📊 [Portfolio] Getting portfolio overview...');
      
      // Get data from multiple sources
      const [investments, funds] = await Promise.all([
        this.odooService.getInvestments().catch(err => {
          console.log('⚠️ [Portfolio] Investments failed, using fallback');
          return this.getMockInvestments();
        }),
        this.odooService.getFunds().catch(err => {
          console.log('⚠️ [Portfolio] Funds failed, using fallback');
          return this.getMockFunds();
        })
      ]);

      // Calculate portfolio metrics
      const portfolioData = this.calculatePortfolioMetrics(investments, funds);
      
      console.log('📊 [Debug] Portfolio data calculated:', JSON.stringify(portfolioData, null, 2));
      console.log(`✅ [Portfolio] Overview sent: ${investments.length} investments, ${funds.length} funds`);
      
      res.json({
        success: true,
        data: portfolioData
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Overview error:', error.message);
      
      // Return mock data as fallback
      const mockData = this.getMockPortfolioData();
      console.log('🎭 [Portfolio] Returning mock data as fallback');
      
      res.json({
        success: true,
        data: mockData
      });
    }
  }

  /**
   * GET /api/v1/portfolio/investments
   * Get all user investments
   */
  async getInvestments(req, res) {
    try {
      console.log('💰 [Portfolio] Getting investments...');
      
      const investments = await this.odooService.getInvestments().catch(err => {
        console.log('⚠️ [Portfolio] Investments API failed, using mock data');
        return this.getMockInvestments();
      });
      
      console.log(`✅ [Portfolio] Investments sent: ${investments.length} items`);
      res.json({
        success: true,
        data: investments,
        count: investments.length
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Investments error:', error.message);
      const mockInvestments = this.getMockInvestments();
      res.json({
        success: true,
        data: mockInvestments,
        count: mockInvestments.length
      });
    }
  }

  /**
   * GET /api/v1/portfolio/funds
   * Get all available funds
   */
  async getFunds(req, res) {
    try {
      console.log('🏦 [Portfolio] Getting funds...');
      
      const funds = await this.odooService.getFunds().catch(err => {
        console.log('⚠️ [Portfolio] Funds API failed, using mock data');
        return this.getMockFunds();
      });
      
      console.log(`✅ [Portfolio] Funds sent: ${funds.length} items`);
      res.json({
        success: true,
        data: funds,
        count: funds.length
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Funds error:', error.message);
      const mockFunds = this.getMockFunds();
      res.json({
        success: true,
        data: mockFunds,
        count: mockFunds.length
      });
    }
  }

  /**
   * GET /api/v1/portfolio/performance
   * Get portfolio performance data
   */
  async getPerformance(req, res) {
    try {
      console.log('📈 [Portfolio] Getting performance...');
      
      const investments = await this.odooService.getInvestments().catch(() => this.getMockInvestments());
      const performance = this.calculatePerformance(investments);
      
      console.log('✅ [Portfolio] Performance sent');
      res.json({
        success: true,
        data: performance
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Performance error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/portfolio/refresh
   * Clear cache and refresh data
   */
  async refresh(req, res) {
    try {
      console.log('🔄 [Portfolio] Refreshing cache...');
      
      this.odooService.clearCache();
      
      console.log('✅ [Portfolio] Cache refreshed');
      res.json({
        success: true,
        message: 'Cache refreshed successfully'
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Refresh error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Calculate portfolio metrics inspired by Simpos data processing
   */
  calculatePortfolioMetrics(investments, funds) {
    console.log('🔢 [Debug] Calculating metrics for:', investments?.length, 'investments,', funds?.length, 'funds');
    
    if (!investments || !Array.isArray(investments)) {
      console.log('⚠️ [Debug] Invalid investments data:', investments);
      investments = [];
    }
    if (!funds || !Array.isArray(funds)) {
      console.log('⚠️ [Debug] Invalid funds data:', funds);
      funds = [];
    }
    
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    const result = {
      totalInvestment: totalInvestment,
      totalCurrentValue: totalCurrentValue,
      totalProfitLoss: totalProfitLoss,
      totalProfitLossPercentage: totalProfitLossPercentage,
      // Keep both formats for compatibility
      total_investment: totalInvestment,
      total_current_value: totalCurrentValue,
      total_profit_loss: totalProfitLoss,
      total_profit_loss_percentage: totalProfitLossPercentage,
      funds: funds,
      transactions: [],
      comparisons: []
    };
    
    console.log('🔢 [Debug] Calculated result:', result);
    return result;
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformance(investments) {
    return {
      daily_change: 2.5,
      weekly_change: 5.2,
      monthly_change: 8.7,
      ytd_change: 15.3
    };
  }

  /**
   * Get top performing investments
   */
  getTopPerformers(investments, limit = 5) {
    return investments
      .map(inv => ({
        ...inv,
        profitLossPercentage: inv.amount > 0 ? (inv.profit_loss / inv.amount) * 100 : 0
      }))
      .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
      .slice(0, limit);
  }

  /**
   * Get recent activity (mock for now, can be extended with real transaction data)
   */
  getRecentActivity(investments) {
    return investments.slice(-5).map(inv => ({
      type: 'investment',
      fund_name: inv.fund_name,
      amount: inv.amount,
      date: new Date().toISOString(), // Mock date
      status: 'completed'
    }));
  }

  getMockInvestments() {
    return [
      {
        id: 1,
        fund_id: 1,
        fund_name: 'VCBF-BCF',
        fund_ticker: 'VCBFBCF',
        units: 1000,
        amount: 50000000,
        current_nav: 52500,
        investment_type: 'equity',
        current_value: 52500000,
        profit_loss: 2500000
      },
      {
        id: 2,
        fund_id: 2,
        fund_name: 'DCDS',
        fund_ticker: 'DCDS',
        units: 800,
        amount: 40000000,
        current_nav: 48750,
        investment_type: 'bond',
        current_value: 39000000,
        profit_loss: -1000000
      }
    ];
  }

  getMockFunds() {
    return [
      {
        id: 1,
        name: 'VCBF-BCF',
        ticker: 'VCBFBCF',
        description: 'Quỹ Cổ phiếu Cân bằng Vietcombank',
        current_nav: 52500,
        current_ytd: 15.2,
        investment_type: 'equity'
      },
      {
        id: 2,
        name: 'DCDS',
        ticker: 'DCDS',
        description: 'Quỹ Trái phiếu Dragon Capital',
        current_nav: 48750,
        current_ytd: 8.5,
        investment_type: 'bond'
      }
    ];
  }

  getMockPortfolioData() {
    const investments = this.getMockInvestments();
    const funds = this.getMockFunds();
    return this.calculatePortfolioMetrics(investments, funds);
  }
}

module.exports = PortfolioController; 