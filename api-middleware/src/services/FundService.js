const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class FundService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Get funds data with caching - gọi trực tiếp HTTP endpoint
   */
  async getFunds() {
    const cacheKey = 'funds_data';
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('📦 [FundService] Returning cached funds data');
      return cachedData;
    }

    try {
      console.log('🔗 [FundService] Calling /data_fund endpoint...');
      // Endpoint /data_fund là public theo Odoo controller
      const data = await this.apiCall('/data_fund', { requireAuth: false });
      console.log('📊 [FundService] Raw funds response:', typeof data, Array.isArray(data));
      
      const funds = Array.isArray(data) ? data : [];
      console.log(`✅ [FundService] Got ${funds.length} funds from Odoo`);

      this.setCachedData(cacheKey, funds);
      return funds;
    } catch (error) {
      console.error('❌ [FundService] Failed to get funds:', error.message);
      throw error;
    }
  }

  /**
   * Get fund details by ID
   */
  async getFundById(fundId) {
    try {
      const funds = await this.getFunds();
      const fund = funds.find(f => f.id === fundId);
      
      if (!fund) {
        throw new Error(`Fund with ID ${fundId} not found`);
      }

      return fund;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buy fund transaction
   */
  async buyFund(fundId, amount, units) {
    try {
      const transactionData = {
        fund_id: fundId,
        amount: amount,
        units: units,
        transaction_type: 'purchase'
      };

      // Sử dụng model portfolio.transaction thay vì transaction.order
      const transactionId = await this.callModelMethod('portfolio.transaction', 'create', [transactionData]);
      
      if (transactionId) {
        await this.callModelMethod('portfolio.transaction', 'action_complete', [transactionId]);
        this.clearCache();
      }
      
      return { success: true, transactionId };
    } catch (error) {
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
   * Buy fund using Odoo HTTP endpoint /create_investment
   */
  async buyFundDirect(fundId, amount, units) {
    try {
      console.log(`🔄 [FundService] Creating buy transaction via /create_investment for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session
      await this.authService.getValidSession();

      // Gọi trực tiếp Odoo endpoint /create_investment
      const response = await this.apiCall('/create_investment', {
        method: 'POST',
        requireAuth: true,
        data: new URLSearchParams({
          fund_id: fundId.toString(),
          units: units.toString(),
          amount: amount.toString()
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('📊 [FundService] /create_investment response:', response);

      // Kiểm tra response từ Odoo
      if (response && response.success) {
        console.log('✅ [FundService] Investment created successfully, ID:', response.id);
        
        // Clear portfolio-related cache to force refresh
        this.clearPortfolioCache();
        
        return {
          investmentId: response.id,
          transactionId: response.tx_id,
          message: response.message
        };
      } else {
        throw new Error(response.message || 'Failed to create investment');
      }
    } catch (error) {
      console.error('❌ [FundService] Failed to create buy transaction via /create_investment:', error.message);
      throw error;
    }
  }

  /**
   * Sell fund using Odoo HTTP endpoint /submit_fund_sell
   */
  async sellFundDirect(fundId, units) {
    try {
      console.log(`🔄 [FundService] Creating sell transaction via /submit_fund_sell for fund ${fundId}:`, { units });
      
      // Ensure valid session and get user ID
      const session = await this.authService.getValidSession();
      const userId = session.uid || 2;

      // Get user investment để lấy investment_id
      const investments = await this.apiCall('/data_investment', { requireAuth: true });
      const investment = investments.find(inv => inv.fund_id === fundId);
      
      if (!investment) {
        throw new Error(`No investment found for fund ${fundId}. Cannot sell fund you don't own.`);
      }

      // Calculate estimated value based on current NAV
      const fund = await this.getFundById(fundId);
      const estimatedValue = units * fund.current_nav;

      console.log(`📊 [FundService] Investment found: ID=${investment.id}, available units=${investment.units}`);

      if (investment.units < units) {
        throw new Error(`Insufficient units. You have ${investment.units} units but trying to sell ${units} units.`);
      }

      // Gọi trực tiếp Odoo endpoint /submit_fund_sell
      const response = await this.apiCall('/submit_fund_sell', {
        method: 'POST',
        requireAuth: true,
        data: new URLSearchParams({
          investment_id: investment.id.toString(),
          quantity: units.toString(),
          estimated_value: estimatedValue.toString()
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('📊 [FundService] /submit_fund_sell response:', response);

      // Kiểm tra response từ Odoo
      if (response && response.success) {
        console.log('✅ [FundService] Sell transaction created successfully');
        
        // Clear portfolio-related cache to force refresh
        this.clearPortfolioCache();
        
        return {
          success: true,
          message: response.message
        };
      } else {
        throw new Error(response.message || 'Failed to submit fund sell');
      }
    } catch (error) {
      console.error('❌ [FundService] Failed to create sell transaction via /submit_fund_sell:', error.message);
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