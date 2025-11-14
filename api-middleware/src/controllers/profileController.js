const OdooService = require('../services/OdooService');

class ProfileController {
    constructor() {
        this.odooService = new OdooService();
    }

    async getStatusInfo(req, res) {
        try {
            console.log('🔄 [ProfileController] Getting status info...');
            const data = await this.odooService.profileService.getStatusInfo();
            res.json({
                success: true,
                data,
                count: Array.isArray(data) ? data.length : 1
            });
        } catch (error) {
            console.error('❌ [ProfileController] Status info error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getVerificationData(req, res) {
        try {
            console.log('🔄 [ProfileController] Getting verification data...');
            const data = await this.odooService.profileService.getVerificationData();
            res.json({
                success: true,
                data,
                count: Array.isArray(data) ? data.length : 1
            });
        } catch (error) {
            console.error('❌ [ProfileController] Verification data error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async saveBankInfo(req, res) {
        try {
            console.log('🔄 [ProfileController] Saving bank info...', req.body);
            const data = await this.odooService.profileService.saveBankInfo(req.body);
            res.json({ success: true, data });
        } catch (error) {
            console.error('❌ [ProfileController] Save bank info error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }

    async saveAllProfileData(req, res) {
        try {
            console.log('🔄 [ProfileController] Saving all profile data...', req.body);
            const data = await this.odooService.profileService.saveAllProfileData(req.body);
            res.json({ success: true, data });
        } catch (error) {
            console.error('❌ [ProfileController] Save all profile data error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            res.status(500).json({ success: false, error: errorMsg });
        }
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

    async savePersonalProfile(req, res) {
        try {
            console.log('🔄 [ProfileController] Saving personal profile...', req.body);
            const data = await this.odooService.savePersonalProfile(req.body);
            res.json({ success: true, data: data });
        } catch (error) {
            console.error('❌ [ProfileController] Save personal profile error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }

    async saveAddressInfo(req, res) {
        try {
            console.log('🔄 [ProfileController] Saving address info...', req.body);
            const data = await this.odooService.saveAddressInfo(req.body);
            res.json({ success: true, data: data });
        } catch (error) {
            console.error('❌ [ProfileController] Save address info error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }

    async linkSSIAccount(req, res) {
        try {
            console.log('🔗 [ProfileController] Linking SSI account...', req.body);
            const { consumer_id, consumer_secret, account, private_key } = req.body;
            
            if (!consumer_id || !consumer_secret || !account || !private_key) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: consumer_id, consumer_secret, account, private_key'
                });
            }
            
            const data = await this.odooService.profileService.linkSSIAccount({
                consumer_id,
                consumer_secret,
                account,
                private_key
            });
            
            res.json({ 
                success: data.status === 'success',
                data: data,
                message: data.message || 'Liên kết tài khoản thành công'
            });
        } catch (error) {
            console.error('❌ [ProfileController] Link SSI account error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Không thể liên kết tài khoản SSI',
                error: error.message 
            });
        }
    }

    async getAccountBalance(req, res) {
        try {
            console.log('💰 [ProfileController] Getting account balance...');
            const data = await this.odooService.profileService.getAccountBalance();
            
            res.json({ 
                success: data.status !== 'error',
                data: data,
                message: data.message || 'Lấy số dư thành công'
            });
        } catch (error) {
            console.error('❌ [ProfileController] Get account balance error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Không thể lấy số dư tài khoản',
                error: error.message 
            });
        }
    }
}

module.exports = ProfileController;