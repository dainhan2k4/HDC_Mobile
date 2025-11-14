import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  Modal,
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { apiService } from '../../config/apiService';
import { Fund } from '../../types/fund';

interface FundComparisonModalProps {
  visible: boolean;
  currentFund: Fund | null;
  onClose: () => void;
  onCompare: (selectedFundIds: number[]) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export const FundComparisonModal: React.FC<FundComparisonModalProps> = ({
  visible,
  currentFund,
  onClose,
  onCompare,
}) => {
  const [funds, setFunds] = useState([] as Fund[]);
  const [selectedFundIds, setSelectedFundIds] = useState([] as number[]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadFunds();
      if (currentFund) {
        setSelectedFundIds([currentFund.id]);
      }
      setSearchQuery('');
    } else {
      setSelectedFundIds([]);
      setSearchQuery('');
    }
  }, [visible, currentFund]);

  const loadFunds = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getFunds();
      if (response.success && response.data) {
        setFunds(response.data as Fund[]);
      }
    } catch (error) {
      console.error('❌ [Comparison] Failed to load funds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFunds = useMemo(() => {
    if (!searchQuery.trim()) {
      return funds;
    }
    const query = searchQuery.trim().toLowerCase();
    return funds.filter(fund => {
      const ticker = fund.ticker?.toLowerCase() || '';
      const name = fund.name?.toLowerCase() || '';
      return ticker.includes(query) || name.includes(query);
    });
  }, [funds, searchQuery]);

  const toggleFundSelection = (fundId: number) => {
    setSelectedFundIds(prev => {
      if (prev.includes(fundId)) {
        return prev.filter(id => id !== fundId);
      } else {
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, fundId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedFundIds.length >= 2) {
      onCompare(selectedFundIds);
      onClose();
    }
  };

  const renderFundItem = ({ item }: { item: Fund }) => {
    const isSelected = selectedFundIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.fundItem,
          isSelected && styles.fundItemSelected,
          isMobile && styles.mobileFundItem
        ]}
        onPress={() => toggleFundSelection(item.id)}
        disabled={!isSelected && selectedFundIds.length >= 5}
      >
        <View style={styles.fundItemContent}>
          <View style={styles.fundInfo}>
            <Text style={[styles.fundTicker, isMobile && styles.mobileFundTicker]}>
              {item.ticker}
            </Text>
            <Text 
              style={[styles.fundName, isMobile && styles.mobileFundName]} 
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <View style={styles.fundPrice}>
            <Text style={[styles.fundNav, isMobile && styles.mobileFundNav]}>
              {item.current_nav?.toLocaleString('vi-VN') || '—'}₫
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { minHeight: screenHeight * 0.55 },
            isMobile && { height: screenHeight * 0.75 }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isMobile && styles.mobileModalTitle]}>
              So sánh CCQ
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalSubtitle, isMobile && styles.mobileModalSubtitle]}>
              Chọn tối đa 5 quỹ để so sánh (đã chọn {selectedFundIds.length}/5)
            </Text>

            <View style={[styles.searchContainer, isMobile && styles.mobileSearchContainer]}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm kiếm CCQ theo mã hoặc tên"
                placeholderTextColor="#94A3B8"
                style={[styles.searchInput, isMobile && styles.mobileSearchInput]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            <View style={styles.listContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2B4BFF" />
                  <Text style={styles.loadingText}>Đang tải danh sách quỹ...</Text>
                </View>
              ) : filteredFunds.length === 0 ? (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>Không tìm thấy CCQ phù hợp</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredFunds}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderFundItem}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.fundListContent}
                  showsVerticalScrollIndicator={true}
                  removeClippedSubviews={false}
                />
              )}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, isMobile && styles.mobileButton]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, isMobile && styles.mobileButtonText]}>
                Hủy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.compareButton,
                selectedFundIds.length < 2 && styles.compareButtonDisabled,
                isMobile && styles.mobileButton
              ]}
              onPress={handleCompare}
              disabled={selectedFundIds.length < 2}
            >
              <Text style={[styles.compareButtonText, isMobile && styles.mobileButtonText]}>
                So sánh ({selectedFundIds.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
    alignSelf: 'stretch',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalBody: {
    flex: 1,
    paddingBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  listContainer: {
    flex: 1,
    paddingTop: 4,
  },
  fundListContent: {
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 8,
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mobileFundItem: {
    padding: 12,
  },
  mobileModalTitle: {
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  searchContainer: {
    marginHorizontal: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileSearchContainer: {
    borderRadius: 10,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  mobileSearchInput: {
    paddingVertical: 10,
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  fundItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2B4BFF',
  },
  fundItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundInfo: {
    flex: 1,
  },
  fundTicker: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  mobileFundTicker: {
    fontSize: 14,
  },
  fundName: {
    fontSize: 13,
    color: '#64748B',
  },
  mobileFundName: {
    fontSize: 12,
  },
  fundPrice: {
    marginLeft: 12,
  },
  fundNav: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  mobileFundNav: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2B4BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  mobileButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  compareButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  compareButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mobileButtonText: {
    fontSize: 14,
  },
});

