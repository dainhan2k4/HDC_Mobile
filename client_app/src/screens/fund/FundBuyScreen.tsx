import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  FlatList,
  Switch,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatVND from '../../hooks/formatCurrency';
import { fundApi } from '../../api/fundApi';
import { FundContractProps } from '../../types/fundcontract';
import { apiService } from '../../config/apiService';
import { SmartOTPModal } from '../../components/common/SmartOTPModal';
import SignatureModal from '../../components/signature/SignatureModal';
import SignatureComponent, { SignatureComponentRef } from '../../components/common/Signature';

interface BuyRouteParams {
  fundId: number;
  fundName: string;
  currentNav?: number;
}

interface TermRate {
  month: number;
  interest_rate: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export const FundBuyScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { fundId, fundName, currentNav = 25000 } = (route.params as BuyRouteParams) || {};

  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'amount' | 'units'>('amount');
  const [termRates, setTermRates] = useState<TermRate[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<TermRate | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);
  const [purchaseFee, setPurchaseFee] = useState(0);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpType, setOtpType] = useState<'smart' | 'sms_email'>('smart');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [debugMode, setDebugMode] = useState(__DEV__);
  const [showDebugCalculationModal, setShowDebugCalculationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOTPSuccessModal, setShowOTPSuccessModal] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState<string>('');
  const [showContractSignModal, setShowContractSignModal] = useState(false);
  const [signatureType, setSignatureType] = useState<'hand' | 'digital'>('hand');
  const signatureRef = React.useRef<SignatureComponentRef>(null);
  const [hasHandSignature, setHasHandSignature] = useState(false);
  const [isContractCollapsed, setIsContractCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'contract' | 'signature'>('contract');

  useEffect(() => {
    loadTermRates();
  }, []);

  const loadTermRates = async () => {
    try {
      const response = await apiService.getTermRates();
      if (response.success && response.data) {
        setTermRates(response.data as TermRate[]);
      }
    } catch (error) {
      console.error('❌ [FundBuy] Failed to load term rates:', error);
    }
  };

  // Tính toán giá bán khi đáo hạn
  const calculateMaturityPrice = (): number => {
    if (!selectedTerm || !units || parseFloat(units) <= 0) return 0;
    
    const shares = parseFloat(units);
    const nav = currentNav;
    const months = selectedTerm.month;
    const rate = selectedTerm.interest_rate;
    const feeAmount = purchaseFee;
    
    if (months <= 0 || rate <= 0 || shares <= 0) return 0;
    
    // Tính ngày đáo hạn
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + months);
    
    // Tính số ngày thực tế
    const days = Math.floor((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // L: Giá trị mua = I * J + K (I = shares, J = nav, K = feeAmount)
    const purchaseValue = (shares * nav) + feeAmount;
    
    // U: Giá trị bán 1 = L * N / 365 * G + L
    const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
    
    // S: Giá bán 1 = ROUND(U / I, 0)
    const sellPrice1 = Math.round(sellValue1 / shares);
    
    // T: Giá bán 2 = MROUND(S, 50)
    const sellPrice2 = Math.round(sellPrice1 / 50) * 50;
    
    return sellPrice2;
  };

  // Tính toán giá trị nhận được sau đáo hạn
  const calculateMaturityValue = (): number => {
    const maturityPrice = calculateMaturityPrice();
    const shares = parseFloat(units) || 0;
    return maturityPrice * shares;
  };

  // Tính ngày đáo hạn
  const getMaturityDate = (): string => {
    if (!selectedTerm) return '...';
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + selectedTerm.month);
    return maturityDate.toLocaleDateString('vi-VN');
  };

  // Tính ngày bán lại (thường là ngày đáo hạn + 1 ngày)
  const getResaleDate = (): string => {
    if (!selectedTerm) return '...';
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + selectedTerm.month);
    maturityDate.setDate(maturityDate.getDate() + 1);
    return maturityDate.toLocaleDateString('vi-VN');
  };

  // Tính toán debug cho modal
  const calculateDebugValues = () => {
    if (!selectedTerm || !units || parseFloat(units) <= 0) {
      return null;
    }

    const I = parseFloat(units); // Số lượng CCQ
    const J = currentNav; // Giá CCQ tại thời điểm mua
    const K = purchaseFee; // Phí mua
    const N = selectedTerm.interest_rate; // Lãi suất (%)
    const months = selectedTerm.month;

    // Tính số ngày
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + months);
    const G = Math.floor((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); // Số ngày

    // L: Giá trị mua = I * J + K
    const L = I * J + K;

    // U: Giá trị bán 1 = L * N / 365 * G + L
    const U = L * (N / 100) / 365 * G + L;

    // S: Giá bán 1 = ROUND(U / I, 0)
    const S = Math.round(U / I);

    // T: Giá bán 2 = MROUND(S, 50)
    const T = Math.round(S / 50) * 50;

    // O: Lãi suất quy đổi = (T / J - 1) * 365 / G * 100
    const O = (T / J - 1) * 365 / G * 100;

    // Q: Chênh lệch lãi suất = O - N
    const Q = O - N;

    // Ngưỡng: 0.1% -> 2%
    const thresholdMin = 0.1;
    const thresholdMax = 2;
    const isWithinThreshold = Q >= thresholdMin && Q <= thresholdMax;

    return {
      I, J, K, N, G, L, U, S, T, O, Q,
      thresholdMin,
      thresholdMax,
      isWithinThreshold,
      amount: parseFloat(amount.replace(/[,\.]/g, '')) || 0
    };
  };

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


  // Tính phí mua dựa trên số tiền đầu tư
  const calculatePurchaseFee = (amount: number): number => {
    if (amount <= 0) return 0;
    
    let fee = 0;
    if (amount < 10000000) {
      // Dưới 10,000,000: 0.3%
      fee = amount * 0.003;
    } else if (amount < 20000000) {
      // 10,000,000 - 20,000,000: 0.2%
      fee = amount * 0.002;
    } else {
      // Trên 20,000,000: 0.1%
      fee = amount * 0.001;
    }
    
    // Làm tròn theo bội số 50 (MROUND 50)
    return Math.round(fee / 50) * 50;
  };

  // Calculate units from amount or vice versa
  const handleAmountChange = (value: string) => {
    setAmount(value);
    setCalculationMode('amount');
    
    const numericAmount = parseFloat(value.replace(/[,\.]/g, ''));
    if (!isNaN(numericAmount) && numericAmount > 0) {
      const calculatedUnits = numericAmount / currentNav;
      setUnits(calculatedUnits.toFixed(4));
      
      // Tính phí mua
      const fee = calculatePurchaseFee(numericAmount);
      setPurchaseFee(fee);
    } else {
      setUnits('');
      setPurchaseFee(0);
    }
  };

  const handleUnitsChange = (value: string) => {
    setUnits(value);
    setCalculationMode('units');
    
    const numericUnits = parseFloat(value);
    if (!isNaN(numericUnits) && numericUnits > 0) {
      const calculatedAmount = numericUnits * currentNav;
      // Làm tròn số tiền theo bội số 50 (MROUND 50)
      const roundedAmount = Math.round(calculatedAmount / 50) * 50;
      setAmount(roundedAmount.toString());
      
      // Tính phí mua dựa trên số tiền đã làm tròn
      const fee = calculatePurchaseFee(roundedAmount);
      setPurchaseFee(fee);
    } else {
      setAmount('');
      setPurchaseFee(0);
    }
  };

  const handleBuyFund = async () => {
    console.log('🚀 [BuyFund] handleBuyFund called');
    console.log('📊 [BuyFund] Current state:', { amount, units, selectedTerm, debugMode });
    
    if (!amount || !units) {
      console.log('❌ [BuyFund] Missing amount or units');
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hoặc số đơn vị muốn mua');
      return;
    }

    if (!selectedTerm) {
      console.log('❌ [BuyFund] Missing selectedTerm');
      Alert.alert('Lỗi', 'Vui lòng chọn kỳ hạn - Lãi suất');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[,\.]/g, ''));
    const numericUnits = parseFloat(units);

    if (numericAmount < 100000) {
      console.log('❌ [BuyFund] Amount too low:', numericAmount);
      Alert.alert('Lỗi', 'Số tiền đầu tư tối thiểu là 100,000 VNĐ');
      return;
    }
    
    console.log('✅ [BuyFund] Basic validation passed, checking threshold...');

    // Kiểm tra ngưỡng lãi suất (trừ khi debug mode bật)
    if (!debugMode) {
      console.log('🔍 [BuyFund] Checking threshold (debug mode OFF)');
      const calc = calculateDebugValues();
      console.log('📊 [BuyFund] Threshold calculation result:', calc);
      if (calc && !calc.isWithinThreshold) {
        console.log('❌ [BuyFund] Outside threshold, blocking payment');
        Alert.alert(
          'Ngoài ngưỡng',
          `Chênh lệch lãi suất (${calc.Q.toFixed(4)}%) ngoài ngưỡng cho phép (${calc.thresholdMin}% → ${calc.thresholdMax}%).\n\nKhông thể thực hiện thanh toán. Vui lòng kiểm tra lại thông tin đầu tư hoặc bật Debug Mode để bỏ qua kiểm tra này.`,
          [
            { 
              text: 'Xem chi tiết', 
              onPress: () => {
                setShowDebugCalculationModal(true);
              }
            },
            { text: 'Đóng', style: 'cancel' }
          ],
          { cancelable: false }
        );
        return;
      }
      console.log('✅ [BuyFund] Within threshold, proceeding...');
    } else {
      console.log('⚠️ [BuyFund] Debug mode enabled - Skipping threshold check');
    }

    try {
      // Kiểm tra OTP config trước
      console.log('📱 [BuyFund] Checking OTP config...');
      let otpConfigResponse;
      try {
        otpConfigResponse = await apiService.getOTPConfig();
        console.log('📊 [BuyFund] OTP config response:', otpConfigResponse);
      } catch (configError: any) {
        // Nếu API trả về 404 hoặc lỗi, vẫn tiếp tục với smart OTP
        console.warn('⚠️ [BuyFund] OTP config API error (404 or other):', configError.message);
        otpConfigResponse = { success: false, data: null };
      }
      
      if (otpConfigResponse.success && otpConfigResponse.data) {
        const config = otpConfigResponse.data;
        const hasValidToken = config.has_valid_write_token || config.hasValidWriteToken;
        const tokenExpiresIn = config.write_token_expires_in || config.writeTokenExpiresIn || '';
        
        // Nếu có token hợp lệ (còn trong 8 giờ), có thể bỏ qua OTP
        if (hasValidToken && tokenExpiresIn) {
          console.log('✅ [BuyFund] Valid write token found, expires in:', tokenExpiresIn);
          console.log('📱 [BuyFund] Token còn hiệu lực, có thể bỏ qua OTP');
          // Bỏ qua OTP và chuyển thẳng sang màn hình ký hợp đồng
          setShowContractSignModal(true);
          return;
        }
        
        // Nếu không có token hoặc token hết hạn, phải nhập OTP mới
        console.log('⚠️ [BuyFund] No valid token or token expired, requiring OTP');
        const type = config.otp_type || config.otpType || 'smart';
        setOtpType(type);
        
        // Hiển thị OTP modal để xác thực
        console.log('📱 [BuyFund] Showing OTP modal, type:', type);
        console.log('📱 [BuyFund] Current showOTPModal state before set:', showOTPModal);
        setShowOTPModal(true);
        console.log('✅ [BuyFund] setShowOTPModal(true) called - OTP modal should be visible now');
      } else {
        // Nếu không có config (404 hoặc lỗi), mặc định dùng smart OTP
        console.log('⚠️ [BuyFund] No OTP config or API error, using default smart OTP');
        console.log('📱 [BuyFund] Current showOTPModal state before set:', showOTPModal);
        setOtpType('smart');
        setShowOTPModal(true);
        console.log('✅ [BuyFund] setShowOTPModal(true) called - OTP modal should be visible now');
      }
    } catch (error: any) {
      console.error('❌ [BuyFund] Error checking OTP config:', error);
      // Nếu lỗi, vẫn hiển thị OTP modal với smart type
      console.log('📱 [BuyFund] Error occurred, showing OTP modal with smart type');
      console.log('📱 [BuyFund] Current showOTPModal state before set:', showOTPModal);
      setOtpType('smart');
      setShowOTPModal(true);
      console.log('✅ [BuyFund] setShowOTPModal(true) called - OTP modal should be visible now (error case)');
    }
  };

  const handleOTPConfirm = async (otp: string, debugMode: boolean) => {
    try {
      setIsVerifyingOTP(true);
      console.log('🔐 [BuyFund] Verifying OTP...', { 
        otp: otp.substring(0, 2) + '****',
        debugMode 
      });
      
      const verifyResponse = await apiService.verifyOTP(otp, debugMode);
      
      if (verifyResponse.success) {
        console.log('✅ [BuyFund] OTP verified successfully');
        
        // Lấy thông tin thời gian còn lại của token
        const data = verifyResponse.data || {};
        let expiresInStr = data.write_token_expires_in || data.writeTokenExpiresIn || '';
        
        // Nếu là số (giây), chuyển đổi sang "X giờ Y phút"
        if (typeof expiresInStr === 'number' && expiresInStr > 0) {
          const hours = Math.floor(expiresInStr / 3600);
          const minutes = Math.floor((expiresInStr % 3600) / 60);
          expiresInStr = `${hours} giờ ${minutes} phút`;
        }
        
        // Nếu là string rỗng hoặc không hợp lệ, dùng giá trị mặc định
        if (!expiresInStr || expiresInStr === '') {
          expiresInStr = '8 giờ 0 phút'; // Mặc định 8 giờ khi verify OTP thành công
        }
        
        setOtpExpiresIn(expiresInStr);
        
        // Đóng OTP modal
        setShowOTPModal(false);
        
        // Hiển thị màn hình thông báo thành công
        setShowOTPSuccessModal(true);
        
        // Tự động chuyển sang màn hình ký hợp đồng sau 2 giây
        setTimeout(() => {
          setShowOTPSuccessModal(false);
          setShowContractSignModal(true);
        }, 2000);
      } else {
        throw new Error(verifyResponse.message || 'Mã OTP không chính xác');
      }
    } catch (error: any) {
      console.error('❌ [BuyFund] OTP verification failed:', error);
      throw error;
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!agreedToTerms) {
      Alert.alert('Lỗi', 'Vui lòng đồng ý với các điều khoản và điều kiện');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[,\.]/g, ''));
    const numericUnits = parseFloat(units);
    
    setShowConfirmModal(false);
    await proceedWithBuyOrder(numericAmount, numericUnits);
  };

  const proceedWithBuyOrder = async (numericAmount: number, numericUnits: number) => {
    try {
      setIsLoading(true);
      console.log(`🔄 [BuyFund] Executing buy order for fund ${fundId}:`, { 
        amount: numericAmount, 
        units: numericUnits 
      });
      
      // Call real API to execute buy order
      const response = await fundApi.buyFund(fundId, numericAmount, numericUnits);
      console.log('✅ [BuyFund] Buy order response:', response);
      
      Alert.alert(
        'Thành công!',
        `Đã đặt lệnh mua ${numericUnits.toFixed(4)} đơn vị quỹ ${fundName} thành công. Portfolio sẽ được cập nhật ngay lập tức.`,
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
            <View style={styles.unitsInputContainer}>
              <TouchableOpacity 
                style={styles.unitsButton}
                onPress={() => {
                  const currentUnits = parseFloat(units) || 0;
                  if (currentUnits > 0) {
                    setUnits((currentUnits - 0.0001).toFixed(4));
                  }
                }}
              >
                <Text style={styles.unitsButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.unitsInput, calculationMode === 'units' && styles.inputActive]}
                value={units}
                onChangeText={handleUnitsChange}
                placeholder="Nhập số đơn vị"
                keyboardType="numeric"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.unitsButton}
                onPress={() => {
                  const currentUnits = parseFloat(units) || 0;
                  setUnits((currentUnits + 0.0001).toFixed(4));
                }}
              >
                <Text style={styles.unitsButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Term Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chọn kỳ hạn - Lãi suất *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowTermModal(true)}
            >
              <Text style={selectedTerm ? styles.selectInputText : styles.selectInputPlaceholder}>
                {selectedTerm 
                  ? `${selectedTerm.month} tháng - ${selectedTerm.interest_rate}%` 
                  : '-- Chọn kỳ hạn --'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6C757D" />
            </TouchableOpacity>
          </View>

          {/* Interest Rate Display */}
          {selectedTerm && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lãi suất</Text>
              <TextInput
                style={styles.input}
                value={`${selectedTerm.interest_rate}%`}
                editable={false}
              />
            </View>
          )}

          {/* Maturity Price */}
          {selectedTerm && units && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giá bán khi đáo hạn</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={formatVND(calculateMaturityPrice())}
                  editable={false}
                />
                <TouchableOpacity style={styles.ellipsisButton}>
                  <Text style={styles.ellipsisButtonText}>...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Maturity Value */}
          {selectedTerm && units && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giá trị nhận được sau đáo hạn</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={formatVND(calculateMaturityValue())}
                  editable={false}
                />
                <TouchableOpacity style={styles.ellipsisButton}>
                  <Text style={styles.ellipsisButtonText}>...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Purchase Fee */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phí mua</Text>
            <TextInput
              style={styles.input}
              value={formatVND(purchaseFee)}
              editable={false}
            />
            <TouchableOpacity 
              style={styles.feeLink}
              onPress={() => setShowFeeModal(true)}
            >
              <Text style={styles.feeLinkText}>Xem biểu phí</Text>
            </TouchableOpacity>
          </View>

          {/* Investment Summary Panel */}
          <View style={styles.summaryPanel}>
            <View style={styles.summaryPanelHeader}>
              <Text style={styles.summaryPanelTitle}>Thông tin đầu tư</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <Text style={styles.summaryPanelLink}>Xem điều khoản</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryPanelContent}>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Quỹ đầu tư:</Text>
                <Text style={styles.summaryPanelValue}>{fundName}</Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Loại lệnh:</Text>
                <Text style={styles.summaryPanelValue}>Mua</Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Ngày đặt lệnh:</Text>
                <Text style={styles.summaryPanelValue}>
                  {new Date().toLocaleString('vi-VN')}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Kỳ hạn:</Text>
                <Text style={styles.summaryPanelValue}>
                  {selectedTerm ? `${selectedTerm.month} tháng` : '...'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Lãi suất:</Text>
                <Text style={styles.summaryPanelValue}>
                  {selectedTerm ? `${selectedTerm.interest_rate}%` : '...'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Số tiền đầu tư:</Text>
                <Text style={styles.summaryPanelValue}>
                  {amount ? formatVND(parseFloat(amount.replace(/[,\.]/g, ''))) : '0₫'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Số tiền mua CCQ:</Text>
                <Text style={styles.summaryPanelValue}>
                  {amount ? formatVND(parseFloat(amount.replace(/[,\.]/g, ''))) : '0₫'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Phí mua:</Text>
                <Text style={styles.summaryPanelValue}>{formatVND(purchaseFee)}</Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Tổng thanh toán:</Text>
                <Text style={styles.summaryPanelValue}>
                  {amount ? formatVND(parseFloat(amount.replace(/[,\.]/g, '')) + purchaseFee) : '0₫'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Tổng số CCQ:</Text>
                <Text style={styles.summaryPanelValue}>
                  {units ? parseFloat(units).toFixed(4) : '0'}
                </Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Ngày đáo hạn:</Text>
                <Text style={styles.summaryPanelValue}>{getMaturityDate()}</Text>
              </View>
              <View style={styles.summaryPanelRow}>
                <Text style={styles.summaryPanelLabel}>Ngày bán lại:</Text>
                <Text style={styles.summaryPanelValue}>{getResaleDate()}</Text>
              </View>
            </View>
          </View>
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

      {/* Debug Mode Section */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <View style={styles.debugModeRow}>
            <View style={styles.debugModeLeft}>
              <Ionicons name="bug-outline" size={20} color="#212529" />
              <Text style={styles.debugModeText}>Debug Mode (Bỏ qua kiểm tra lãi trong ngưỡng)</Text>
            </View>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: '#DEE2E6', true: '#FF6B35' }}
              thumbColor={debugMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          {debugMode && (
            <View style={styles.debugWarning}>
              <Ionicons name="warning" size={16} color="#DC3545" />
              <Text style={styles.debugWarningText}>
                Chế độ debug đang bật - Bỏ qua kiểm tra lãi trong ngưỡng
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Footer with Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        
        {__DEV__ && (
          <TouchableOpacity onPress={() => setShowDebugCalculationModal(true)}>
            <Text style={styles.debugLabel}>DEBUG</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.buyButton, (!amount || !units || !selectedTerm || isLoading) && styles.buyButtonDisabled]}
          onPress={handleBuyFund}
          disabled={!amount || !units || !selectedTerm || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buyButtonText}>Thanh toán</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Term Selection Modal */}
      <Modal
        visible={showTermModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn kỳ hạn</Text>
              <TouchableOpacity onPress={() => setShowTermModal(false)}>
                <Ionicons name="close" size={24} color="#212529" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={termRates}
              keyExtractor={(item) => `${item.month}-${item.interest_rate}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.termItem,
                    selectedTerm?.month === item.month && styles.termItemSelected
                  ]}
                  onPress={() => {
                    setSelectedTerm(item);
                    setShowTermModal(false);
                  }}
                >
                  <Text style={styles.termItemText}>
                    {item.month} tháng - {item.interest_rate}%
                  </Text>
                  {selectedTerm?.month === item.month && (
                    <Ionicons name="checkmark" size={20} color="#28A745" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Smart OTP Modal */}
      <SmartOTPModal
        visible={showOTPModal}
        onClose={() => {
          console.log('📱 [BuyFund] OTP modal onClose called');
          setShowOTPModal(false);
        }}
        onConfirm={handleOTPConfirm}
        otpType={otpType}
      />

      {/* Fee Chart Modal */}
      <Modal
        visible={showFeeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeeModal(false)}
      >
        <View style={styles.feeModalOverlay}>
          <View style={styles.feeModalContainer}>
            <View style={styles.feeModalHeader}>
              <Text style={styles.feeModalTitle}>Biểu phí mua</Text>
              <TouchableOpacity 
                onPress={() => setShowFeeModal(false)}
                style={styles.feeModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.feeTable}>
              <View style={styles.feeTableHeader}>
                <Text style={styles.feeTableHeaderText}>Giá trị</Text>
                <Text style={styles.feeTableHeaderText}>Phí mua</Text>
              </View>
              
              <View style={styles.feeTableRow}>
                <Text style={styles.feeTableCell}>Dưới 10,000,000</Text>
                <Text style={styles.feeTableCell}>0.3%</Text>
              </View>
              
              <View style={styles.feeTableRow}>
                <Text style={styles.feeTableCell}>10,000,000 - 20,000,000</Text>
                <Text style={styles.feeTableCell}>0.2%</Text>
              </View>
              
              <View style={styles.feeTableRow}>
                <Text style={styles.feeTableCell}>Trên 20,000,000</Text>
                <Text style={styles.feeTableCell}>0.1%</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>Điều khoản và Điều kiện</Text>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={styles.termsModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.termsModalContent} showsVerticalScrollIndicator={true}>
              {/* Summary Section */}
              <View style={styles.termsSummarySection}>
                <Text style={styles.termsSummaryTitle}>Điều khoản và Điều kiện</Text>
                <View style={styles.termsSummaryList}>
                  <Text style={styles.termsSummaryItem}>
                    1. Bạn phải tuân thủ các quy định của pháp luật hiện hành.
                  </Text>
                  <Text style={styles.termsSummaryItem}>
                    2. Khoản đầu tư có thể tăng hoặc giảm, không đảm bảo lợi nhuận.
                  </Text>
                  <Text style={styles.termsSummaryItem}>
                    3. Không được sao chép, phát tán trái phép nội dung của sản phẩm.
                  </Text>
                  <Text style={styles.termsSummaryItem}>
                    4. Khi tham gia đầu tư, bạn đã đồng ý với các điều khoản của công ty.
                  </Text>
                </View>
              </View>

              {/* Full Terms Document */}
              <View style={styles.termsDocumentSection}>
                <Text style={styles.termsDocumentTitle}>Tài liệu điều khoản đầy đủ:</Text>
                
                <View style={styles.contractContainer}>
                  <Text style={styles.contractTitle}>HỢP ĐỒNG MUA BÁN CCQ</Text>
                  
                  {/* Party A - Fund Management Company */}
                  <View style={styles.contractPartySection}>
                    <Text style={styles.contractPartyTitle}>Thông tin Bên A - Công ty quản lý quỹ</Text>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Tên công ty:</Text>
                      <Text style={styles.contractInfoValue}>Công ty ABC</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Địa chỉ:</Text>
                      <Text style={styles.contractInfoValue}>19 Nguyễn Đình Chiểu, Phường Sài Gòn, TP.HCM</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>MST:</Text>
                      <Text style={styles.contractInfoValue}>999999999</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Người đại diện:</Text>
                      <Text style={styles.contractInfoValue}>Nguyễn Văn A</Text>
                    </View>
                  </View>

                  {/* Party B - Investor */}
                  <View style={styles.contractPartySection}>
                    <Text style={styles.contractPartyTitle}>Thông tin Bên B - Nhà đầu tư</Text>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Họ và tên:</Text>
                      <Text style={styles.contractInfoValue}>_________________</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Ngày sinh:</Text>
                      <Text style={styles.contractInfoValue}>_________________</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Số CCCD:</Text>
                      <Text style={styles.contractInfoValue}>_________________</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Email:</Text>
                      <Text style={styles.contractInfoValue}>_________________</Text>
                    </View>
                    <View style={styles.contractInfoRow}>
                      <Text style={styles.contractInfoLabel}>Số điện thoại:</Text>
                      <Text style={styles.contractInfoValue}>_________________</Text>
                    </View>
                  </View>

                  {/* Contract Clauses */}
                  <View style={styles.contractClausesSection}>
                    <Text style={styles.contractClauseTitle}>1. Cam kết hiểu biết và chấp nhận rủi ro:</Text>
                    <Text style={styles.contractClauseText}>
                      Bên B cam kết đã đọc và hiểu rõ bản cáo bạch, điều lệ quỹ và các tài liệu liên quan. 
                      Bên B hiểu rằng đầu tư vào CCQ có rủi ro, giá trị đầu tư có thể tăng hoặc giảm 
                      theo biến động thị trường, không đảm bảo lợi nhuận và không đảm bảo hoàn vốn.
                    </Text>

                    <Text style={styles.contractClauseTitle}>2. Thời hạn giao dịch và thanh toán:</Text>
                    <Text style={styles.contractClauseText}>
                      Giao dịch mua CCQ chỉ được thực hiện khi Bên B đã chuyển đủ số tiền đầu tư trong 
                      thời hạn quy định. Nếu quá thời hạn chuyển tiền, lệnh có thể bị hủy mà không cần 
                      thông báo trước. Mọi phí chuyển khoản do Bên B chịu trách nhiệm.
                    </Text>
                  </View>

                  {/* Signature Section */}
                  <View style={styles.contractSignatureSection}>
                    <View style={styles.contractSignatureBox}>
                      <Text style={styles.contractSignatureLabel}>Xác nhận chữ ký công ty</Text>
                      <View style={styles.contractSignaturePlaceholder} />
                    </View>
                    <View style={styles.contractSignatureBox}>
                      <Text style={styles.contractSignatureLabel}>Xác nhận chữ ký khách hàng</Text>
                      <View style={styles.contractSignaturePlaceholder} />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Debug Calculation Modal */}
      <Modal
        visible={showDebugCalculationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDebugCalculationModal(false)}
      >
        <View style={styles.debugCalcModalOverlay}>
          <View style={styles.debugCalcModalContainer}>
            <View style={styles.debugCalcModalHeader}>
              <Ionicons name="information-circle" size={24} color="#2B4BFF" />
              <Text style={styles.debugCalcModalTitle}>DEBUG tính toán đáo hạn</Text>
              <TouchableOpacity 
                onPress={() => setShowDebugCalculationModal(false)}
                style={styles.debugCalcModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.debugCalcModalContent} showsVerticalScrollIndicator={true}>
              {(() => {
                const calc = calculateDebugValues();
                if (!calc) {
                  return (
                    <View style={styles.debugCalcEmptyState}>
                      <Text style={styles.debugCalcEmptyText}>
                        Vui lòng nhập đầy đủ thông tin đầu tư để xem tính toán
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    {/* Input Parameters */}
                    <View style={styles.debugCalcSection}>
                      <Text style={styles.debugCalcSectionTitle}>Thông tin đầu vào:</Text>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Quỹ:</Text>
                        <Text style={styles.debugCalcInfoValue}>{fundName}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Số tiền đầu tư (amount-input):</Text>
                        <Text style={styles.debugCalcInfoValue}>{formatVND(calc.amount)}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Số lượng CCQ (I):</Text>
                        <Text style={styles.debugCalcInfoValue}>{calc.I.toFixed(4)}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Giá CCQ tại thời điểm mua (J):</Text>
                        <Text style={styles.debugCalcInfoValue}>{formatVND(calc.J)}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Phí mua (K):</Text>
                        <Text style={styles.debugCalcInfoValue}>{formatVND(calc.K)}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>NAV hiện tại:</Text>
                        <Text style={styles.debugCalcInfoValue}>{formatVND(currentNav)}</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Kỳ hạn (Term):</Text>
                        <Text style={styles.debugCalcInfoValue}>{selectedTerm?.month} tháng (~{calc.G} ngày)</Text>
                      </View>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Lãi suất (N):</Text>
                        <Text style={styles.debugCalcInfoValue}>{calc.N}%</Text>
                      </View>
                    </View>

                    {/* Detailed Calculations */}
                    <View style={styles.debugCalcSection}>
                      <Text style={styles.debugCalcSectionTitle}>Công thức chi tiết:</Text>
                      
                      {/* L */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>L (Giá trị mua):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: I x J + K</Text>
                        <Text style={styles.debugCalcFormulaText}>Tính toán: {calc.I.toFixed(4)} x {formatVND(calc.J)} + {formatVND(calc.K)}</Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {formatVND(calc.L)}</Text>
                      </View>

                      {/* U */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>U (Giá trị bán 1):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: L x N / 365 x G + L</Text>
                        <Text style={styles.debugCalcFormulaText}>
                          Tính toán: {formatVND(calc.L)} x ({calc.N}/100) / 365 x {calc.G} + {formatVND(calc.L)}
                        </Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {formatVND(calc.U)}</Text>
                        <Text style={styles.debugCalcFormulaResult}>
                          Giá trị bán 1 (MROUND 50): {formatVND(Math.round(calc.U / 50) * 50)}
                        </Text>
                      </View>

                      {/* S */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>S (Giá bán 1):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: ROUND(U / I, 0)</Text>
                        <Text style={styles.debugCalcFormulaText}>Tính toán: ROUND({formatVND(calc.U)} / {calc.I.toFixed(4)}, 0)</Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {formatVND(calc.S)}/CCQ</Text>
                      </View>

                      {/* T */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>T (Giá bán 2):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: MROUND(S, 50)</Text>
                        <Text style={styles.debugCalcFormulaText}>Tính toán: MROUND({formatVND(calc.S)}, 50)</Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {formatVND(calc.T)}/CCQ</Text>
                      </View>

                      {/* O */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>O (Lãi suất quy đổi):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: (T / J - 1) x 365 / G x 100</Text>
                        <Text style={styles.debugCalcFormulaText}>
                          Tính toán: ({formatVND(calc.T)} / {formatVND(calc.J)} - 1) x 365 / {calc.G} x 100
                        </Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {calc.O.toFixed(4)}%</Text>
                      </View>

                      {/* Q */}
                      <View style={styles.debugCalcFormulaBox}>
                        <Text style={styles.debugCalcFormulaLabel}>Q (Chênh lệch lãi suất):</Text>
                        <Text style={styles.debugCalcFormulaText}>Công thức: O - N</Text>
                        <Text style={styles.debugCalcFormulaText}>Tính toán: {calc.O.toFixed(4)}% - {calc.N}%</Text>
                        <Text style={styles.debugCalcFormulaResult}>Kết quả: {calc.Q.toFixed(4)}%</Text>
                      </View>
                    </View>

                    {/* Conclusion */}
                    <View style={styles.debugCalcSection}>
                      <View style={styles.debugCalcInfoRow}>
                        <Text style={styles.debugCalcInfoLabel}>Ngưỡng:</Text>
                        <Text style={styles.debugCalcInfoValue}>{calc.thresholdMin}% → {calc.thresholdMax}%</Text>
                      </View>
                      <View style={styles.debugCalcConclusionRow}>
                        <Text style={styles.debugCalcInfoLabel}>Kết luận:</Text>
                        <View style={styles.debugCalcConclusionBox}>
                          {calc.isWithinThreshold ? (
                            <>
                              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
                              <Text style={[styles.debugCalcConclusionText, { color: '#28A745' }]}>Trong ngưỡng</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="close-circle" size={20} color="#DC3545" />
                              <Text style={[styles.debugCalcConclusionText, { color: '#DC3545' }]}>Ngoài ngưỡng</Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  </>
                );
              })()}
            </ScrollView>

            <View style={styles.debugCalcModalFooter}>
              <TouchableOpacity 
                style={styles.debugCalcModalButton}
                onPress={() => setShowDebugCalculationModal(false)}
              >
                <Text style={styles.debugCalcModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Success Modal */}
      <Modal
        visible={showOTPSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.otpSuccessModalOverlay}>
          <View style={styles.otpSuccessModalContainer}>
            <Ionicons name="information-circle" size={64} color="#2B4BFF" />
            <Text style={styles.otpSuccessTitle}>Xác thực thành công</Text>
            <Text style={styles.otpSuccessMessage}>
              Smart OTP còn hiệu lực ({otpExpiresIn}). Đang tiếp tục...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Confirm Order Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalTitle}>Xác nhận đặt lệnh mua</Text>
              <TouchableOpacity 
                onPress={() => setShowConfirmModal(false)}
                style={styles.confirmModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.confirmModalContent} showsVerticalScrollIndicator={true}>
              {/* Fund Info */}
              <View style={styles.confirmFundInfo}>
                <Text style={styles.confirmFundName}>{fundName}</Text>
              </View>

              {/* Investment Info */}
              <View style={styles.confirmSection}>
                <Text style={styles.confirmSectionTitle}>Thông tin đầu tư</Text>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Loại lệnh:</Text>
                  <Text style={styles.confirmInfoValue}>Mua</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Ngày đặt lệnh:</Text>
                  <Text style={styles.confirmInfoValue}>
                    {new Date().toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Kỳ hạn:</Text>
                  <Text style={styles.confirmInfoValue}>{selectedTerm?.month} tháng</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Lãi suất:</Text>
                  <Text style={styles.confirmInfoValue}>{selectedTerm?.interest_rate}%</Text>
                </View>
              </View>

              {/* Payment Info */}
              <View style={styles.confirmSection}>
                <Text style={styles.confirmSectionTitle}>Thông tin thanh toán</Text>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Số tiền đầu tư:</Text>
                  <Text style={styles.confirmInfoValue}>{formatVND(parseFloat(amount.replace(/[,\.]/g, '')) || 0)}</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Số lượng CCQ:</Text>
                  <Text style={styles.confirmInfoValue}>{parseFloat(units || '0').toFixed(4)} CCQ</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Phí mua:</Text>
                  <Text style={styles.confirmInfoValue}>{formatVND(purchaseFee)}</Text>
                </View>
                <View style={[styles.confirmInfoRow, styles.confirmTotalRow]}>
                  <Text style={styles.confirmTotalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.confirmTotalValue}>
                    {formatVND((parseFloat(amount.replace(/[,\.]/g, '')) || 0) + purchaseFee)}
                  </Text>
                </View>
              </View>

              {/* Maturity Info */}
              <View style={styles.confirmSection}>
                <Text style={styles.confirmSectionTitle}>Thông tin đáo hạn</Text>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Tổng số CCQ:</Text>
                  <Text style={styles.confirmInfoValue}>{parseFloat(units || '0').toFixed(4)}</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Ngày đáo hạn:</Text>
                  <Text style={styles.confirmInfoValue}>{getMaturityDate()}</Text>
                </View>
                <View style={styles.confirmInfoRow}>
                  <Text style={styles.confirmInfoLabel}>Ngày bán lại:</Text>
                  <Text style={styles.confirmInfoValue}>{getResaleDate()}</Text>
                </View>
              </View>

              {/* Terms Agreement */}
              <View style={styles.confirmTermsAgreement}>
                <TouchableOpacity 
                  style={styles.confirmCheckboxContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <View style={[styles.confirmCheckbox, agreedToTerms && styles.confirmCheckboxChecked]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.confirmTermsText}>
                    Tôi đã đọc và đồng ý với các điều khoản và điều kiện
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.confirmModalFooter}>
              <TouchableOpacity 
                style={[styles.confirmButton, (!agreedToTerms || isLoading) && styles.confirmButtonDisabled]}
                onPress={handleConfirmOrder}
                disabled={!agreedToTerms || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contract Sign Modal */}
      <Modal
        visible={showContractSignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContractSignModal(false)}
      >
        <View style={styles.contractSignModalOverlay}>
          <View style={styles.contractSignModalContainer}>
            {/* Header */}
            <View style={styles.contractSignModalHeader}>
              <Text style={styles.contractSignModalTitle}>Xác nhận và ký hợp đồng đầu tư</Text>
              <TouchableOpacity 
                onPress={() => setShowContractSignModal(false)}
                style={styles.contractSignModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <Text style={styles.contractSignModalSubtitle}>
              Vui lòng xem xét và chọn phương thức ký tên
            </Text>

            {/* Tab Navigation for Mobile */}
            {isMobile && (
              <View style={styles.contractTabNavigation}>
                <TouchableOpacity
                  style={[styles.contractTab, activeTab === 'contract' && styles.contractTabActive]}
                  onPress={() => setActiveTab('contract')}
                >
                  <Ionicons 
                    name="document-text" 
                    size={20} 
                    color={activeTab === 'contract' ? '#FF6B35' : '#6C757D'} 
                  />
                  <Text style={[styles.contractTabText, activeTab === 'contract' && styles.contractTabTextActive]}>
                    Hợp đồng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contractTab, activeTab === 'signature' && styles.contractTabActive]}
                  onPress={() => setActiveTab('signature')}
                >
                  <Ionicons 
                    name="create" 
                    size={20} 
                    color={activeTab === 'signature' ? '#FF6B35' : '#6C757D'} 
                  />
                  <Text style={[styles.contractTabText, activeTab === 'signature' && styles.contractTabTextActive]}>
                    Ký tên
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[
              styles.contractSignModalContent,
              isMobile && styles.contractSignModalContentMobile
            ]}>
              {/* Contract Preview Section */}
              {(!isMobile || activeTab === 'contract') && (
                <View style={[
                  styles.contractPreviewSection, 
                  isContractCollapsed && styles.contractPreviewSectionCollapsed,
                  isMobile && styles.contractPreviewSectionMobile
                ]}>
                  <View style={styles.contractPreviewHeader}>
                    <Text style={styles.contractPreviewTitle}>Hợp đồng đầu tư</Text>
                    {!isMobile && (
                      <TouchableOpacity
                        style={styles.contractCollapseButton}
                        onPress={() => setIsContractCollapsed(!isContractCollapsed)}
                      >
                        <Ionicons 
                          name={isContractCollapsed ? "chevron-down" : "chevron-up"} 
                          size={20} 
                          color="#6C757D" 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {!isContractCollapsed && (
                    <>
                      <Text style={styles.contractPreviewNote}>
                        Vui lòng xem xét kỹ trước khi ký
                      </Text>
                      
                      <ScrollView style={styles.contractPreviewContent} showsVerticalScrollIndicator={true}>
                        <View style={styles.contractDocument}>
                          <Text style={styles.contractDocumentTitle}>HỢP ĐỒNG MUA BÁN CCQ</Text>
                          
                          {/* Party A */}
                          <View style={styles.contractPartySection}>
                            <Text style={styles.contractPartyTitle}>Thông tin Bên A - Công ty quản lý quỹ</Text>
                            <Text style={styles.contractPartyText}>Tên công ty: Công ty ABC</Text>
                            <Text style={styles.contractPartyText}>Địa chỉ: 19 Nguyễn Đình Chiểu, Phường Sài Gòn, TP.HCM</Text>
                            <Text style={styles.contractPartyText}>MST: 999999999</Text>
                            <Text style={styles.contractPartyText}>Người đại diện:</Text>
                          </View>

                          {/* Party B */}
                          <View style={styles.contractPartySection}>
                            <Text style={styles.contractPartyTitle}>Thông tin Bên B - Nhà đầu tư</Text>
                            <Text style={styles.contractPartyText}>Họ và tên:</Text>
                            <Text style={styles.contractPartyText}>Ngày sinh:</Text>
                            <Text style={styles.contractPartyText}>Số CCCD:</Text>
                            <Text style={styles.contractPartyText}>Email:</Text>
                            <Text style={styles.contractPartyText}>Số điện thoại:</Text>
                          </View>

                          {/* Clauses */}
                          <View style={styles.contractClauseSection}>
                            <Text style={styles.contractClauseTitle}>1. Cam kết hiểu biết và chấp nhận rủi ro:</Text>
                            <Text style={styles.contractClauseText}>
                              Nhà đầu tư cam kết đã đọc và hiểu rõ bản cáo bạch, điều lệ quỹ và các tài liệu liên quan. 
                              Nhà đầu tư hiểu rằng đầu tư vào CCQ có thể chịu ảnh hưởng bởi biến động thị trường.
                            </Text>

                            <Text style={styles.contractClauseTitle}>2. Thời hạn giao dịch và thanh toán:</Text>
                            <Text style={styles.contractClauseText}>
                              Nhà đầu tư đồng ý rằng giao dịch CCQ chỉ được thực hiện khi công ty nhận được đầy đủ 
                              số tiền đầu tư trong thời hạn quy định.
                            </Text>
                          </View>

                          {/* Signatures */}
                          <View style={styles.contractSignatureSection}>
                            <View style={styles.contractSignatureBox}>
                              <Text style={styles.contractSignatureLabel}>Xác nhận chữ ký công ty</Text>
                              <View style={styles.contractSignaturePlaceholder} />
                            </View>
                            <View style={styles.contractSignatureBox}>
                              <Text style={styles.contractSignatureLabel}>Xác nhận chữ ký khách hàng</Text>
                              <View style={styles.contractSignaturePlaceholder} />
                            </View>
                          </View>
                        </View>
                      </ScrollView>

                      <View style={styles.contractPreviewNoteBox}>
                        <Ionicons name="information-circle" size={16} color="#2B4BFF" />
                        <Text style={styles.contractPreviewNoteText}>
                          Vui lòng đọc kỹ toàn bộ hợp đồng trước khi ký tên. Hợp đồng đã ký có giá trị pháp lý.
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Signature Method Selection */}
              {(!isMobile || activeTab === 'signature') && (
                <View style={[
                  styles.signatureMethodSection,
                  isMobile && styles.signatureMethodSectionMobile
                ]}>
                <Text style={styles.signatureMethodTitle}>Chọn phương thức ký tên</Text>
                <Text style={styles.signatureMethodSubtitle}>
                  Chọn một trong hai phương thức bên dưới
                </Text>

                {/* Signature Type Selection */}
                <View style={styles.signatureTypeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.signatureTypeOption,
                      signatureType === 'hand' && styles.signatureTypeOptionSelected
                    ]}
                    onPress={() => setSignatureType('hand')}
                  >
                    <View style={styles.signatureTypeOptionLeft}>
                      <View style={[
                        styles.signatureTypeRadio,
                        signatureType === 'hand' && styles.signatureTypeRadioSelected
                      ]}>
                        {signatureType === 'hand' && (
                          <View style={styles.signatureTypeRadioInner} />
                        )}
                      </View>
                      <Text style={styles.signatureTypeOptionText}>Ký tay</Text>
                    </View>
                    <Text style={styles.signatureTypeOptionDesc}>Ký tên bằng tay trên màn hình</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.signatureTypeOption,
                      signatureType === 'digital' && styles.signatureTypeOptionSelected
                    ]}
                    onPress={() => setSignatureType('digital')}
                  >
                    <View style={styles.signatureTypeOptionLeft}>
                      <View style={[
                        styles.signatureTypeRadio,
                        signatureType === 'digital' && styles.signatureTypeRadioSelected
                      ]}>
                        {signatureType === 'digital' && (
                          <View style={styles.signatureTypeRadioInner} />
                        )}
                      </View>
                      <Text style={styles.signatureTypeOptionText}>Ký số</Text>
                    </View>
                    <Text style={styles.signatureTypeOptionDesc}>Ký số tự động bằng chứng thư số</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                  </TouchableOpacity>
                </View>

                {/* Signature Canvas (only for hand signature) */}
                {signatureType === 'hand' && (
                  <View style={styles.signatureCanvasSection}>
                    <View style={styles.signatureCanvasNoteBox}>
                      <Ionicons name="information-circle" size={16} color="#2B4BFF" />
                      <Text style={styles.signatureCanvasNoteText}>
                        Vui lòng ký tên vào ô bên dưới bằng chuột hoặc ngón tay
                      </Text>
                    </View>
                    <View style={styles.signatureCanvasContainer}>
                      <SignatureComponent 
                        ref={signatureRef}
                      />
                      <View style={styles.signatureCanvasActions}>
                        <TouchableOpacity
                          style={styles.signatureClearButton}
                          onPress={() => {
                            signatureRef.current?.clear();
                            setHasHandSignature(false);
                          }}
                        >
                          <Ionicons name="trash-outline" size={20} color="#6C757D" />
                          <Text style={styles.signatureClearButtonText}>Xóa chữ ký</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.signatureConfirmButton}
                          onPress={() => {
                            // Trigger read signature
                            signatureRef.current?.readSignature();
                            
                            // Check after a short delay
                            setTimeout(() => {
                              if (signatureRef.current?.hasSignature()) {
                                const signature = signatureRef.current?.getSignature();
                                console.log('✅ [BuyFund] Hand signature completed:', signature);
                                setShowContractSignModal(false);
                                setShowConfirmModal(true);
                              } else {
                                Alert.alert('Lỗi', 'Vui lòng ký tên vào ô để xác nhận');
                              }
                            }, 100);
                          }}
                        >
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          <Text style={styles.signatureConfirmButtonText}>Xác nhận ký tay</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Digital Signature Button */}
                {signatureType === 'digital' && (
                  <View style={styles.digitalSignatureSection}>
                    <TouchableOpacity
                      style={styles.digitalSignatureButton}
                      onPress={async () => {
                        // Xử lý ký số
                        console.log('✅ [BuyFund] Digital signature selected');
                        setShowContractSignModal(false);
                        setShowConfirmModal(true);
                      }}
                    >
                      <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                      <Text style={styles.digitalSignatureButtonText}>Ký số tự động</Text>
                    </TouchableOpacity>
                  </View>
                )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  debugSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  debugModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  debugModeText: {
    fontSize: 14,
    color: '#212529',
    marginLeft: 8,
    flex: 1,
  },
  debugWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugWarningText: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugLabel: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
    marginHorizontal: 12,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
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
  unitsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitsButton: {
    width: 40,
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitsButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
  },
  unitsInput: {
    flex: 1,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectInputText: {
    fontSize: 16,
    color: '#212529',
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: '#6C757D',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  ellipsisButton: {
    width: 40,
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisButtonText: {
    fontSize: 16,
    color: '#495057',
  },
  feeLink: {
    marginTop: 4,
  },
  feeLinkText: {
    fontSize: 12,
    color: '#2B4BFF',
    textDecorationLine: 'underline',
  },
  summaryPanel: {
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
  summaryPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  summaryPanelLink: {
    fontSize: 12,
    color: '#2B4BFF',
    textDecorationLine: 'underline',
  },
  summaryPanelContent: {
    gap: 8,
  },
  summaryPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryPanelLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryPanelValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  termItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  termItemSelected: {
    backgroundColor: '#F8F9FA',
  },
  termItemText: {
    fontSize: 16,
    color: '#212529',
  },
  feeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    padding: 0,
    overflow: 'hidden',
  },
  feeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  feeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  feeModalCloseButton: {
    padding: 4,
  },
  feeTable: {
    padding: 20,
  },
  feeTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E9ECEF',
    marginBottom: 12,
  },
  feeTableHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  feeTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  feeTableCell: {
    fontSize: 15,
    color: '#212529',
    flex: 1,
  },
  termsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  termsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  termsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  termsModalCloseButton: {
    padding: 4,
  },
  termsModalContent: {
    padding: 20,
  },
  termsSummarySection: {
    marginBottom: 24,
  },
  termsSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  termsSummaryList: {
    gap: 12,
  },
  termsSummaryItem: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 22,
  },
  termsDocumentSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  termsDocumentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  contractContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 20,
  },
  contractPartySection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  contractPartyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  contractInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contractInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
    width: 100,
  },
  contractInfoValue: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  contractClausesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  contractClauseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  contractClauseText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 22,
    textAlign: 'justify',
  },
  contractSignatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  contractSignatureBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  contractSignatureLabel: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 8,
    textAlign: 'center',
  },
  contractSignaturePlaceholder: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderStyle: 'dashed',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  debugCalcModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugCalcModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  debugCalcModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F0F4FF',
  },
  debugCalcModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 8,
    flex: 1,
  },
  debugCalcModalCloseButton: {
    padding: 4,
  },
  debugCalcModalContent: {
    padding: 20,
    maxHeight: 500,
  },
  debugCalcEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  debugCalcEmptyText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  debugCalcSection: {
    marginBottom: 24,
  },
  debugCalcSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  debugCalcInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  debugCalcInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
    width: 180,
    flexShrink: 0,
  },
  debugCalcInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
  },
  debugCalcFormulaBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2B4BFF',
  },
  debugCalcFormulaLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  debugCalcFormulaText: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  debugCalcFormulaResult: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
    marginTop: 4,
  },
  debugCalcConclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  debugCalcConclusionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  debugCalcConclusionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  debugCalcModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  debugCalcModalButton: {
    backgroundColor: '#6F42C1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugCalcModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  confirmModalCloseButton: {
    padding: 4,
  },
  confirmModalContent: {
    padding: 20,
    maxHeight: 500,
  },
  confirmFundInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  confirmFundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B4BFF',
  },
  confirmSection: {
    marginBottom: 20,
  },
  confirmSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  confirmInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  confirmInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  confirmInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  confirmTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  confirmTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  confirmTotalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#28A745',
    textAlign: 'right',
    flex: 1,
  },
  confirmTermsAgreement: {
    marginTop: 20,
    marginBottom: 10,
  },
  confirmCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  confirmCheckboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  confirmTermsText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
    lineHeight: 20,
  },
  confirmModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  otpSuccessModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  otpSuccessModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  otpSuccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  otpSuccessMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  contractSignModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contractSignModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contractSignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  contractSignModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  contractSignModalCloseButton: {
    padding: 4,
  },
  contractSignModalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    padding: 16,
    paddingTop: 12,
    textAlign: 'center',
  },
  contractSignModalContent: {
    flex: 1,
    flexDirection: 'row',
  },
  contractSignModalContentMobile: {
    flexDirection: 'column',
  },
  contractTabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  contractTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  contractTabActive: {
    borderBottomColor: '#FF6B35',
  },
  contractTabText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
    fontWeight: '500',
  },
  contractTabTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  contractPreviewSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    padding: 16,
    minWidth: 300,
  },
  contractPreviewSectionMobile: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 16,
    marginBottom: 0,
    minWidth: '100%',
  },
  contractPreviewSectionCollapsed: {
    flex: 0,
    minWidth: 200,
  },
  contractPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contractPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  contractCollapseButton: {
    padding: 4,
    marginLeft: 8,
  },
  contractPreviewNote: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 12,
  },
  contractPreviewContent: {
    flex: 1,
    marginBottom: 12,
  },
  contractDocument: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
  },
  contractDocumentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 20,
  },
  contractPartyText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
  },
  contractPreviewNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E7F3FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  contractPreviewNoteText: {
    fontSize: 13,
    color: '#004085',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  signatureMethodSection: {
    flex: 1,
    padding: 16,
    width: isMobile ? '100%' : 'auto',
  },
  signatureMethodSectionMobile: {
    width: '100%',
    paddingTop: 16,
  },
  signatureMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  signatureMethodSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 20,
  },
  signatureTypeOptions: {
    marginBottom: 20,
  },
  signatureTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  signatureTypeOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  signatureTypeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  signatureTypeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureTypeRadioSelected: {
    borderColor: '#FF6B35',
  },
  signatureTypeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  signatureTypeOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
    marginRight: 8,
  },
  signatureTypeOptionDesc: {
    fontSize: 13,
    color: '#6C757D',
    flex: 1,
  },
  signatureCanvasSection: {
    marginTop: 20,
  },
  signatureCanvasNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E7F3FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  signatureCanvasNoteText: {
    fontSize: 13,
    color: '#004085',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  signatureCanvasContainer: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    marginBottom: 16,
  },
  signatureCanvasActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  signatureClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  signatureClearButtonText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
  },
  signatureConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B4BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  signatureConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  digitalSignatureSection: {
    marginTop: 20,
  },
  digitalSignatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B4BFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  digitalSignatureButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 