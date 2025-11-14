const AuthService = require('./AuthService');
const FundService = require('./FundService');
const TransactionService = require('./TransactionService');
const ProfileService = require('./ProfileService');
const InvestmentService = require('./InvestmentService');
const AssetService = require('./AssetService');
const OTPService = require('./OTPService');
const PaymentService = require('./PaymentService');
/**
 * Main OdooService class that combines all service modules
 * This is the primary interface for interacting with Odoo
 */
class OdooService {
  constructor() {
    // Initialize AuthService first
    this.authService = new AuthService();
    
    // Initialize other services with AuthService dependency
    this.fundService = new FundService(this.authService);
    this.transactionService = new TransactionService(this.authService);
    this.profileService = new ProfileService(this.authService);
    this.investmentService = new InvestmentService(this.authService);
    this.assetService = new AssetService(this.authService);
    this.otpService = new OTPService(this.authService);
    this.paymentService = new PaymentService(this.authService);
    console.log('🚀 [OdooService] Initialized with modular architecture');
  }

  // ======================
  // Authentication Methods
  // ======================
  
  /**
   * Authenticate with Odoo
   */
  async authenticate() {
    return this.authService.authenticate();
  }

  /**
   * Get valid session
   */
  async getValidSession() {
    return this.authService.getValidSession();
  }

