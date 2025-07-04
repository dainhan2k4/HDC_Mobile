import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fund } from '../../types/fund';

interface FundCardProps {
  fund: Fund;
  onPress: (fund: Fund) => void;
  showActions?: boolean;
  onBuyPress?: (fund: Fund) => void;
  onSellPress?: (fund: Fund) => void;
}

export const FundCard: React.FC<FundCardProps> = ({ fund, onPress, showActions, onBuyPress, onSellPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(fund)}>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: fund.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.ticker}>{fund.ticker}</Text>
          <Text style={styles.name} numberOfLines={1}>{fund.name}</Text>
        </View>
        <Text style={[styles.status, { color: fund.status === 'active' ? '#33FF57' : '#DC143C' }]}>
          {fund.status === 'active' ? 'Đang hoạt động' : 'Ngừng giao dịch'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Giá NAV:</Text>
        <Text style={styles.value}>{fund.current_nav.toLocaleString('vi-VN')} đ</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Lãi/Lỗ:</Text>
        <Text style={[styles.value, { color: fund.profit_loss >= 0 ? '#33FF57' : '#DC143C' }]}>
          {fund.profit_loss >= 0 ? '+' : ''}{fund.profit_loss.toLocaleString('vi-VN')} đ
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Tỷ suất:</Text>
        <Text style={[styles.value, { color: fund.profit_loss_percentage >= 0 ? '#33FF57' : '#DC143C' }]}>
          {fund.profit_loss_percentage >= 0 ? '+' : ''}{fund.profit_loss_percentage}%
        </Text>
      </View>
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buyButton} onPress={() => onBuyPress && onBuyPress(fund)}>
            <Text style={styles.actionText}>Mua</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellButton} onPress={() => onSellPress && onSellPress(fund)}>
            <Text style={styles.actionText}>Bán</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  ticker: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2B4BFF',
  },
  name: {
    fontSize: 14,
    color: '#212529',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#6C757D',
  },
  value: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  buyButton: {
    backgroundColor: '#2B4BFF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  sellButton: {
    backgroundColor: '#FF5733',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 