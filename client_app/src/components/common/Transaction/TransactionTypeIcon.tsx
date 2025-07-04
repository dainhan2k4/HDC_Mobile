import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../../types/transaction';

interface TransactionTypeIconProps {
  type: Transaction['transaction_type'];
  size?: number;
}

const iconConfig: Record<Transaction['transaction_type'], { name: string; color: string }> = {
  purchase: {
    name: 'arrow-up-circle',
    color: '#28a745', // Green for purchase
  },
  sale: {
    name: 'arrow-down-circle',
    color: '#dc3545', // Red for sale
  },
  // Add other types if needed
};

export const TransactionTypeIcon: React.FC<TransactionTypeIconProps> = ({ type, size = 36 }) => {
  const config = iconConfig[type] || { name: 'help-circle', color: '#6c757d' };

  return (
    <View style={styles.container}>
      <Ionicons name={config.name as any} size={size} color={config.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
}); 