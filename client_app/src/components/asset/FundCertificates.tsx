import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FundCertificate {
  code: string;
  name: string;
  quantity: number;
  change: number;
  isProfit: boolean;
  color?: string;
}

interface FundCertificatesProps {
  certificates: FundCertificate[];
}

export const FundCertificates: React.FC<FundCertificatesProps> = ({ certificates }) => {
  const renderCertificate = ({ item }: { item: FundCertificate }) => (
    <View style={[styles.certificateCard, { borderLeftColor: item.color || '#2B4BFF' }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.fundName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.profitBadge}>
          <Ionicons 
            name={item.isProfit ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={item.isProfit ? '#10B981' : '#EF4444'} 
          />
        </View>
      </View>
      
      <Text style={styles.fundCode}>{item.code}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Số lượng</Text>
          <Text style={styles.quantityValue}>{item.quantity.toLocaleString('vi-VN')}</Text>
        </View>
        
        <View style={styles.changeContainer}>
          <Text style={[styles.changeValue, { color: item.isProfit ? '#10B981' : '#EF4444' }]}>
            {item.isProfit ? '+' : ''}{item.change}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chứng chỉ quỹ nắm giữ</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{certificates.length}</Text>
        </View>
      </View>
      
      <FlatList
        data={certificates}
        renderItem={renderCertificate}
        keyExtractor={(item) => item.code}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có chứng chỉ quỹ nào</Text>
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
  certificateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 200,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  profitBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundCode: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  changeContainer: {
    alignItems: 'flex-end',
  },
  changeValue: {
    fontSize: 14,
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
