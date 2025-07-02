import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import { LoginScreen } from '../components/auth/LoginScreen';
import { FundListScreen } from '../components/fund/FundListScreen';
import { PortfolioOverviewScreen } from '../screens/portfolio/PortfolioOverviewScreen';

import { SignupScreen } from '../components/auth/SignupScreen';
import { ForgotPasswordScreen } from '../components/auth/ForgotPasswordScreen';
import { FundDetailScreen } from '../components/fund/FundDetailScreen';
import { FundBuyScreen } from '../components/fund/FundBuyScreen';
import { FundSellScreen } from '../components/fund/FundSellScreen';
import { ProfileScreen } from '../components/profile/ProfileScreen';

// Import types
import { PortfolioOverview } from '../types/portfolio';
import { Fund } from '../types/fund';
import { Transaction } from '../types/transaction';

// Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
};

export type MainTabParamList = {
  Portfolio: undefined;
  Funds: undefined;
  Profile: undefined;
};

export type FundStackParamList = {
  FundList: undefined;
  FundDetail: { fundId: number };
  FundBuy: { fundId: number };
  FundSell: { fundId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const FundStack = createNativeStackNavigator<FundStackParamList>();

// Cast components that expect props to a generic ComponentType for navigation
const LoginScreenComponent = LoginScreen as unknown as React.ComponentType<any>;
const FundListScreenComponent = FundListScreen as unknown as React.ComponentType<any>;
const PortfolioOverviewScreenComponent = PortfolioOverviewScreen as unknown as React.ComponentType<any>;
const FundDetailScreenComponent = FundDetailScreen as unknown as React.ComponentType<any>;
const FundBuyScreenComponent = FundBuyScreen as unknown as React.ComponentType<any>;
const FundSellScreenComponent = FundSellScreen as unknown as React.ComponentType<any>;
const ProfileScreenComponent = ProfileScreen as unknown as React.ComponentType<any>;

// Dummy portfolio data
const dummyFunds: Fund[] = [
  {
    id:1,
    ticker:'VFMVN30',
    name:'Fund A',
    description:'Demo',
    current_ytd: 5,
    current_nav: 25000,
    investment_type:'equity',
    current_value:1000000,
    color:'#2B4BFF',
    profit_loss_percentage:5,
    profit_loss:50000,
    created_at:'',
    status:'active' as any,
  } as unknown as Fund,
];
const dummyTransactions: Transaction[] = [];

const dummyPortfolio: PortfolioOverview = {
  total_investment: 1000000,
  total_current_value: 1100000,
  total_profit_loss: 100000,
  total_profit_loss_percentage: 10,
  funds: dummyFunds,
  transactions: dummyTransactions,
  comparisons: [],
};

const PortfolioTabScreen: React.FC = () => (
  <PortfolioOverviewScreen
    portfolio={dummyPortfolio}
    onFundPress={(f)=>{}}
    onTransactionPress={()=>{}}
  />
);

// Cast
const PortfolioTabComponent = PortfolioTabScreen as unknown as React.ComponentType<any>;

// Auth Navigator
const AuthNavigator = ({onAuthenticated}:{onAuthenticated:()=>void}) => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onLogin={(email, password) => {
              // TODO: thực hiện gọi API xác thực thực tế
              onAuthenticated();
            }}
            onNavigateToSignup={() => navigation.navigate('Signup')}
            onNavigateToForgotPassword={() => navigation.navigate('ForgotPassword')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Fund Stack Navigator
const FundStackNavigator = () => {
  return (
    <FundStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FundStack.Screen name="FundList" component={FundListScreenComponent} />
      <FundStack.Screen name="FundDetail" component={FundDetailScreenComponent} />
      <FundStack.Screen name="FundBuy" component={FundBuyScreenComponent} />
      <FundStack.Screen name="FundSell" component={FundSellScreenComponent} />
    </FundStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Portfolio') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Funds') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2B4BFF',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen 
        name="Portfolio" 
        component={PortfolioTabComponent}
        options={{ title: 'Tổng quan', headerShown: true }}
      />
      <MainTab.Screen 
        name="Funds" 
        component={FundStackNavigator}
        options={{ title: 'Quỹ' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreenComponent}
        options={{ title: 'Hồ sơ' }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
export const AppNavigator = () => {
  const [isAuthenticated, setAuthenticated] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthNavigator onAuthenticated={() => setAuthenticated(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 