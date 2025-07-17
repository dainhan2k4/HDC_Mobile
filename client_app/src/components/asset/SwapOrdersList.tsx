import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwapOrder {
  accountNumber: string;
  fund: string;
  tradingDate: string;
  amount: string;
  transactionType: string;
  status: string;
  statusColor: string; // e.g. 'text-green-500'
}

interface FundData {
  code: string;
  name: string;
}

interface SwapOrdersListProps {
  funds: FundData[];
  orders: SwapOrder[];
  initialFund?: string;
}

export const SwapOrdersList: React.FC<SwapOrdersListProps> = ({ funds, orders, initialFund }) => {
  const [selectedFund, setSelectedFund] = useState(initialFund || funds[0]?.code || '');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentFund = funds.find(f => f.code === selectedFund);
  const filteredOrders = orders.filter(order => order.fund === currentFund?.code || order.fund === currentFund?.name);

  const renderOrder = ({ item }: { item: SwapOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.fundInfo}>
          <Text style={styles.fundName}>{item.fund}</Text>
          <Text style={styles.accountNumber}>#{item.accountNumber}</Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: item.statusColor === 'text-green-500' ? '#10B981' : item.statusColor === 'text-yellow-500' ? '#F59E0B' : '#EF4444'
        }] }>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày giao dịch</Text>
          <Text style={styles.infoValue}>{item.tradingDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số tiền</Text>
          <Text style={styles.infoValue}>{item.amount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Loại giao dịch</Text>
          <Text style={styles.infoValue}>{item.transactionType}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with collapse toggle */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Danh sách lệnh hoán đổi</Text>
        <TouchableOpacity style={styles.collapseButton} onPress={() => setIsCollapsed(!isCollapsed)}>
          <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#64748B" />
        </TouchableOpacity>

      </View>

      {!isCollapsed && (
        <>
          {/* Fund selector */}
          <View style={styles.fundSelectorContainer}>
            <Text style={styles.fundSelectorLabel}>Chọn quỹ:</Text>
            <View style={styles.fundButtons}>
              {funds.map(fund => (
                <TouchableOpacity
                  key={fund.code}
                  style={[styles.fundButton, selectedFund === fund.code && styles.fundButtonActive]}
                  onPress={() => setSelectedFund(fund.code)}
                >
                  <Text style={[styles.fundButtonText, selectedFund === fund.code && styles.fundButtonTextActive]}>{fund.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="swap-horizontal" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có lệnh hoán đổi cho quỹ này</Text>
            </View>
          ) : (
            <>
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{filteredOrders.length}</Text>
              </View>
              <FlatList
          scrollEnabled={false}
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="swap-horizontal" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có lệnh hoán đổi</Text>
            </View>
          }
                />
            </>
          )}
        </>
      )}

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
    backgroundColor: '#2B4BFF',
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
  orderCard: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardContent: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  /* New styles for collapsible and fund switching */
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  collapseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  fundSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fundSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fundButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fundButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fundButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  fundButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  fundButtonTextActive: {
    color: '#FFFFFF',
  },
  badgeWrapper: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 8,
    backgroundColor: '#2B4BFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
