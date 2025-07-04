import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FundCard } from '../../components/common/FundCard';
import { Fund } from '../../types/fund';

interface FundListScreenProps {
  funds: Fund[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onFundPress: (fund: Fund) => void;
  onBuyPress: (fund: Fund) => void;
  onSellPress: (fund: Fund) => void;
}

export const FundListScreen: React.FC<FundListScreenProps> = ({
  funds,
  isLoading = false,
  onRefresh,
  onFundPress,
  onBuyPress,
  onSellPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFunds, setFilteredFunds] = useState<Fund[]>(funds);
  const [selectedType, setSelectedType] = useState<string>('all');

  const investmentTypes = [
    { key: 'all', label: 'Tất cả' },
    { key: 'equity', label: 'Cổ phiếu' },
    { key: 'fixed_income', label: 'Trái phiếu' },
    { key: 'balanced', label: 'Cân bằng' },
    { key: 'money_market', label: 'Thị trường tiền tệ' },
  ];

  useEffect(() => {
    filterFunds();
  }, [funds, searchQuery, selectedType]);

  const filterFunds = () => {
    let filtered = funds;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (fund) =>
          fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fund.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by investment type
    if (selectedType !== 'all') {
      filtered = filtered.filter((fund) => fund.investment_type === selectedType);
    }

    setFilteredFunds(filtered);
  };

  const renderFundItem = ({ item }: { item: Fund }) => (
    <FundCard
      fund={item}
      onPress={onFundPress}
      showActions={true}
      onBuyPress={onBuyPress}
      onSellPress={onSellPress}
    />
  );

  const renderTypeFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        data={investmentTypes}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === item.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType(item.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === item.key && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Không tìm thấy quỹ</Text>
      <Text style={styles.emptyStateSubtitle}>
        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm quỹ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {renderTypeFilter()}

      <View style={styles.topPadding} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải danh sách quỹ...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFunds}
          renderItem={renderFundItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={['#2B4BFF']}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <View style={styles.bottomPadding} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topPadding: {
    height: 20,
  },
  bottomPadding: {
    height: 80,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterList: {
    paddingHorizontal: 24,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2B4BFF',
    borderColor: '#2B4BFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 8,
  },
}); 