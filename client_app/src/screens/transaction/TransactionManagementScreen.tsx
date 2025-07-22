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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatVND } from '../../hooks/formatCurrency';
import { transactionApi, Transaction } from '../../api/transactionApi';
import OrderItem from '../../components/transaction/OrderItem';
import OrderTabHeader from '../../components/transaction/OrderTabHeader';
import parseDate from '../../hooks/parseDate';

type TabType = 'buy' | 'sell' | 'history';

interface OrderItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const TransactionManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [allBuyOrders, setAllBuyOrders] = useState<Transaction[]>([]);
  const [allSellOrders, setAllSellOrders] = useState<Transaction[]>([]);
  const [allTransactionHistory, setAllTransactionHistory] = useState<Transaction[]>([]);

  const [buyOrders, setBuyOrders] = useState<Transaction[]>([]);
  const [sellOrders, setSellOrders] = useState<Transaction[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [fromDate, setFromDate] = useState<Date>(firstDayOfMonth);
  const [toDate, setToDate] = useState<Date>(now);

  const loadOrders = useCallback(async (refresh = false, forceRefresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        console.log('🔄 [TransactionManagement] Pull-to-refresh triggered');
      } else {
        setLoading(true);
        console.log('🔄 [TransactionManagement] Loading orders...');
      }

      // Load both pending orders and transaction history with force refresh if needed
      const [pendingOrders, historyOrders] = await Promise.all([
        transactionApi.getPendingTransactions(forceRefresh),
        transactionApi.getTransactionHistory(forceRefresh)
      ]);
      
      console.log(`📊 [TransactionManagement] Loaded ${pendingOrders.length} pending orders and ${historyOrders.length} history transactions`);
      
      // Separate buy and sell orders from pending
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
      setAllBuyOrders(buyOrdersData);
      setAllSellOrders(sellOrdersData);
      setAllTransactionHistory(historyOrders);

      setBuyOrders(buyOrdersData);
      setSellOrders(sellOrdersData);
      setTransactionHistory(historyOrders);
      
      console.log(`✅ [TransactionManagement] Data loaded - Buy: ${buyOrdersData.length}, Sell: ${sellOrdersData.length}, History: ${historyOrders.length}`);

    } catch (error) {
      console.error('❌ [TransactionManagement] Error loading orders:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách giao dịch. Vui lòng thử lại.',
        [
          { text: 'Thử lại', onPress: () => loadOrders(false, true) },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } finally {
      filterOrdersByDate(fromDate, toDate);

      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filterOrdersByDate = useCallback(( from: Date, to: Date) => {
    setFromDate(from);
    setToDate(to);
    const isInRange = (dateStr: string) => {
      const d = parseDate(dateStr);
      return d>= from && d<=to;
    };
    setBuyOrders(allBuyOrders.filter(order => isInRange(order.session_date)));
    setSellOrders(allSellOrders.filter(order => isInRange(order.session_date)));
    setTransactionHistory(allTransactionHistory.filter(order => isInRange(order.session_date)));
    
  }, [allBuyOrders, allSellOrders, allTransactionHistory]);

  useEffect(() => {
    filterOrdersByDate(fromDate, toDate);
  }, [allBuyOrders, allSellOrders, allTransactionHistory]);

  

    
  
  // Auto refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 [TransactionManagement] Screen focused, refreshing orders...');
      loadOrders(false, false);
    }, [loadOrders])
  );

  const onRefresh = useCallback(() => {
    loadOrders(true, true); // Force refresh on pull-to-refresh
  }, [loadOrders]);

  const handleOrderPress = (transaction: Transaction) => {
    // TODO: Navigate to order detail or edit screen
    console.log('Order pressed:', transaction);
  };

 

 

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={
          activeTab === 'buy' ? 'trending-up-outline' : 
          activeTab === 'sell' ? 'trending-down-outline' : 
          'time-outline'
        } 
        size={64} 
        color="#CCCCCC" 
      />
      <Text style={styles.emptyStateText}>
        {activeTab === 'buy' ? 'Chưa có lệnh mua nào' : 
         activeTab === 'sell' ? 'Chưa có lệnh bán nào' :
         'Chưa có lịch sử giao dịch'
        }
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {activeTab === 'buy' ? 
          'Tạo lệnh mua để đầu tư vào các quỹ' : 
          activeTab === 'sell' ?
          'Tạo lệnh bán để chốt lời các quỹ trong danh mục' :
          'Lịch sử giao dịch sẽ hiển thị sau khi bạn thực hiện giao dịch'
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

  const currentOrders = activeTab === 'buy' ? buyOrders : 
                        activeTab === 'sell' ? sellOrders : 
                        transactionHistory;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <OrderTabHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          buyOrdersCount={buyOrders.length}
          sellOrdersCount={sellOrders.length}
          historyCount={transactionHistory.length}
          onRefresh={onRefresh}
          loading={loading}
          refreshing={refreshing}
          fromDate={fromDate}
          toDate={toDate}
          onDateFilterChange={filterOrdersByDate}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OrderTabHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        buyOrdersCount={buyOrders.length}
        sellOrdersCount={sellOrders.length}
        historyCount={transactionHistory.length}
        onRefresh={onRefresh}
        loading={loading}
        refreshing={refreshing}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={filterOrdersByDate}
      />
      
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TransactionManagementScreen; 