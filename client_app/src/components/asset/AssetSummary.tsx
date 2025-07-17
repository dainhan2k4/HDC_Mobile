import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChartCustom } from '../common/PieChartCustom';

interface FundCertificate {
  name: string;
  code: string;
  quantity: number;
  value: number;
  change: number;
  isProfit: boolean;
  color?: string;
}

interface AssetSummaryProps {
  totalAssets?: number;
  fundCertificates?: FundCertificate[];
}

export const AssetSummary: React.FC<AssetSummaryProps> = ({ totalAssets, fundCertificates = [] }) => {
  // Prepare data for pie chart
  const pieChartData = fundCertificates.map(fund => ({
    name: fund.name,
    value: fund.value || 0,
  }));

  const pieChartColors = fundCertificates.map(fund => fund.color || '#4F46E5');

  return (
    <View style={styles.container}>
      {/* Total Assets Section */}
      <View style={styles.assetSection}>
        <Text style={styles.assetTotal}>
          {totalAssets?.toLocaleString('vi-VN') ?? '650,440'}đ
        </Text>
        <Text style={styles.assetLabel}>Tổng tài sản</Text>
      </View>

      {/* Fund Distribution Chart */}
      {pieChartData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Phân bổ quỹ đầu tư</Text>
          <PieChartCustom 
            data={pieChartData}
            sliceColor={pieChartColors.length > 0 ? pieChartColors : ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  assetSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 20,
  },
  assetTotal: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  assetLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartSection: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center',
  },
});
