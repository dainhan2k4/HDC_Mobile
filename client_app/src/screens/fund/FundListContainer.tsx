import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FundListScreen } from './FundListScreen';
import { Fund } from '../../types/fund';
import { mockFunds } from '../../config/mockData';

export const FundListContainer: React.FC = () => {
  const navigation = useNavigation();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFunds = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Sử dụng mock data thay vì gọi API
      setTimeout(() => {
        setFunds(mockFunds);
        setIsLoading(false);
        setIsRefreshing(false);
      }, 1000); // Simulate loading time
      
    } catch (error: any) {
      console.error('Error loading funds:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách quỹ');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const handleRefresh = () => {
    loadFunds(true);
  };

  const handleFundPress = (fund: Fund) => {
    navigation.navigate('FundDetail', { fundId: fund.id });
  };

  const handleBuyPress = (fund: Fund) => {
    navigation.navigate('FundBuy', { fundId: fund.id });
  };

  const handleSellPress = (fund: Fund) => {
    navigation.navigate('FundSell', { fundId: fund.id });
  };

  return (
    <FundListScreen
      funds={funds}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onFundPress={handleFundPress}
      onBuyPress={handleBuyPress}
      onSellPress={handleSellPress}
    />
  );
}; 