import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

// Import screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { FundListContainer } from '../screens/fund/FundListContainer';
import { PortfolioOverviewContainer } from '../screens/overview/PortfolioOverviewContainer';

import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { FundBuyScreen } from '../screens/fund/FundBuyScreen';
import { FundSellScreen } from '../screens/fund/FundSellScreen';
import { FundDetailContainer } from '../screens/fund/FundDetailContainer';
import { ProfileContainer } from '../screens/profile/ProfileContainer';
import { AssetManagementContainer } from '../screens/asset/AssetManagementContainer';
import { TransactionManagementContainer } from '../screens/transaction/TransactionManagementContainer';
import { useAuth } from '../context/AuthContext';

// Import types
import { PortfolioOverview } from '../types/portfolio';
import { Fund, Investment } from '../types/fund';
import { Transaction } from '../types/transaction';
import { getInvestments } from '../api/fundApi';

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
  Fund_widget: undefined;
  transaction_management: undefined;
  assetmanagement: undefined;
  personal_profile: undefined;
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
const FundListContainerComponent = FundListContainer as unknown as React.ComponentType<any>;
const PortfolioOverviewContainerComponent = PortfolioOverviewContainer as unknown as React.ComponentType<any>;
const FundDetailContainerComponent = FundDetailContainer as unknown as React.ComponentType<any>;
const FundBuyScreenComponent = FundBuyScreen as unknown as React.ComponentType<any>;
const FundSellScreenComponent = FundSellScreen as unknown as React.ComponentType<any>;
const ProfileContainerComponent = ProfileContainer as unknown as React.ComponentType<any>;
const AssetManagementContainerComponent = AssetManagementContainer as unknown as React.ComponentType<any>;
const TransactionManagementContainerComponent = TransactionManagementContainer as unknown as React.ComponentType<any>;

