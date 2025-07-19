const OdooService = require('../services/OdooService');

class AssetController {
  constructor(odooService) {
    this.odooService = odooService;
  }
  
  async getAssetManagementData(req, res) {
    try {
      const assetData = await this.odooService.getAssetManagementData();
      res.json(assetData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch asset management data' });
    }
  }
}   

module.exports = AssetController;