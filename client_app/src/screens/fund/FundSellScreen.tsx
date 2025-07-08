import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatVND from '../../hooks/formatCurrency';
import { fundApi } from '../../api/fundApi';

interface SellRouteParams {
  fundId: number;
  fundName: string;
  currentUnits: number;
  currentNav?: number;
}

export const FundSellScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { fundId, fundName, currentUnits, currentNav = 25000 } = (route.params as SellRouteParams) || {};

  const [sellAmount, setSellAmount] = useState('');
  const [sellUnits, setSellUnits] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'amount' | 'units'>('units');

  // Calculate amount from units or vice versa
  const handleUnitsChange = (value: string) => {
    setSellUnits(value);
    setCalculationMode('units');
    
    const numericUnits = parseFloat(value);
    if (!isNaN(numericUnits) && numericUnits > 0) {
      const calculatedAmount = numericUnits * currentNav;
      setSellAmount(calculatedAmount.toString());
    } else {
      setSellAmount('');
    }
  };

  const handleAmountChange = (value: string) => {
    setSellAmount(value);
    setCalculationMode('amount');
    
    const numericAmount = parseFloat(value.replace(/[,\.]/g, ''));
    if (!isNaN(numericAmount) && numericAmount > 0) {
      const calculatedUnits = numericAmount / currentNav;
      setSellUnits(calculatedUnits.toFixed(4));
    } else {
      setSellUnits('');
    }
  };

  const handleSellAll = () => {
    setSellUnits(currentUnits.toString());
    setSellAmount((currentUnits * currentNav).toString());
    setCalculationMode('units');
  };

  const handleSellFund = async () => {
    if (!sellAmount || !sellUnits) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hoặc số đơn vị muốn bán');
      return;
    }

    const numericAmount = parseFloat(sellAmount.replace(/[,\.]/g, ''));
    const numericUnits = parseFloat(sellUnits);

    if (numericUnits > currentUnits) {
      Alert.alert('Lỗi', `Bạn chỉ có thể bán tối đa ${currentUnits} đơn vị`);
      return;
    }

    if (numericUnits <= 0) {
      Alert.alert('Lỗi', 'Số đơn vị bán phải lớn hơn 0');
      return;
    }

    Alert.alert(
      'Xác nhận bán quỹ',
      `Bạn muốn bán ${numericUnits.toFixed(4)} đơn vị quỹ ${fundName} với tổng giá trị dự kiến ${formatVND(numericAmount)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          style: 'destructive',
          onPress: () => executeSellOrder(numericAmount, numericUnits)
        }
      ]
    );
  };

  const executeSellOrder = async (amount: number, units: number) => {
    try {
      setIsLoading(true);
      console.log(`🔄 [SellFund] Executing sell order for fund ${fundId}:`, { amount, units });
      
      // Call real API to execute sell order
      const response = await fundApi.sellFund(fundId, units);
      console.log('✅ [SellFund] Sell order response:', response);
      
      Alert.alert(
        'Thành công!',
        `Đã đặt lệnh bán ${units.toFixed(4)} đơn vị quỹ ${fundName} thành công. Portfolio sẽ được cập nhật ngay lập tức.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to trigger portfolio refresh
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ [SellFund] Sell order failed:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đặt lệnh bán. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bán quỹ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fund Info */}
        <View style={styles.fundInfoCard}>
          <Text style={styles.fundName}>{fundName}</Text>
          <View style={styles.fundInfoRow}>
            <Text style={styles.fundInfoLabel}>NAV hiện tại:</Text>
            <Text style={styles.fundInfoValue}>{formatVND(currentNav)}</Text>
          </View>
          <View style={styles.fundInfoRow}>
            <Text style={styles.fundInfoLabel}>Số đơn vị đang sở hữu:</Text>
            <Text style={styles.fundInfoValue}>{currentUnits}</Text>
          </View>
          <View style={styles.fundInfoRow}>
            <Text style={styles.fundInfoLabel}>Giá trị hiện tại:</Text>
            <Text style={[styles.fundInfoValue, styles.totalValue]}>
              {formatVND(currentUnits * currentNav)}
            </Text>
          </View>
        </View>

        {/* Sell Form */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin bán</Text>
            <TouchableOpacity style={styles.sellAllButton} onPress={handleSellAll}>
              <Text style={styles.sellAllButtonText}>Bán tất cả</Text>
            </TouchableOpacity>
          </View>
          
          {/* Units Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số đơn vị muốn bán</Text>
            <TextInput
              style={[styles.input, calculationMode === 'units' && styles.inputActive]}
              value={sellUnits}
              onChangeText={handleUnitsChange}
              placeholder={`Nhập số đơn vị (tối đa ${currentUnits})`}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số tiền dự kiến nhận (VNĐ)</Text>
            <TextInput
              style={[styles.input, calculationMode === 'amount' && styles.inputActive]}
              value={sellAmount ? formatVND(parseFloat(sellAmount.replace(/[,\.]/g, ''))) : ''}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                handleAmountChange(numericValue);
              }}
              placeholder="Số tiền dự kiến nhận"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Calculation Summary */}
          {sellAmount && sellUnits && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tóm tắt giao dịch</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số đơn vị bán:</Text>
                <Text style={styles.summaryValue}>{parseFloat(sellUnits).toFixed(4)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NAV:</Text>
                <Text style={styles.summaryValue}>{formatVND(currentNav)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Còn lại sau bán:</Text>
                <Text style={styles.summaryValue}>
                  {(currentUnits - parseFloat(sellUnits)).toFixed(4)} đơn vị
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryLabelTotal}>Số tiền dự kiến:</Text>
                <Text style={styles.summaryValueTotal}>
                  {formatVND(parseFloat(sellAmount.replace(/[,\.]/g, '')))}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Lưu ý quan trọng</Text>
          <Text style={styles.noteText}>• Lệnh bán sẽ được xử lý theo NAV cuối ngày</Text>
          <Text style={styles.noteText}>• Thời gian xử lý: 1-2 ngày làm việc</Text>
          <Text style={styles.noteText}>• Tiền sẽ được chuyển về tài khoản trong 3-5 ngày</Text>
          <Text style={styles.noteText}>• Phí giao dịch: 0% (miễn phí)</Text>
          <Text style={styles.noteText}>• NAV thực tế có thể khác với NAV hiện tại</Text>
        </View>
      </ScrollView>

      {/* Sell Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.sellButton, (!sellAmount || !sellUnits || isLoading) && styles.sellButtonDisabled]}
          onPress={handleSellFund}
          disabled={!sellAmount || !sellUnits || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.sellButtonText}>Đặt lệnh bán</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fundInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fundName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC3545',
    marginBottom: 12,
  },
  fundInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fundInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  fundInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  totalValue: {
    color: '#28A745',
    fontSize: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  sellAllButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sellAllButtonText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputActive: {
    borderColor: '#DC3545',
    borderWidth: 2,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryLabelTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  summaryValueTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC3545',
  },
  notesCard: {
    backgroundColor: '#F8D7DA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#721C24',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#721C24',
    lineHeight: 16,
    marginBottom: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  sellButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  sellButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 