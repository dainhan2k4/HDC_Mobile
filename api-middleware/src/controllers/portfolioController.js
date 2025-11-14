const OdooService = require('../services/OdooService');

class PortfolioController {
  constructor() {
    this.odooService = new OdooService();
  }

  /**
   * GET /api/v1/portfolio/overview
   * Lấy trực tiếp từ Odoo controller /investment_dashboard (ưu tiên khớp 100%)
   * Fallback: tính toán từ investments + funds nếu controller lỗi
   */
  async getOverview(req, res) {
    try {
      console.log('📊 [Portfolio] Getting portfolio overview...');

      // Ưu tiên gọi controller mới từ Odoo
      try {
        const dashboard = await Promise.race([
          this.odooService.getInvestmentDashboard(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);

        // Đảm bảo giữ ổn định schema cho client (camelCase + snake_case)
        const data = {
          totalInvestment: dashboard.totalInvestment ?? dashboard.total_investment ?? 0,
          totalCurrentValue: dashboard.totalCurrentValue ?? dashboard.total_current_value ?? 0,
          totalProfitLoss: dashboard.totalProfitLoss ?? dashboard.total_profit_loss ?? 0,
          totalProfitLossPercentage: dashboard.totalProfitLossPercentage ?? dashboard.total_profit_loss_percentage ?? 0,
          total_investment: dashboard.total_investment ?? dashboard.totalInvestment ?? 0,
          total_current_value: dashboard.total_current_value ?? dashboard.totalCurrentValue ?? 0,
          total_profit_loss: dashboard.total_profit_loss ?? dashboard.totalProfitLoss ?? 0,
          total_profit_loss_percentage: dashboard.total_profit_loss_percentage ?? dashboard.totalProfitLossPercentage ?? 0,
          funds: dashboard.funds || [],
          allocation: dashboard.allocation || [],
          lastUpdated: dashboard.lastUpdated || new Date().toISOString()
        };

        return res.json({ success: true, data });
      } catch (controllerError) {
        console.warn('⚠️ [Portfolio] /investment_dashboard failed, fallback to calculated:', controllerError.message);
      }

      // Fallback: Lấy dữ liệu thật từ Odoo với timeout handling và tự tính
      let investments = [];
      let funds = [];

      try {
        investments = await Promise.race([
          this.odooService.getInvestments(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout'))), 10000)
        ]);
      } catch (e) { investments = []; }

      try {
        funds = await Promise.race([
          this.odooService.getFunds(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout'))), 10000)
        ]);
      } catch (e) { funds = []; }

      const portfolioData = this.calculatePortfolioMetrics(investments, funds);
      res.json({ success: true, data: portfolioData });
      
    } catch (error) {
      console.error('❌ [Portfolio] Overview error:', error.message);
      
      // Return mock data as fallback
      const mockInvestments = [];
      const mockFunds = [];
      const mockData = this.calculatePortfolioMetrics(mockInvestments, mockFunds);
      console.log('[Portfolio] Returning mock data as fallback');
      
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
      
      // Lấy dữ liệu thật từ Odoo
      const investments = await this.odooService.getInvestments();
      console.log('✅ [Portfolio] Got real investments from Odoo:', investments.length);
      
      console.log(`✅ [Portfolio] Investments sent: ${investments.length} items`);
      res.json({
        success: true,
        data: investments,
        count: investments.length
      });
      
    } catch (error) {
      console.error('❌ [Portfolio] Investments error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async submitFundSell(req, res) {
    try {
      const { investmentId, quantity, estimatedValue, debug } = req.body || {};

      const parsedInvestmentId = parseInt(investmentId, 10);
      const parsedQuantity = parseFloat(quantity);
      const parsedEstimatedValue = estimatedValue !== undefined && estimatedValue !== null
        ? parseFloat(estimatedValue)
        : undefined;
      const debugMode = typeof debug === 'string'
        ? ['true', '1', 'yes'].includes(debug.toLowerCase())
        : Boolean(debug);

      if (Number.isNaN(parsedInvestmentId) || parsedInvestmentId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid investmentId'
        });
      }

      if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity'
        });
      }

      const result = await this.odooService.submitFundSell({
        investmentId: parsedInvestmentId,
        quantity: parsedQuantity,
        estimatedValue: parsedEstimatedValue,
        debug: debugMode,
      });

      return res.json({
        success: result?.success !== false,
        data: result,
        message: result?.message || 'Submit fund sell successfully'
      });
    } catch (error) {
      console.error('❌ [Portfolio] submitFundSell error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể gửi yêu cầu bán quỹ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/funds
   * Get all available funds
   * Merge với dashboard data để có đầy đủ open_price, high_price, low_price
   */
  async getFunds(req, res) {
    try {
      console.log('📊 [Portfolio] Getting funds...');
      
      // Lấy dữ liệu thật từ Odoo
      const funds = await this.odooService.getFunds();
      console.log(`✅ [Portfolio] Got ${funds.length} funds from /data_fund`);
      
      // Lấy thêm data từ dashboard để merge open_price, high_price, low_price
      try {
        const dashboard = await this.odooService.getInvestmentDashboard();
        const dashboardFunds = dashboard.funds || [];
        
        // Merge dashboard data vào funds
        const enrichedFunds = funds.map(fund => {
          const dashboardFund = dashboardFunds.find(df => 
            df.id === fund.id || 
            df.ticker === fund.ticker ||
            (df.name && fund.name && df.name.includes(fund.name.split(' ')[0]))
          );
          
          if (dashboardFund) {
            return {
              ...fund,
              open_price: dashboardFund.open_price || fund.open_price || 0,
              high_price: dashboardFund.high_price || fund.high_price || 0,
              low_price: dashboardFund.low_price || fund.low_price || 0,
            };
          }
          
          return fund;
        });
        
        console.log(`✅ [Portfolio] Enriched ${enrichedFunds.length} funds with dashboard data`);
        
        res.json({
          success: true,
          data: enrichedFunds,
          count: enrichedFunds.length
        });
      } catch (dashboardError) {
        console.warn('⚠️ [Portfolio] Failed to enrich funds with dashboard data:', dashboardError.message);
        // Fallback: trả về funds không có enrichment
        res.json({
          success: true,
          data: funds,
          count: funds.length
        });
      }
      
    } catch (error) {
      console.error('❌ [Portfolio] Funds error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/funds/:id/chart?timeRange=1M
   * Get chart data for a specific fund
   */
  async getFundChart(req, res) {
    try {
      const fundId = parseInt(req.params.id, 10);
      const timeRange = req.query.timeRange || '1M';
      
      if (isNaN(fundId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid fund ID'
        });
      }

      const chartData = await this.odooService.getFundChartData(fundId, timeRange);
      
      return res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('❌ [Portfolio] Fund chart error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu biểu đồ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/funds/:id/ohlc?timeRange=1D
   * Get OHLC (candlestick) data for a specific fund
   */
  async getFundOHLC(req, res) {
    try {
      const fundId = parseInt(req.params.id, 10);
      const timeRange = req.query.timeRange || '1D';
      
      if (isNaN(fundId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid fund ID'
        });
      }

      // Lấy ticker từ fund ID
      const funds = await this.odooService.getFunds();
      const fund = funds.find(f => f.id === fundId);
      
      if (!fund || !fund.ticker) {
        return res.status(404).json({
          success: false,
          message: 'Fund not found or missing ticker'
        });
      }

      const ohlcData = await this.odooService.getFundOHLC(fund.ticker, timeRange);
      
      return res.json({
        success: true,
        data: ohlcData
      });
    } catch (error) {
      console.error('❌ [Portfolio] Fund OHLC error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu OHLC',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/term-rates
   * Get term rates (kỳ hạn và lãi suất) for fund investment
   */
  async getTermRates(req, res) {
    try {
      console.log('📊 [Portfolio] Getting term rates...');
      
      const termRates = await this.odooService.getTermRates();
      
      return res.json({
        success: true,
        data: termRates,
        count: termRates.length
      });
    } catch (error) {
      console.error('❌ [Portfolio] Term rates error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách kỳ hạn và lãi suất',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/funds/compare?ids=1,2,3
   * So sánh nhiều CCQ theo danh sách ID
   */
  async getFundComparison(req, res) {
    try {
      const idsParam = (req.query.ids || '').toString().trim();
      if (!idsParam) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tham số ids (danh sách ID, phân tách bằng dấu phẩy)'
        });
      }

      const fundIds = idsParam
        .split(',')
        .map(s => parseInt(s, 10))
        .filter(n => !Number.isNaN(n));

      if (!fundIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách ids không hợp lệ'
        });
      }

      const data = await this.odooService.getFundComparison(fundIds);
      return res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      console.error('❌ [Portfolio] Fund comparison error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu so sánh quỹ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/portfolio/performance
   * Get portfolio performance data
   */
  async getPerformance(req, res) {
    try {
      
      const investments = await this.odooService.getInvestments();
      const performance = this.calculatePerformance(investments);
      
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
      
      this.odooService.clearCache();
      
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


}

module.exports = PortfolioController; 