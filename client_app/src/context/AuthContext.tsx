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
        }
      } catch (e) {
        // Restoring token failed
        console.error('Failed to load session from storage', e);
      }

      // After restoring token, prevent the splash screen from hiding
      setSessionId(userSessionId);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: response, sessionId: newSessionId } = await apiLogin(email, password);
      
      if (response.error) {
        throw new Error(response.message || 'Login failed');
      }

      if (newSessionId) {
        setSessionId(newSessionId);
        // Set session ID in ApiService for future API calls
        apiService.setSessionId(newSessionId);
        // Cast the user data to the specific type
        const userData = response.data as { result: OdooLoginResult };
        setUser(userData.result); 
        await AsyncStorage.setItem('sessionId', newSessionId);
      } else {
        // Try to get session ID from response headers
        const rawResponse = response.rawResponse;
        if (rawResponse && rawResponse.headers) {
          const setCookieHeader = (rawResponse.headers as any)['set-cookie'];
          if (setCookieHeader && typeof setCookieHeader === 'string') {
            const match = setCookieHeader.match(/session_id=([^;]+)/);
            if (match && match[1]) {
              const extractedSessionId = match[1];
              setSessionId(extractedSessionId);
              apiService.setSessionId(extractedSessionId);
              const userData = response.data as { result: OdooLoginResult };
              setUser(userData.result);
              await AsyncStorage.setItem('sessionId', extractedSessionId);
              return;
            }
          }
        }
        throw new Error('Could not retrieve session ID');
      }
    } catch (error) {
      // Re-throw the error to be caught by the calling component (e.g., LoginScreen)
      console.error('Sign in failed', error);
      throw error;
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