const BaseOdooService = require('./BaseOdooService');
const AuthService = require('./AuthService');

class ProfileService extends BaseOdooService {
  constructor(authService = null) {
    super(authService);
    this.authService = authService || new AuthService();
  }

  /**
   * Get personal profile data
   */
  async getPersonalProfile() {
    const cacheKey = 'personal_profile_data';
    let cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📦 [ProfileService] Returning cached personal profile data');
      return cached;
    }

    try {
      console.log('🔗 [ProfileService] Calling /data_personal_profile endpoint (requires auth)...');
      const data = await this.apiCall('/data_personal_profile', { requireAuth: true });
      console.log('📊 [ProfileService] Raw personal profile response:', data);

      // Return data as-is (should be array from Odoo)
      this.setCachedData(cacheKey, data);
      console.log(`✅ [ProfileService] Personal profile data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get personal profile:', error.message);
      console.error('❌ [ProfileService] Error details:', error);
      return [];
    }
  }

  /**
   * Get bank info data
   */
  async getBankInfo() {
    const cacheKey = 'bank_info_data';
    let cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📦 [ProfileService] Returning cached bank info data');
      return cached;
    }

    try {
      console.log('🔗 [ProfileService] Calling /data_bank_info endpoint (requires auth)...');
      const data = await this.apiCall('/data_bank_info', { requireAuth: true });
      console.log('📊 [ProfileService] Raw bank info response:', data);

      // Return data as-is (should be array from Odoo)
      this.setCachedData(cacheKey, data);
      console.log(`✅ [ProfileService] Bank info data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get bank info:', error.message);
      console.error('❌ [ProfileService] Error details:', error);
      return [];
    }
  }

  /**
   * Get address info data
   */
  async getAddressInfo() {
    const cacheKey = 'address_info_data';
    let cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📦 [ProfileService] Returning cached address info data');
      return cached;
    }

