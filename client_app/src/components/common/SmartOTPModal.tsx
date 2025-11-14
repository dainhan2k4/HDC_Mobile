import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface SmartOTPModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (otp: string, debugMode: boolean) => Promise<void>;
  otpType?: 'smart' | 'sms_email';
}

const OTP_LENGTH = 6;
const TIMEOUT_SECONDS = 60;

export const SmartOTPModal: React.FC<SmartOTPModalProps> = ({
  visible,
  onClose,
  onConfirm,
  otpType = 'smart',
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [SmartOTPModal] visible prop changed:', visible, 'otpType:', otpType);
  }, [visible, otpType]);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeLeft(TIMEOUT_SECONDS);
      setDebugMode(false);
      setIsSubmitting(false);
      // Focus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, timeLeft]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((val) => val !== '') && newOtp.join('').length === OTP_LENGTH) {
      handleConfirm(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async (otpValue?: string) => {
    const otpString = otpValue || otp.join('');
    
    if (otpString.length !== OTP_LENGTH && !debugMode) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(otpString, debugMode);
      // Không gọi onClose() ở đây vì parent component sẽ tự quản lý việc đóng modal
      // onClose() sẽ được gọi trong handleOTPConfirm sau khi xác thực thành công
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Mã OTP không chính xác. Vui lòng thử lại.');
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      // Không đóng modal khi có lỗi để user có thể thử lại
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    return `${seconds} giây`;
  };

  const title = otpType === 'sms_email' ? 'Xác thực OTP' : 'Xác thực Smart OTP';
  const description = otpType === 'sms_email'
    ? 'Vui lòng nhập mã OTP đã được gửi qua SMS hoặc Email'
    : 'Vui lòng kiểm tra mã Smart OTP trên ứng dụng SSI Iboard Pro';
  const instruction1 = otpType === 'sms_email'
    ? 'Kiểm tra SMS hoặc Email để lấy mã OTP'
    : 'Mở ứng dụng SSI Iboard Pro trên điện thoại của bạn';
  const instruction2 = otpType === 'sms_email'
    ? 'Lấy mã OTP 6 chữ số từ SMS hoặc Email'
    : 'Kiểm tra mã Smart OTP (6 chữ số)';

  console.log('🔍 [SmartOTPModal] Rendering, visible:', visible);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6C757D" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>Hướng dẫn:</Text>
            <Text style={styles.instructionText}>1. {instruction1}</Text>
            <Text style={styles.instructionText}>2. {instruction2}</Text>
            <Text style={styles.instructionText}>3. Nhập mã OTP vào các ô bên dưới</Text>
          </View>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  index === 0 && otp[0] === '' && styles.otpInputActive,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                editable={!isSubmitting && timeLeft > 0}
              />
            ))}
          </View>

          {/* Timer */}
          {timeLeft > 0 ? (
            <Text style={styles.timerText}>Thời gian còn lại: {formatTime(timeLeft)}</Text>
          ) : (
            <Text style={styles.timerExpiredText}>Hết thời gian</Text>
          )}

          {/* Debug Mode */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugLabel}>Debug Mode (Bỏ qua xác thực OTP)</Text>
              <Switch
                value={debugMode}
                onValueChange={setDebugMode}
                trackColor={{ false: '#DEE2E6', true: '#FF6B35' }}
                thumbColor={debugMode ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleConfirm()}
              disabled={isSubmitting || (timeLeft <= 0 && !debugMode)}
            >
              {isSubmitting ? (
                <Text style={styles.confirmButtonText}>Đang xác thực...</Text>
              ) : (
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: screenWidth * 0.9,
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 4,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  otpInputActive: {
    borderColor: '#2B4BFF',
  },
  timerText: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerExpiredText: {
    fontSize: 13,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  debugContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  debugLabel: {
    fontSize: 13,
    color: '#E65100',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  confirmButton: {
    backgroundColor: '#2B4BFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

