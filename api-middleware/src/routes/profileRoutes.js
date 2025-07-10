const express = require('express');
const ProfileController = require('../controllers/profileController');
const config = require('../config/config');

const router = express.Router();
const profileController = new ProfileController();

// Personal profile routes
router.get('/personal', async (req, res) => {
    await profileController.getPersonalProfile(req, res);
});

router.get('/data_personal_profile', async (req, res) => {
    await profileController.getPersonalProfile(req, res);
});

// Legacy route (compatibility) 
router.get('/profile', async (req, res) => {
    await profileController.getProfile(req, res);
});

router.get('/data_bank_info', async (req, res) => {
    await profileController.getBankInfo(req, res);
});

router.get('/data_address_info', async (req, res) => {
    await profileController.getAddressInfo(req, res);
});
    
module.exports = router;