import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAssetManagement } from '../../api/assetApi';
import { FundHoldingsList } from '../../components/asset/FundHoldingsList';
import { SwapOrdersList } from '../../components/asset/SwapOrdersList';
import { PieChartCustom } from '../../components/common/PieChartCustom';
import { AppColors } from '@/styles/GlobalTheme';

// Bộ màu cố định
const FIXED_COLORS = [
  '#2B4BFF', // Xanh dương đậm
  '#36A2EB', // Xanh dương nhạt
  '#4BC0C0', // Xanh ngọc
  '#FFCE56', // Vàng
  '#FF6384', // Hồng
  '#9966FF', // Tím
];

export const AssetManagementContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [assetData, setAssetData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAssetManagement();
      setAssetData(data);
    } catch (e) {
      console.log('❌ [AssetManagementContainer] Failed to load asset data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.secondary.main} />
          <Text style={styles.loadingText}>Đang tải dữ liệu tài sản...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assetData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không có dữ liệu tài sản</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Chuẩn bị dữ liệu cho PieChartCustom với màu cố định
  const pieChartData = assetData.holdings?.map((holding: any, index: number) => ({
    label: holding.fund,
    value: holding.currentValue || 0,
    color: FIXED_COLORS[index % FIXED_COLORS.length], // Sử dụng màu cố định
  })) || [];

  return (
    <SafeAreaView style={{backgroundColor: AppColors.background.primary}}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} 
          
        >
          Quản lý tài sản
          </Text>
        <View style={styles.headerSummary}>
          <Text style={styles.headerSummaryLabel}>Tổng tài sản</Text>
          <Text style={styles.headerSummaryValue}>
            {assetData.totalAssets?.toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} />}
      >
        {/* Hiển thị biểu đồ tròn với màu cố định */}
        <PieChartCustom
          data={pieChartData}
        />

        {assetData.fundCertificates && assetData.fundCertificates.length > 0 && (
          <FundHoldingsList
            funds={assetData.fundCertificates.map((fund: any) => ({
              code: fund.code,
              name: fund.name,
              holdings: assetData.holdings?.filter((holding: any) =>
                holding.fund === fund.code || holding.fund === fund.name
              ) || []
            }))}
            initialFund={assetData.fundCertificates[0]?.code}
          />
        )}

        <SwapOrdersList
          funds={assetData.fundCertificates || []}
          orders={assetData.swapOrders?.items || []}
          initialFund={assetData.fundCertificates?.[0]?.code}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: AppColors.primary.main,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
  },
  headerTitle: {
    color: AppColors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSummaryLabel: {
    color: AppColors.text.inverse,
    fontSize: 16,
  },
  headerSummaryValue: {
    color: AppColors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 