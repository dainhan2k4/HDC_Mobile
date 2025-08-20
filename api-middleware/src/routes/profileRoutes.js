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

router.post('/update_personal_profile', async (req, res) => {
    await profileController.updatePersonalProfile(req, res);
});

router.post('/save_personal_profile', async (req, res) => {
    console.log('[Route] save_personal_profile endpoint hit!', req.body);
    await profileController.savePersonalProfile(req, res);
});

router.post('/save_address_info', async (req, res) => {
    console.log('[Route] save_address_info endpoint hit!', req.body);
    await profileController.saveAddressInfo(req, res);
});

router.post('/update_address_info', async (req, res) => {
    await profileController.saveAddressInfo(req, res);
});

// Debug endpoint để list tất cả routes
router.get('/debug-routes', (req, res) => {
    const routes = [];
    router.stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            routes.push({
                path: layer.route.path,
                methods: methods
            });
        }
    });
    
    res.json({
        success: true,
        message: 'Available profile routes',
        routes: routes,
        total: routes.length
    });
});
    
module.exports = router;