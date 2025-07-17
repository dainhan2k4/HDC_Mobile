const BaseOdooService = require('./BaseOdooService');
const { JSDOM } = require('jsdom');

class AssetService extends BaseOdooService {
  constructor(authService) {
    super(authService);
  }

  async getAssetManagementData() {
    try {
      const html = await this.apiCall('/asset-management', { requireAuth: true });
      const dom = new JSDOM(html);
      const scripts =  dom.window.document.querySelectorAll('script');

      let json = [];

      for (const script of scripts) {
        if (script.textContent.includes('window.assetManagementData')) {
          const match = script.textContent.match(/window\.assetManagementData\s*=\s*(\{.*\});?/s);
          if (match && match[1]) {
            json = JSON.parse(match[1]);
            break;
          }
        }
      }

      return json;
    } catch (error) {
      console.error('Error fetching asset management data:', error);
      throw error;  
    }
  }
}

module.exports = AssetService;
