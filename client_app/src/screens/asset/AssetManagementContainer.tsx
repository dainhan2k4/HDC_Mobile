import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const AssetManagementContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý tài sản</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add-circle-outline" size={24} color="#2B4BFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tổng quan tài sản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan tài sản</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng giá trị</Text>
              <Text style={styles.summaryValue}>2,500,000,000 VND</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lãi/Lỗ hôm nay</Text>
              <Text style={[styles.summaryValue, { color: '#33FF57' }]}>+125,000,000 VND</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng lãi/Lỗ</Text>
              <Text style={[styles.summaryValue, { color: '#33FF57' }]}>+450,000,000 VND</Text>
            </View>
          </View>
        </View>

        {/* Phân bổ tài sản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân bổ tài sản</Text>
          <View style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={[styles.assetColor, { backgroundColor: '#2B4BFF' }]} />
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>Quỹ đầu tư</Text>
                <Text style={styles.assetPercentage}>65%</Text>
              </View>
              <Text style={styles.assetValue}>1,625,000,000 VND</Text>
            </View>
          </View>

          <View style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={[styles.assetColor, { backgroundColor: '#FF5733' }]} />
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>Tiết kiệm</Text>
                <Text style={styles.assetPercentage}>25%</Text>
              </View>
              <Text style={styles.assetValue}>625,000,000 VND</Text>
            </View>
          </View>

          <View style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={[styles.assetColor, { backgroundColor: '#33FF57' }]} />
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>Tiền mặt</Text>
                <Text style={styles.assetPercentage}>10%</Text>
              </View>
              <Text style={styles.assetValue}>250,000,000 VND</Text>
            </View>
          </View>
        </View>

        {/* Tài khoản ngân hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản ngân hàng</Text>
          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <Ionicons name="card-outline" size={24} color="#2B4BFF" />
              <Text style={styles.bankName}>Vietcombank</Text>
            </View>
            <Text style={styles.accountNumber}>**** **** **** 1234</Text>
            <Text style={styles.accountBalance}>Số dư: 150,000,000 VND</Text>
          </View>

          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <Ionicons name="card-outline" size={24} color="#FF5733" />
              <Text style={styles.bankName}>BIDV</Text>
            </View>
            <Text style={styles.accountNumber}>**** **** **** 5678</Text>
            <Text style={styles.accountBalance}>Số dư: 75,000,000 VND</Text>
          </View>

          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <Ionicons name="card-outline" size={24} color="#8B4513" />
              <Text style={styles.bankName}>HDBank</Text>
            </View>
            <Text style={styles.accountNumber}>**** **** **** 9012</Text>
            <Text style={styles.accountBalance}>Số dư: 125,000,000 VND</Text>
          </View>
        </View>

        {/* Thống kê */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Quỹ đang đầu tư</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8.5%</Text>
              <Text style={styles.statLabel}>Lợi nhuận TB</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Tháng đầu tư</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  assetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  assetPercentage: {
    fontSize: 14,
    color: '#6C757D',
  },
  assetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B4BFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
}); 