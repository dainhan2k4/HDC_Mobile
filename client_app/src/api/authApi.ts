import { apiService } from '../config/apiService';
import { API_ENDPOINTS } from '../config/apiConfig';

export const login = async (email: string, password: string) => {
  try {
    const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
      db: 'p2p',
      login: email,
      password: password,
      context: {},
    });

    const rawResponse = response.rawResponse;
    let sessionId: string | null = null;

    if (rawResponse && rawResponse.headers) {
      // Headers in Fetch API are accessed via the `get` method or iterating
      const setCookieHeader = rawResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        const match = setCookieHeader.match(/session_id=([^;]+)/);
        if (match && match[1]) {
          sessionId = match[1];
        }
      }
    }

    return {
      data: response, // Return the whole response object from apiService
      sessionId: sessionId,
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

