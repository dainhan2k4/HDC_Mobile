import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import formatVND from '../../hooks/formatCurrency';
import { Fund } from '../../types/fund';

interface FundListItemProps {
  fund: Fund;
  isSelected: boolean;
  onPress: (fund: Fund) => void;
}

export const FundListItem: React.FC<FundListItemProps> = ({
  fund,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={() => onPress(fund)}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {fund.name}
        </Text>
        <Text style={styles.ticker}>{fund.ticker}</Text>
        <Text style={styles.value}>{formatVND(fund.current_nav)}</Text>
      </View>
      {fund.is_shariah && (
        <View style={styles.shariahBadge}>
          <Text style={styles.shariahText}>Shariah</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2B4BFF',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    lineHeight: 18,
  },
  ticker: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#2B4BFF',
    fontWeight: '600',
  },
  shariahBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6F42C1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shariahText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 