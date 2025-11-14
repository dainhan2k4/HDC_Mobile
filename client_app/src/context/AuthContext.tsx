import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '@/api/authApi'; // Assuming authApi is in src/api
import { apiService } from '@/config/apiService';

// Define the shape for the Odoo login response result
interface OdooLoginResult {
  uid: number;
  is_system: boolean;
  is_admin: boolean;
  user_context: object;
  db: string;
  server_version: string;
  server_version_info: number[];
  name: string;
  username: string;
  partner_display_name: string;
  company_id: number;
  partner_id: number;
  web_tours: any[];
  notification_type: string;
  // Add other fields from Odoo's response as needed
}

// Define the shape of the context state
interface AuthContextType {
  sessionId: string | null;
  user: any | null; // Replace 'any' with a proper user type later
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session from storage on app start
    const bootstrapAsync = async () => {
      let userSessionId: string | null = null;
      try {
        userSessionId = await AsyncStorage.getItem('sessionId');
        if (userSessionId) {
          // Set session ID in ApiService if found
          apiService.setSessionId(userSessionId);
          console.log('✅ [AuthContext] Restored session ID from storage:', userSessionId.substring(0, 10) + '...');
        } else {
          console.log('ℹ️ [AuthContext] No session ID found in storage');
        }
      } catch (e) {
        // Restoring token failed
        console.error('❌ [AuthContext] Failed to load session from storage', e);
      }

      // After restoring token, prevent the splash screen from hiding
      setSessionId(userSessionId);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Starting login process...');
      const loginResponse = await apiService.login(email, password);
      console.log('🔐 [AuthContext] Login response:', loginResponse);
      
      if (!loginResponse.success) {
        throw new Error('Login failed');
      }

      // Get session ID from ApiService
      const authStatus = apiService.getAuthStatus();
      console.log('🔐 [AuthContext] Auth status after login:', authStatus);
      
      // Try multiple ways to get session ID
      let sessionId: string | null = null;
      
      // Method 1: From ApiService private property
      if (authStatus.hasSessionId) {
        sessionId = apiService.getSessionId();
        console.log('✅ [AuthContext] Got session ID from getSessionId():', sessionId);
      }
      
      // Method 2: From login response data
      if (!sessionId && loginResponse.data?.result?.session_id) {
        sessionId = loginResponse.data.result.session_id;
        console.log('✅ [AuthContext] Got session ID from response:', sessionId);
        apiService.setSessionId(sessionId);
      }
      
      // Method 3: Try to extract from raw response headers
      if (!sessionId && loginResponse.rawResponse) {
        const rawRes = loginResponse.rawResponse as any;
        const setCookie = rawRes?.headers?.['set-cookie'] || rawRes?.headers?.['Set-Cookie'];
        if (setCookie) {
          const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
          const match = /session_id=([^;]+)/.exec(cookieStr);
          if (match) {
            sessionId = match[1];
            console.log('✅ [AuthContext] Got session ID from headers:', sessionId);
            apiService.setSessionId(sessionId);
          }
        }
      }
      
      if (sessionId) {
        setSessionId(sessionId);
        setUser({ 
          id: 1, 
          email: email,
          name: email,
          db: loginResponse.data?.result?.db || 'odoo'
        });
        await AsyncStorage.setItem('sessionId', sessionId);
        console.log('✅ [AuthContext] Login successful, session saved to storage');
      } else {
        console.error('❌ [AuthContext] Could not retrieve session ID from any source');
        throw new Error('Could not retrieve session ID');
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign in failed:', error);
      throw new Error(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
    }
  };

  const signOut = async () => {
    setSessionId(null);
    setUser(null);
    // Clear session from ApiService
    apiService.clearTokens();
    await AsyncStorage.removeItem('sessionId');
  };

  const value = {
    sessionId,
    user,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 