import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, TouchableOpacity } from 'react-native';
import SignatureComponent, { SignatureComponentRef } from '../../components/common/Signature';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePdfService } from '../../hooks/usePdfService';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiService } from '@/config/api';
import { FundContractProps } from '@/types/fundcontract';
  

type SignatureSceneRouteProp = RouteProp<RootStackParamList, 'SignatureScene'>;

const SignatureScene = () => {
  const route = useRoute<SignatureSceneRouteProp>();
  const signatureRef = useRef<SignatureComponentRef>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { appendSignatureToPdf, loading, error } = usePdfService();
  const [profileInfo, setProfileInfo] = useState<any>(null);
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
    try {
      // Tự động đọc chữ ký từ canvas
      signatureRef.current?.readSignature();
      
      // Đợi một chút để canvas xử lý xong
      setTimeout(async () => {
        const signature = signatureRef.current?.getSignature();
        const hasSignature = signatureRef.current?.hasSignature();
        
        
        if (hasSignature && signature) {
          try {
            // Sử dụng hook để thêm chữ ký vào tài liệu
            const signedHtml = await appendSignatureToPdf({
              signatureImage: signature,
              investorName: profileInfo.name || '',
              investorBirthday: profileInfo.birth_date || '',
              investorIdCard: profileInfo.id_card || '',
              investorEmail: profileInfo.email || '',
              investorPhone: profileInfo.phone || '',
            });

            Alert.alert('Thành công', 'Giao dịch đã được ký xác nhận!');
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
          }
        } else {
          Alert.alert('Thông báo', 'Vui lòng ký trước khi xác nhận!');  
        }
      }, 100);
    } catch (error) {
      console.error('❌ [SignatureScene] Handle confirm error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
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
            Vui lòng ký vào khung bên dưới để hoàn tất giao dịch
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <SignatureComponent ref={signatureRef} />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Xóa</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Xác nhận</Text>
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
  },
});

export default SignatureScene;