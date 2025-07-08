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
import { useNavigation } from '@react-navigation/native';
import { Fund } from '../types/fund';
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

  const loadFunds = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 [Fund] Starting to load fund data...');
      
      if (API_CONFIG.USE_MIDDLEWARE) {
        console.log('🔄 [Fund] Using middleware API...');
        try {
          const response = await middlewareApiService.getFunds();
          if (response && Array.isArray(response)) {
            setFunds(response);
            if (response.length > 0 && !selectedFund) {
              setSelectedFund(response[0]);
            }
            console.log('✅ [Fund] Middleware data loaded successfully');
            return;
          }
        } catch (middlewareError) {
          console.error('❌ [Fund] Middleware API failed:', middlewareError);
          console.log('🔄 [Fund] Falling back to direct API...');
        }
      }

      try {
        const response = await apiService.getFundData();
        const fundData = response?.data as any;
        if (Array.isArray(fundData) && fundData.length > 0) {
          setFunds(fundData);
          if (!selectedFund) {
            setSelectedFund(fundData[0]);
          }
          console.log('✅ [Fund] Direct API data loaded successfully');
          return;
        }
      } catch (error) {
        console.error('❌ [Fund] Direct API failed:', error);
      }

      // Fallback to demo data
      console.log('⚠️ [Fund] Using demo data for testing...');
      setFunds(demoFunds);
      if (!selectedFund) {
        setSelectedFund(demoFunds[0]);
      }

    } catch (error) {
      console.error('❌ [Fund] Critical error loading funds:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu quỹ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const handleFundSelect = (fund: Fund) => {
    setSelectedFund(fund);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
  };

  const handleBuyFund = () => {
    if (selectedFund) {
      Alert.alert('Mua quỹ', `Chức năng mua quỹ ${selectedFund.name} đang được phát triển.`);
    }
  };

  const handleSellFund = () => {
    if (selectedFund) {
      Alert.alert('Bán quỹ', `Chức năng bán quỹ ${selectedFund.name} đang được phát triển.`);
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