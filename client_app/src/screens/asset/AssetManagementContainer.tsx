import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Icons handled in child components
import { useFocusEffect } from '@react-navigation/native';
import { getAssetManagement } from '../../api/assetApi';
// Nếu có PieChartCustom thì import, nếu không thì để placeholder
import { AssetSummary } from '../../components/asset/AssetSummary';
import { FundHoldingsList } from '../../components/asset/FundHoldingsList';
import { SwapOrdersList } from '../../components/asset/SwapOrdersList';

export const AssetManagementContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [assetData, setAssetData] = useState<any>(null);

  // Fetch data helper so we can reuse in focus effect
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

  // Refetch whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
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

  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} />}
      >
        <AssetSummary 
          totalAssets={assetData.totalAssets} 
          fundCertificates={assetData.fundCertificates || []} 
        />
        
        {/* Holdings with fund switching */}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
}); 