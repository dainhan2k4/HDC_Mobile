import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '@/api/authApi'; // Assuming authApi is in src/api

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
      const { data, sessionId: newSessionId } = await apiLogin(email, password);
      
      if (data.error) {
        throw new Error(data.error.message || 'Login failed');
      }

      if (newSessionId) {
        setSessionId(newSessionId);
        setUser(data.result); // Save user info
        await AsyncStorage.setItem('sessionId', newSessionId);
      } else {
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