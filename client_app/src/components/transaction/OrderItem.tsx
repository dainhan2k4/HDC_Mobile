import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatVND } from '../../hooks/formatCurrency';
import { Transaction } from '../../api/transactionApi';

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'success':
      case 'hoàn thành':
        return '#28A745';
      case 'pending':
      case 'waiting':
      case 'chờ xử lý':
        return '#FFC107';
      case 'failed':
      case 'error':
      case 'thất bại':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'success':
        return 'Hoàn thành';
      case 'pending':
      case 'waiting':
        return 'Chờ xử lý';
      case 'failed':
      case 'error':
        return 'Thất bại';
      default:
        return status;
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
            {transaction.order_date}
          </Text>
          {transaction.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}> 
              <Text style={styles.statusText}>
                {getStatusText(transaction.status)}
              </Text>
            </View>
          )}
        </View>
        {/* Order Details */}
        <View style={styles.orderDetails}>
          <Text style={styles.amount}>
            {formatVND(transaction.amount)}
          </Text>
          <Text style={styles.units}>
            {transaction.units || 0} CCQ
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

const styles = StyleSheet.create({
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

export default OrderItem; 