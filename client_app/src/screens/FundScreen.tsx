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
import { Fund, Investment } from '../types/fund';
import { API_CONFIG } from '../config/apiConfig';
import { middlewareApiService } from '../services/MiddlewareApiService';
import { apiService } from '../config/apiService';
import { useAuth } from '../context/AuthContext';
import { FundListItem, FundDetails, TimeRangeSelector } from '../components/fund';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export const FundScreen: React.FC = () => {
  const navigation = useNavigation();
  const { sessionId, user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M');
  const [isLoading, setIsLoading] = useState(true);

  // Demo data matching the web interface
  const demoFunds: Fund[] = [
    {
      id: 1,
      ticker: 'VCBGROWTH',
      name: 'VCB Growth Fund',
      description: 'Quỹ tăng trưởng VCB - Đầu tư vào các cổ phiếu tăng trưởng cao với tiềm năng sinh lời dài hạn',
      current_ytd: 12.5,
      current_nav: 23000,
      investment_type: 'equity',
      is_shariah: false,
      status: 'active',
      launch_price: 10000,
      currency_id: 1,
      total_units: 2000000,
      total_investment: 46000000000,
      current_value: 48500000000,
      profit_loss: 2500000000,
      profit_loss_percentage: 5.4,
      flex_sip_percentage: 0,
      color: '#2B4BFF',
      previous_nav: 22500,
      flex_units: 0,
      sip_units: 0,
      last_update: '2024-06-01',
      investment_count: 1500,
    },
    {
      id: 2,
      ticker: 'FPTINCOME',
      name: 'FPT Income Fund', 
      description: 'Quỹ thu nhập FPT - Tập trung vào các khoản đầu tư mang lại thu nhập ổn định và bền vững',
      current_ytd: 8.2,
      current_nav: 18000,
      investment_type: 'fixed_income',
      is_shariah: false,
      status: 'active',
      launch_price: 10000,
      currency_id: 1,
      total_units: 1800000,
      total_investment: 32400000000,
      current_value: 33000000000,
      profit_loss: 600000000,
      profit_loss_percentage: 1.9,
      flex_sip_percentage: 0,
      color: '#28A745',
      previous_nav: 17800,
      flex_units: 0,
      sip_units: 0,
      last_update: '2024-06-01',
      investment_count: 1200,
    },
    {
      id: 3,
      ticker: 'VCBBALANCED',
      name: 'VCB Balanced Fund',
      description: 'Quỹ cân bằng VCB - Kết hợp giữa cổ phiếu và trái phiếu để tối ưu hóa rủi ro và lợi nhuận',
      current_ytd: 10.1,
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
      ticker: 'VCBSHARIAH',
      name: 'VCB Shariah Equity Fund',
      description: 'Quỹ cổ phiếu Shariah VCB - Đầu tư tuân thủ các nguyên tắc Hồi giáo với tiềm năng tăng trưởng cao',
      current_ytd: 15.8,
      current_nav: 26000,
      investment_type: 'equity',
      is_shariah: true,
      status: 'active',
      launch_price: 10000,
      currency_id: 1,
      total_units: 1200000,
      total_investment: 31200000000,
      current_value: 32500000000,
      profit_loss: 1300000000,
      profit_loss_percentage: 4.2,
      flex_sip_percentage: 0,
      color: '#FFC107',
      previous_nav: 25200,
      flex_units: 0,
      sip_units: 0,
      last_update: '2024-06-01',
      investment_count: 950,
    },
  ];

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

      // Fallback to mock data
      console.log('⚠️ [Fund] No API response available, using mock data');
      setFunds(demoFunds);
      
      // Still load investments for mock data too
      await loadInvestments();
      
      // Auto-select first fund if none selected
      if (demoFunds.length > 0 && !selectedFund) {
        setSelectedFund(demoFunds[0]);
      }

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
        <ActivityIndicator size="large" color="#2B4BFF" />
        <Text style={styles.loadingText}>Đang tải danh sách quỹ...</Text>
      </View>
    );
  }

  if (isTablet) {
    // Tablet layout: two columns
    return (
      <View style={styles.container}>
        <View style={styles.tabletContainer}>
          {/* Left Panel: Fund List */}
          <View style={styles.leftPanel}>
            <Text style={styles.panelTitle}>Danh mục đầu tư</Text>
            <ScrollView style={styles.fundList} showsVerticalScrollIndicator={false}>
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
          <View style={styles.rightPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
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
  }

  // Mobile layout: stacked
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fund List */}
      <View style={styles.mobileSection}>
        <Text style={styles.sectionTitle}>Danh sách quỹ đầu tư</Text>
        {funds.map((fund) => (
          <FundListItem
            key={fund.id}
            fund={fund}
            isSelected={selectedFund?.id === fund.id}
            onPress={() => handleFundSelect(fund)}
          />
        ))}
      </View>

      {/* Fund Details */}
      {selectedFund && (
        <View style={styles.mobileSection}>
          <FundDetails
            fund={selectedFund}
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
            onBuyFund={handleBuyFund}
            onSellFund={handleSellFund}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  leftPanel: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  fundList: {
    flex: 1,
  },
  mobileSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
}); 