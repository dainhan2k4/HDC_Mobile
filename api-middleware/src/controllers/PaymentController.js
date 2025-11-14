class PaymentController {
  constructor(odooService) {
    this.odooService = odooService;
  }

  async createPayment(req, res) {
    console.log('💰 [PaymentController] Creating PayOS payment...');
    
    try {
      const { transaction_id, amount, units, description } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Số tiền thanh toán không hợp lệ'
        });
      }

      if (!units || units <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Số đơn vị không hợp lệ'
        });
      }

      console.log('📊 [PaymentController] Payment data:', {
        transaction_id,
        amount,
        units,
        description
      });

      const result = await this.odooService.paymentService.createPayOSPayment({
        transaction_id: transaction_id || 0,
        amount: parseFloat(amount),
        units: parseFloat(units),
        description: description || `Nap tien TK${transaction_id ? String(transaction_id).slice(-4) : '****'} tai HDC`
      });

      console.log('✅ [PaymentController] PayOS payment created successfully');

      res.json(result);

    } catch (error) {
      console.error('❌ [PaymentController] Failed to create PayOS payment:', error.message);
      console.error('❌ [PaymentController] Error stack:', error.stack);
      console.error('❌ [PaymentController] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Log response nếu có
      if (error.response) {
        console.error('❌ [PaymentController] Error response status:', error.response.status);
        console.error('❌ [PaymentController] Error response data:', error.response.data);
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create PayOS payment',
        details: error.response?.data || undefined
      });
    }
  }
}

module.exports = PaymentController;

