import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import SignatureComponent, { SignatureComponentRef } from '../../components/common/Signature';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePdfService } from '../../hooks/usePdfService';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiService } from '@/config/api';
import { FundContractProps } from '@/types/fundcontract';
  

type SignatureSceneRouteProp = RouteProp<RootStackParamList, 'SignatureScene'>;

type SignatureType = 'hand' | 'digital';

const SignatureScene = () => {
  const route = useRoute<SignatureSceneRouteProp>();
  const signatureRef = useRef<SignatureComponentRef>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { appendSignatureToPdf, loading, error } = usePdfService();
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [signatureType, setSignatureType] = useState<SignatureType>('hand');
  const [isProcessing, setIsProcessing] = useState(false);
  const { fundContract } = route.params as unknown as { fundContract: FundContractProps };
  console.log('fundContract in SignatureScene :', fundContract);
  const fetchPersonalInfo = async () => {
    const response = await apiService.getProfile();
    const rawData = response?.data?.[0] ?? response?.data?.data?.[0];

    if (response.success && rawData) {
      const data = {
        name: rawData.name,
        birth_date: rawData.birth_date,
        id_card: rawData.id_number,
        email: rawData.email,
        phone: rawData.phone,
        
      };
      setProfileInfo(data);
    } else {
      console.error('Failed to fetch profile info');
    }
    };
    
  useEffect(() => {
    fetchPersonalInfo();
  }, []);



  const handleConfirm = async () => {
    if (signatureType === 'hand') {
      await handleHandSignature();
    } else {
      await handleDigitalSignature();
    }
  };

  const handleHandSignature = async () => {
    try {
      // Tự động đọc chữ ký từ canvas
      signatureRef.current?.readSignature();
      
      // Đợi một chút để canvas xử lý xong
      setTimeout(async () => {
        const signature = signatureRef.current?.getSignature();
        const hasSignature = signatureRef.current?.hasSignature();
        
        
        if (hasSignature && signature) {
          try {
            setIsProcessing(true);
            
            // Sử dụng hook để thêm chữ ký vào tài liệu
            const signedHtml = await appendSignatureToPdf({
              signatureImage: signature,
              investorName: profileInfo.name || '',
              investorBirthday: profileInfo.birth_date || '',
              investorIdCard: profileInfo.id_card || '',
              investorEmail: profileInfo.email || '',
              investorPhone: profileInfo.phone || '',
            });

            Alert.alert('Thành công', 'Giao dịch đã được ký tay xác nhận!');
            setSignature(signature);
            console.log('signature:', signature.substring(0, 100) + '...');
            console.log('signedHtml length:', signedHtml.length);
            
            // Chuyển sang màn hình xem hợp đồng với HTML đã ký
            (navigation as any).navigate('ContractViewer', { 
              fundContract, 
              signature : signature ? String(signature) : "",
              signedHtml: signedHtml ? String(signedHtml) : ''
            });
          } catch (error) {
            console.error('❌ [SignatureScene] PDF signing error:', error);
            Alert.alert('Lỗi', 'Không thể ký tài liệu. Vui lòng thử lại.');
          } finally {
            setIsProcessing(false);
          }
        } else {
          Alert.alert('Thông báo', 'Vui lòng ký trước khi xác nhận!');  
        }
      }, 100);
    } catch (error) {
      console.error('❌ [SignatureScene] Handle hand signature error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDigitalSignature = async () => {
    try {
      setIsProcessing(true);
      console.log('🔐 [SignatureScene] Starting digital signature process');
      
      // Gọi API Odoo để thực hiện ký số
      const response = await apiService.post('/signature/digital', {
        signer_email: profileInfo?.email || 'user@example.com',
        transaction_type: 'buy',
        fund_id: fundContract.fundCode,
        fund_name: fundContract.fundName,
        amount: fundContract.value,
        units: fundContract.quantity,
        investor_name: profileInfo?.name || '',
        investor_id_card: profileInfo?.id_card || '',
        investor_phone: profileInfo?.phone || '',
      });

      const responseData = response as any;
      
      if (responseData.success) {
        console.log('✅ [SignatureScene] Digital signature successful:', responseData);
        
        const digitalSignature = responseData.signature_id || responseData.signature || responseData.data?.signature_id || responseData.data?.signature;
        
        // Sử dụng cùng hook appendSignatureToPdf như ký tay
        // Nhưng thay vì ảnh chữ ký, dùng text chữ ký số
        const signedHtml = await appendSignatureToPdf({
          signatureImage: digitalSignature, // Gửi mã chữ ký số thay vì ảnh
          investorName: profileInfo?.name || '',
          investorBirthday: profileInfo?.birth_date || '',
          investorIdCard: profileInfo?.id_card || '',
          investorEmail: profileInfo?.email || '',
          investorPhone: profileInfo?.phone || '',
          isDigitalSignature: true, // Flag để phân biệt ký số
        });
        
        Alert.alert('Thành công', 'Giao dịch đã được ký số xác nhận!');
        console.log('Digital signature:', digitalSignature);
        console.log('signedHtml length:', signedHtml.length);
        
        // Chuyển sang màn hình xem hợp đồng với HTML đã ký
        (navigation as any).navigate('ContractViewer', { 
          fundContract,
          signature: digitalSignature,
          signedHtml: signedHtml ? String(signedHtml) : ''
        });
      } else {
        throw new Error(responseData.message || responseData.data?.message || 'Ký số thất bại');
      }
    } catch (error: any) {
      console.error('❌ [SignatureScene] Digital signature error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể thực hiện ký số. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Hủy', 'Bạn đã hủy việc ký xác nhận.');
    // Navigate về màn hình trước
  };

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Ký xác nhận</Text>
          <Text style={styles.subtitle}>
            Chọn phương thức ký để hoàn tất giao dịch
          </Text>
        </View>
      </View>

      {/* Signature Type Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, signatureType === 'hand' && styles.tabActive]}
          onPress={() => setSignatureType('hand')}
          disabled={isProcessing}
        >
          <Ionicons 
            name="create-outline" 
            size={24} 
            color={signatureType === 'hand' ? '#FFFFFF' : '#6C757D'} 
          />
          <Text style={[styles.tabText, signatureType === 'hand' && styles.tabTextActive]}>
            Ký tay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, signatureType === 'digital' && styles.tabActive]}
          onPress={() => setSignatureType('digital')}
          disabled={isProcessing}
        >
          <Ionicons 
            name="shield-checkmark-outline" 
            size={24} 
            color={signatureType === 'digital' ? '#FFFFFF' : '#6C757D'} 
          />
          <Text style={[styles.tabText, signatureType === 'digital' && styles.tabTextActive]}>
            Ký số
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {signatureType === 'hand' ? (
          <SignatureComponent ref={signatureRef} />
        ) : (
          <View style={styles.digitalSignatureContainer}>
            <Ionicons name="shield-checkmark" size={80} color="#2B4BFF" />
            <Text style={styles.digitalTitle}>Ký số điện tử</Text>
            <Text style={styles.digitalSubtitle}>
              Chữ ký số sẽ được tạo tự động và gửi đến Odoo để xác thực
            </Text>
            <View style={styles.digitalInfoBox}>
              <View style={styles.digitalInfoRow}>
                <Text style={styles.digitalInfoLabel}>Email:</Text>
                <Text style={styles.digitalInfoValue}>{profileInfo?.email || 'Đang tải...'}</Text>
              </View>
              <View style={styles.digitalInfoRow}>
                <Text style={styles.digitalInfoLabel}>Quỹ:</Text>
                <Text style={styles.digitalInfoValue}>{fundContract.fundName}</Text>
              </View>
              <View style={styles.digitalInfoRow}>
                <Text style={styles.digitalInfoLabel}>Số tiền:</Text>
                <Text style={styles.digitalInfoValue}>
                  {fundContract.value?.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        {signatureType === 'hand' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.clearButton]} 
              onPress={handleClear}
              disabled={isProcessing}
            >
              <Text style={styles.clearButtonText}>Xóa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]} 
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons 
                name={signatureType === 'hand' ? 'checkmark-circle' : 'shield-checkmark'} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.confirmButtonText}>
                {signatureType === 'hand' ? 'Xác nhận ký tay' : 'Thực hiện ký số'}
              </Text>
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
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  buttonSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#2B4BFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  digitalSignatureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  digitalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginTop: 20,
    marginBottom: 8,
  },
  digitalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  digitalInfoBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  digitalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  digitalInfoLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  digitalInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default SignatureScene;