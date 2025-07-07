import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { FundDetailScreen } from './FundDetailScreen';
import { Fund } from '../../types/fund';
import { mockFunds } from '../../config/mockData';

type FundDetailRouteProp = RouteProp<{
  FundDetail: { fundId: number };
}, 'FundDetail'>;

export const FundDetailContainer: React.FC = () => {
  const route = useRoute<FundDetailRouteProp>();
  const { fundId } = route.params;
  const [fund, setFund] = useState<Fund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFundDetail = async () => {
    try {
      setIsLoading(true);
      
      // Sử dụng mock data thay vì gọi API
      setTimeout(() => {
        const fund = mockFunds.find(f => f.id === fundId);
        setFund(fund || null);
        setIsLoading(false);
      }, 1000); // Simulate loading time
      
    } catch (error: any) {
      console.error('Error loading fund detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin quỹ');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFundDetail();
  }, [fundId]);

  return (
    <FundDetailScreen 
      fund={fund}
      isLoading={isLoading}
    />
  );
}; 