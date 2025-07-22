const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

router.get('/management', assetController.getAssetManagement);

module.exports = router;
