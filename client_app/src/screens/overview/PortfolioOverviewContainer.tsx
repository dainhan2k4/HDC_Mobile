import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PortfolioOverviewScreen } from './PortfolioOverviewScreen';
import { PortfolioOverview } from '../../types/portfolio';
import { Investment } from '../../types/fund';
import { apiService } from '../../config/apiService';

export const PortfolioOverviewContainer: React.FC = () => {
  const navigation = useNavigation();
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      
      // Load portfolio overview - vẫn sử dụng API thực
      const portfolioResponse = await apiService.getPortfolioOverview();
      if (portfolioResponse.success && portfolioResponse.data) {
        setPortfolio(portfolioResponse.data);
      } else {
        // Fallback to mock data if API fails
        setPortfolio({
          total_investment: 1000000,
          total_current_value: 1100000,
          total_profit_loss: 100000,
          total_profit_loss_percentage: 10,
          funds: [],
          transactions: [],
          comparisons: [],
        });
      }

      // Load investments - vẫn sử dụng API thực
      const investmentsResponse = await apiService.getInvestments();
      if (investmentsResponse.success && investmentsResponse.data) {
        setInvestments(investmentsResponse.data);
      } else {
        // Fallback to mock data if API fails
        setInvestments([]);
      }
    } catch (error: any) {
      console.error('Error loading portfolio data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu danh mục đầu tư');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const handleFundPress = (fund: any) => {
    navigation.navigate('FundDetail', { fundId: fund.id });
  };

  const handleTransactionPress = (transaction: any) => {
    // Navigate to transaction detail if needed
    console.log('Transaction pressed:', transaction);
  };

  if (isLoading) {
    return null; // Or show loading screen
  }

  return (
    <PortfolioOverviewScreen
      portfolio={portfolio || {
        total_investment: 0,
        total_current_value: 0,
        total_profit_loss: 0,
        total_profit_loss_percentage: 0,
      }}
      fundsInvested={investments}
      onFundPress={handleFundPress}
      onTransactionPress={handleTransactionPress}
    />
  );
}; 