import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PortfolioScreen } from '../../screens/overview/PortfolioScreen';
import { FundScreen } from '../../screens/fund/FundScreen';
import { AssetManagementContainer } from '../../screens/asset/AssetManagementContainer';
import { TransactionManagementContainer } from '../../screens/transaction/TransactionManagementContainer';
import { ProfileContainer } from '../../screens/profile/ProfileContainer';
import { MainTabParamList } from '../../types/navigation';

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

          if (route.name === 'Portfolio') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Fund_widget') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'transaction_management') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'assetmanagement') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'personal_profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
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
        component={PortfolioScreen}
        options={{ title: 'Tổng quan', headerShown: true }}
      />
      <MainTab.Screen 
        name="Fund_widget" 
        component={FundScreen}
        options={{ title: 'Sản phẩm đầu tư' }}
      />
      <MainTab.Screen 
        name="assetmanagement" 
        component={AssetManagementContainer}
        options={{ title: 'Quản lý tài sản' }}
      />
      <MainTab.Screen 
        name="transaction_management" 
        component={TransactionManagementContainer}
        options={{ title: 'Giao dịch' }}
      />
      <MainTab.Screen 
        name="personal_profile" 
        component={ProfileContainer}
        options={{ title: 'Hồ sơ cá nhân' }}
      />
    </MainTab.Navigator>
  );
}; 