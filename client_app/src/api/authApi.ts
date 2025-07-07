import { apiService } from '../config/apiService';
import { API_ENDPOINTS } from '../config/apiConfig';

export const login = async (email: string, password: string) => {
  try {
    const response = await apiService.login(email, password);

    const rawResponse = response.rawResponse;
    let sessionId: string | null = null;

    if (rawResponse && rawResponse.headers) {
      const setCookieHeader = (rawResponse.headers as any)['set-cookie'];
      if (setCookieHeader && typeof setCookieHeader === 'string') {
        const match = setCookieHeader.match(/session_id=([^;]+)/);
        if (match && match[1]) {
          sessionId = match[1];
        }
      } else if (Array.isArray(setCookieHeader) && setCookieHeader.length > 0) {
        const match = setCookieHeader[0].match(/session_id=([^;]+)/);
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

