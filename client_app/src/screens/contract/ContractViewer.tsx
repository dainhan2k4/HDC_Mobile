import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import * as Print from 'expo-print';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { FundContractProps } from '../../types/fundcontract';
import { apiService } from '../../config/apiService';
import { Alert } from 'react-native';
import { fundApi } from '../../api/fundApi';


const ContractViewer = ({
  investorName,
  investorId,
  investorAddress,
  fundName,
  fundCode,
  quantity,
  value,
  transactionDate,
  signature,
}: FundContractProps) => {
  const [loading, setLoading] = React.useState(false);
  const [pdfUri, setPdfUri] = React.useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = React.useState<any | null>(null);

  // Navigation instance
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Handlers
  const handlePrint = async () => {
    try {
      if (pdfUri) {
        await Print.printAsync({ uri: pdfUri });
      }
    } catch (err: any) {
      
      if (err?.message?.includes('did not complete')) {
        console.log('🛑 In bị hủy bởi người dùng');
      } else {
        console.error('Print error', err);
      }
    }
  };

  const handleNext = () => {
    const numericAmount = value;
    const numericUnits = quantity;
    Alert.alert(
          'Xác nhận mua quỹ',
          `Bạn muốn mua ${numericUnits?.toFixed(4)} đơn vị quỹ ${fundName} với tổng giá trị ${numericAmount} VNĐ?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác nhận', 
              onPress: () => executeBuyOrder(numericAmount!, numericUnits!)
            }
          ]
        );
  };
  const executeBuyOrder = async (amount: number, units: number) => {
    try {
      console.log(`🔄 [BuyFund] Executing buy order for fund ${fundName}:`, { amount, units });
      
      // Call real API to execute buy order
      const response = await fundApi.buyFund(parseInt(fundCode!), amount, units);
      console.log('✅ [BuyFund] Buy order response:', response);
      
      Alert.alert(
        'Thành công!',
        `Đã đặt lệnh mua ${units.toFixed(4)} đơn vị quỹ ${fundName} thành công. Portfolio sẽ được cập nhật ngay lập tức.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.navigate('Main');
            
              
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ [BuyFund] Buy order failed:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đặt lệnh mua. Vui lòng thử lại.');
    }
  };

  // Fetch personal profile once
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiService.get('/profile/data_personal_profile');
        const profileData = (res.data as any)?.data || res.data;
        if (Array.isArray(profileData) && profileData.length > 0) {
          setPersonalInfo(profileData[0]);
        }
        console.log(' Personal profile:', profileData);
      } catch (err) {
        console.error('Failed to load personal profile', err);
      }
    };
    fetchProfile();
  }, []);

  React.useEffect(() => {
    const createPdf = async () => {
      if (!signature) {
        return;
      }
      setLoading(true);
      try {
        const html = `
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
              <title>Hợp đồng mua bán chứng chỉ quỹ</title>
              <style>
                @page { size: A4; margin: 16px; }
                body { font-family: Arial, sans-serif; padding: 8px; font-size: 16px; height: auto; box-sizing: border-box; overflow: visible; }
                h1 { text-align: center; color: #333; }
                .section { margin-bottom: 16px; }
                .label { font-weight: bold; }
                .signature { display: flex; flex-direction: column; align-items: flex-end; margin-top: 80px; }
                .signature p { text-align: right; margin: 0 0 8px 0; font-size: 16px; font-weight: bold; }
                .signature img { width: 160px; height: 120px; object-fit: contain; border: 1px solid #ccc; }
              </style>
            </head>
            <body>
              <h1>HỢP ĐỒNG MUA BÁN CHỨNG CHỈ QUỸ</h1>
              <div class="section">
                <span class="label">Ngày giao dịch:</span> ${transactionDate ?? ''}
              </div>
              <div class="section">
                <span class="label">Nhà đầu tư:</span> ${investorName ?? personalInfo?.name ?? ''}<br/>
                <span class="label">Số CMND/CCCD:</span> ${investorId ?? personalInfo?.id_number ?? ''}<br/>
                <span class="label">Email:</span> ${personalInfo?.email ?? ''}
              </div>
              <div class="section">
                <span class="label">Tên quỹ:</span> ${fundName ?? ''}<br/>
                <span class="label">Mã quỹ:</span> ${fundCode ?? ''}
              </div>
              <div class="section">
                <span class="label">Số lượng chứng chỉ:</span> ${(quantity !== undefined && quantity !== null) ? quantity : ''}<br/>
                <span class="label">Giá trị giao dịch:</span> ${(value !== undefined && value !== null && typeof value === 'number') ? value.toLocaleString('vi-VN') : ''} VNĐ
              </div>
              <div class="signature">
                <p><strong>Chữ ký nhà đầu tư:</strong></p>
                <img src="${signature}" />
              </div>
            </body>
          </html>
        `;
        const result = await Print.printToFileAsync({ html });
        setPdfUri(result.uri);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('PDF creation error:', error);
      } finally {
        setLoading(false);
      }
    };
    createPdf();
  }, [investorName, investorId, fundName, fundCode, quantity, value, transactionDate, signature, personalInfo]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Đang tạo PDF hợp đồng...</Text>
      </View>
    );
  }

  if (!pdfUri) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chưa có PDF hợp đồng</Text>
      </View>
    );
  }

  return (
    <View  style={{ flex: 1 }}>
    <WebView
      

      originWhitelist={['*']}
      source={{ uri: pdfUri }}
      style={{ flex: 1 }}
      useWebKit={true}
      scalesPageToFit={true}
    />

    <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity
          onPress={handlePrint}
          style={{ backgroundColor: '#2B4BFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: '#28A745', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Tiếp theo</Text>
        </TouchableOpacity>
      </View>
    </View>

  );
};

export default ContractViewer;