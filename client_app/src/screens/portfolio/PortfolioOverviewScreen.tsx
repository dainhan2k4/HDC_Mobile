import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioOverview } from '../../types/portfolio';
import { PieChartCustom } from '../../components/common/PieChartCustom';
import { Fund } from '../../types/fund';

interface PortfolioOverviewScreenProps {
  portfolio: PortfolioOverview;
  fundsInvested: Fund[];
  onFundPress: (fund: any) => void;
  onTransactionPress: (transaction: any) => void;
}

export const PortfolioOverviewScreen: React.FC<PortfolioOverviewScreenProps> = ({
  portfolio,
  fundsInvested,
  onFundPress,
  onTransactionPress,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPerformanceColor = (percentage: number) => {
    return percentage >= 0 ? '#33FF57' : '#DC143C';
  };

  const renderPortfolioSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng giá trị thị trường</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(portfolio.total_investment ?? 0)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng giá trị đầu tư trung bình</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(portfolio.total_current_value ?? 0)}
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
          {formatCurrency(portfolio.total_profit_loss ?? 0)}
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
  );

  const renderDetailFund = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chi tiết quỹ</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {fundsInvested && fundsInvested.length > 0 ? (
          fundsInvested.map((fund) => (
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
              <Text style={styles.fundValue}>{formatCurrency(fund.current_nav)}</Text>
              <Text 
                style={[
                  styles.fundPerformance, 
                  { color: getPerformanceColor(fund.profit_loss_percentage) }
                ]}
              >
                {formatPercentage(fund.profit_loss_percentage)}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.fundCard}>
            <Text>Không có dữ liệu quỹ</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  
  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      {portfolio.transactions.slice(0, 5).map((transaction) => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionItem}
          onPress={() => onTransactionPress(transaction)}
        >
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>
              {transaction.fund.name} - {transaction.fund.ticker}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.transactionValue,
                {
                  color:
                    transaction.transaction_type === 'purchase' ? '#2B4BFF' : '#FF5733',
                },
              ]}
            >
              {transaction.transaction_type === 'purchase' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.transactionStatus}>
              {transaction.status === 'completed'
                ? 'Hoàn thành'
                : transaction.status === 'pending'
                ? 'Chờ xử lý'
                : 'Đã hủy'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.topPadding} />

        {renderPortfolioSummary()}
        {renderDetailFund()}
        {renderRecentTransactions()}

        <PieChartCustom 
          data={fundsInvested.map(fund => ({
            name: fund.ticker,
            value: fund.current_value
          }))}
          sliceColor={fundsInvested.map(fund => fund.color || '#2B4BFF')}
          title='Phân bổ danh mục đầu tư'
        />
        <View style={styles.bottomPadding} />

      </ScrollView>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  topPadding: {
    height: 0,
  },
  bottomPadding: {
    height: 0,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2B4BFF',
    fontWeight: '600',
  },
  fundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginLeft: 24,
    marginRight: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    color: '#6C757D',
  },
}); 