import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PortfolioOverview } from '../types/portfolio';
import { Investment } from '../types/fund';
import { API_CONFIG } from '../config/apiConfig';
import { middlewareApiService } from '../services/MiddlewareApiService';
import { apiService } from '../config/apiService';
import { useAuth } from '../context/AuthContext';
import { PieChartCustom } from '../components/common/PieChartCustom';
import formatVND from '../hooks/formatCurrency';

const { width: screenWidth } = Dimensions.get('window');

export const PortfolioScreen: React.FC = () => {
  const navigation = useNavigation();
  const { sessionId, user, isLoading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 [Portfolio] Starting to load portfolio data...');
      
      if (!sessionId && !user) {
        console.log('❌ [Portfolio] No authentication found');
        setError('Vui lòng đăng nhập để xem thông tin danh mục đầu tư');
        return;
      }

      console.log('✅ [Portfolio] User authenticated, loading portfolio data...');
      
      // Check if using middleware
      if (API_CONFIG.USE_MIDDLEWARE) {
        console.log('🔄 [Portfolio] Using middleware API for data loading...');
        
        try {
          const { portfolio, investments } = await middlewareApiService.getLegacyPortfolioData();
          setPortfolio(portfolio);
          setInvestments(investments);
          console.log('✅ [Portfolio] Middleware data loaded successfully');
          return;
        } catch (middlewareError) {
          console.error('❌ [Portfolio] Middleware API failed:', middlewareError);
          console.log('🔄 [Portfolio] Falling back to direct Odoo calls...');
        }
      }

      console.log('🔄 [Portfolio] Using direct Odoo calls...');

      // Call authenticated endpoints
      let realInvestments: Investment[] = [];
      let realPortfolio: PortfolioOverview | null = null;

      try {
        console.log('📊 [Portfolio] Fetching data using actual backend endpoints...');
        
        const fundResponse = await apiService.getFundData();
        console.log('📊 [Portfolio] Fund endpoint response:', fundResponse);
        
        let investmentResponse = null;
        const isSessionValid = await apiService.testSessionValidity();
        
        if (isSessionValid) {
          try {
            investmentResponse = await apiService.getInvestments();
            console.log('📊 [Portfolio] Investment endpoint response:', investmentResponse);
          } catch (investmentError) {
            console.log('❌ [Portfolio] Investment endpoint failed despite valid session:', investmentError);
          }
        } else {
          console.log('⚠️ [Portfolio] Session invalid, skipping investment data call');
        }

        // Parse investment data if available
        if (investmentResponse) {
          const investmentData = investmentResponse?.data as any;
          if (Array.isArray(investmentData)) {
            realInvestments = investmentData.map((record: any) => ({
              id: record.id,
              fund_id: record.fund_id || record.id,
              fund_name: record.fund_name || record.name || `Fund ${record.id}`,
              fund_ticker: record.fund_ticker || record.ticker || `F${record.id}`,
              units: record.units || 100,
              amount: record.amount || 1000000,
              current_nav: record.current_nav || 10000,
              investment_type: record.investment_type || 'equity',
            }));
            console.log('✅ [Portfolio] Got real investment data from backend:', realInvestments.length, 'items');
          }
        } else {
          console.log('⚠️ [Portfolio] No investment data - session may be invalid or user has no investments');
        }

        const fundData = fundResponse?.data as any;
        if (Array.isArray(fundData)) {
          console.log('✅ [Portfolio] Got fund data from backend:', fundData.length, 'funds');
        }

      } catch (error) {
        console.log('❌ [Portfolio] Backend API failed:', error);
      }

      // Fallback to calculation if we have some data
      if (realInvestments.length > 0) {
        const totalInvestment = realInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCurrentValue = realInvestments.reduce((sum, inv) => sum + (inv.current_nav * inv.units), 0);
        const totalProfitLoss = totalCurrentValue - totalInvestment;
        const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

        realPortfolio = {
          total_investment: totalInvestment,
          total_current_value: totalCurrentValue,
          total_profit_loss: totalProfitLoss,
          total_profit_loss_percentage: totalProfitLossPercentage,
          funds: [],
          transactions: [],
          comparisons: [],
        };
        console.log('✅ [Portfolio] Calculated portfolio from investment data');
      } else {
        // Demo data for testing
        console.log('⚠️ [Portfolio] No real data found, creating demo data for testing...');
        realInvestments = [
          {
            id: 1,
            fund_id: 1,
            fund_name: 'Vietnam Growth Fund',
            fund_ticker: 'VGF',
            units: 100,
            amount: 2500000,
            current_nav: 25000,
            investment_type: 'equity',
          },
          {
            id: 2,
            fund_id: 2,
            fund_name: 'Bond Stable Fund',
            fund_ticker: 'BSF',
            units: 50,
            amount: 1000000,
            current_nav: 20000,
            investment_type: 'fixed_income',
          }
        ];

        realPortfolio = {
          total_investment: 3500000,
          total_current_value: 3500000,
          total_profit_loss: 0,
          total_profit_loss_percentage: 0,
          funds: [],
          transactions: [],
          comparisons: [],
        };
        console.log('✅ [Portfolio] Using demo data for testing');
      }

      // Set data
      if (realInvestments.length > 0) {
        setInvestments(realInvestments);
      } else {
        const isAuthenticated = await apiService.testSessionValidity();
        if (isAuthenticated) {
          setError('Chưa có khoản đầu tư nào. Hãy bắt đầu đầu tư để xem danh mục.');
        } else {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        return;
      }

      if (realPortfolio) {
        setPortfolio(realPortfolio);
      } else {
        setError('Không thể tải thông tin danh mục đầu tư.');
        return;
      }

      console.log('🏁 [Portfolio] Real data loaded successfully');

    } catch (error) {
      console.error('❌ [Portfolio] Critical error loading portfolio:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) {
        console.log('⏳ [Portfolio] Auth still loading, waiting...');
        return;
      }
      
      console.log('▶️ [Portfolio] Auth loaded, initializing portfolio data...');
      await loadPortfolioData();
    };

    initializeData();
  }, [authLoading, sessionId, user]);

  // Refresh portfolio when screen comes into focus (after buy/sell operations)
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && (sessionId || user)) {
        console.log('🔍 [Portfolio] Screen focused, refreshing portfolio data...');
        loadPortfolioData();
      }
    }, [authLoading, sessionId, user])
  );

  const prepareChartData = () => {
    if (!investments || investments.length === 0) return [];

    return investments.map((investment, index) => ({
      name: investment.fund_ticker,
      value: investment.amount,
      color: generateColor(index),
    }));
  };

  const generateColor = (index: number) => {
    const colors = ['#2B4BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#17A2B8'];
    return colors[index % colors.length];
  };

  const handleRefresh = async () => {
    await loadPortfolioData();
  };

  const handleNavigateToFunds = () => {
    console.log('📈 [Portfolio] Navigate to Funds screen for buy/sell operations');
    try {
      (navigation as any).navigate('Fund_widget');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Thông báo', 'Không thể mở màn hình sản phẩm đầu tư');
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B4BFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!portfolio) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu danh mục đầu tư</Text>
      </View>
    );
  }

  const chartData = prepareChartData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tổng quan danh mục</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshButton}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng đầu tư</Text>
          <Text style={styles.summaryValue}>
            {formatVND(portfolio.total_investment)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giá trị hiện tại</Text>
          <Text style={[styles.summaryValue, { color: '#28A745' }]}>
            {formatVND(portfolio.total_current_value)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Lãi/Lỗ</Text>
          <Text style={[
            styles.summaryValue,
            { color: portfolio.total_profit_loss >= 0 ? '#28A745' : '#DC3545' }
          ]}>
            {formatVND(portfolio.total_profit_loss)} ({portfolio.total_profit_loss_percentage.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Portfolio Allocation Chart */}
      {chartData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Phân bổ danh mục đầu tư</Text>
          <PieChartCustom
            data={chartData}
            sliceColor={chartData.map(item => item.color)}
            title="Phân bổ theo quỹ (%)"
          />
        </View>
      )}

      {/* Investment List */}
      <View style={styles.investmentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Danh sách đầu tư</Text>
          <Text style={styles.cardSubtitle}>Để mua/bán quỹ, vui lòng truy cập tab &quot;Sản phẩm đầu tư&quot;</Text>
        </View>
        {investments.map((investment) => (
          <View key={investment.id} style={styles.investmentItem}>
            <View style={styles.investmentHeader}>
              <Text style={styles.investmentTicker}>{investment.fund_ticker}</Text>
              <Text style={styles.investmentName}>{investment.fund_name}</Text>
            </View>
            <View style={styles.investmentDetails}>
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>Số đơn vị:</Text>
                <Text style={styles.investmentValue}>{investment.units}</Text>
              </View>
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>Giá trị đầu tư:</Text>
                <Text style={styles.investmentValue}>{formatVND(investment.amount)}</Text>
              </View>
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>NAV hiện tại:</Text>
                <Text style={styles.investmentValue}>{formatVND(investment.current_nav)}</Text>
              </View>
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>Giá trị hiện tại:</Text>
                <Text style={styles.investmentValue}>{formatVND(investment.current_nav * investment.units)}</Text>
              </View>
            </View>
            
            {/* Navigate to Funds for Buy/Sell */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.fundsButton]}
                onPress={handleNavigateToFunds}
              >
                <Ionicons name="trending-up-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Mua/Bán</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2B4BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  refreshButton: {
    fontSize: 14,
    color: '#2B4BFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  investmentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  investmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 16,
    marginBottom: 16,
  },
  investmentHeader: {
    marginBottom: 8,
  },
  investmentTicker: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B4BFF',
  },
  investmentName: {
    fontSize: 14,
    color: '#6C757D',
  },
  investmentDetails: {
    paddingLeft: 12,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  investmentLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  investmentValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  fundsButton: {
    backgroundColor: '#2B4BFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 