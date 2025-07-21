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
import { FundContractProps } from '../../types/fundcontract';

interface BuyRouteParams {
  fundId: number;
  fundName: string;
  currentNav?: number;
}

export const FundBuyScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { fundId, fundName, currentNav = 25000 } = (route.params as BuyRouteParams) || {};

  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'amount' | 'units'>('amount');

  const fundContract: FundContractProps = {
    fundName: fundName ,
    fundCode: fundId,
    quantity: parseFloat(units),
    value: parseFloat(amount),
    nav: currentNav,
    investorName: '',
    investorId: '', 
    investorAddress: '',
    transactionDate: new Date().toLocaleDateString('vi-VN'),
    signature: '', 
    investorPhone: '',
  };


  // Calculate units from amount or vice versa
  const handleAmountChange = (value: string) => {
    setAmount(value);
    setCalculationMode('amount');
    
    const numericAmount = parseFloat(value.replace(/[,\.]/g, ''));
    if (!isNaN(numericAmount) && numericAmount > 0) {
      const calculatedUnits = numericAmount / currentNav;
      setUnits(calculatedUnits.toFixed(4));
    } else {
      setUnits('');
    }
  };

  const handleUnitsChange = (value: string) => {
    setUnits(value);
    setCalculationMode('units');
    
    const numericUnits = parseFloat(value);
    if (!isNaN(numericUnits) && numericUnits > 0) {
      const calculatedAmount = numericUnits * currentNav;
      setAmount(calculatedAmount.toString());
    } else {
      setAmount('');
    }
  };

  const handleBuyFund = async () => {
    if (!amount || !units) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hoặc số đơn vị muốn mua');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[,\.]/g, ''));
    const numericUnits = parseFloat(units);

    if (numericAmount < 100000) {
      Alert.alert('Lỗi', 'Số tiền đầu tư tối thiểu là 100,000 VNĐ');
      return;
    }
    console.log(' fundContract in FundBuyScreen :', fundContract);
    (navigation as any).navigate('SignatureScene', { fundContract });    
    
  };

  const executeBuyOrder = async (amount: number, units: number) => {
    try {
      setIsLoading(true);
      console.log(`🔄 [BuyFund] Executing buy order for fund ${fundId}:`, { amount, units });
      
      // Call real API to execute buy order
      const response = await fundApi.buyFund(fundId, amount, units);
      console.log('✅ [BuyFund] Buy order response:', response);
      
      Alert.alert(
        'Thành công!',
        `Đã đặt lệnh mua ${units.toFixed(4)} đơn vị quỹ ${fundName} thành công. Portfolio sẽ được cập nhật ngay lập tức.`,
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
      console.error('❌ [BuyFund] Buy order failed:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đặt lệnh mua. Vui lòng thử lại.');
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
        <Text style={styles.headerTitle}>Mua quỹ</Text>
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
        </View>

        {/* Investment Form */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Thông tin đầu tư</Text>
          
          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số tiền muốn đầu tư (VNĐ)</Text>
            <TextInput
              style={[styles.input, calculationMode === 'amount' && styles.inputActive]}
              value={amount ? formatVND(parseFloat(amount.replace(/[,\.]/g, ''))) : ''}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                handleAmountChange(numericValue);
              }}
              placeholder="Nhập số tiền (tối thiểu 100,000 VNĐ)"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Units Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số đơn vị muốn mua</Text>
            <TextInput
              style={[styles.input, calculationMode === 'units' && styles.inputActive]}
              value={units}
              onChangeText={handleUnitsChange}
              placeholder="Nhập số đơn vị"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Calculation Summary */}
          {amount && units && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tóm tắt giao dịch</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số đơn vị:</Text>
                <Text style={styles.summaryValue}>{parseFloat(units).toFixed(4)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NAV:</Text>
                <Text style={styles.summaryValue}>{formatVND(currentNav)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryLabelTotal}>Tổng tiền:</Text>
                <Text style={styles.summaryValueTotal}>
                  {formatVND(parseFloat(amount.replace(/[,\.]/g, '')))}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Lưu ý quan trọng</Text>
          <Text style={styles.noteText}>• Lệnh mua sẽ được xử lý theo NAV cuối ngày</Text>
          <Text style={styles.noteText}>• Đầu tư tối thiểu: 100,000 VNĐ</Text>
          <Text style={styles.noteText}>• Thời gian xử lý: 1-2 ngày làm việc</Text>
          <Text style={styles.noteText}>• Phí giao dịch: 0% (miễn phí)</Text>
        </View>
      </ScrollView>

      {/* Buy Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.buyButton, (!amount || !units || isLoading) && styles.buyButtonDisabled]}
          onPress={handleBuyFund}
          disabled={!amount || !units || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buyButtonText}>Đặt lệnh mua</Text>
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
    color: '#2B4BFF',
    marginBottom: 8,
  },
  fundInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  fundInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
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
    borderColor: '#2B4BFF',
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
    color: '#28A745',
  },
  notesCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
    marginBottom: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  buyButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 