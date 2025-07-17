const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/assetController');

router.get('/management', AssetController.getAssetManagementData);

module.exports = router;
