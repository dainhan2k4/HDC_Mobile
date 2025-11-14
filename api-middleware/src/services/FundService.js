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
      // Return empty array instead of throwing to prevent cascade failures
      console.log('⚠️ [FundService] Returning empty funds array as fallback');
      return [];
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
  async buyFundDirect(fundId, amount, units, signature = {}) {
    try {
      console.log(`🔄 [FundService] Creating buy transaction via /create_investment for fund ${fundId}:`, { amount, units });
      
      // Ensure valid session
      await this.authService.getValidSession();

      // Gọi trực tiếp Odoo endpoint /create_investment
      const form = new URLSearchParams({
        fund_id: fundId.toString(),
        units: units.toString(),
        amount: amount.toString()
      });

      // Optional chữ ký số / ký tay
      if (signature.signature_type) form.append('signature_type', String(signature.signature_type));
      if (signature.signature_value) form.append('signature_value', String(signature.signature_value));
      if (signature.signed_pdf_path) form.append('signed_pdf_path', String(signature.signed_pdf_path));
      if (signature.signer_email) form.append('signer_email', String(signature.signer_email));

      const response = await this.apiCall('/create_investment', {
        method: 'POST',
        requireAuth: true,
        data: form.toString(),
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
  async sellFundDirect(fundId, units, signature = {}) {
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
      const form = new URLSearchParams({
        investment_id: investment.id.toString(),
        quantity: units.toString(),
        estimated_value: estimatedValue.toString()
      });

      // Optional chữ ký số / ký tay
      if (signature.signature_type) form.append('signature_type', String(signature.signature_type));
      if (signature.signature_value) form.append('signature_value', String(signature.signature_value));
      if (signature.signed_pdf_path) form.append('signed_pdf_path', String(signature.signed_pdf_path));
      if (signature.signer_email) form.append('signer_email', String(signature.signer_email));

      const response = await this.apiCall('/submit_fund_sell', {
        method: 'POST',
        requireAuth: true,
        data: form.toString(),
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

  /**
   * Get term rates (kỳ hạn và lãi suất) from Odoo
   * Gọi endpoint /api/fund/calc của Odoo
   */
  async getTermRates() {
    try {
      console.log('📊 [FundService] Getting term rates from /api/fund/calc...');
      
      await this.authService.getValidSession();
      
      const response = await this.apiCall('/api/fund/calc', {
        requireAuth: true
      });
      
      console.log('📊 [FundService] Term rates response:', typeof response, Array.isArray(response));
      
      // Parse JSON response if needed
      let data;
      if (typeof response === 'string') {
        try {
          data = JSON.parse(response);
        } catch (parseError) {
          console.error('❌ [FundService] Failed to parse term rates JSON:', parseError.message);
          throw parseError;
        }
      } else {
        data = response;
      }
      
      // Ensure data is an array
      const termRates = Array.isArray(data) ? data : [];
      
      console.log(`✅ [FundService] Got ${termRates.length} term rates`);
      return termRates;
    } catch (error) {
      console.error('❌ [FundService] Failed to get term rates:', error.message);
      throw error;
    }
  }

  /**
   * Get fund OHLC (Open, High, Low, Close) data for candlestick chart
   * Gọi endpoint /fund_ohlc của Odoo
   */
  async getFundOHLC(ticker, timeRange = '1D') {
    try {
      console.log(`📊 [FundService] Getting OHLC data for ticker ${ticker}, range: ${timeRange}`);
      
      // Map timeRange từ client format sang Odoo format
      const rangeMap = {
        '1D': '1D',
        '5D': '5D',
        '1M': '1M',
        '3M': '3M',
        '6M': '6M',
        '1Y': '1Y'
      };
      const odooRange = rangeMap[timeRange] || '1D';
      
      const response = await this.apiCall(`/fund_ohlc?ticker=${encodeURIComponent(ticker)}&range=${odooRange}`, {
        requireAuth: false
      });
      
      console.log(`📊 [FundService] Raw response type: ${typeof response}, is string: ${typeof response === 'string'}`);
      
      // Parse JSON response
      let data;
      if (typeof response === 'string') {
        try {
          data = JSON.parse(response);
        } catch (parseError) {
          console.error('❌ [FundService] Failed to parse JSON response:', parseError.message);
          console.error('❌ [FundService] Response string:', response.substring(0, 200));
          throw parseError;
        }
      } else {
        data = response;
      }
      
      console.log(`📊 [FundService] Parsed data:`, {
        hasStatus: !!data.status,
        status: data.status,
        hasData: !!data.data,
        isArray: Array.isArray(data.data),
        dataLength: data.data ? data.data.length : 0,
        firstItem: data.data && data.data.length > 0 ? data.data[0] : null,
        fullResponse: JSON.stringify(data).substring(0, 500)
      });
      
      // Kiểm tra nhiều format response từ Odoo
      let ohlcArray = null;
      
      // Format 1: { status: 'Success', data: [...] }
      if (data && data.status === 'Success' && Array.isArray(data.data) && data.data.length > 0) {
        ohlcArray = data.data;
      }
      // Format 2: { success: true, data: [...] }
      else if (data && data.success === true && Array.isArray(data.data) && data.data.length > 0) {
        ohlcArray = data.data;
      }
      // Format 3: data là array trực tiếp
      else if (Array.isArray(data) && data.length > 0) {
        ohlcArray = data;
      }
      // Format 4: { result: [...] } (JSON-RPC)
      else if (data && data.result && Array.isArray(data.result) && data.result.length > 0) {
        ohlcArray = data.result;
      }
      
      if (ohlcArray && ohlcArray.length > 0) {
        console.log(`✅ [FundService] Found ${ohlcArray.length} OHLC records for ticker ${ticker}`);
        
        // Transform Odoo format to client format
        const candles = ohlcArray.map(item => {
          // item.t có thể là timestamp (number) hoặc date string (YYYY-MM-DD)
          let timeLabel = '';
          if (typeof item.t === 'number') {
            // Unix timestamp - convert to time string
            const date = new Date(item.t * 1000);
            timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          } else if (item.t) {
            // Date string
            timeLabel = item.t;
          } else if (item.time) {
            timeLabel = item.time;
          } else if (item.timestamp) {
            const date = new Date(item.timestamp * 1000);
            timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }
          
          return {
            time: timeLabel,
            open: parseFloat(item.o || item.open || 0) || 0,
            high: parseFloat(item.h || item.high || 0) || 0,
            low: parseFloat(item.l || item.low || 0) || 0,
            close: parseFloat(item.c || item.close || 0) || 0,
            volume: parseFloat(item.v || item.volume || 0) || 0,
            timestamp: typeof item.t === 'number' ? item.t : (item.timestamp || item.t)
          };
        });
        
        console.log(`✅ [FundService] Transformed ${candles.length} candles for ticker ${ticker}`);
        
        return {
          candles,
          labels: candles.map(c => c.time),
          timeRange: timeRange
        };
      }
      
      console.warn(`⚠️ [FundService] No OHLC data found for ticker ${ticker}. Response:`, {
        hasData: !!data,
        status: data?.status,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : (data?.data ? data.data.length : 0)
      });
      return {
        candles: [],
        labels: [],
        timeRange: timeRange
      };
    } catch (error) {
      console.error(`❌ [FundService] Failed to get OHLC data for ticker ${ticker}:`, error.message);
      return {
        candles: [],
        labels: [],
        timeRange: timeRange
      };
    }
  }

  /**
   * Get fund chart data (NAV history) for a specific fund
   * Parse từ /fund_widget hoặc sử dụng chart_data từ dashboard
   */
  async getFundChartData(fundId, timeRange = '1M') {
    try {
      console.log(`📈 [FundService] Getting chart data for fund ${fundId}, range: ${timeRange}`);
      
      // Thử lấy từ dashboard data trước
      try {
        const investmentService = require('./InvestmentService');
        const invService = new investmentService(this.authService);
        const dashboard = await invService.getInvestmentDashboard();
        
        // Parse chart_data nếu có
        if (dashboard.chart_data && dashboard.chart_data !== '{}') {
          let chartData;
          try {
            chartData = typeof dashboard.chart_data === 'string' 
              ? JSON.parse(dashboard.chart_data) 
              : dashboard.chart_data;
            
            // Tìm data cho fund cụ thể
            if (chartData && chartData[fundId]) {
              const fundChartData = chartData[fundId];
              // Map timeRange
              const rangeMap = {
                '1M': '1m',
                '3M': '3m',
                '6M': '6m',
                '1Y': '1y'
              };
              const odooRange = rangeMap[timeRange] || '1m';
              
              if (fundChartData[odooRange]) {
                const data = fundChartData[odooRange];
                return {
                  labels: data.labels || [],
                  values: data.values || [],
                  timeRange: timeRange
                };
              }
            }
          } catch (parseError) {
            console.warn('⚠️ [FundService] Failed to parse chart_data:', parseError.message);
          }
        }
      } catch (dashboardError) {
        console.warn('⚠️ [FundService] Failed to get dashboard data:', dashboardError.message);
      }
      
      // Fallback: Gọi /fund_widget và parse HTML
      try {
        const html = await this.apiCall('/fund_widget', { requireAuth: false });
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        const scripts = dom.window.document.querySelectorAll('script');
        
        for (const script of scripts) {
          // Tìm window.fundChartData hoặc tương tự
          if (script.textContent.includes('fundChartData') || script.textContent.includes(`fund_${fundId}`)) {
            // Parse chart data từ script
            // Implementation tùy vào format của Odoo
            console.log('📊 [FundService] Found chart data in HTML');
            // TODO: Parse specific format từ Odoo
          }
        }
      } catch (htmlError) {
        console.warn('⚠️ [FundService] Failed to parse /fund_widget:', htmlError.message);
      }
      
      // Final fallback: return empty data
      console.warn(`⚠️ [FundService] No chart data found for fund ${fundId}, returning empty`);
      return {
        labels: [],
        values: [],
        timeRange: timeRange
      };
    } catch (error) {
      console.error(`❌ [FundService] Failed to get chart data for fund ${fundId}:`, error.message);
      return {
        labels: [],
        values: [],
        timeRange: timeRange
      };
    }
  }
}

module.exports = FundService; 