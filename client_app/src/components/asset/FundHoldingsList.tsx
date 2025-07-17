import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Holding {
  accountNumber: string;
  fund: string;
  tradingDate: string;
  buyPrice?: number;
  quantity: number;
  investmentValue?: number;
  profitLossPercent: string;
  isProfit: boolean;
}

interface FundData {
  code: string;
  name: string;
  holdings: Holding[];
}

interface FundHoldingsListProps {
  funds: FundData[];
  initialFund?: string;
  itemsPerPage?: number;
}

export const FundHoldingsList: React.FC<FundHoldingsListProps> = ({ 
  funds, 
  initialFund, 
  itemsPerPage = 10 
}) => {
  const [selectedFund, setSelectedFund] = useState(initialFund || funds[0]?.code || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentFund = funds.find(fund => fund.code === selectedFund);
  const holdings = currentFund?.holdings || [];
  
  const totalPages = Math.ceil(holdings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHoldings = holdings.slice(startIndex, endIndex);

  const renderHoldingItem = ({ item }: { item: Holding }) => (
    <View style={styles.holdingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.fundName}>{item.fund}</Text>
        <View style={[styles.profitBadge, { backgroundColor: item.isProfit ? '#DCFCE7' : '#FEF2F2' }]}>
          <Text style={[styles.profitText, { color: item.isProfit ? '#16A34A' : '#DC2626' }]}>
            {item.isProfit ? '+' : ''}{item.profitLossPercent}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tài khoản:</Text>
          <Text style={styles.infoValue}>{item.accountNumber}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày giao dịch:</Text>
          <Text style={styles.infoValue}>{item.tradingDate}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giá mua:</Text>
          <Text style={styles.infoValue}>{item.buyPrice?.toLocaleString('vi-VN')}đ</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số lượng:</Text>
          <Text style={styles.infoValue}>{item.quantity}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giá trị đầu tư:</Text>
          <Text style={styles.infoValueBold}>{item.investmentValue?.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={16} color="#fff" />
          <Text style={styles.paginationButtonText}>Trước</Text>
        </TouchableOpacity>
        
        <Text style={styles.currentPageText}>
          Trang {currentPage} / {totalPages}
        </Text>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Tiếp</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with fund selector and collapse toggle */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Danh sách lệnh mua đang nắm giữ</Text>
        <TouchableOpacity 
          style={styles.collapseButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <Ionicons 
            name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color="#64748B" 
          />
        </TouchableOpacity>
      </View>

      {/* Fund selector */}
      {!isCollapsed && (
        <View style={styles.fundSelectorContainer}>
          <Text style={styles.fundSelectorLabel}>Chọn quỹ:</Text>
          <View style={styles.fundButtons}>
            {funds.map((fund) => (
              <TouchableOpacity
                key={fund.code}
                style={[
                  styles.fundButton,
                  selectedFund === fund.code && styles.fundButtonActive
                ]}
                onPress={() => {
                  setSelectedFund(fund.code);
                  setCurrentPage(1);
                }}
              >
                <Text style={[
                  styles.fundButtonText,
                  selectedFund === fund.code && styles.fundButtonTextActive
                ]}>
                  {fund.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Holdings list */}
      {!isCollapsed && (
        holdings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có dữ liệu cho quỹ này</Text>
          </View>
        ) : (
          <>
            {/* Data rows */}
            <FlatList
              data={currentHoldings}
              renderItem={renderHoldingItem}
              keyExtractor={(item, index) => `${item.accountNumber}-${index}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />

            {/* Pagination */}
            {renderPagination()}
          </>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  holdingCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  profitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  infoValueBold: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  paginationButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  currentPageText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  collapseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  fundSelectorContainer: {
    marginBottom: 16,
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
});
