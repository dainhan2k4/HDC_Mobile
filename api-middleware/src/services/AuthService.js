const BaseOdooService = require('./BaseOdooService');

class AuthService extends BaseOdooService {
  constructor() {
    super();
  }

  setSessionId(sessionId) {
    // Lưu vào cache chung của BaseOdooService để các service khác đọc được
    super.setSessionId(sessionId);
    // Giữ tương thích với nơi đang dùng global
    global.sessionId = sessionId;
  }

  getSessionId() {
    // Ưu tiên lấy từ cache chung, fallback global
    return super.getSessionId() || global.sessionId;
  }

  clearSession() {
    // Xóa cả cache chung và global
    super.clearSession();
    global.sessionId = null;
  }

  extractSessionFromCookies(setCookie) {
    if (Array.isArray(setCookie)) {
      const sessionMatch = setCookie.find(cookie => cookie.includes('session_id='));
      if (sessionMatch) {
        return sessionMatch.match(/session_id=([^;]+)/)?.[1];
      }
    } else if (typeof setCookie === 'string') {
      const match = setCookie.match(/session_id=([^;]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Authenticate with Odoo and get session_id
   * Inspired by Simpos's authentication approach
   */
  async authenticate() {
    try {
      console.log(`🔐 [AuthService] Authenticating with Odoo...`);
      console.log(`🔐 [AuthService] Database: ${this.database}, Username: ${this.username}`);
      
      const response = await this.client.post('/web/session/authenticate', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: this.database,
          login: this.username,
          password: this.password,
        },
      });

      const data = response.data;
      const setCookie = response.headers['set-cookie'];
      
      // Try to get session from result first
      if (data.result && data.result.session_id) {
        const sessionId = data.result.session_id;
        this.setSessionId(sessionId);
        console.log(`✅ [AuthService] Authentication successful, session ID: ${sessionId.substring(0, 10)}...`);
        return { success: true, sessionId, uid: data.result.uid };
      }

      // Try to get session from cookies
      if (setCookie) {
        const sessionId = this.extractSessionFromCookies(setCookie);
        if (sessionId) {
          this.setSessionId(sessionId);
          console.log(`✅ [AuthService] Authentication successful (from cookie), session ID: ${sessionId.substring(0, 10)}...`);
          return { success: true, sessionId };
        }
      }

      console.error(`❌ [AuthService] Authentication failed - no session ID found`);
      return { success: false, error: 'Authentication failed - no session ID' };
    } catch (error) {
      console.error(`❌ [AuthService] Authentication error: ${error.message}`);
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        console.error(`❌ [AuthService] Cannot connect to Odoo at ${this.baseUrl}. Is Odoo running?`);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cached session_id or authenticate if needed
   */
  async getValidSession() {
    const sessionId = this.getSessionId();
    
    if (!sessionId || sessionId === 'undefined') {
      console.log('🔐 [AuthService] No session found, authenticating...');
      return await this.authenticate();
    }

    // Test if session is still valid
    try {
      const response = await this.client.post('/web/session/get_session_info', {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
      }, {
        headers: { Cookie: `session_id=${sessionId}` }
      });

      const sessionInfo = response.data.result;
      if (sessionInfo && sessionInfo.uid && sessionInfo.uid !== false) {
        console.log(`✅ [AuthService] Session valid for user ${sessionInfo.uid}`);
        return { success: true, sessionId, sessionInfo, uid: sessionInfo.uid };
      }

      // Session invalid, re-authenticate
      console.log('⚠️ [AuthService] Session invalid, re-authenticating...');
      return await this.authenticate();
    } catch (error) {
      console.log(`⚠️ [AuthService] Session test failed: ${error.message}, re-authenticating...`);
      return await this.authenticate();
    }
  }

  /**
   * Test if current session is valid
   */
  async testSession() {
    try {
      const response = await this.client.post('/web/session/get_session_info', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });

      const sessionInfo = response.data.result;
      if (!sessionInfo || !sessionInfo.uid || sessionInfo.uid === false) {
        throw new Error('Invalid session');
      }

      console.log('✅ [AuthService] Session is valid for user:', sessionInfo.uid);
      return sessionInfo;
    } catch (error) {
      console.error('❌ [AuthService] Session test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    try {
      const sessionInfo = await this.testSession();
      
      if (sessionInfo.uid) {
        // Get user details
        const userInfo = await this.readRecords('res.users', [sessionInfo.uid], [
          'id', 'name', 'login', 'email', 'partner_id'
        ]);

        return userInfo[0] || null;
      }

      return null;
    } catch (error) {
      console.error('❌ [AuthService] Failed to get current user:', error.message);
      return null;
    }
  }

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      await this.client.post('/web/session/destroy', {
        jsonrpc: "2.0",
        method: "call",
        params: {}
      });

      this.clearSession();
      console.log('✅ [AuthService] Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [AuthService] Logout failed:', error.message);
      // Clear session anyway
      this.clearSession();
      return { success: true };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      await this.testSession();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user session information
   */
  async getSessionInfo() {
    try {
      return await this.testSession();
    } catch (error) {
      console.error('❌ [AuthService] Failed to get session info:', error.message);
      return null;
    }
  }
}

module.exports = AuthService; 