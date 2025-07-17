import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../config/apiService';
import { useNavigation } from '@react-navigation/native';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  nationality: string;
  id_type: string;
  id_number: string;
  id_issue_date: string;
  id_issue_place: string;
}

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    nationality: '',
    id_type: '',
    id_number: '',
    id_issue_date: '',
    id_issue_place: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Lấy dữ liệu hiện tại từ API
  const fetchPersonalInfo = async () => {
    try {
      const response = await apiService.get('/profile/data_personal_profile');
      const profileData = (response.data as any)?.data || response.data;
      
      if (Array.isArray(profileData) && profileData.length > 0) {
        setPersonalInfo(profileData[0]);
      }
    } catch (error) {
      console.error('❌ [EditProfile] Fetch error:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý cập nhật thông tin
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await apiService.post('/profile/update_personal_profile', personalInfo);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      navigation.goBack();
    } catch (error) {
      console.error('❌ [EditProfile] Update error:', error);
      Alert.alert('Lỗi', 'Cập nhật thông tin thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý thay đổi giá trị trường nhập liệu
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2B4BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Form chỉnh sửa */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Nhập họ và tên"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="Nhập email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.phone}
            onChangeText={(text) => handleChange('phone', text)}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.birth_date}
            onChangeText={(text) => handleChange('birth_date', text)}
            placeholder="DD/MM/YYYY"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.gender}
            onChangeText={(text) => handleChange('gender', text)}
            placeholder="Nhập giới tính"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số CMND/CCCD</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.id_number}
            onChangeText={(text) => handleChange('id_number', text)}
            placeholder="Nhập số CMND/CCCD"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày cấp</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.id_issue_date}
            onChangeText={(text) => handleChange('id_issue_date', text)}
            placeholder="DD/MM/YYYY"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nơi cấp</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.id_issue_place}
            onChangeText={(text) => handleChange('id_issue_place', text)}
            placeholder="Nhập nơi cấp"
          />
        </View>
      </ScrollView>

      {/* Nút lưu */}
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleUpdateProfile}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2B4BFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
