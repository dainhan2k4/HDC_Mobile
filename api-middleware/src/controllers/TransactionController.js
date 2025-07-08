class TransactionController {
  constructor(odooService) {
    this.odooService = odooService;
  }

  async buyFund(req, res) {
    console.log('📈 [TransactionController] Processing fund purchase request...');
    
    try {
      // Debug: Check transaction model availability
      const fields = await this.odooService.testTransactionMethods();
      console.log('🔍 [TransactionController] Transaction model available:', !!fields);
      
      const { fundId, amount, units } = req.body;

      // Validation
      if (!fundId || !amount || !units) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fundId, amount, units'
        });
      }

      if (amount < 100000) {
        return res.status(400).json({
          success: false,
          message: 'Minimum investment amount is 100,000 VND'
        });
      }

      let result;
      try {
        // Try the custom create_transaction method first
        result = await this.odooService.buyFund(
          parseInt(fundId),
          parseFloat(amount),
          parseFloat(units)
        );
      } catch (customMethodError) {
        console.log('⚠️ [TransactionController] Custom method failed, trying direct create...');
        // Fallback to direct create method
        result = await this.odooService.buyFundDirect(
          parseInt(fundId),
          parseFloat(amount),
          parseFloat(units)
        );
      }

      console.log('✅ [TransactionController] Fund purchase completed:', result);

      // Clear cache to ensure fresh data on next request
      this.odooService.clearCache();
      console.log('🧹 [TransactionController] Cache cleared after successful purchase');

      res.json({
        success: true,
        message: 'Fund purchase completed successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ [TransactionController] Fund purchase failed:', error.message);
      console.error('❌ [TransactionController] Error details:', error);
      
      const errorMessage = error.message || 'Failed to process fund purchase';
      const isOdooError = error.response?.data?.error;
      
      res.status(500).json({
        success: false,
        message: isOdooError ? 'Backend transaction error - please check Odoo configuration' : errorMessage,
        error: isOdooError ? error.response.data.error.message : errorMessage,
        ...(isOdooError && { odooError: error.response.data.error })
      });
    }
  }

  async sellFund(req, res) {
    console.log('📉 [TransactionController] Processing fund sale request...');
    
    try {
      const { fundId, units } = req.body;

      // Validation
      if (!fundId || !units) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fundId, units'
        });
      }

      if (units <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Units to sell must be greater than 0'
        });
      }

      let result;
      try {
        // Try the custom create_transaction method first
        result = await this.odooService.sellFund(
          parseInt(fundId),
          parseFloat(units)
        );
      } catch (customMethodError) {
        console.log('⚠️ [TransactionController] Custom sell method failed, trying direct create...');
        // Fallback to direct create method
        result = await this.odooService.sellFundDirect(
          parseInt(fundId),
          parseFloat(units)
        );
      }

      console.log('✅ [TransactionController] Fund sale completed:', result);

      // Clear cache to ensure fresh data on next request
      this.odooService.clearCache();
      console.log('🧹 [TransactionController] Cache cleared after successful sale');

      res.json({
        success: true,
        message: 'Fund sale completed successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ [TransactionController] Fund sale failed:', error.message);
      console.error('❌ [TransactionController] Error details:', error);
      
      const errorMessage = error.message || 'Failed to process fund sale';
      const isOdooError = error.response?.data?.error;
      
      res.status(500).json({
        success: false,
        message: isOdooError ? 'Backend transaction error - please check Odoo configuration' : errorMessage,
        error: isOdooError ? error.response.data.error.message : errorMessage,
        ...(isOdooError && { odooError: error.response.data.error })
      });
    }
  }
}

module.exports = TransactionController; 