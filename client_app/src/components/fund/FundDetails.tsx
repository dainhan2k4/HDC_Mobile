import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import ScrollingChartWithPointer from '../common/ScrollingChartWithPointer';
import { TimeRangeSelector } from './TimeRangeSelector';
import formatVND from '../../hooks/formatCurrency';
import { Fund } from '../../types/fund';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

interface FundDetailsProps {
  fund: Fund | null;
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onBuyFund: () => void;
  onSellFund: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;
const isSmallMobile = screenWidth < 400;

export const FundDetails: React.FC<FundDetailsProps> = ({
  fund,
  selectedTimeRange,
  onTimeRangeChange,
  onBuyFund,
  onSellFund,
}) => {
  if (!fund) {
    return (
      <View style={[styles.container, isMobile && styles.mobileContainer]}>
        <View style={styles.noSelectionContainer}>
          <View style={styles.noSelectionIcon}>
            <Text style={styles.noSelectionIconText}>📊</Text>
          </View>
          <Text style={[styles.noSelectionText, isMobile && styles.mobileNoSelectionText]}>
            Chọn quỹ để xem chi tiết
          </Text>
          <Text style={[styles.noSelectionSubtext, isMobile && styles.mobileNoSelectionSubtext]}>
            Tất cả thông tin về hiệu suất và đầu tư sẽ hiển thị ở đây
          </Text>
        </View>
      </View>
    );
  }

  const hasInvestment = (fund.total_units || 0) > 0;

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      {/* Fund Header */}
      <View style={[styles.headerSection, isMobile && styles.mobileHeaderSection]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isMobile && styles.mobileTitle]} numberOfLines={isMobile ? 2 : 3}>
            {fund.name}
          </Text>
          {fund.is_shariah && (
            <View style={[styles.shariahBadge, isMobile && styles.mobileShariahBadge]}>
              <Text style={[styles.shariahText, isMobile && styles.mobileShariahText]}>
                Shariah
              </Text>
            </View>
          )}
        </View>
        
        {/* Fund Description - Only show on larger screens */}
        {!isSmallMobile && fund.description && (
          <Text style={[styles.description, isMobile && styles.mobileDescription]} numberOfLines={3}>
            {fund.description}
          </Text>
        )}
      </View>

      {/* Key Metrics Grid */}
      <View style={[styles.metricsSection, isMobile && styles.mobileMetricsSection]}>
        <Text style={[styles.sectionTitle, isMobile && styles.mobileSectionTitle]}>
          Thông tin quỹ
        </Text>
        <View style={[styles.metricsGrid, isMobile && styles.mobileMetricsGrid]}>
          <View style={[styles.metricCard, isMobile && styles.mobileMetricCard]}>
            <Text style={[styles.metricLabel, isMobile && styles.mobileMetricLabel]}>
              NAV hiện tại
            </Text>
            <Text style={[styles.metricValue, styles.currentValue, isMobile && styles.mobileMetricValue]}>
              {formatVND(fund.current_nav)}
            </Text>
          </View>
          
          <View style={[styles.metricCard, isMobile && styles.mobileMetricCard]}>
            <Text style={[styles.metricLabel, isMobile && styles.mobileMetricLabel]}>
              NAV trước đó
            </Text>
            <Text style={[styles.metricValue, styles.previousValue, isMobile && styles.mobileMetricValue]}>
              {formatVND(fund.previous_nav)}
            </Text>
          </View>
          
          <View style={[styles.metricCard, isMobile && styles.mobileMetricCard]}>
            <Text style={[styles.metricLabel, isMobile && styles.mobileMetricLabel]}>
              YTD
            </Text>
            <Text style={[styles.metricValue, styles.ytdValue, isMobile && styles.mobileMetricValue]}>
              {formatVND(fund.current_ytd)}
            </Text>
          </View>

