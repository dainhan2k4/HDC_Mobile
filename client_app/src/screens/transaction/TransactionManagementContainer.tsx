import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const TransactionManagementContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const mockTransactions = [
    {
      id: 1,
      type: 'buy',
      fundName: 'Vietnam VN30 Fund',
      amount: 5000000,
      status: 'completed',
      date: '2024-01-15',
      time: '14:30',
    },
    {
      id: 2,
      type: 'sell',
      fundName: 'Vietnam Value Fund',
      amount: 3000000,
      status: 'pending',
      date: '2024-01-14',
      time: '09:15',
    },
    {
      id: 3,
      type: 'buy',
      fundName: 'Vietnam Strategic Fund',
      amount: 2500000,
      status: 'completed',
      date: '2024-01-13',
      time: '16:45',
    },
    {
      id: 4,
      type: 'sell',
      fundName: 'Vietnam Bond Fund',
      amount: 1500000,
      status: 'cancelled',
      date: '2024-01-12',
      time: '11:20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#33FF57';
      case 'pending':
        return '#FFA500';
      case 'cancelled':
        return '#FF5733';
      default:
        return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'buy' ? 'arrow-up-circle' : 'arrow-down-circle';
  };

  const getTypeColor = (type: string) => {
    return type === 'buy' ? '#33FF57' : '#FF5733';
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={24} 
            color={getTypeColor(item.type)} 
          />
          <View style={styles.transactionDetails}>
            <Text style={styles.fundName}>{item.fundName}</Text>
            <Text style={styles.transactionDate}>{item.date} {item.time}</Text>
          </View>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={styles.amountText}>
            {item.type === 'buy' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} VND
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giao dịch</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="filter-outline" size={24} color="#2B4BFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === 'all' && styles.activeFilterTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.filterText, activeTab === 'all' && styles.activeFilterText]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === 'buy' && styles.activeFilterTab]}
            onPress={() => setActiveTab('buy')}
          >
            <Text style={[styles.filterText, activeTab === 'buy' && styles.activeFilterText]}>
              Mua
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === 'sell' && styles.activeFilterTab]}
            onPress={() => setActiveTab('sell')}
          >
            <Text style={[styles.filterText, activeTab === 'sell' && styles.activeFilterText]}>
              Bán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === 'pending' && styles.activeFilterTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.filterText, activeTab === 'pending' && styles.activeFilterText]}>
              Đang xử lý
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng giao dịch</Text>
          <Text style={styles.summaryValue}>{mockTransactions.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng giá trị</Text>
          <Text style={styles.summaryValue}>
            {mockTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('vi-VN')} VND
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Hoàn thành</Text>
          <Text style={styles.summaryValue}>
            {mockTransactions.filter(t => t.status === 'completed').length}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Lịch sử giao dịch</Text>
        <FlatList
          data={mockTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeFilterTab: {
    backgroundColor: '#2B4BFF',
  },
  filterText: {
    fontSize: 14,
    color: '#6C757D',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 