// Dummy portfolio data
const dummyFunds: Fund[] = [
  {
    id: 1,
    ticker: 'VFMVN30',
    name: 'Vietnam VN30 Fund',
    description: 'Quỹ đầu tư chỉ số VN30 - Đầu tư vào 30 cổ phiếu vốn hóa lớn nhất thị trường chứng khoán Việt Nam',
    current_ytd: 8.5,
    current_nav: 25000,
    investment_type: 'equity',
    is_shariah: false,
    status: 'active',
    launch_price: 10000,
    currency_id: 1,
    total_units: 1000000,
    total_investment: 25000000000,
    current_value: 26250000000,
    profit_loss: 1250000000,
    profit_loss_percentage: 5,
    flex_sip_percentage: 0,
    color: '#2B4BFF',
    previous_nav: 24000,
    flex_units: 0,
    sip_units: 0,
    last_update: '2024-06-01',
    investment_count: 1250,
  },
  {
    id: 2,
    ticker: 'VFMVF4',
    name: 'Vietnam Value Fund',
    description: 'Quỹ đầu tư giá trị Việt Nam - Đầu tư vào các cổ phiếu có giá trị nội tại tốt và tiềm năng tăng trưởng cao',
    current_ytd: 6.2,
    current_nav: 20000,
    investment_type: 'fixed_income',
    is_shariah: false,
    status: 'active',
    launch_price: 10000,
    currency_id: 1,
    total_units: 2000000,
    total_investment: 40000000000,
    current_value: 41200000000,
    profit_loss: 1200000000,
    profit_loss_percentage: 3,
    flex_sip_percentage: 0,
    color: '#FF5733',
    previous_nav: 19500,
    flex_units: 0,
    sip_units: 0,
    last_update: '2024-06-01',
    investment_count: 950,
  },
  {
    id: 3,
    ticker: 'VFMVSF',
    name: 'Vietnam Strategic Fund',
    description: 'Quỹ đầu tư chiến lược Việt Nam - Đầu tư vào các doanh nghiệp có lợi thế cạnh tranh bền vững',
    current_ytd: 7.8,
    current_nav: 22500,
    investment_type: 'balanced',
    is_shariah: false,
    status: 'active',
    launch_price: 10000,
    currency_id: 1,
    total_units: 1500000,
    total_investment: 33750000000,
    current_value: 35000000000,
    profit_loss: 1250000000,
    profit_loss_percentage: 3.7,
    flex_sip_percentage: 0,
    color: '#33FF57',
    previous_nav: 21800,
    flex_units: 0,
    sip_units: 0,
    last_update: '2024-06-01',
    investment_count: 1100,
  },
  {
    id: 4,
    ticker: 'VFMBOND',
    name: 'Vietnam Bond Fund',
    description: 'Quỹ trái phiếu Việt Nam - Đầu tư vào trái phiếu chính phủ và trái phiếu doanh nghiệp có xếp hạng tín nhiệm tốt',
    current_ytd: 4.5,
    current_nav: 15000,
    investment_type: 'fixed_income',
    is_shariah: false,
    status: 'active',
    launch_price: 10000,
    currency_id: 1,
    total_units: 3000000,
    total_investment: 45000000000,
    current_value: 46000000000,
    profit_loss: 1000000000,
    profit_loss_percentage: 2.2,
    flex_sip_percentage: 0,
    color: '#FFA500',
    previous_nav: 14800,
    flex_units: 0,
    sip_units: 0,
    last_update: '2024-06-01',
    investment_count: 1800,
  },
  {
    id: 5,
    ticker: 'VFMREIT',
    name: 'Vietnam Real Estate Fund',
    description: 'Quỹ bất động sản Việt Nam - Đầu tư vào các dự án bất động sản và cổ phiếu bất động sản tiềm năng',
    current_ytd: 5.8,
    current_nav: 18000,
    investment_type: 'real_estate',
    is_shariah: false,
    status: 'active',
    launch_price: 10000,
    currency_id: 1,
    total_units: 2500000,
    total_investment: 45000000000,
    current_value: 46500000000,
    profit_loss: 1500000000,
    profit_loss_percentage: 3.3,
    flex_sip_percentage: 0,
    color: '#9370DB',
    previous_nav: 17500,
    flex_units: 0,
    sip_units: 0,
    last_update: '2024-06-01',
    investment_count: 1450,
  },
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
// Cast
const PortfolioTabComponent = PortfolioOverviewContainerComponent as unknown as React.ComponentType<any>;

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreenComponent} />
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
      <FundStack.Screen name="FundList" component={FundListContainerComponent} />
      <FundStack.Screen name="FundDetail" component={FundDetailContainerComponent} />
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
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline'; // Default value

          if (route.name === 'Portfolio') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline'; // Tổng quan: biểu đồ tròn
          } else if (route.name === 'Fund_widget') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'; // Sản phẩm đầu tư: biểu đồ cột
          } else if (route.name === 'transaction_management') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline'; // Giao dịch: mũi tên chuyển đổi
          } else if (route.name === 'assetmanagement') {
            iconName = focused ? 'wallet' : 'wallet-outline'; // Quản lý tài sản: ví
          } else if (route.name === 'personal_profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline'; // Hồ sơ cá nhân: avatar
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2B4BFF',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
          paddingBottom: 0,
          paddingTop: 0,
          height: 70,
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
        name="Fund_widget" 
        component={FundStackNavigator}
        options={{ title: 'Sản phẩm đầu tư' }}
      />
      <MainTab.Screen 
        name="assetmanagement" 
        component={AssetManagementContainerComponent}
        options={{ title: 'Quản lý tài sản' }}
      />
      <MainTab.Screen 
        name="transaction_management" 
        component={TransactionManagementContainerComponent}
        options={{ title: 'Giao dịch' }}
      />
      <MainTab.Screen 
        name="personal_profile" 
        component={ProfileContainerComponent}
        options={{ title: 'Hồ sơ cá nhân' }}
      />
      
      </MainTab.Navigator>
  );
};

// Root Navigator
export const AppNavigator = () => {
  const { sessionId, isLoading } = useAuth();

  if (isLoading) {
    // We haven't finished checking for the session yet
    // You can render a splash screen or loading indicator here
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sessionId ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 