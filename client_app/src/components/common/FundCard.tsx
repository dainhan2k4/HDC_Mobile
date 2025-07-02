import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Fund } from '../../types/fund';

interface FundCardProps {
  fund: Fund;
  onPress: (fund: Fund) => void;
  showActions?: boolean;
  onBuyPress?: (fund: Fund) => void;
  onSellPress?: (fund: Fund) => void;
}

export const FundCard: React.FC<FundCardProps> = ({
  fund,
  onPress,
  showActions = false,
  onBuyPress,
  onSellPress,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPerformanceColor = (percentage: number) => {
    return percentage >= 0 ? '#33FF57' : '#DC143C';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(fund)}>
      <View style={styles.header}>
        <View style={styles.tickerContainer}>
          <View style={[styles.colorIndicator, { backgroundColor: fund.color }]} />
          <View>
            <Text style={styles.ticker}>{fund.ticker}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {fund.name}
            </Text>
          </View>
        </View>
        <View style={styles.typeContainer}>
          <Text style={styles.type}>{fund.investment_type}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>NAV</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(fund.current_nav)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>YTD</Text>
            <Text
              style={[
                styles.metricValue,
                { color: getPerformanceColor(fund.current_ytd) },
              ]}
            >
              {formatPercentage(fund.current_ytd)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>P/L</Text>
            <Text
              style={[
                styles.metricValue,
                { color: getPerformanceColor(fund.profit_loss_percentage) },
              ]}
            >
              {formatPercentage(fund.profit_loss_percentage)}
            </Text>
          </View>
        </View>

        {fund.total_investment > 0 && (
          <View style={styles.holdingsRow}>
            <View style={styles.holding}>
              <Text style={styles.holdingLabel}>Đầu tư</Text>
              <Text style={styles.holdingValue}>
                {formatCurrency(fund.total_investment)}
              </Text>
            </View>
            <View style={styles.holding}>
              <Text style={styles.holdingLabel}>Giá trị hiện tại</Text>
              <Text style={styles.holdingValue}>
                {formatCurrency(fund.current_value)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={() => onBuyPress?.(fund)}
          >
            <Text style={styles.buyButtonText}>Mua</Text>
          </TouchableOpacity>
          {fund.total_units > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.sellButton]}
              onPress={() => onSellPress?.(fund)}
            >
              <Text style={styles.sellButtonText}>Bán</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  ticker: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  typeContainer: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  type: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  content: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  holdingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  holding: {
    alignItems: 'center',
    flex: 1,
  },
  holdingLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#2B4BFF',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sellButton: {
    backgroundColor: '#FF5733',
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 