const AssetService = require('../services/AssetService');
const AuthService = require('../services/AuthService');

const authService = new AuthService();
const assetService = new AssetService(authService);

exports.getAssetManagementData = async (req, res) => {
  try {
    const data = await assetService.getAssetManagementData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve asset management data.' });
  }
};
