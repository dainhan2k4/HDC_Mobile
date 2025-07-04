import axios from "axios";

// Vui lòng thay thế <YOUR_LOCAL_IP> bằng địa chỉ IP cục bộ của bạn
const API_URL = 'http://192.168.50.104:11018/web/session/authenticate';

export const login = async (email: string, password: string) => {
  const response = await axios.post(API_URL, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      db: 'p2p',
      login: email,
      password: password,
      context: {},
    },
  });

  // Odoo returns the session_id in the 'set-cookie' header
  const setCookieHeader: string[] | undefined = response.headers['set-cookie'];
  let sessionId: string | null = null;

  if (setCookieHeader && setCookieHeader.length > 0) {
    // Example: 'session_id=a_long_session_id; expires=...; path=/'
    const sessionCookie = setCookieHeader[0];
    const match = sessionCookie.match(/session_id=([^;]+)/);
    if (match && match[1]) {
      sessionId = match[1];
    }
  }

  // We return both the original data and the extracted session ID
  return {
    data: response.data,
    sessionId: sessionId,
  };
};