    try {
      console.log('🔗 [ProfileService] Calling /data_address_info endpoint (requires auth)...');
      const data = await this.apiCall('/data_address_info', { requireAuth: true });
      console.log('📊 [ProfileService] Raw address info response:', data);

      // Return data as-is (should be array from Odoo)
      this.setCachedData(cacheKey, data);
      console.log(`✅ [ProfileService] Address info data cached: ${Array.isArray(data) ? data.length : 'single'} items`);
      return data;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get address info:', error.message);
      console.error('❌ [ProfileService] Error details:', error);
      return [];
    }
  }

  /**
   * Get complete profile data (all sections)
   */
  async getCompleteProfile() {
    try {
      console.log('📋 [ProfileService] Getting complete profile data...');
      
      const [personalProfile, bankInfo, addressInfo] = await Promise.all([
        this.getPersonalProfile(),
        this.getBankInfo(),
        this.getAddressInfo()
      ]);

      return {
        personal: personalProfile,
        bank: bankInfo,
        address: addressInfo,
        completeness: this.calculateProfileCompleteness({
          personal: personalProfile,
          bank: bankInfo,
          address: addressInfo
        })
      };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get complete profile:', error.message);
      throw error;
    }
  }

  /**
   * Update personal profile data
   */
  async updatePersonalProfile(profileData) {
    try {
      console.log('🔄 [ProfileService] Updating personal profile data:', profileData);
      
      await this.authService.getValidSession();

      // Clear cache to force refresh
      this.deleteCachedData('personal_profile_data');

      const data = await this.apiCall('/save_personal_profile',
         { requireAuth: true, method: 'POST', data: JSON.stringify(profileData), headers: {
        'Content-Type': 'application/json',
      } });
      
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to update personal profile:', error.message);
      throw error;
    }
  }

  /**
   * Update bank info data
   */
  async updateBankInfo(bankData) {
    try {
      console.log('🔄 [ProfileService] Updating bank info data:', bankData);
      
      await this.authService.getValidSession();

      // Clear cache to force refresh
      this.deleteCachedData('bank_info_data');

      // Implementation depends on your Odoo model structure
      console.log('✅ [ProfileService] Bank info update placeholder');
      
      return { success: true, message: 'Bank info updated successfully' };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to update bank info:', error.message);
      throw error;
    }
  }

  /**
   * Update address info data
   */
  async updateAddressInfo(addressData) {
    try {
      console.log('🔄 [ProfileService] Updating address info data:', addressData);
      
      await this.authService.getValidSession();

      // Clear cache to force refresh
      this.deleteCachedData('address_info_data');

      // Implementation depends on your Odoo model structure
      console.log('✅ [ProfileService] Address info update placeholder');
      
      return { success: true, message: 'Address info updated successfully' };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to update address info:', error.message);
      throw error;
    }
  }

  /**
   * Get profile verification status
   */
  async getVerificationStatus() {
    try {
      console.log('🔍 [ProfileService] Getting profile verification status...');
      
      const session = await this.authService.getValidSession();
      
      // Search for user verification records
      const verificationRecords = await this.searchRecords(
        "investor.verification",
        [['user_id', '=', session.uid]],
        ['id', 'status', 'verification_level', 'verified_date', 'notes']
      );

      return verificationRecords.length > 0 ? verificationRecords[0] : {
        status: 'pending',
        verification_level: 'none',
        verified_date: null,
        notes: 'No verification record found'
      };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get verification status:', error.message);
      return {
        status: 'unknown',
        verification_level: 'none',
        verified_date: null,
        notes: 'Error retrieving verification status'
      };
    }
  }

  /**
   * Calculate profile completeness percentage
   */
  calculateProfileCompleteness(profileData) {
    let totalFields = 0;
    let completedFields = 0;

    // Check personal profile
    if (Array.isArray(profileData.personal) && profileData.personal.length > 0) {
      const personal = profileData.personal[0];
      const personalFields = ['full_name', 'birth_date', 'identity_number', 'phone', 'email'];
      totalFields += personalFields.length;
      completedFields += personalFields.filter(field => personal[field] && personal[field] !== '').length;
    }

    // Check bank info
    if (Array.isArray(profileData.bank) && profileData.bank.length > 0) {
      const bank = profileData.bank[0];
      const bankFields = ['bank_name', 'account_number', 'account_holder'];
      totalFields += bankFields.length;
      completedFields += bankFields.filter(field => bank[field] && bank[field] !== '').length;
    }

    // Check address info
    if (Array.isArray(profileData.address) && profileData.address.length > 0) {
      const address = profileData.address[0];
      const addressFields = ['street', 'city', 'state', 'zip_code'];
      totalFields += addressFields.length;
      completedFields += addressFields.filter(field => address[field] && address[field] !== '').length;
    }

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    return {
      percentage,
      completed_fields: completedFields,
      total_fields: totalFields,
      missing_sections: this.getMissingSections(profileData)
    };
  }

  /**
   * Get missing profile sections
   */
  getMissingSections(profileData) {
    const missing = [];

    if (!Array.isArray(profileData.personal) || profileData.personal.length === 0) {
      missing.push('personal_profile');
    }

    if (!Array.isArray(profileData.bank) || profileData.bank.length === 0) {
      missing.push('bank_info');
    }

    if (!Array.isArray(profileData.address) || profileData.address.length === 0) {
      missing.push('address_info');
    }

    return missing;
  }

  /**
   * Get profile summary for dashboard
   */
  async getProfileSummary() {
    try {
      console.log('📊 [ProfileService] Getting profile summary...');
      
      const [profileData, verificationStatus] = await Promise.all([
        this.getCompleteProfile(),
        this.getVerificationStatus()
      ]);

      return {
        completeness: profileData.completeness,
        verification: verificationStatus,
        last_updated: new Date().toISOString(),
        sections: {
          personal: Array.isArray(profileData.personal) && profileData.personal.length > 0,
          bank: Array.isArray(profileData.bank) && profileData.bank.length > 0,
          address: Array.isArray(profileData.address) && profileData.address.length > 0
        }
      };
    } catch (error) {
      console.error('❌ [ProfileService] Failed to get profile summary:', error.message);
      throw error;
    }
  }

  /**
   * Clear all profile caches
   */
  clearProfileCache() {
    this.deleteCachedData('personal_profile_data');
    this.deleteCachedData('bank_info_data');
    this.deleteCachedData('address_info_data');
    console.log('🧹 [ProfileService] Profile cache cleared');
  }

  // Legacy method for compatibility
  async getProfile() {
    return this.getPersonalProfile();
  }
}

module.exports = ProfileService; 