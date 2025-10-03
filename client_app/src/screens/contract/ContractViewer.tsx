import { View, Text, StyleSheet, Button, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute   } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../../types/navigation';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import GradientButton from '@/components/common/GradientButton';
import GlobalStyles from '@/styles/GlobalStyles';
import { useState } from 'react';
import { fundApi } from '@/api/fundApi';
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';
import { FundContractProps } from '@/types/fundcontract';


export default function ContractViewer() {
  const route = useRoute<RouteProp<RootStackParamList, 'ContractViewer'>>();
  const { signedHtml, fundContract } = route.params as unknown as { signedHtml: string, fundContract: FundContractProps };
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);

  
  console.log('📄 [ContractViewer] fundContract:', fundContract);
  console.log('📄 [ContractViewer] signedHtml length:', signedHtml?.length);
  console.log('📄 [ContractViewer] signedHtml preview:', signedHtml?.substring(0, 200));
  const executeBuyOrder = async () => {
    try {
      setIsLoading(true);
      console.log(`🔄 [BuyFund] Executing buy order for fund ${fundContract.fundCode}`, fundContract);
      
      // Call real API to execute buy order
      const response = await fundApi.buyFund(fundContract.fundCode, fundContract.value, fundContract.quantity);
      console.log('✅ [BuyFund] Buy order response:', response);
      
      Alert.alert(
        'Thành công!',
        `Đã đặt lệnh mua ${fundContract.quantity} đơn vị quỹ ${fundContract.fundName} thành công. Portfolio sẽ được cập nhật ngay lập tức.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to trigger portfolio refresh
              navigation.navigate('Main');
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

  const handlePrint = async () => {
    try{
      const { uri } = await Print.printToFileAsync({
        html: signedHtml,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Lưu hợp đồng với tên: hop_dong_CCQ.pdf',
        UTI: 'com.adobe.pdf',
      });

    }catch (error){
      console.log('Error printing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: signedHtml }}
        style={{ flex: 1, marginTop: 40 }}
      />

      <SafeAreaView style={{  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>  
      <GradientButton
        title="In hợp đồng"
        onPress={handlePrint}
        style={{  }}
        textStyle={GlobalStyles.buttonText}
      />

      <GradientButton
        title="Tiếp theo"
        onPress={() => executeBuyOrder()}
        style={{  }}
        textStyle={GlobalStyles.buttonText}
      />
      </SafeAreaView>
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  
});