          {/* Performance Change */}
          <View style={[styles.metricCard, styles.performanceCard, isMobile && styles.mobileMetricCard]}>
            <Text style={[styles.metricLabel, isMobile && styles.mobileMetricLabel]}>
              Thay đổi
            </Text>
            <View style={styles.performanceRow}>
              <Text style={[
                styles.performanceValue, 
                isMobile && styles.mobilePerformanceValue,
                { color: (fund.current_nav - fund.previous_nav) >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {(fund.current_nav - fund.previous_nav) >= 0 ? '+' : ''}{formatVND(fund.current_nav - fund.previous_nav)}
              </Text>
              <View style={[
                styles.performanceIndicator,
                (fund.current_nav - fund.previous_nav) >= 0 ? styles.positiveIndicator : styles.negativeIndicator
              ]}>
                <Text style={styles.performanceIcon}>
                  {(fund.current_nav - fund.previous_nav) >= 0 ? '↗' : '↘'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Investment Portfolio Section */}
      {hasInvestment && (
        <View style={[styles.portfolioSection, isMobile && styles.mobilePortfolioSection]}>
          <Text style={[styles.sectionTitle, isMobile && styles.mobileSectionTitle]}>
            Danh mục của bạn
          </Text>
          <View style={[styles.portfolioGrid, isMobile && styles.mobilePortfolioGrid]}>
            <View style={[styles.portfolioCard, isMobile && styles.mobilePortfolioCard]}>
              <Text style={[styles.portfolioLabel, isMobile && styles.mobilePortfolioLabel]}>
                Số đơn vị
              </Text>
              <Text style={[styles.portfolioValue, isMobile && styles.mobilePortfolioValue]}>
                {(fund.total_units || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.portfolioCard, isMobile && styles.mobilePortfolioCard]}>
              <Text style={[styles.portfolioLabel, isMobile && styles.mobilePortfolioLabel]}>
                Giá trị đầu tư
              </Text>
              <Text style={[styles.portfolioValue, isMobile && styles.mobilePortfolioValue]}>
                {formatVND(fund.total_investment || 0)}
              </Text>
            </View>
            
            <View style={[styles.portfolioCard, isMobile && styles.mobilePortfolioCard]}>
              <Text style={[styles.portfolioLabel, isMobile && styles.mobilePortfolioLabel]}>
                Giá trị hiện tại
              </Text>
              <Text style={[styles.portfolioValue, styles.currentPortfolioValue, isMobile && styles.mobilePortfolioValue]}>
                {formatVND(fund.current_value || 0)}
              </Text>
            </View>
            
            <View style={[styles.portfolioCard, styles.profitLossCard, isMobile && styles.mobilePortfolioCard]}>
              <Text style={[styles.portfolioLabel, isMobile && styles.mobilePortfolioLabel]}>
                Lãi/Lỗ
              </Text>
              <View style={styles.profitLossRow}>
                <Text style={[
                  styles.portfolioValue, 
                  isMobile && styles.mobilePortfolioValue,
                  { color: (fund.profit_loss || 0) >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {(fund.profit_loss || 0) >= 0 ? '+' : ''}{formatVND(fund.profit_loss || 0)}
                </Text>
                
              </View>
              <Text style={[
                  styles.profitLossPercentage,
                  isMobile && styles.mobileProfitLossPercentage,
                  { color: (fund.profit_loss || 0) >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  ({(fund.profit_loss_percentage || 0).toFixed(2)}%)
                </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.actionsSection, isMobile && styles.mobileActionsSection]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton, isMobile && styles.mobileActionButton]}
          onPress={onBuyFund}
        >
          <Text style={[styles.actionButtonText, isMobile && styles.mobileActionButtonText]}>
            {isMobile ? 'Mua' : 'Mua quỹ'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.sellButton, isMobile && styles.mobileActionButton]}
          onPress={onSellFund}
        >
          <Text style={[styles.actionButtonText, isMobile && styles.mobileActionButtonText]}>
            {isMobile ? 'Bán' : 'Bán quỹ'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={[styles.timeRangeSection, isMobile && styles.mobileTimeRangeSection]}>
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onRangeChange={onTimeRangeChange}
        />
      </View>

      {/* Performance Chart */}
      <View style={[styles.chartSection, isMobile && styles.mobileChartSection]}>
        <Text style={[styles.chartTitle, isMobile && styles.mobileChartTitle]}>
          Biểu đồ hiệu suất
        </Text>
        <View style={[styles.chartContainer, isMobile && styles.mobileChartContainer]}>
          <ScrollingChartWithPointer timeRange={selectedTimeRange} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mobileContainer: {
    // Mobile specific container styles if needed
  },

  // No Selection State
  noSelectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noSelectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noSelectionIconText: {
    fontSize: 24,
  },
  noSelectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  mobileNoSelectionText: {
    fontSize: 16,
  },
  noSelectionSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  mobileNoSelectionSubtext: {
    fontSize: 12,
  },

  // Header Section
  headerSection: {
    marginBottom: 24,
  },
  mobileHeaderSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 26,
    marginRight: 12,
  },
  mobileTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
  },
  shariahBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mobileShariahBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shariahText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mobileShariahText: {
    fontSize: 9,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  mobileDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Section Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  mobileSectionTitle: {
    fontSize: 14,
    marginBottom: 8,
  },

  // Metrics Section
  metricsSection: {
    marginBottom: 24,
  },
  mobileMetricsSection: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mobileMetricsGrid: {
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileMetricCard: {
    padding: 12,
    borderRadius: 8,
    minWidth: '46%',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  mobileMetricLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  mobileMetricValue: {
    fontSize: 14,
  },
  currentValue: {
    color: '#10B981',
  },
  previousValue: {
    color: '#64748B',
  },
  ytdValue: {
    color: '#2B4BFF',
  },
  performanceCard: {
    borderColor: '#E2E8F0',
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  mobilePerformanceValue: {
    fontSize: 12,
  },
  performanceIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  positiveIndicator: {
    backgroundColor: '#DCFCE7',
  },
  negativeIndicator: {
    backgroundColor: '#FEE2E2',
  },
  performanceIcon: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Portfolio Section
  portfolioSection: {
    marginBottom: 24,
  },
  mobilePortfolioSection: {
    marginBottom: 16,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mobilePortfolioGrid: {
    gap: 8,
  },
  portfolioCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mobilePortfolioCard: {
    padding: 12,
    borderRadius: 8,
    minWidth: '46%',
  },
  portfolioLabel: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    marginBottom: 6,
  },
  mobilePortfolioLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  mobilePortfolioValue: {
    fontSize: 14,
  },
  currentPortfolioValue: {
    color: '#10B981',
  },
  profitLossCard: {
    borderColor: '#FED7D7',
    backgroundColor: '#FFFBEB',
  },
  profitLossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profitLossPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mobileProfitLossPercentage: {
    fontSize: 10,
  },

  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  mobileActionsSection: {
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mobileActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buyButton: {
    backgroundColor: '#10B981',
  },
  sellButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  mobileActionButtonText: {
    fontSize: 12,
  },

  // Time Range Section
  timeRangeSection: {
    marginBottom: 20,
  },
  mobileTimeRangeSection: {
    marginBottom: 16,
  },

  // Chart Section
  chartSection: {
    flex: 1,
  },
  mobileChartSection: {
    minHeight: 200,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  mobileChartTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  chartContainer: {
    flex: 1,
    minHeight: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mobileChartContainer: {
    minHeight: 180,
    borderRadius: 8,
  },
}); 