import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { runDiagnostics } from './services/DiagnosticsService';

const App = () => {
  React.useEffect(() => {
    if (__DEV__) {
      runDiagnostics().then((res) => {
        console.log('🩺 Diagnostics:', res);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App; 