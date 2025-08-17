const OdooService = require('../services/OdooService');

class ProfileController {
    constructor() {
        this.odooService = new OdooService();
    }

    async getProfile(req, res) {
        try {
            const profile = await this.odooService.getProfile();
            res.json({
                success: true,
                data: profile,
                count: Array.isArray(profile) ? profile.length : 1
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPersonalProfile(req, res) {
        try {
            console.log('🔄 [ProfileController] Getting personal profile data...');
            const data = await this.odooService.getPersonalProfile();
            res.json({
                success: true,
                data: data,
                count: Array.isArray(data) ? data.length : 1
            });
        } catch (error) {
            console.error('❌ [ProfileController] Personal profile error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    async getBankInfo(req, res) {
        try {
            console.log('🔄 [ProfileController] Getting bank info data...');
            const data = await this.odooService.getBankInfo();
            res.json({
                success: true,
                data: data,
                count: Array.isArray(data) ? data.length : 1
            });
        } catch (error) {
            console.error('❌ [ProfileController] Bank info error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    async getAddressInfo(req, res) {
        try {
            console.log('🔄 [ProfileController] Getting address info data...');
            const data = await this.odooService.getAddressInfo();
            res.json({
                success: true,
                data: data,
                count: Array.isArray(data) ? data.length : 1
            });
        } catch (error) {
            console.error('❌ [ProfileController] Address info error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    async updatePersonalProfile(req, res) {
        try {
            console.log('🔄 [ProfileController] Received request body:', req.body);
            console.log('🔍 [ProfileController] id_type in request body:', req.body.id_type);
            console.log('🔍 [ProfileController] All keys in request body:', Object.keys(req.body));
            
            // Thêm trường id_type nếu không có
            const requestData = {
                ...req.body,
                id_type: req.body.id_type || 'id_card'
            };
            
            console.log('🔍 [ProfileController] Request data with id_type:', requestData);
            
            const data = await this.odooService.updatePersonalProfile(requestData);
            res.json({ success: true, data: data });
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }
}

module.exports = ProfileController;