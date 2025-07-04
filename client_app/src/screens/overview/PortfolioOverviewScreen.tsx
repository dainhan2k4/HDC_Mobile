import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioOverview } from '../../types/portfolio';
import { PieChartCustom } from '../../components/common/PieChartCustom';
import { Fund } from '../../types/fund';
import { formatVND, formatDate } from '../../utils/formatters';
import { TransactionItem } from '../../components/common/Transaction/TransactionItem';

interface PortfolioOverviewScreenProps {
  portfolio: PortfolioOverview;
  fundsInvested: Fund[];
  onFundPress: (fund: any) => void;
  onTransactionPress: (transaction: any) => void;
}

const mockTransactions = [
  {
    id: 1,
    amount: 1000000,
    status: 'completed',
    created_at: '2024-07-28T10:00:00Z',
    updated_at: '2024-07-28T10:00:00Z',
    transaction_type: 'purchase',
    fund: {
      id: 1,
      name: 'Quỹ Đầu tư Cổ phiếu Hàng đầu VCBF',
      ticker: 'VCBF-BCF',
    },
  },
  {
    id: 2,
    amount: 2500000,
    status: 'pending',
    created_at: '2024-07-27T15:30:00Z',
    updated_at: '2024-07-27T15:30:00Z',
    transaction_type: 'purchase',
    fund: {
      id: 2,
      name: 'Quỹ Đầu tư Cân bằng Chiến lược VCBF',
      ticker: 'VCBF-TBF',
    },
  },
  {
    id: 3,
    amount: 500000,
    status: 'completed',
    created_at: '2024-07-26T11:00:00Z',
    updated_at: '2024-07-26T11:00:00Z',
    transaction_type: 'sale',
    fund: {
      id: 1,
      name: 'Quỹ Đầu tư Cổ phiếu Hàng đầu VCBF',
      ticker: 'VCBF-BCF',
    },
  },
    {
    id: 4,
    amount: 1200000,
    status: 'cancelled',
    created_at: '2024-07-25T09:00:00Z',
    updated_at: '2024-07-25T09:00:00Z',
    transaction_type: 'purchase',
    fund: {
      id: 3,
      name: 'Quỹ Trái phiếu VFF',
      ticker: 'VFF',
    },
  },
];

export const PortfolioOverviewScreen: React.FC<PortfolioOverviewScreenProps> = ({
  portfolio,
  fundsInvested,
  onFundPress,
  onTransactionPress,
}) => {
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPerformanceColor = (percentage: number) => {
    return percentage >= 0 ? '#33FF57' : '#DC143C';
  };

  const renderListHeader = () => (
    <>
      {/* Portfolio Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng giá trị thị trường</Text>
          <Text style={styles.summaryValue}>
            {formatVND(portfolio.total_investment ?? 0)}
          </Text>
        </View>
        <View style={styles.summaryCard}> 
          <Text style={styles.summaryLabel}>Tổng giá trị đầu tư trung bình</Text>
          <Text style={styles.summaryValue}>
            {formatVND(portfolio.total_current_value ?? 0)}
          </Text>
        </View> 
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng Lãi/Lỗ</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: getPerformanceColor(portfolio.total_profit_loss) },
            ]}
          >
            {formatVND(portfolio.total_profit_loss ?? 0)}
          </Text>
          <Text
            style={[
              styles.summaryPercentage,
              { color: getPerformanceColor(portfolio.total_profit_loss_percentage) },
            ]}
          >
            {formatPercentage(portfolio.total_profit_loss_percentage ?? 0)}
          </Text>
        </View>
      </View>

      {/* Invested Funds */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quỹ đã đầu tư</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={fundsInvested}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({item: fund}) => (
            <TouchableOpacity 
              key={fund.id} 
              style={styles.fundCard}
              onPress={() => onFundPress(fund)}
            >
              <View style={styles.fundHeader}>
                <View style={[styles.fundColor, { backgroundColor: fund.color }]} />
                <View>
                  <Text style={styles.fundTicker}>{fund.ticker}</Text>
                  <Text style={styles.fundName}>{fund.name}</Text>
                </View>
              </View>
              <Text style={styles.fundValue}>{formatVND(fund.current_nav)}</Text>
              <Text 
                style={[
                  styles.fundPerformance, 
                  { color: getPerformanceColor(fund.profit_loss_percentage) }
                ]}
              >
                {formatPercentage(fund.profit_loss_percentage)}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={styles.fundCard}><Text>Không có dữ liệu quỹ</Text></View>}
          contentContainerStyle={{paddingLeft: 24}}
        />
      </View>

      {/* Transactions Header */}
      <View style={styles.transactionHeaderContainer}>
        <Text style={styles.sectionTitle}>Giao dịch gần nhất</Text>
      </View>
    </>
  );

  const renderListFooter = () => (
    <PieChartCustom 
      data={fundsInvested.map(fund => ({
        name: fund.ticker,
        value: fund.current_value
      }))}
      sliceColor={fundsInvested.map(fund => fund.color || '#2B4BFF')}
      title='Phân bổ danh mục đầu tư'
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mockTransactions as any[]}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <View style={styles.transactionItemContainer}>
            <TransactionItem
              transaction={item}
              onPress={onTransactionPress}
            />
          </View>
        )}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
          <View style={{alignItems: 'center', marginTop: 20}}>
            <Text>Chưa có giao dịch nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  summaryPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  fundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fundColor: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  fundTicker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
  fundName: {
    fontSize: 12,
    color: '#6C757D',
  },
  fundValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  fundPerformance: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionHeaderContainer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  transactionItemContainer: {
    paddingHorizontal: 16,
  }
});