import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

type SignatureType = 'hand' | 'digital' | null;

interface SignatureSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (signatureType: 'hand' | 'digital') => void;
  transactionType: 'buy' | 'sell';
  fundName?: string;
  amount?: number;
}

export default function SignatureSelector({
  visible,
  onClose,
  onConfirm,
  transactionType,
  fundName = '',
  amount = 0,
}: SignatureSelectorProps) {
  const [selectedType, setSelectedType] = useState<SignatureType>(null);

  const handleConfirm = () => {
    if (!selectedType) {
      Alert.alert('Chưa chọn', 'Vui lòng chọn phương thức ký');
      return;
    }

    onConfirm(selectedType);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Xác nhận giao dịch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Loại giao dịch:</Text>
            <Text style={styles.infoValue}>
              {transactionType === 'buy' ? '🛒 Mua CCQ' : '💰 Bán CCQ'}
            </Text>

            {fundName && (
              <>
                <Text style={styles.infoLabel}>Quỹ:</Text>
                <Text style={styles.infoValue}>{fundName}</Text>
              </>
            )}

            {amount > 0 && (
              <>
                <Text style={styles.infoLabel}>Số tiền:</Text>
                <Text style={styles.infoValueHighlight}>{formatCurrency(amount)}</Text>
              </>
            )}
          </View>

          {/* Signature Type Selection */}
          <View style={styles.selectionBox}>
            <Text style={styles.selectionTitle}>Chọn phương thức ký xác nhận:</Text>

            {/* Ký tay */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedType === 'hand' && styles.optionSelected,
              ]}
              onPress={() => setSelectedType('hand')}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.iconText}>✍️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedType === 'hand' && styles.optionTitleSelected,
                  ]}
                >
                  Ký tay
                </Text>
                <Text style={styles.optionDescription}>
                  Vẽ chữ ký của bạn trên màn hình
                </Text>
              </View>
              {selectedType === 'hand' && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Ký số */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedType === 'digital' && styles.optionSelected,
              ]}
              onPress={() => setSelectedType('digital')}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.iconText}>🔐</Text>
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedType === 'digital' && styles.optionTitleSelected,
                  ]}
                >
                  Ký số
                </Text>
                <Text style={styles.optionDescription}>
                  Xác thực tự động bằng chữ ký số
                </Text>
              </View>
              {selectedType === 'digital' && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedType && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedType}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  !selectedType && styles.confirmButtonTextDisabled,
                ]}
              >
                Tiếp tục ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Note */}
          <Text style={styles.note}>
            ⚠️ Giao dịch sẽ được xác nhận sau khi bạn hoàn tất việc ký
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
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
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  infoValueHighlight: {
    fontSize: 18,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  selectionBox: {
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#ff6b35',
    backgroundColor: '#fff5f2',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#ff6b35',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ff6b35',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

