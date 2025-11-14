import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { transactionApi, Transaction } from '../../api/transactionApi';
import OrderItem from '../../components/transaction/OrderItem';
import OrderTabHeader from '../../components/transaction/OrderTabHeader';
import parseDate from '../../hooks/parseDate';
import SignatureSelector from '../../components/signature/SignatureSelector';
import SignatureModal from '../../components/signature/SignatureModal';

type TabType = 'buy' | 'sell' | 'history';

const TransactionManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Signature states
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureType, setSignatureType] = useState<'hand' | 'digital' | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'buy' | 'sell';
    fundId: number;
    fundName: string;
    amount?: number;
    units: number;
  } | null>(null);
  const [userEmail, setUserEmail] = useState('user@example.com');

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
        transactionApi.getPendingTransactions(forceRefresh).catch(err => {
          console.error('❌ [TransactionManagement] Failed to load pending transactions:', err);
          return []; // Return empty array on error
        }),
        transactionApi.getTransactionHistory(forceRefresh, { limit: 200 }).catch(err => {
          console.error('❌ [TransactionManagement] Failed to load transaction history:', err);
          return []; // Return empty array on error
        })
      ]);
      
      // Đảm bảo luôn là array
      const safePendingOrders = Array.isArray(pendingOrders) ? pendingOrders : [];
      const safeHistoryOrders = Array.isArray(historyOrders) ? historyOrders : [];
      
      console.log(`📊 [TransactionManagement] Loaded ${safePendingOrders.length} pending orders and ${safeHistoryOrders.length} history transactions`);
      
      // Separate buy and sell orders from pending
      const buyOrdersData = safePendingOrders.filter(order => {
        const type = order?.transaction_type?.toLowerCase() || '';
        const isBuy = type === 'buy' || type === 'purchase' || type === 'mua';
        if (isBuy) {
          console.log(`✅ [TransactionManagement] Found buy order:`, {
            id: order.id,
            fund_name: order.fund_name,
            transaction_type: order.transaction_type,
            session_date: order.session_date,
            order_date: order.order_date,
            amount: order.amount,
            units: order.units
          });
        }
        return isBuy;
      });
      
      const sellOrdersData = safePendingOrders.filter(order => 
        order?.transaction_type && (
          order.transaction_type.toLowerCase() === 'sell' || 
          order.transaction_type.toLowerCase() === 'sale' ||
          order.transaction_type.toLowerCase() === 'bán'
        )
      );
      
      console.log(`📊 [TransactionManagement] Separated orders - Buy: ${buyOrdersData.length}, Sell: ${sellOrdersData.length} from ${safePendingOrders.length} pending orders`);
      setAllBuyOrders(buyOrdersData);
      setAllSellOrders(sellOrdersData);
      setAllTransactionHistory(safeHistoryOrders);
      
      // Debug: Log sample dates
      if (safeHistoryOrders.length > 0) {
        console.log(`📅 [Debug] Sample session_dates:`, safeHistoryOrders.slice(0, 3).map(order => order?.session_date));
      }
      
      console.log(`✅ [TransactionManagement] Data loaded - Buy: ${buyOrdersData.length}, Sell: ${sellOrdersData.length}, History: ${safeHistoryOrders.length}`);

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
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Hàm chỉ để update date state khi user chọn từ DatePicker
  const handleDateFilterChange = useCallback((from: Date, to: Date) => {
    console.log(`📅 [DatePicker] User changed date range: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`);
    setFromDate(from);
    setToDate(to);
  }, []);

  // useEffect tự động filter khi data hoặc date range thay đổi
  useEffect(() => {
    console.log(`🔍 [Filter] Auto-filtering with range: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`);
    
    // Guard clause: đảm bảo tất cả đều là array
    const safeBuyOrders = Array.isArray(allBuyOrders) ? allBuyOrders : [];
    const safeSellOrders = Array.isArray(allSellOrders) ? allSellOrders : [];
    const safeHistory = Array.isArray(allTransactionHistory) ? allTransactionHistory : [];
    
    // Helper function để lấy date từ order (ưu tiên session_date, sau đó order_date)
    const getOrderDate = (order: Transaction): string | null => {
      return order?.session_date || order?.order_date || order?.date || null;
    };
    
    const isInRange = (dateStr: string | null): boolean => {
      if (!dateStr) return true; // Nếu không có date, vẫn hiển thị (không filter ra)
      try {
        const d = parseDate(dateStr);
        return d >= fromDate && d <= toDate;
      } catch (error) {
        console.warn(`⚠️ [Filter] Failed to parse date: ${dateStr}`, error);
        return true; // Nếu parse lỗi, vẫn hiển thị
      }
    };
    
    // Filter buy orders
    const filteredBuy = safeBuyOrders.filter(order => {
      const orderDate = getOrderDate(order);
      const inRange = isInRange(orderDate);
      if (!inRange && orderDate) {
        console.log(`🔍 [Filter] Buy order ${order.id} filtered out - date: ${orderDate}, range: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`);
      }
      return inRange;
    });
    
    // Filter sell orders
    const filteredSell = safeSellOrders.filter(order => {
      const orderDate = getOrderDate(order);
      return isInRange(orderDate);
    });
    
    // Filter history
    const filteredHistory = safeHistory.filter(order => {
      const orderDate = getOrderDate(order);
      return isInRange(orderDate);
    });
    
    console.log(`📊 [Filter] Results - Buy: ${filteredBuy.length}/${safeBuyOrders.length}, Sell: ${filteredSell.length}/${safeSellOrders.length}, History: ${filteredHistory.length}/${safeHistory.length}`);
    
    // Debug: Log sample buy orders
    if (safeBuyOrders.length > 0 && filteredBuy.length === 0) {
      console.log(`⚠️ [Filter] All buy orders filtered out! Sample orders:`, safeBuyOrders.slice(0, 3).map(order => ({
        id: order.id,
        fund_name: order.fund_name,
        session_date: order.session_date,
        order_date: order.order_date,
        transaction_type: order.transaction_type
      })));
    }
    
    setBuyOrders(filteredBuy);
    setSellOrders(filteredSell);
    setTransactionHistory(filteredHistory);
  }, [allBuyOrders, allSellOrders, allTransactionHistory, fromDate, toDate]);

  

    
  
  // Auto refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 [TransactionManagement] Screen focused, refreshing orders...');
      // Force refresh khi screen được focus để đảm bảo lấy dữ liệu mới nhất
      loadOrders(false, true);
    }, [loadOrders])
  );

  const onRefresh = useCallback(() => {
    loadOrders(true, true); // Force refresh on pull-to-refresh
  }, [loadOrders]);

  const handleOrderPress = (transaction: Transaction) => {
    // TODO: Navigate to order detail or edit screen
    console.log('Order pressed:', transaction);
  };

  // === Signature Handlers ===
  
  const handleBuyPress = (fundId: number, fundName: string, amount: number, units: number) => {
    setPendingTransaction({
      type: 'buy',
      fundId,
      fundName,
      amount,
      units,
    });
    setShowSignatureSelector(true);
  };

  const handleSellPress = (fundId: number, fundName: string, units: number) => {
    setPendingTransaction({
      type: 'sell',
      fundId,
      fundName,
      units,
    });
    setShowSignatureSelector(true);
  };

  const handleSignatureTypeSelected = (type: 'hand' | 'digital') => {
    setSignatureType(type);
    setShowSignatureSelector(false);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = async (signature: {
    type: 'hand' | 'digital';
    value: string;
    timestamp: string;
  }) => {
    setShowSignatureModal(false);

    if (!pendingTransaction) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin giao dịch');
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        pendingTransaction.type === 'buy'
          ? 'http://localhost:3000/api/v1/transaction/buy'
          : 'http://localhost:3000/api/v1/transaction/sell';

      const body =
        pendingTransaction.type === 'buy'
          ? {
              fundId: pendingTransaction.fundId,
              amount: pendingTransaction.amount,
              units: pendingTransaction.units,
              signature: {
                signature_type: signature.type,
                signature_value: signature.value,
                signer_email: userEmail,
              },
            }
          : {
              fundId: pendingTransaction.fundId,
              units: pendingTransaction.units,
              signature: {
                signature_type: signature.type,
                signature_value: signature.value,
                signer_email: userEmail,
              },
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        const action = pendingTransaction.type === 'buy' ? 'mua' : 'bán';
        Alert.alert(
          '✅ Thành công',
          `Đã ${action} ${pendingTransaction.units} CCQ thành công!\n\nChữ ký: ${
            signature.type === 'hand' ? 'Ký tay' : 'Ký số'
          }\nThời gian: ${new Date(signature.timestamp).toLocaleString('vi-VN')}`,
          [
            {
              text: 'OK',
              onPress: () => {
                loadOrders(false, true);
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Lỗi', result.error || 'Giao dịch thất bại');
      }
    } catch (error: any) {
      console.error('❌ [Transaction] Error:', error);
      Alert.alert('❌ Lỗi', error.message || 'Không thể thực hiện giao dịch');
    } finally {
      setLoading(false);
      setPendingTransaction(null);
      setSignatureType(null);
    }
  };

  const handleSignatureSelectorClose = () => {
    setShowSignatureSelector(false);
    setPendingTransaction(null);
  };

  const handleSignatureModalClose = () => {
    setShowSignatureModal(false);
    setSignatureType(null);
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
          onDateFilterChange={handleDateFilterChange}
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
        onDateFilterChange={handleDateFilterChange}
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

      {/* Signature Modals */}
      <SignatureSelector
        visible={showSignatureSelector}
        onClose={handleSignatureSelectorClose}
        onConfirm={handleSignatureTypeSelected}
        transactionType={pendingTransaction?.type || 'buy'}
        fundName={pendingTransaction?.fundName}
        amount={pendingTransaction?.amount}
      />

      <SignatureModal
        visible={showSignatureModal}
        onClose={handleSignatureModalClose}
        onSignatureComplete={handleSignatureComplete}
        transactionType={pendingTransaction?.type || 'buy'}
        userEmail={userEmail}
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