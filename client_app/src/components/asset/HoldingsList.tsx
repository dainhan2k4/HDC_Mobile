import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HoldingItem {
  accountNumber: string;
  fund: string;
  tradingDate: string;
  buyPrice: string;
  quantity: number;
  investmentValue: string;
  profitLossPercent: string;
  isProfit: boolean;
}

interface HoldingsListProps {
  holdings: HoldingItem[];
}

export const HoldingsList: React.FC<HoldingsListProps> = ({ holdings }) => {
  const renderHolding = ({ item }: { item: HoldingItem }) => (
    <View style={styles.holdingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.fundInfo}>
          <Text style={styles.fundName}>{item.fund}</Text>
          <Text style={styles.accountNumber}>#{item.accountNumber}</Text>
        </View>
        <View style={[styles.profitIndicator, { backgroundColor: item.isProfit ? '#10B981' : '#EF4444' }]}>
          <Ionicons 
            name={item.isProfit ? 'trending-up' : 'trending-down'} 
            size={16} 
            color="#FFFFFF" 
          />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ngày giao dịch</Text>
            <Text style={styles.infoValue}>{item.tradingDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Giá mua</Text>
            <Text style={styles.infoValue}>{item.buyPrice}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số lượng</Text>
            <Text style={styles.infoValue}>{item.quantity.toLocaleString('vi-VN')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Giá trị đầu tư</Text>
            <Text style={styles.infoValue}>{item.investmentValue}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.profitLabel}>Lãi/Lỗ</Text>
        <Text style={[styles.profitValue, { color: item.isProfit ? '#10B981' : '#EF4444' }]}>
          {item.profitLossPercent}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách lệnh mua đang nắm giữ</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{holdings.length}</Text>
        </View>
      </View>
      
      <FlatList
        scrollEnabled={false}
        data={holdings}
        renderItem={renderHolding}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có lệnh mua nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  holdingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundInfo: {
    flex: 1,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  profitIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  profitLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
