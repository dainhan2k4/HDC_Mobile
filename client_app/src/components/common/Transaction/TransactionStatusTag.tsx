import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../../types/transaction';

interface TransactionStatusTagProps {
  status: Transaction['status'];
}

const statusConfig: Record<Transaction['status'], { text: string; backgroundColor: string; textColor: string }> = {
  pending: {
    text: 'Chờ khớp',
    backgroundColor: '#fff3cd',
    textColor: '#856404',
  },
  completed: {
    text: 'Đã khớp',
    backgroundColor: '#d4edda',
    textColor: '#155724',
  },
  cancelled: {
    text: 'Đã hủy',
    backgroundColor: '#f8d7da',
    textColor: '#721c24',
  },
};

export const TransactionStatusTag: React.FC<TransactionStatusTagProps> = ({ status }) => {
  const config = statusConfig[status] || {
    text: 'Không xác định',
    backgroundColor: '#e9ecef',
    textColor: '#495057',
  };

  return (
    <View style={[styles.tag, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
}); 