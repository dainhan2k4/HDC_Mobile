import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fund } from '../../types/fund';

interface FundDetailScreenProps {
  fund: Fund | null;
  isLoading: boolean;
}

export const FundDetailScreen: React.FC<FundDetailScreenProps> = ({ fund, isLoading }) => {
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải thông tin quỹ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fund) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Không tìm thấy quỹ</Text>
          <Text style={styles.subtitle}>Quỹ này có thể đã bị xóa hoặc không tồn tại</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{fund.name}</Text>
        <Text style={styles.ticker}>{fund.ticker}</Text>
        <Text style={styles.description}>{fund.description}</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NAV hiện tại:</Text>
            <Text style={styles.infoValue}>{fund.current_nav.toLocaleString('vi-VN')} VND</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lãi/Lỗ:</Text>
            <Text style={[styles.infoValue, { color: fund.profit_loss_percentage >= 0 ? '#33FF57' : '#DC143C' }]}>
              {fund.profit_loss_percentage >= 0 ? '+' : ''}{fund.profit_loss_percentage.toFixed(2)}%
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loại đầu tư:</Text>
            <Text style={styles.infoValue}>{fund.investment_type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái:</Text>
            <Text style={styles.infoValue}>{fund.status}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  ticker: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B4BFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
}); 