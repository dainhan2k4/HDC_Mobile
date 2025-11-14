import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatVND } from '../../hooks/formatCurrency';
import { Transaction } from '../../api/transactionApi';
import parseDate from '../../hooks/parseDate';

interface OrderItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ transaction, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'success':
      case 'hoàn thành':
        return '#28A745';
      case 'pending':
      case 'waiting':
      case 'chờ xử lý':
      case 'chờ khớp lệnh':
        return '#FFC107';
      case 'failed':
      case 'error':
      case 'thất bại':
        return '#DC3545';
      default:
        return '#FFC107'; // Default to pending color
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'success':
        return 'Hoàn thành';
      case 'pending':
      case 'waiting':
      case 'chờ xử lý':
      case 'chờ khớp lệnh':
        return 'Chờ khớp lệnh';
      case 'failed':
      case 'error':
        return 'Thất bại';
      default:
        return status || 'Chờ khớp lệnh';
    }
  };

  const getOrderDateValue = () => {
    return transaction.order_date ||
      transaction.orderDate ||
      transaction.date ||
      transaction.created_at ||
      '';
  };

  const getSessionDateValue = () => {
    return transaction.session_date ||
      transaction.sessionDate ||
      transaction.transaction_date ||
      '';
  };

  // Format date: "14/11/2025, 06:45"
  const formatOrderDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseDate(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();

      if (
        Number.isNaN(day) ||
        Number.isNaN(month) ||
        Number.isNaN(year) ||
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return dateStr;
      }

      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
      console.warn('⚠️ [OrderItem] Failed to parse order date:', dateStr, error);
      return dateStr;
    }
  };

  // Format session date: "14/11/2025"
  const formatSessionDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseDate(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
        return dateStr;
      }

      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } catch (error) {
      console.warn('⚠️ [OrderItem] Failed to parse session date:', dateStr, error);
      return dateStr;
    }
  };

  const formatUnitsValue = () => {
    const unitsValue = transaction.units;
    if (typeof unitsValue === 'string') {
      const trimmed = unitsValue.trim();
      if (!trimmed) return '0 CCQ';
      return trimmed.includes('CCQ') ? trimmed : `${trimmed} CCQ`;
    }
    const numeric = Number(unitsValue);
    if (!Number.isFinite(numeric)) return '0 CCQ';
    const formatted = Number.isInteger(numeric) ? numeric.toFixed(0) : numeric.toFixed(1);
    return `${formatted} CCQ`;
  };

  const formatAmountValue = () => {
    const rawValue = transaction.amount ?? transaction.amount_text ?? transaction.amount_display;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) return '0₫';
      return /[₫đ]/i.test(trimmed) ? trimmed : `${trimmed}₫`;
    }
    const numeric = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue).replace(/,/g, ''));
    if (!Number.isFinite(numeric)) {
      return '0₫';
    }
    return formatVND(numeric);
  };

  return (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      {/* Header Row: Fund Name & Status */}
      <View style={styles.headerRow}>
        <View style={styles.fundNameContainer}>
          <Text style={styles.fundName} numberOfLines={2}>
            {transaction.fund_name || 'N/A'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(transaction.status)}
          </Text>
        </View>
      </View>

      {/* Account Number */}
      {transaction.account_number && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số tài khoản:</Text>
          <Text style={styles.infoValue}>{transaction.account_number}</Text>
        </View>
      )}

      {/* Order Code */}
      {transaction.order_code && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã lệnh:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {transaction.order_code}
          </Text>
        </View>
      )}

      {/* Order Date */}
      {getOrderDateValue() && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày đặt lệnh:</Text>
          <Text style={styles.infoValue}>
            {formatOrderDate(getOrderDateValue())}
          </Text>
        </View>
      )}

      {/* Previous NAV */}
      {(transaction.previous_nav !== undefined && transaction.previous_nav !== null) || 
       (transaction.nav !== undefined && transaction.nav !== null) ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NAV kỳ trước:</Text>
          <Text style={styles.infoValue}>
            {(() => {
              const navValue = transaction.previous_nav !== undefined && transaction.previous_nav !== null
                ? transaction.previous_nav
                : transaction.nav;
              if (typeof navValue === 'string') {
                // Nếu là string đã format sẵn (ví dụ: "29,850đ"), dùng trực tiếp
                return navValue.includes('đ') ? navValue : `${navValue}₫`;
              } else if (typeof navValue === 'number') {
                return formatVND(navValue);
              }
              return 'N/A';
            })()}
          </Text>
        </View>
      ) : null}

      {/* Main Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Số lượng (CCQ)</Text>
          <Text style={styles.detailValue}>
            {formatUnitsValue()}
          </Text>
        </View>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Số tiền mua</Text>
          <Text style={[styles.detailValue, styles.amountValue]}>
            {formatAmountValue()}
          </Text>
        </View>
      </View>

      {/* Session Date */}
      {getSessionDateValue() && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phiên giao dịch:</Text>
          <Text style={styles.infoValue}>
            {formatSessionDate(getSessionDateValue())}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  orderItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailColumn: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  amountValue: {
    color: '#28A745',
  },
});

export default OrderItem;
