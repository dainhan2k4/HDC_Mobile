const BaseOdooService = require('./BaseOdooService');

class AuthService extends BaseOdooService {
  constructor() {
    super();
  }

  /**
   * Authenticate with Odoo and get session_id
   * Inspired by Simpos's authentication approach
   */
  async authenticate() {
    try {
      console.log(`🔐 [AuthService] Authenticating with database: ${this.database}`);
      
      const response = await this.client.post('/web/session/authenticate', {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: this.database,
          login: this.username,
          password: this.password
        }
      });

      console.log('🔐 [AuthService] Auth response status:', response.status);
      console.log('🔐 [AuthService] Auth response data:', response.data);
      console.log('🔐 [AuthService] Auth response headers:', response.headers);

      const data = response.data;
      
      // Check for session_id in response result first
      if (data.result && data.result.session_id) {
        this.setSessionId(data.result.session_id);
        console.log(`✅ [AuthService] Authentication successful via result, session: ${data.result.session_id}`);
        console.log(`🔧 [AuthService] Session saved to cache, can retrieve: ${this.getSessionId()}`);
        return { success: true, sessionId: data.result.session_id, uid: data.result.uid };
      }

      // Extract session_id from cookies as fallback
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        console.log('🍪 [AuthService] Checking cookies:', setCookie);
        const sessionMatch = setCookie.find(cookie => cookie.includes('session_id='));
        if (sessionMatch) {
          const sessionId = sessionMatch.match(/session_id=([^;]+)/)?.[1];
          if (sessionId) {
            this.setSessionId(sessionId);
            console.log(`✅ [AuthService] Authentication successful via cookies, session: ${sessionId}`);
            console.log(`🔧 [AuthService] Session saved to cache, can retrieve: ${this.getSessionId()}`);
            return { success: true, sessionId, uid: data.result?.uid };
          }
        }
      }

      throw new Error('No session_id found in response or cookies');
    } catch (error) {
      console.error('❌ [AuthService] Authentication failed:', error.message);
      console.error('❌ [AuthService] Full error:', error);
      throw error;
    }
  }

  /**
   * Get cached session_id or authenticate if needed
   */
  async getValidSession() {
    let sessionId = this.getSessionId();
    console.log(`🔍 [AuthService] getValidSession - current session: ${sessionId || 'undefined'}`);
    
    if (!sessionId) {
      console.log(`🔄 [AuthService] No session found, authenticating...`);
      const result = await this.authenticate();
      return { sessionId: result.sessionId, uid: result.uid };
    }

    // Test session validity
    try {
      const sessionInfo = await this.testSession();
      return { sessionId, uid: sessionInfo.uid };
    } catch (error) {
      // Session invalid, re-authenticate
      console.log('🔄 [AuthService] Session invalid, re-authenticating...');
      const result = await this.authenticate();
      return { sessionId: result.sessionId, uid: result.uid };
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