import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatVND from '../../hooks/formatCurrency';
import { apiService } from '../../config/apiService';

interface PaymentRouteParams {
  fundId: number;
  fundName: string;
  amount: number;
  units: number;
  totalAmount: number;
  transactionId?: number;
  orderDate?: string;
}

interface PayOSPaymentResponse {
  success: boolean;
  data?: {
    checkoutUrl?: string;
    qrCode?: string;
    accountNumber?: string;
    amount?: number;
    description?: string;
  };
  error?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export const FundPaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as PaymentRouteParams) || {};

  const {
    fundId,
    fundName,
    amount,
    units,
    totalAmount,
    transactionId,
    orderDate
  } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PayOSPaymentResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    createPayOSPayment();
  }, []);

  const createPayOSPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💰 [Payment] Creating PayOS payment:', {
        fundId,
        amount: totalAmount,
        units,
        transactionId
      });

      const response = await apiService.post<PayOSPaymentResponse>('/payment/create', {
        transaction_id: transactionId || 0,
        amount: totalAmount,
        units: units,
        description: `Nap tien TK${transactionId ? String(transactionId).slice(-4) : '****'} tai HDC`
      });

      console.log('✅ [Payment] PayOS payment created:', response);

      if (response.success && response.data) {
        setPaymentData(response.data);
      } else {
        throw new Error(response.error || 'Không tạo được liên kết PayOS');
      }
    } catch (err: any) {
      console.error('❌ [Payment] Failed to create PayOS payment:', err);
      setError(err.message || 'Không thể tạo thanh toán PayOS. Vui lòng thử lại.');
      Alert.alert('Lỗi', err.message || 'Không thể tạo thanh toán PayOS. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      // Sử dụng Clipboard API của browser nếu là web
      if (Platform.OS === 'web') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback cho browser cũ
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } else {
        // Cho mobile, sử dụng Alert để hiển thị text (user có thể copy thủ công)
        Alert.alert(
          'Sao chép',
          text,
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Đã sao chép',
              onPress: () => {
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
              }
            }
          ]
        );
        return;
      }
      
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      Alert.alert('Thành công', 'Đã sao chép vào clipboard');
    } catch (err) {
      console.error('❌ [Payment] Failed to copy:', err);
      // Fallback: hiển thị text để user có thể copy thủ công
      Alert.alert('Sao chép', text, [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Đã sao chép',
          onPress: () => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
          }
        }
      ]);
    }
  };

  const handleOpenPayOS = () => {
    if (paymentData?.checkoutUrl) {
      Linking.openURL(paymentData.checkoutUrl).catch(err => {
        console.error('❌ [Payment] Failed to open PayOS URL:', err);
        Alert.alert('Lỗi', 'Không thể mở trang thanh toán PayOS');
      });
    }
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      'Xác nhận thanh toán',
      'Bạn đã hoàn tất thanh toán chưa?',
      [
        { text: 'Chưa', style: 'cancel' },
        {
          text: 'Đã thanh toán',
          onPress: () => {
            // Navigate to payment success screen
            (navigation as any).navigate('PaymentSuccess', {
              fundId,
              fundName,
              amount,
              units,
              totalAmount,
              transactionId
            });
          }
        }
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleString('vi-VN');
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // QR Code Image Source
  // PayOS có thể trả về:
  // 1. URL hình ảnh QR code (qrCodeUrl) - dùng trực tiếp
  // 2. Base64 string - cần thêm prefix data:image/png;base64,
  // 3. VietQR string (bắt đầu bằng "000201") - cần tạo QR code từ string bằng QR generator API
  const getQRCodeUri = (qrCode: string | undefined): string | null => {
    if (!qrCode) return null;
    
    // 1. URL hình ảnh - dùng trực tiếp
    if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) {
      return qrCode;
    }
    
    // 2. Data URI - dùng trực tiếp
    if (qrCode.startsWith('data:')) {
      return qrCode;
    }
    
    // 3. VietQR string (bắt đầu bằng "000201") - tạo QR code từ string
    if (qrCode.startsWith('000201')) {
      // Sử dụng QR generator API để tạo QR code từ VietQR string
      const encodedData = encodeURIComponent(qrCode);
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
    }
    
    // 4. Base64 string - thêm prefix
    return `data:image/png;base64,${qrCode}`;
  };
  
  const qrCodeUri = getQRCodeUri(paymentData?.qrCode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.progressCircleCompleted]}>
            <Text style={styles.progressText}>1</Text>
          </View>
          <Text style={styles.progressLabel}>Đặt lệnh</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressText}>2</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Xác nhận</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Kết quả</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Đang tạo liên kết thanh toán...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#DC3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={createPayOSPayment}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.paymentContainer}>
            {/* Left Section: Payment Method */}
            <View style={styles.paymentMethodSection}>
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              <Text style={styles.paymentDescription}>
                Thanh toán trực tuyến qua PayOS
              </Text>
              <Text style={styles.paymentSubDescription}>
                Quét mã QR bên dưới để thanh toán hoặc click vào nút để mở trang thanh toán PayOS.
              </Text>

              {/* Bank Information */}
              <View style={styles.bankInfoContainer}>
                <View style={styles.bankInfoRow}>
                  <Ionicons name="business" size={20} color="#FF6B35" />
                  <Text style={styles.bankInfoLabel}>Ngân hàng</Text>
                </View>
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoText}>Chủ tài khoản:</Text>
                </View>
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoText}>Số tài khoản:</Text>
                  <View style={styles.copyRow}>
                    <Text style={styles.bankInfoValue}>
                      {paymentData?.accountNumber || 'VQRQAFGXW2547'}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(paymentData?.accountNumber || 'VQRQAFGXW2547', 'account')}
                    >
                      <Ionicons
                        name={copiedField === 'account' ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedField === 'account' ? '#28A745' : '#6C757D'}
                      />
                      <Text style={styles.copyButtonText}>Sao chép</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoText}>Số tiền:</Text>
                  <View style={styles.copyRow}>
                    <Text style={styles.bankInfoValue}>
                      {formatVND(totalAmount)}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(String(totalAmount).replace(/[^0-9]/g, ''), 'amount')}
                    >
                      <Ionicons
                        name={copiedField === 'amount' ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedField === 'amount' ? '#28A745' : '#6C757D'}
                      />
                      <Text style={styles.copyButtonText}>Sao chép</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoText}>Nội dung:</Text>
                  <View style={styles.copyRow}>
                    <Text style={styles.bankInfoValue}>
                      {paymentData?.description || `Nap tien TK${transactionId ? String(transactionId).slice(-4) : '****'} tai HDC`}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(paymentData?.description || `Nap tien TK${transactionId ? String(transactionId).slice(-4) : '****'} tai HDC`, 'description')}
                    >
                      <Ionicons
                        name={copiedField === 'description' ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedField === 'description' ? '#28A745' : '#6C757D'}
                      />
                      <Text style={styles.copyButtonText}>Sao chép</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Warning Note */}
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={20} color="#FFC107" />
                <Text style={styles.warningText}>
                  Lưu ý: Nhập chính xác số tiền {formatVND(totalAmount)} khi chuyển khoản
                </Text>
              </View>

              {/* QR Code */}
              {qrCodeUri ? (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: qrCodeUri }}
                    style={styles.qrCode}
                    resizeMode="contain"
                    onError={(error) => {
                      const originalQrCode = paymentData?.qrCode || '';
                      const qrCodeType = originalQrCode.startsWith('000201') 
                        ? 'VietQR' 
                        : originalQrCode.startsWith('http') 
                        ? 'URL' 
                        : originalQrCode.startsWith('data:') 
                        ? 'DataURI' 
                        : 'Base64/String';
                      
                      console.error('❌ [Payment] QR code load error:', {
                        message: error?.nativeEvent?.error || 'Unknown error',
                        originalQrCodePreview: originalQrCode.substring(0, 50) + '...',
                        qrCodeType: qrCodeType,
                        generatedUri: qrCodeUri?.substring(0, 100) + '...',
                        uriType: qrCodeUri?.startsWith('http') ? 'URL' : qrCodeUri?.startsWith('data:') ? 'DataURI' : 'Unknown'
                      });
                      
                      // Nếu QR code không load được, hiển thị placeholder
                      // Không set error state để không làm mất toàn bộ UI
                      console.warn('⚠️ [Payment] QR code failed to load, user can still use PayOS button');
                    }}
                    onLoad={() => {
                      console.log('✅ [Payment] QR code loaded successfully');
                    }}
                  />
                  <Text style={styles.qrText}>Quét mã QR để thanh toán qua PayOS</Text>
                  <Text style={styles.qrSubText}>VIETQR PRO</Text>
                  <Text style={styles.qrSubText}>napas 247 | MB</Text>
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={64} color="#DEE2E6" />
                  <Text style={styles.qrPlaceholderText}>
                    {paymentData?.checkoutUrl 
                      ? 'Mã QR không có sẵn. Vui lòng sử dụng nút bên dưới để thanh toán.'
                      : 'Đang tạo mã QR...'}
                  </Text>
                </View>
              )}

              {/* PayOS Button */}
              {paymentData?.checkoutUrl && (
                <TouchableOpacity
                  style={styles.payosButton}
                  onPress={handleOpenPayOS}
                >
                  <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.payosButtonText}>Mở trang thanh toán PayOS</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Right Section: Investment Info */}
            <View style={styles.investmentInfoSection}>
              <Text style={styles.sectionTitle}>Thông tin đầu tư</Text>
              <View style={styles.infoTable}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Quỹ đầu tư</Text>
                  <Text style={styles.infoValue}>{fundName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chương trình</Text>
                  <Text style={styles.infoValue}>FFC2 - FFlex</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Loại lệnh</Text>
                  <Text style={styles.infoValue}>Mua</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày đặt lệnh</Text>
                  <Text style={styles.infoValue}>{formatDate(orderDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số tiền đầu tư</Text>
                  <Text style={styles.infoValue}>{formatVND(amount)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tổng cộng thanh toán</Text>
                  <Text style={[styles.infoValue, styles.infoValueHighlight]}>
                    {formatVND(totalAmount)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tổng số CCQ</Text>
                  <Text style={styles.infoValue}>{units}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.backButtonAction}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.confirmButtonText}>Xác nhận thanh toán</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressCircleCompleted: {
    backgroundColor: '#6C757D',
  },
  progressCircleActive: {
    backgroundColor: '#FF6B35',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  progressLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#DEE2E6',
    marginHorizontal: 8,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: isMobile ? 16 : 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#DC3545',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 24,
  },
  paymentMethodSection: {
    flex: isMobile ? 1 : 1,
    marginBottom: isMobile ? 24 : 0,
  },
  investmentInfoSection: {
    flex: isMobile ? 1 : 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  paymentSubDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 20,
  },
  bankInfoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
  },
  bankInfoText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  bankInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    marginBottom: 12,
  },
  qrText: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  qrSubText: {
    fontSize: 10,
    color: '#ADB5BD',
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 8,
  },
  payosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  payosButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoTable: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: '#FF6B35',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonAction: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

