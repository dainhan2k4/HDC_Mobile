import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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

export const FundDetails: React.FC<FundDetailsProps> = ({
  fund,
  selectedTimeRange,
  onTimeRangeChange,
  onBuyFund,
  onSellFund,
}) => {
  if (!fund) {
    return (
      <View style={styles.container}>
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Vui lòng chọn quỹ để xem thông tin chi tiết.
          </Text>
        </View>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Quỹ Đầu tư {fund.name}
      </Text>

      {/* Fund Description */}
      <Text style={styles.description}>
        {fund.description}
      </Text>

      {/* Fund Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Giá trị từ đầu năm</Text>
          <Text style={styles.metricValue}>
            {formatVND(fund.current_ytd)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Giá trị hiện tại</Text>
          <Text style={[styles.metricValue, { color: '#28A745' }]}>
            {formatVND(fund.current_nav)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Giá trước đó</Text>
          <Text style={[styles.metricValue, { color: '#DC3545' }]}>
            {formatVND(fund.previous_nav)}
          </Text>
        </View>
      </View>

      {/* Investment Info */}
      <View style={styles.investmentInfo}>
        <View style={styles.investmentRow}>
          <Text style={styles.investmentLabel}>Số đơn vị sở hữu:</Text>
          <Text style={styles.investmentValue}>{fund.total_units || 0}</Text>
        </View>
        <View style={styles.investmentRow}>
          <Text style={styles.investmentLabel}>Giá trị đầu tư:</Text>
          <Text style={styles.investmentValue}>{formatVND(fund.total_investment || 0)}</Text>
        </View>
        <View style={styles.investmentRow}>
          <Text style={styles.investmentLabel}>Giá trị hiện tại:</Text>
          <Text style={[styles.investmentValue, { color: '#28A745' }]}>
            {formatVND(fund.current_value || 0)}
          </Text>
        </View>
        <View style={styles.investmentRow}>
          <Text style={styles.investmentLabel}>Lãi/Lỗ:</Text>
          <Text style={[
            styles.investmentValue, 
            { color: (fund.profit_loss || 0) >= 0 ? '#28A745' : '#DC3545' }
          ]}>
            {formatVND(fund.profit_loss || 0)} ({(fund.profit_loss_percentage || 0).toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton]}
          onPress={onBuyFund}
        >
          <Text style={styles.actionButtonText}>Mua</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.sellButton]}
          onPress={onSellFund}
        >
          <Text style={styles.actionButtonText}>Bán</Text>
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <TimeRangeSelector
        selectedRange={selectedTimeRange}
        onRangeChange={onTimeRangeChange}
      />

      {/* Fund Performance Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Biểu đồ hiệu suất quỹ</Text>
        <ScrollingChartWithPointer timeRange={selectedTimeRange} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 500,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B4BFF',
    textAlign: 'center',
  },
  investmentInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  investmentLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  investmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#28A745',
  },
  sellButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noSelectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 