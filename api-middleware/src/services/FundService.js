const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class FundService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Get funds data with caching
   */
  async getFunds() {
    const cacheKey = 'funds_data';
    let cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📦 [FundService] Returning cached funds data');
      return cached;
    }

    try {
      console.log('🔗 [FundService] Calling /data_fund endpoint...');
      const data = await this.apiCall('/data_fund');
      console.log('📊 [FundService] Raw funds response:', data);
      
      // Transform data to consistent format
      const funds = Array.isArray(data) ? data.map(fund => ({
        id: fund.id,
        name: fund.name,
        ticker: fund.ticker,
        description: fund.description,
        current_nav: parseFloat(fund.current_nav) || 0,
        current_ytd: parseFloat(fund.current_ytd) || 0,
        investment_type: fund.investment_type || 'equity'
      })) : [];

      this.setCachedData(cacheKey, funds);
      console.log(`✅ [FundService] Funds data cached: ${funds.length} items`);
      return funds;
    } catch (error) {
      console.error('❌ [FundService] Failed to get funds:', error.message);
      return [];
    }
  }

  /**
   * Get fund details by ID
   */
  async getFundById(fundId) {
    try {
      console.log(`🔍 [FundService] Getting fund details for ID: ${fundId}`);
      
      const funds = await this.getFunds();
      const fund = funds.find(f => f.id === fundId);
      
      if (!fund) {
        throw new Error(`Fund with ID ${fundId} not found`);
      }

      return fund;
    } catch (error) {
      console.error('❌ [FundService] Failed to get fund by ID:', error.message);
      throw error;
    }
  }

  /**
   * Buy fund transaction
   */
  async buyFund(fundId, amount, units) {
    try {
      console.log(`🔄 [FundService] Creating buy transaction for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session and get user ID
      const session = await this.authService.getValidSession();
      const userId = session.uid || 2;

      const transactionId = await this.callModelMethod(
        "portfolio.transaction",
        "create_transaction",
        [userId, fundId, 'purchase', units, amount]
      );

      console.log('✅ [FundService] Buy transaction created:', transactionId);
      
      // Clear portfolio-related cache to force refresh
      this.clearPortfolioCache();
      
      return transactionId;
    } catch (error) {
      console.error('❌ [FundService] Failed to create buy transaction:', error.message);
      throw error;
    }
  }

  /**
   * Sell fund transaction
   */
  async sellFund(fundId, units) {
    try {
      console.log(`🔄 [FundService] Creating sell transaction for fund ${fundId}:`, { units });
      
      // Ensure valid session and get user ID
      const session = await this.authService.getValidSession();
      const userId = session.uid || 2;

      // Calculate amount based on current NAV
      const fund = await this.getFundById(fundId);
      const amount = units * fund.current_nav;

      const transactionId = await this.callModelMethod(
        "portfolio.transaction",
        "create_transaction",
        [userId, fundId, 'sale', units, amount]
      );

      console.log('✅ [FundService] Sell transaction created:', transactionId);
      
      // Clear portfolio-related cache to force refresh
      this.clearPortfolioCache();
      
      return transactionId;
    } catch (error) {
      console.error('❌ [FundService] Failed to create sell transaction:', error.message);
      throw error;
    }
  }

  /**
   * Buy fund using direct create method
   */
  async buyFundDirect(fundId, amount, units) {
    try {
      console.log(`🔄 [FundService] Creating buy transaction using direct create for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session and get user ID
      const session = await this.authService.getValidSession();
      const userId = session.uid || 2;

      const transactionData = {
        user_id: userId,
        fund_id: fundId,
        transaction_type: 'purchase',
        units: units,
        amount: amount,
        status: 'pending',
        investment_type: 'fund_certificate',
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const transactionId = await this.createRecord("portfolio.transaction", transactionData);
      console.log('✅ [FundService] Direct buy transaction created:', transactionId);

      // Complete the transaction to update investment portfolio
      console.log(`🔄 [FundService] Completing transaction ${transactionId} to update portfolio...`);
      
      await this.callModelMethod(
        "portfolio.transaction",
        "action_complete",
        [transactionId]
      );

      console.log('✅ [FundService] Transaction completed');
      
      // Clear portfolio-related cache to force refresh
      this.clearPortfolioCache();
      
      return transactionId;
    } catch (error) {
      console.error('❌ [FundService] Failed to create direct buy transaction:', error.message);
      throw error;
    }
  }

  /**
   * Sell fund using direct create method
   */
  async sellFundDirect(fundId, units) {
    try {
      console.log(`🔄 [FundService] Creating sell transaction using direct create for fund ${fundId}:`, { units });
      
      // Ensure valid session and get user ID
      const session = await this.authService.getValidSession();
      const userId = session.uid || 2;

      // Calculate amount based on current NAV
      const fund = await this.getFundById(fundId);
      const amount = units * fund.current_nav;

      const transactionData = {
        user_id: userId,
        fund_id: fundId,
        transaction_type: 'sale',
        units: units,
        amount: amount,
        status: 'pending',
        investment_type: 'fund_certificate',
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const transactionId = await this.createRecord("portfolio.transaction", transactionData);
      console.log('✅ [FundService] Direct sell transaction created:', transactionId);

      // Complete the transaction to update investment portfolio
      console.log(`🔄 [FundService] Completing sell transaction ${transactionId} to update portfolio...`);
      
      await this.callModelMethod(
        "portfolio.transaction",
        "action_complete",
        [transactionId]
      );

      console.log('✅ [FundService] Sell transaction completed');
      
      // Clear portfolio-related cache to force refresh
      this.clearPortfolioCache();
      
      return transactionId;
    } catch (error) {
      console.error('❌ [FundService] Failed to create direct sell transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get fund comparison data
   */
  async getFundComparison(fundIds) {
    try {
      console.log(`📊 [FundService] Getting fund comparison for IDs:`, fundIds);
      
      const funds = await this.getFunds();
      const comparisonData = funds.filter(fund => fundIds.includes(fund.id));
      
      return comparisonData.map(fund => ({
        ...fund,
        performance_1m: parseFloat(fund.performance_1m) || 0,
        performance_3m: parseFloat(fund.performance_3m) || 0,
        performance_6m: parseFloat(fund.performance_6m) || 0,
        performance_1y: parseFloat(fund.performance_1y) || 0,
        risk_rating: fund.risk_rating || 'Medium',
        fee_ratio: parseFloat(fund.fee_ratio) || 0
      }));
    } catch (error) {
      console.error('❌ [FundService] Failed to get fund comparison:', error.message);
      throw error;
    }
  }

  /**
   * Clear portfolio-related caches
   */
  clearPortfolioCache() {
    this.deleteCachedData('investments_data');
    this.deleteCachedData('portfolio_data');
    this.deleteCachedData('overview_data');
    console.log('🧹 [FundService] Portfolio cache cleared');
  }

  /**
   * Get fund categories
   */
  async getFundCategories() {
    try {
      const funds = await this.getFunds();
      const categories = [...new Set(funds.map(fund => fund.investment_type))];
      
      return categories.map(category => ({
        type: category,
        count: funds.filter(fund => fund.investment_type === category).length,
        funds: funds.filter(fund => fund.investment_type === category)
      }));
    } catch (error) {
      console.error('❌ [FundService] Failed to get fund categories:', error.message);
      return [];
    }
  }

  /**
   * Search funds by criteria
   */
  async searchFunds(criteria = {}) {
    try {
      const funds = await this.getFunds();
      let filteredFunds = [...funds];

      if (criteria.name) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.name.toLowerCase().includes(criteria.name.toLowerCase()) ||
          fund.ticker.toLowerCase().includes(criteria.name.toLowerCase())
        );
      }

      if (criteria.investment_type) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.investment_type === criteria.investment_type
        );
      }

      if (criteria.min_nav) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.current_nav >= parseFloat(criteria.min_nav)
        );
      }

      if (criteria.max_nav) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.current_nav <= parseFloat(criteria.max_nav)
        );
      }

      // Sort by criteria
      if (criteria.sort_by) {
        filteredFunds.sort((a, b) => {
          switch (criteria.sort_by) {
            case 'nav_asc':
              return a.current_nav - b.current_nav;
            case 'nav_desc':
              return b.current_nav - a.current_nav;
            case 'ytd_asc':
              return a.current_ytd - b.current_ytd;
            case 'ytd_desc':
              return b.current_ytd - a.current_ytd;
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
      }

      return filteredFunds;
    } catch (error) {
      console.error('❌ [FundService] Failed to search funds:', error.message);
      return [];
    }
  }
}

module.exports = FundService; 