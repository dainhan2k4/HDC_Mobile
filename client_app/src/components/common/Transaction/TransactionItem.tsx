import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../../../types/transaction';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { TransactionStatusTag } from './TransactionStatusTag';
import { formatVND, formatDate } from '../../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(transaction)} disabled={!onPress}>
      <TransactionTypeIcon type={transaction.transaction_type} />
      <View style={styles.infoContainer}>
        <Text style={styles.fundName} numberOfLines={1}>
          {transaction.fund.name} ({transaction.fund.ticker})
        </Text>
        <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatVND(transaction.amount)}</Text>
        <TransactionStatusTag status={transaction.status} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  fundName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#343a40',
  },
  date: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
}); 