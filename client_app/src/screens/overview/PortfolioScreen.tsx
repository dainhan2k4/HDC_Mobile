import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PortfolioOverview } from '../../types/portfolio';
import { Investment } from '../../types/fund';
import { API_CONFIG } from '../../config/apiConfig';
import { middlewareApiService } from '../../services/MiddlewareApiService';
import { apiService } from '../../config/apiService';
import { useAuth } from '../../context/AuthContext';
import { PieChartCustom } from '../../components/common/PieChartCustom';
import formatVND from '../../hooks/formatCurrency';
import GradientButton from '../../components/common/GradientButton';
import GradientView from '@/components/common/GradientView';
import { AppColors } from '../../styles/GlobalTheme';

const { width: screenWidth } = Dimensions.get('window');

// Safe calculation helpers to prevent crashes
const safeNumber = (value: any): number => {
  try {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return typeof value === 'number' ? value : parseFloat(value) || 0;
  } catch (error) {
    console.error('Error in safeNumber:', error);
    return 0;
  }
};

const safeMultiply = (a: any, b: any): number => {
  try {
    const numA = safeNumber(a);
    const numB = safeNumber(b);
    return numA * numB;
  } catch (error) {
    console.error('Error in safeMultiply:', error);
    return 0;
  }
};

const safeSubtract = (a: any, b: any): number => {
  try {
    const numA = safeNumber(a);
    const numB = safeNumber(b);
    return numA - numB;
  } catch (error) {
    console.error('Error in safeSubtract:', error);
    return 0;
  }
};

const safePercentage = (value: any): string => {
  try {
    const num = safeNumber(value);
    return num.toFixed(2);
  } catch (error) {
    console.error('Error in safePercentage:', error);
    return '0.00';
  }
};

const safeFormatVND = (value: any): string => {
  try {
    const num = safeNumber(value);
    return formatVND(num);
  } catch (error) {
    console.error('Error in safeFormatVND:', error);
    return '0 ₫';
  }
};

