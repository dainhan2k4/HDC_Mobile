import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatVND } from '../../hooks/formatCurrency';
import { transactionApi, Transaction } from '../../api/transactionApi';

type TabType = 'buy' | 'sell';

interface OrderItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ transaction, onPress }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'purchase':
      case 'mua':
        return '#28A745'; // Green for buy
      case 'sell':
      case 'sale':
      case 'bán':
        return '#DC3545'; // Red for sell
      default:
        return '#007BFF';
    }
  };

  const getTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'purchase':
      case 'mua':
        return 'MUA';
      case 'sell':
      case 'sale':
      case 'bán':
        return 'BÁN';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => onPress?.(transaction)}
    >
      <View style={styles.orderRow}>
        {/* Fund Info */}
        <View style={styles.fundInfo}>
          <Text style={styles.fundName}>{transaction.fund_name}</Text>
          <Text style={styles.orderDate}>
            {transaction.order_date || transaction.session_date}
          </Text>
        </View>
        
        {/* Order Details */}
        <View style={styles.orderDetails}>
          <Text style={styles.amount}>
            {formatVND(transaction.amount)}
          </Text>
          <Text style={styles.units}>
            {transaction.units || 0} chứng chỉ
          </Text>
        </View>
        
        {/* Order Type */}
        <View style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(transaction.transaction_type) }]}>
            <Text style={styles.typeText}>
              {getTypeText(transaction.transaction_type)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TransactionManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [buyOrders, setBuyOrders] = useState<Transaction[]>([]);
  const [sellOrders, setSellOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load pending orders (both buy and sell)
      const pendingOrders = await transactionApi.getPendingTransactions();
      
      // Separate buy and sell orders
      const buyOrdersData = pendingOrders.filter(order => 
        order.transaction_type.toLowerCase() === 'buy' || 
        order.transaction_type.toLowerCase() === 'purchase' ||
        order.transaction_type.toLowerCase() === 'mua'
      );
      
      const sellOrdersData = pendingOrders.filter(order => 
        order.transaction_type.toLowerCase() === 'sell' || 
        order.transaction_type.toLowerCase() === 'sale' ||
        order.transaction_type.toLowerCase() === 'bán'
      );

      setBuyOrders(buyOrdersData);
      setSellOrders(sellOrdersData);

    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách lệnh. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  const handleOrderPress = (transaction: Transaction) => {
    // TODO: Navigate to order detail or edit screen
    console.log('Order pressed:', transaction);
  };

 

 

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Quản lý lệnh</Text>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
          onPress={() => setActiveTab('buy')}
        >
          <Text style={[styles.tabText, activeTab === 'buy' && styles.activeTabText]}>
            Lệnh mua ({buyOrders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sell' && styles.activeTab]}
          onPress={() => setActiveTab('sell')}
        >
          <Text style={[styles.tabText, activeTab === 'sell' && styles.activeTabText]}>
            Lệnh bán ({sellOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'buy' ? 'trending-up-outline' : 'trending-down-outline'} 
        size={64} 
        color="#CCCCCC" 
      />
      <Text style={styles.emptyStateText}>
        {activeTab === 'buy' ? 'Chưa có lệnh mua nào' : 'Chưa có lệnh bán nào'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {activeTab === 'buy' ? 
          'Tạo lệnh mua để đầu tư vào các quỹ' : 
          'Tạo lệnh bán để chốt lời các quỹ trong danh mục'
        }
      </Text>
    </View>
  );

  const renderOrder = ({ item }: { item: Transaction }) => (
    <OrderItem
      transaction={item}
      onPress={handleOrderPress}
    />
  );

  const currentOrders = activeTab === 'buy' ? buyOrders : sellOrders;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={currentOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={currentOrders.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.tint]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fundInfo: {
    flex: 2,
    marginRight: 12,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  orderDetails: {
    flex: 1.4,
    alignItems: 'flex-end',
    marginRight: 10,
    minWidth: 110,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  units: {
    fontSize: 14,
    color: '#666666',
  },
  typeContainer: {
    alignItems: 'flex-end',
    flex: 0.8,
    minWidth: 60,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TransactionManagementScreen; 