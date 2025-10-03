import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = 200;

type SignatureType = 'hand' | 'digital';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSignatureComplete: (signature: {
    type: SignatureType;
    value: string;
    timestamp: string;
  }) => void;
  transactionType: 'buy' | 'sell';
  userEmail?: string;
}

export default function SignatureModal({
  visible,
  onClose,
  onSignatureComplete,
  transactionType,
  userEmail = 'user@example.com',
}: SignatureModalProps) {
  const [signatureType, setSignatureType] = useState<SignatureType>('hand');
  const [paths, setPaths] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useCanvasRef();

  // Gesture handler cho ký tay
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      const newPath = Skia.Path.Make();
      newPath.moveTo(e.x, e.y);
      setPaths((prev) => [...prev, { path: newPath, color: '#000' }]);
    })
    .onUpdate((e) => {
      setPaths((prev) => {
        const updatedPaths = [...prev];
        const currentPath = updatedPaths[updatedPaths.length - 1];
        currentPath.path.lineTo(e.x, e.y);
        return updatedPaths;
      });
    });

  const handleClear = () => {
    setPaths([]);
  };

  const handleSubmit = async () => {
    if (signatureType === 'hand') {
      await handleHandSignature();
    } else {
      await handleDigitalSignature();
    }
  };

  const handleHandSignature = async () => {
    if (paths.length === 0) {
      Alert.alert('Thiếu chữ ký', 'Vui lòng ký vào ô để xác nhận');
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuyển canvas thành base64 image
      const image = canvasRef.current?.makeImageSnapshot();
      if (!image) {
        throw new Error('Không thể tạo ảnh chữ ký');
      }

      const base64 = image.encodeToBase64();
      const signatureValue = `data:image/png;base64,${base64}`;

      // Gọi Odoo API để validate chữ ký tay
      const validationResult = await validateSignature({
        signature_type: 'hand',
        signature_value: signatureValue,
        signer_email: userEmail,
        transaction_type: transactionType,
      });

      if (validationResult.valid) {
        Alert.alert(
          'Xác nhận chữ ký',
          'Chữ ký tay đã được xác nhận. Tiếp tục giao dịch?',
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Xác nhận',
              onPress: () => {
                onSignatureComplete({
                  type: 'hand',
                  value: signatureValue,
                  timestamp: new Date().toISOString(),
                });
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', validationResult.message || 'Chữ ký không hợp lệ');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xử lý chữ ký tay');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigitalSignature = async () => {
    setIsSubmitting(true);

    try {
      // Gọi service ký số (Flask API hoặc native)
      const signResult = await performDigitalSignature({
        signer_email: userEmail,
        transaction_type: transactionType,
      });

      if (!signResult.success) {
        throw new Error(signResult.message || 'Ký số thất bại');
      }

      // Validate với Odoo
      const validationResult = await validateSignature({
        signature_type: 'digital',
        signature_value: signResult.signature,
        signer_email: userEmail,
        transaction_type: transactionType,
      });

      if (validationResult.valid) {
        Alert.alert(
          'Xác nhận chữ ký số',
          `Đã ký số thành công lúc ${signResult.timestamp}. Tiếp tục giao dịch?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Xác nhận',
              onPress: () => {
                onSignatureComplete({
                  type: 'digital',
                  value: signResult.signature,
                  timestamp: signResult.timestamp,
                });
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', validationResult.message || 'Chữ ký số không hợp lệ');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thực hiện ký số');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Xác nhận giao dịch {transactionType === 'buy' ? 'mua' : 'bán'}</Text>

          {/* Tabs: Ký tay / Ký số */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, signatureType === 'hand' && styles.tabActive]}
              onPress={() => setSignatureType('hand')}
            >
              <Text style={[styles.tabText, signatureType === 'hand' && styles.tabTextActive]}>
                ✍️ Ký tay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, signatureType === 'digital' && styles.tabActive]}
              onPress={() => setSignatureType('digital')}
            >
              <Text style={[styles.tabText, signatureType === 'digital' && styles.tabTextActive]}>
                🔐 Ký số
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {signatureType === 'hand' ? (
            <View style={styles.canvasContainer}>
              <Text style={styles.label}>Vui lòng ký vào ô bên dưới:</Text>
              <View style={styles.canvasBorder}>
                <GestureDetector gesture={panGesture}>
                  <Canvas ref={canvasRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                    {paths.map((p, index) => (
                      <Path
                        key={index}
                        path={p.path}
                        color={p.color}
                        style="stroke"
                        strokeWidth={2}
                        strokeCap="round"
                        strokeJoin="round"
                      />
                    ))}
                  </Canvas>
                </GestureDetector>
              </View>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>🗑️ Xóa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.digitalContainer}>
              <Text style={styles.label}>Xác thực ký số</Text>
              <Text style={styles.digitalInfo}>Email: {userEmail}</Text>
              <Text style={styles.digitalInfo}>
                Loại giao dịch: {transactionType === 'buy' ? 'Mua CCQ' : 'Bán CCQ'}
              </Text>
              <Text style={styles.digitalNote}>
                ⚠️ Chữ ký số sẽ được tạo và xác thực tự động
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {signatureType === 'hand' ? 'Xác nhận ký tay' : 'Thực hiện ký số'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// === API Calls ===

async function performDigitalSignature(params: {
  signer_email: string;
  transaction_type: string;
}): Promise<{ success: boolean; signature: string; timestamp: string; message?: string }> {
  try {
    // Gọi Flask service ký số
    const response = await fetch('http://127.0.0.1:5000/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_base64: '', // Có thể tạo PDF tạm từ thông tin giao dịch
        signer: params.signer_email,
      }),
    });

    if (!response.ok) {
      throw new Error('API ký số trả về lỗi');
    }

    const result = await response.json();
    return {
      success: result.success,
      signature: result.signature,
      timestamp: result.timestamp,
    };
  } catch (error: any) {
    console.error('❌ [DigitalSignature] Error:', error);
    return {
      success: false,
      signature: '',
      timestamp: '',
      message: error.message || 'Lỗi kết nối service ký số',
    };
  }
}

async function validateSignature(params: {
  signature_type: string;
  signature_value: string;
  signer_email: string;
  transaction_type: string;
}): Promise<{ valid: boolean; message?: string }> {
  try {
    // Gọi Odoo API để validate chữ ký
    const response = await fetch('http://localhost:3000/api/v1/signature/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, message: error.message || 'Validation failed' };
    }

    const result = await response.json();
    return { valid: result.valid, message: result.message };
  } catch (error: any) {
    console.error('❌ [ValidateSignature] Error:', error);
    return { valid: false, message: 'Không thể kết nối tới server' };
  }
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
    borderRadius: 12,
    padding: 20,
    width: SCREEN_WIDTH - 40,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#ff6b35',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  canvasContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  canvasBorder: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  clearButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ff6b35',
    fontSize: 14,
  },
  digitalContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  digitalInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  digitalNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ff6b35',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