  /**
   * Test session validity
   */
  async testSession() {
    return this.authService.testSession();
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  /**
   * Logout
   */
  async logout() {
    return this.authService.logout();
  }

  // =================
  // Fund Methods
  // =================
  
  /**
   * Get all funds
   */
  async getFunds() {
    return this.fundService.getFunds();
  }

  /**
   * Get fund by ID
   */
  async getFundById(fundId) {
    return this.fundService.getFundById(fundId);
  }

  /**
   * Buy fund
   */
  async buyFund(fundId, amount, units) {
    return this.fundService.buyFund(fundId, amount, units);
  }

  /**
   * Sell fund
   */
  async sellFund(fundId, units) {
    return this.fundService.sellFund(fundId, units);
  }

  /**
   * Buy fund (direct method)
   */
  async buyFundDirect(fundId, amount, units) {
    return this.fundService.buyFundDirect(fundId, amount, units);
  }

  /**
   * Sell fund (direct method)
   */
  async sellFundDirect(fundId, units) {
    return this.fundService.sellFundDirect(fundId, units);
  }

  /**
   * Search funds
   */
  async searchFunds(criteria) {
    return this.fundService.searchFunds(criteria);
  }

  /**
   * Get fund categories
   */
  async getFundCategories() {
    return this.fundService.getFundCategories();
  }

  /**
   * Get fund comparison data
   */
  async getFundComparison(fundIds) {
    return this.fundService.getFundComparison(fundIds);
  }

  /**
   * Get fund chart data for a specific fund
   */
  async getFundChartData(fundId, timeRange = '1M') {
    return this.fundService.getFundChartData(fundId, timeRange);
  }

  /**
   * Get fund OHLC data for candlestick chart
   */
  async getFundOHLC(ticker, timeRange = '1D') {
    return this.fundService.getFundOHLC(ticker, timeRange);
  }

  /**
   * Get term rates (kỳ hạn và lãi suất)
   */
  async getTermRates() {
    return this.fundService.getTermRates();
  }

  // ====================
  // Investment Methods
  // ====================
  
  /**
   * Get user investments
   */
  async getInvestments() {
    return this.investmentService.getInvestments();
  }

  async submitFundSell(params) {
    return this.investmentService.submitFundSell(params);
  }

  /**
   * Get portfolio dashboard từ controller
   */
  async getInvestmentDashboard() {
    return this.investmentService.getInvestmentDashboard();
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary() {
    return this.investmentService.getPortfolioSummary();
  }

  /**
   * Get investment by fund ID
   */
  async getInvestmentByFundId(fundId) {
    return this.investmentService.getInvestmentByFundId(fundId);
  }

  /**
   * Get investment allocations
   */
  async getInvestmentAllocations() {
    return this.investmentService.getInvestmentAllocations();
  }

  /**
   * Get investment performance
   */
  async getInvestmentPerformance(period) {
    return this.investmentService.getInvestmentPerformance(period);
  }

  /**
   * Get investment statistics
   */
  async getInvestmentStats() {
    return this.investmentService.getInvestmentStats();
  }

  // ==================
  // Profile Methods
  // ==================
  
  /**
   * Get profile (legacy - for compatibility)
   */
  async getProfile() {
    return this.profileService.getProfile();
  }

  /**
   * Get personal profile
   */
  async getPersonalProfile() {
    return this.profileService.getPersonalProfile();
  }

  /**
   * Update personal profile
   */
  async updatePersonalProfile(profileData) {
    return this.profileService.updatePersonalProfile(profileData);
  }

  /**
   * Save personal profile
   */
  async savePersonalProfile(profileData) {
    return this.profileService.savePersonalProfile(profileData);
  }

  /**
   * Save address info
   */
  async saveAddressInfo(addressData) {
    return this.profileService.saveAddressInfo(addressData);
  }

  /**
   * Get bank info
   */
  async getBankInfo() {
    return this.profileService.getBankInfo();
  }

  /**
   * Get address info
   */
  async getAddressInfo() {
    return this.profileService.getAddressInfo();
  }

  /**
   * Get complete profile
   */
  async getCompleteProfile() {
    return this.profileService.getCompleteProfile();
  }

  /**
   * Get profile summary
   */
  async getProfileSummary() {
    return this.profileService.getProfileSummary();
  }

  /**
   * Get verification status
   */
  async getVerificationStatus() {
    return this.profileService.getVerificationStatus();
  }

  // ====================
  // Transaction Methods
  // ====================
  
  /**
   * Get transactions
   */
  async getTransactions(filters) {
    return this.transactionService.getTransactions(filters);
  }

  /**
   * Get transactions từ controller endpoints
   */
  async getOrdersFromController() {
    return this.transactionService.getOrdersFromController();
  }
  async getPendingFromController() {
    return this.transactionService.getPendingFromController();
  }
  async getPeriodicFromController() {
    return this.transactionService.getPeriodicFromController();
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId) {
    return this.transactionService.getTransactionById(transactionId);
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(filters) {
    return this.transactionService.getTransactionStats(filters);
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(filters) {
    return this.transactionService.getPendingTransactions(filters);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(filters) {
    return this.transactionService.getTransactionHistory(filters);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId, status, description) {
    return this.transactionService.updateTransactionStatus(transactionId, status, description);
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId, reason) {
    return this.transactionService.cancelTransaction(transactionId, reason);
  }

  /**
   * Complete transaction
   */
  async completeTransaction(transactionId) {
    return this.transactionService.completeTransaction(transactionId);
  }

  // ==================
  // Asset Methods
  // ==================
  
  /**
   * Get asset management data
   */
  async getAssetManagementData() {
    return this.assetService.getAssetManagementData();
  }
  
  // ==================
  // Utility Methods
  // ==================

  /**
   * Clear all caches
   */
  clearCache() {
    this.authService.clearCache();
    this.fundService.clearCache();
    this.transactionService.clearCache();
    this.profileService.clearProfileCache();
    this.investmentService.clearInvestmentCache();
    console.log('🧹 [OdooService] All caches cleared');
  }

  /**
   * Clear session cache (force re-authentication)
   */
  clearSession() {
    this.authService.clearSession();
    console.log('🔐 [OdooService] Session cleared');
  }

  /**
   * Test transaction methods (for debugging)
   */
  async testTransactionMethods() {
    return this.transactionService.getTransactionMethods();
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      auth: !!this.authService,
      fund: !!this.fundService,
      transaction: !!this.transactionService,
      profile: !!this.profileService,
      investment: !!this.investmentService,
      initialized_at: new Date().toISOString()
    };
  }
}

module.exports = OdooService; 