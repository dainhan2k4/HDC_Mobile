import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Fund, Investment } from '../../types/fund';
import { API_CONFIG } from '../../config/apiConfig';
import { middlewareApiService } from '../../services/MiddlewareApiService';
import { apiService } from '../../config/apiService';
import { useAuth } from '../../context/AuthContext';
import { FundListItem, FundDetails, TimeRangeSelector } from '../../components/fund';
import { AppColors } from '../../styles/GlobalTheme';
import { GradientView } from '../../components/common/GradientView';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive breakpoints
const getLayoutConfig = () => {
  if (screenWidth >= 1024) {
    return { 
      type: 'desktop',
      leftPanelFlex: 0.35,
      rightPanelFlex: 0.65,
      gap: 24,
      padding: 24
    };
  }
  if (screenWidth >= 768) {
    return { 
      type: 'tablet',
      leftPanelFlex: 0.4,
      rightPanelFlex: 0.6,
      gap: 20,
      padding: 16
    };
  }
  if (screenWidth >= 400) {
    return { 
      type: 'mobile-large',
      leftPanelFlex: 0.42,
      rightPanelFlex: 0.58,
      gap: 12,
      padding: 12
    };
  }
  return { 
    type: 'mobile-small',
    leftPanelFlex: 0.45,
    rightPanelFlex: 0.55,
    gap: 8,
    padding: 8
  };
};

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export const FundScreen: React.FC = () => {
  const navigation = useNavigation();
  const { sessionId, user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [layoutConfig] = useState(getLayoutConfig());

  

  // Merge funds with user investment data
  const mergeFundsWithInvestments = (funds: Fund[], investments: Investment[]) => {
    return funds.map(fund => {
      const userInvestment = investments.find(inv => inv.fund_id === fund.id);
      
      if (userInvestment) {
        // User has investment in this fund
        const currentValue = userInvestment.units * fund.current_nav;
        const profitLoss = currentValue - userInvestment.amount;
        const profitLossPercentage = userInvestment.amount > 0 ? (profitLoss / userInvestment.amount) * 100 : 0;
        
        return {
          ...fund,
          total_units: userInvestment.units,
          total_investment: userInvestment.amount,
          current_value: currentValue,
          profit_loss: profitLoss,
          profit_loss_percentage: profitLossPercentage,
        };
      }
      
      // User has no investment in this fund
      return {
        ...fund,
        total_units: 0,
        total_investment: 0,
        current_value: 0,
        profit_loss: 0,
        profit_loss_percentage: 0,
      };
    });
  };

  const loadFunds = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [Fund] Loading funds...');
      
      if (API_CONFIG.USE_MIDDLEWARE) {
        try {
          const response = await middlewareApiService.getFunds();
          if (response && Array.isArray(response)) {
            setFunds(response);
            console.log('✅ [Fund] Middleware funds loaded successfully:', response.length);
            
            // Load investments to merge with fund data
            await loadInvestments();
            
            // Auto-select first fund if none selected
            if (response.length > 0 && !selectedFund) {
              setSelectedFund(response[0]);
            }
            return;
          }
        } catch (middlewareError) {
          console.error('❌ [Fund] Middleware funds failed:', middlewareError);
        }
      }

      try {
        const response = await apiService.getFundData();
        console.log('🔄 [Fund] Direct API response:', response);
        
        const fundData = response?.data as any;
        if (Array.isArray(fundData)) {
          setFunds(fundData);
          console.log('✅ [Fund] Direct API funds loaded successfully:', fundData.length);
          
          // Load investments to merge with fund data
          await loadInvestments();
          
          // Auto-select first fund if none selected
          if (fundData.length > 0 && !selectedFund) {
            setSelectedFund(fundData[0]);
          }
          return;
        }
      } catch (directError) {
        console.error('❌ [Fund] Direct API failed:', directError);
      }

      
      
      // Still load investments for mock data too
      await loadInvestments();
      
     

    } catch (error) {
      console.error('❌ [Fund] Critical error loading funds:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu quỹ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvestments = async () => {
    try {
      console.log('🔄 [Fund] Loading user investments...');
      
      if (API_CONFIG.USE_MIDDLEWARE) {
        try {
          const response = await middlewareApiService.getLegacyPortfolioData();
          if (response && response.investments) {
            setInvestments(response.investments);
            console.log('✅ [Fund] Middleware investments loaded successfully');
            
            // Merge with current funds
            setFunds(currentFunds => mergeFundsWithInvestments(currentFunds, response.investments));
            return;
          }
        } catch (middlewareError) {
          console.error('❌ [Fund] Middleware investments failed:', middlewareError);
        }
      }

      try {
        const response = await apiService.getInvestments();
        const investmentData = response?.data as any;
        if (Array.isArray(investmentData)) {
          const mappedInvestments = investmentData.map((record: any) => ({
            id: record.id,
            fund_id: record.fund_id || record.id,
            fund_name: record.fund_name || record.name || `Fund ${record.id}`,
            fund_ticker: record.fund_ticker || record.ticker || `F${record.id}`,
            units: record.units || 0,
            amount: record.amount || 0,
            current_nav: record.current_nav || 10000,
            investment_type: record.investment_type || 'equity',
          }));
          setInvestments(mappedInvestments);
          console.log('✅ [Fund] Direct API investments loaded successfully');
          
          // Merge with current funds
          setFunds(currentFunds => mergeFundsWithInvestments(currentFunds, mappedInvestments));
          return;
        }
      } catch (error) {
        console.error('❌ [Fund] Direct API investments failed:', error);
      }

      console.log('⚠️ [Fund] No investment data available');
      setInvestments([]);
      
      // Still merge with empty investments to reset fund data
      setFunds(currentFunds => mergeFundsWithInvestments(currentFunds, []));
      
    } catch (error) {
      console.error('❌ [Fund] Critical error loading investments:', error);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 [Fund] Screen focused, refreshing data...');
      loadFunds();
    }, [])
  );

  const handleFundSelect = (fund: Fund) => {
    setSelectedFund(fund);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
  };

  const handleBuyFund = () => {
    if (selectedFund) {
      console.log(`🟢 [Fund] Navigate to buy fund ${selectedFund.id}: ${selectedFund.name}`);
      try {
        (navigation as any).navigate('FundBuy', {
          fundId: selectedFund.id,
          fundName: selectedFund.name,
          currentNav: selectedFund.current_nav
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Thông báo', 'Không thể mở màn hình mua quỹ');
      }
    }
  };

  const handleSellFund = async () => {
    if (selectedFund) {
      console.log(`🔴 [Fund] Navigate to sell fund ${selectedFund.id}: ${selectedFund.name}`);
      
      // Refresh investment data before validating sell
      console.log('🔄 [Fund] Refreshing investment data before sell validation...');
      await loadInvestments();
      
      // Get user's current holdings for this fund
      const userInvestment = investments.find(inv => inv.fund_id === selectedFund.id);
      console.log(`🔍 [Fund] User investment for fund ${selectedFund.id}:`, userInvestment);
      console.log(`🔍 [Fund] All current investments:`, investments.map(inv => ({
        fund_id: inv.fund_id,
        fund_name: inv.fund_name,
        units: inv.units
      })));
      
      if (!userInvestment || userInvestment.units <= 0) {
        Alert.alert(
          'Thông báo', 
          `Bạn chưa có khoản đầu tư nào vào quỹ ${selectedFund.name}. Vui lòng mua quỹ trước khi bán.`
        );
        return;
      }
      
      try {
        (navigation as any).navigate('FundSell', {
          fundId: selectedFund.id,
          fundName: selectedFund.name,
          currentUnits: userInvestment.units,
          currentNav: selectedFund.current_nav
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Thông báo', 'Không thể mở màn hình bán quỹ');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.secondary.main} />
        <Text style={styles.loadingText}>Đang tải danh sách quỹ...</Text>
      </View>
    );
  }

  // Universal two-column layout for all screen sizes
  return (
    <View style={styles.container}>
      {/* Responsive header */}
      <GradientView gradientType="header" style={styles.responsiveHeader}>
        <Text style={[
          styles.headerTitle, 
          layoutConfig.type.startsWith('mobile') && styles.mobileHeaderTitle
        ]}>
          Quỹ đầu tư  
        </Text>
      </GradientView>

      <View style={[
        styles.twoColumnContainer,
        {
          padding: layoutConfig.padding,
          gap: layoutConfig.gap,
        }
      ]}>
        {/* Left Panel: Fund List */}
        <View style={[
          styles.leftPanel,
          { flex: layoutConfig.leftPanelFlex },
          layoutConfig.type.startsWith('mobile') && styles.mobileLeftPanel
        ]}>
          {/* Panel Header */}
          <View style={[
            styles.panelHeader,
            { backgroundColor: AppColors.background.primary },
            layoutConfig.type.startsWith('mobile') && styles.mobilePanelHeader
          ]}>
            <Text style={[
              styles.panelTitle,
              layoutConfig.type.startsWith('mobile') && styles.mobilePanelTitle
            ]}>
              {layoutConfig.type.startsWith('mobile') ? 'Quỹ' : 'Danh sách quỹ đầu tư'}
            </Text>
            <View style={styles.fundCount}>
              <Text style={[
                styles.fundCountText,
                layoutConfig.type.startsWith('mobile') && styles.mobileFundCountText
              ]}>
                {funds.length}
              </Text>
            </View>
          </View>
          
          {/* Fund List */}
          <ScrollView 
            style={styles.fundListScrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.fundListContent,
              layoutConfig.type.startsWith('mobile') && styles.mobileFundListContent
            ]}
          >
            {funds.map((fund) => (
              <FundListItem
                key={fund.id}
                fund={fund}
                isSelected={selectedFund?.id === fund.id}
                onPress={() => handleFundSelect(fund)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Right Panel: Fund Details */}
        <View style={[
          styles.rightPanel,
          { flex: layoutConfig.rightPanelFlex },
          layoutConfig.type.startsWith('mobile') && styles.mobileRightPanel
        ]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.rightPanelContent,
              layoutConfig.type.startsWith('mobile') && styles.mobileRightPanelContent
            ]}
          >
            <FundDetails
              fund={selectedFund}
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
              onBuyFund={handleBuyFund}
              onSellFund={handleSellFund}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.text.secondary,
    fontWeight: '500',
  },

  // Responsive Header
  responsiveHeader: {
    backgroundColor: AppColors.background.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileHeader: {
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text.inverse,
    letterSpacing: 0.5,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  headerSubtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.text.inverse,
  },
  mobileHeaderSubtitleText: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // Two Column Layout
  twoColumnContainer: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },

  // Left Panel Styles
  leftPanel: {
    backgroundColor: AppColors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileLeftPanel: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },

  panelHeader: {
    backgroundColor: AppColors.background.secondary,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobilePanelHeader: {
    padding: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.primary,
    letterSpacing: 0.3,
  },
  mobilePanelTitle: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  fundCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  fundCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.inverse,
  },
  mobileFundCountText: {
    fontSize: 10,
  },

  fundListScrollView: {
    flex: 1,
  },
  fundListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  mobileFundListContent: {
    padding: 8,
    paddingBottom: 16,
  },

  // Right Panel Styles
  rightPanel: {
    backgroundColor: AppColors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileRightPanel: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  rightPanelContent: {
    padding: 20,
    minHeight: screenHeight * 0.7,
  },
  mobileRightPanelContent: {
    padding: 12,
    minHeight: screenHeight * 0.6,
  },
}); 