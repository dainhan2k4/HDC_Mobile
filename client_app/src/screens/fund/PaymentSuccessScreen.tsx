import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import formatVND from '../../hooks/formatCurrency';

interface PaymentSuccessRouteParams {
  fundId: number;
  fundName: string;
  amount: number;
  units: number;
  totalAmount: number;
  transactionId?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as PaymentSuccessRouteParams) || {};

  const {
    fundId,
    fundName,
    amount,
    units,
    totalAmount,
    transactionId
  } = params;

  // Refresh transaction list when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [PaymentSuccess] Screen focused, transaction should be visible in pending orders');
      // Transaction đã được tạo khi confirm contract, nên sẽ tự động hiển thị trong pending orders
    }, [])
  );

  const handleBackToHome = () => {
    // Navigate về Main tab và reset stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  const handleViewOrders = () => {
    // Reset stack và mở tab Quản lý giao dịch (TransactionManagement)
    navigation.reset({
      index: 0,
      routes: [{
        name: 'Main' as never,
        params: {
          screen: 'transaction_management'
        }
      }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#28A745" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.subtitle}>
          Giao dịch của bạn đã được xử lý thành công
        </Text>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Thông tin giao dịch</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quỹ đầu tư</Text>
            <Text style={styles.detailValue}>{fundName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số tiền đầu tư</Text>
            <Text style={styles.detailValue}>{formatVND(amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng số CCQ</Text>
            <Text style={styles.detailValue}>{units}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng thanh toán</Text>
            <Text style={[styles.detailValue, styles.detailValueHighlight]}>
              {formatVND(totalAmount)}
            </Text>
          </View>

          {transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã giao dịch</Text>
              <Text style={styles.detailValue}>#{transactionId}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007BFF" />
          <Text style={styles.infoText}>
            Giao dịch của bạn đang được xử lý. Vui lòng đợi vài phút để cập nhật vào tài khoản.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleViewOrders}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Xem lệnh mua
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBackToHome}
          >
            <Text style={styles.buttonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: isMobile ? 24 : 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'right',
  },
  detailValueHighlight: {
    color: '#28A745',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E7F3FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#004085',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
});

