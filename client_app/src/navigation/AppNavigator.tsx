import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

// Import navigators
import { AuthNavigator, MainTabNavigator, FundNavigator } from './navigators';

// Import screens
import { FundBuyScreen } from '../screens/fund/FundBuyScreen';
import { FundSellScreen } from '../screens/fund/FundSellScreen';
import { FundPaymentScreen } from '../screens/fund/FundPaymentScreen';
import { PaymentSuccessScreen } from '../screens/fund/PaymentSuccessScreen';
import SignatureScene from '../screens/Signature/SignatureScene';
import { ContractViewerWrapper } from './components/ContractViewerWrapper';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import KycScreen from '../screens/kyc/KycScreen';
import FaceDetectionScreen from '../screens/kyc/FaceDetectionScreen';

// Import types
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Root Navigator
export const AppNavigator = () => {
  const { sessionId, isLoading } = useAuth();
  const navigationRef = React.useRef(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={sessionId ? "Main" : "Auth"} screenOptions={{ headerShown: false }}>
          {sessionId ? (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="FundBuy" component={FundBuyScreen} />
              <Stack.Screen name="FundSell" component={FundSellScreen} />
              <Stack.Screen name="FundPayment" component={FundPaymentScreen} />
              <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
              <Stack.Screen name="SignatureScene" component={SignatureScene} />
              <Stack.Screen name="ContractViewer" component={ContractViewerWrapper} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="Kyc" component={KycScreen} />
              <Stack.Screen name="FaceDetection" component={FaceDetectionScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
    </NavigationContainer>
  );
}; 