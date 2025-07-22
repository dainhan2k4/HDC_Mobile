// api-middleware/src/controllers/assetController.js
const OdooService = require('../services/OdooService');

const odoo = new OdooService();
  
exports.getAssetManagement = async (req, res) => {
  try {
    const data = await odoo.getAssetManagementData();
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in getAssetManagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset data'
    });
  }
};