export const PortfolioScreen: React.FC = () => {
  const navigation = useNavigation();
  const { sessionId, user, isLoading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache và rate limiting
  const lastLoadTime = useRef<number>(0);
  const loadingTimeoutRef = useRef<number | null>(null);
  const isRateLimited = useRef<boolean>(false);
  const rateLimitResetTime = useRef<number>(0);
  const MIN_REFRESH_INTERVAL = 5000; // 5 giây giữa các lần gọi API
  
  // Performance metrics
  const [performanceData, setPerformanceData] = useState({
    todayChange: 0,
    todayPercentage: 0,
    monthlyReturn: 0,
    yearlyReturn: 0,
    bestPerformer: '',
    worstPerformer: ''
  });

  // Filter out investments with zero values - with safe checks
  const activeInvestments = investments.filter(investment => {
    try {
      return investment && 
             safeNumber(investment.units) > 0 && 
             safeNumber(investment.amount) > 0;
    } catch (error) {
      console.error('Error filtering investments:', error);
      return false;
    }
  });

  // Kiểm tra rate limit
  const checkRateLimit = () => {
    const now = Date.now();
    if (isRateLimited.current && now < rateLimitResetTime.current) {
      const remainingTime = Math.ceil((rateLimitResetTime.current - now) / 1000);
      setError(`Đang bị giới hạn tần suất. Vui lòng thử lại sau ${remainingTime} giây.`);
      return false;
    }
    isRateLimited.current = false;
    return true;
  };

  // Debounced load function
  const debouncedLoadPortfolioData = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    
    // Kiểm tra cache time nếu không force refresh
    if (!forceRefresh && (now - lastLoadTime.current) < MIN_REFRESH_INTERVAL) {
      console.log('⏳ [Portfolio] Skipping load - too soon since last refresh');
      return;
    }

    // Kiểm tra rate limit
    if (!checkRateLimit()) {
      return;
    }

    // Clear existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce với 300ms
    loadingTimeoutRef.current = setTimeout(async () => {
      await loadPortfolioData();
    }, 300);
  }, []);

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
              units: safeNumber(record.units || 100),
              amount: safeNumber(record.amount || 1000000),
              current_nav: safeNumber(record.current_nav || 10000),
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
        const activeRealInvestments = realInvestments.filter(inv => {
          try {
            return inv && safeNumber(inv.units) > 0 && safeNumber(inv.amount) > 0;
          } catch (error) {
            console.error('Error filtering real investments:', error);
            return false;
          }
        });
        
        const totalInvestment = activeRealInvestments.reduce((sum, inv) => {
          try {
            return sum + safeNumber(inv.amount);
          } catch (error) {
            console.error('Error calculating totalInvestment:', error);
            return sum;
          }
        }, 0);
        
        const totalCurrentValue = activeRealInvestments.reduce((sum, inv) => {
          try {
            return sum + safeMultiply(inv.current_nav, inv.units);
          } catch (error) {
            console.error('Error calculating totalCurrentValue:', error);
            return sum;
          }
        }, 0);
        
        const totalProfitLoss = safeSubtract(totalCurrentValue, totalInvestment);
        const totalProfitLossPercentage = totalInvestment > 0 ? 
          (totalProfitLoss / totalInvestment) * 100 : 0;

        realPortfolio = {
          total_investment: totalInvestment,
          total_current_value: totalCurrentValue,
          total_profit_loss: totalProfitLoss,
          total_profit_loss_percentage: totalProfitLossPercentage,
          funds: [],
          transactions: [],
          comparisons: [],
        };
        console.log('✅ [Portfolio] Calculated portfolio from active investment data');
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
      lastLoadTime.current = Date.now();

    } catch (error: any) {
      console.error('❌ [Portfolio] Critical error loading portfolio:', error);
      
      // Xử lý rate limiting error
      if (error?.message?.includes('Too many requests') || error?.status === 429) {
        console.log('🚫 [Portfolio] Rate limited - setting cooldown');
        isRateLimited.current = true;
        rateLimitResetTime.current = Date.now() + 60000; // 1 phút cooldown
        setError('Đang bị giới hạn tần suất. Vui lòng đợi 1 phút và thử lại.');
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
      }
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
      await debouncedLoadPortfolioData(true); // Force initial load
    };

    initializeData();
  }, [authLoading, sessionId, user, debouncedLoadPortfolioData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Refresh portfolio when screen comes into focus (after buy/sell operations)
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && (sessionId || user)) {
        console.log('🔍 [Portfolio] Screen focused, refreshing portfolio data...');
        debouncedLoadPortfolioData(false); // Normal debounced load
      }
    }, [authLoading, sessionId, user, debouncedLoadPortfolioData])
  );

  const prepareChartData = () => {
    try {
      if (!activeInvestments || activeInvestments.length === 0) return [];
      
      return activeInvestments.map((investment, index) => ({
        name: investment.fund_ticker || `Fund ${index}`,
        value: safeMultiply(investment.current_nav, investment.units), 
        color: generateColor(index),
      }));
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
  };

  const FIXED_CHART_COLORS = [
    AppColors.primary.main,     // Orange primary
    AppColors.secondary.main,   // Blue secondary  
    AppColors.status.success,   // Green
    AppColors.status.warning,   // Yellow
    AppColors.status.error,     // Red
    AppColors.status.info,      // Light blue
    '#9C27B0',                  // Purple
    '#795548',                  // Brown
    '#607D8B',                  // Blue grey
    '#FF5722',                  // Deep orange
  ];

  const generateColor = (index = -1) => {
    if (index === -1) {
      return FIXED_CHART_COLORS[Math.floor(Math.random() * FIXED_CHART_COLORS.length)];
    }
    return FIXED_CHART_COLORS[index % FIXED_CHART_COLORS.length];
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await debouncedLoadPortfolioData(true); // Force refresh
    setIsRefreshing(false);
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

  const chartData = prepareChartData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Modern Header with Gradient Effect */}
      <GradientView style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Xin chào, {user?.name || 'Nhà đầu tư'}!</Text>
            <Text style={styles.headerTitle}>Danh mục đầu tư</Text>
          </View>
          <TouchableOpacity style={styles.refreshIconButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </GradientView>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2B4BFF']}
            tintColor="#2B4BFF"
          />
        }
      >
        {authLoading || isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2B4BFF" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons 
              name={error.includes('giới hạn tần suất') ? "time-outline" : "alert-circle-outline"} 
              size={64} 
              color={error.includes('giới hạn tần suất') ? "#FFA500" : "#DC3545"} 
            />
            <Text style={[
              styles.errorText,
              { color: error.includes('giới hạn tần suất') ? "#FFA500" : "#DC3545" }
            ]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[
                styles.retryButton,
                { backgroundColor: error.includes('giới hạn tần suất') ? "#FFA500" : "#2B4BFF" }
              ]} 
              onPress={handleRefresh}
              disabled={isRateLimited.current}
            >
              <Text style={styles.retryButtonText}>
                {error.includes('giới hạn tần suất') ? 'Đợi một chút...' : 'Thử lại'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : !portfolio ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={64} color="#6C757D" />
            <Text style={styles.emptyText}>Không có dữ liệu danh mục đầu tư</Text>
          </View>
        ) : (
          <>
            {/* Portfolio Summary Cards */}
            <View style={styles.summaryContainer}>
              {/* Main Portfolio Value Card */}
              <View style={styles.mainSummaryCard}>
                <View style={styles.portfolioValueSection}>
                  <Text style={styles.portfolioLabel}>Tổng giá trị danh mục</Text>
                  <Text style={styles.portfolioMainValue}>
                    {safeFormatVND(portfolio.total_current_value)}
                  </Text>
                  <View style={styles.portfolioChangeRow}>
                    <Ionicons 
                      name={safeNumber(portfolio.total_profit_loss) >= 0 ? "trending-up" : "trending-down"} 
                      size={16} 
                      color={safeNumber(portfolio.total_profit_loss) >= 0 ? "#28A745" : "#DC3545"} 
                    />
                    <Text style={[
                      styles.portfolioChange,
                      { color: safeNumber(portfolio.total_profit_loss) >= 0 ? "#28A745" : "#DC3545" }
                    ]}>
                      {safeFormatVND(portfolio.total_profit_loss)} ({safePercentage(portfolio.total_profit_loss_percentage)}%)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Stats Row */}
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStatCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="wallet-outline" size={20} color="#2B4BFF" />
                  </View>
                  <Text style={styles.statLabel}>Đã đầu tư</Text>
                  <Text style={styles.statValue}>{safeFormatVND(portfolio.total_investment)}</Text>
                </View>
                
                <View style={styles.quickStatCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="bar-chart-outline" size={20} color="#28A745" />
                  </View>
                  <Text style={styles.statLabel}>Số quỹ</Text>
                  <Text style={styles.statValue}>{activeInvestments.length}</Text>
                </View>
                
                <View style={styles.quickStatCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="trophy-outline" size={20} color="#FFA500" />
                  </View>
                  <Text style={styles.statLabel}>Hiệu suất</Text>
                  <Text style={[
                    styles.statValue,
                    { color: safeNumber(portfolio.total_profit_loss_percentage) >= 0 ? "#28A745" : "#DC3545" }
                  ]}>
                    {safeNumber(portfolio.total_profit_loss_percentage) >= 0 ? "+" : ""}{safePercentage(portfolio.total_profit_loss_percentage)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Hành động nhanh</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToFunds}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="add-circle" size={24} color="#28A745" />
                  </View>
                  <Text style={styles.actionButtonText}>Mua quỹ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToFunds}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="remove-circle" size={24} color="#DC3545" />
                  </View>
                  <Text style={styles.actionButtonText}>Bán quỹ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToFunds}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="analytics" size={24} color="#2B4BFF" />
                  </View>
                  <Text style={styles.actionButtonText}>Phân tích</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Portfolio Allocation Chart */}
            {chartData.length > 0 && (
              
                <PieChartCustom
                  data={chartData}
                  title="Phân bổ theo quỹ (%)"
                />
              
            )}

            {/* Investment Holdings */}
            <View style={styles.holdingsContainer}>
              <View style={styles.holdingsHeader}>
                <Text style={styles.sectionTitle}>Danh mục nắm giữ</Text>
                <TouchableOpacity onPress={handleNavigateToFunds}>
                  <Text style={styles.seeAllButton}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              
              {activeInvestments.length > 0 ? (
                activeInvestments.map((investment, index) => (
                  <View key={investment.id} style={styles.modernInvestmentCard}>
                    <View style={styles.investmentCardHeader}>
                      <View style={styles.fundInfo}>
                        <View style={[styles.fundColorDot, { backgroundColor: generateColor(index) }]} />
                        <View style={styles.fundDetails}>
                          <Text style={styles.fundTicker}>{investment.fund_ticker}</Text>
                          <Text style={styles.fundName}>{investment.fund_name}</Text>
                        </View>
                      </View>
                      <View style={styles.investmentValues}>
                        <Text style={styles.investmentCurrentValue}>
                          {safeFormatVND(investment.current_nav * investment.units)}
                        </Text>
                        <Text style={styles.investmentUnits}>{safeNumber(investment.units)} đơn vị</Text>
                      </View>
                    </View>
                    
                    <View style={styles.investmentMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Giá NAV</Text>
                        <Text style={styles.metricText}>{safeFormatVND(investment.current_nav)}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Đầu tư</Text>
                        <Text style={styles.metricText}>{safeFormatVND(investment.amount)}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Lãi/Lỗ</Text>
                        <Text style={[
                          styles.metricText,
                          { color: safeSubtract(safeMultiply(investment.current_nav, investment.units), investment.amount) >= 0 ? "#28A745" : "#DC3545" }
                        ]}>
                          {safeFormatVND(safeSubtract(safeMultiply(investment.current_nav, investment.units), investment.amount))}
                        </Text>
                      </View>
                    </View>

                    <GradientButton title="Quản lý" onPress={() => {}} gradientType="button" />
                  </View>
                ))
              ) : (
                <View style={styles.noInvestmentsContainer}>
                  <Ionicons name="trending-up-outline" size={48} color="#6C757D" />
                  <Text style={styles.noInvestmentsTitle}>Chưa có đầu tư nào</Text>
                  <Text style={styles.noInvestmentsSubtitle}>
                    Hãy bắt đầu đầu tư để xây dựng danh mục của bạn
                  </Text>
                  <TouchableOpacity 
                    style={styles.startInvestingButton}
                    onPress={handleNavigateToFunds}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.startInvestingText}>Bắt đầu đầu tư</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
  modernHeader: {
    height: 80,
    padding: 20,
    backgroundColor: '#2B4BFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshIconButton: {
    padding: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  summaryContainer: {
    padding: 20,
  },
  mainSummaryCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  portfolioValueSection: {
    marginBottom: 12,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  portfolioMainValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  portfolioChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioChange: {
    fontSize: 12,
    color: '#6C757D',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modernChartCard: {
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
  holdingsContainer: {
    padding: 20,
  },
  holdingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    fontSize: 14,
    color: '#2B4BFF',
    fontWeight: '600',
  },
  modernInvestmentCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  investmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  fundDetails: {
    flexDirection: 'column',
    flex: 1,
  },
  fundTicker: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B4BFF',
    marginBottom: 2,
  },
  fundName: {
    fontSize: 14,
    color: '#6C757D',
  },
  investmentValues: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  investmentCurrentValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  investmentUnits: {
    fontSize: 14,
    color: '#6C757D',
  },
  investmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2B4BFF',
    gap: 6,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noInvestmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noInvestmentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  noInvestmentsSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  startInvestingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B4BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  startInvestingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 