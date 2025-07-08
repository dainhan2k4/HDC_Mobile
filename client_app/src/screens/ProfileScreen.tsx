import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PersonalInfo, BankInfo, AddressInfo } from '../types/profile';
import { apiService } from '../config/apiService';

export const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const { signOut } = useAuth();

  // API fetch functions
  const fetchPersonalInfo = async () => {
    try {
      console.log('🔄 [Profile] Fetching personal info...');
      const response = await apiService.get('/profile/data_personal_profile');
      console.log('✅ [Profile] Personal info loaded:', response.data);
      
      // Handle middleware response structure
      const profileData = (response.data as any)?.data || response.data;
      
      if (Array.isArray(profileData) && profileData.length > 0) {
        setPersonalInfo(profileData[0]);
      } else {
        console.log('⚠️ [Profile] No personal info data, using empty state');
        setPersonalInfo({
          name: 'Chưa cập nhật',
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
      }
    } catch (error) {
      console.error('❌ [Profile] Personal info fetch error:', error);
      setPersonalInfo({
        name: 'Lỗi tải dữ liệu',
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
    }
  };

  const fetchBankInfo = async () => {
    try {
      console.log('🔄 [Profile] Fetching bank info...');
      const response = await apiService.get('/profile/data_bank_info');
      console.log('✅ [Profile] Bank info loaded:', response.data);
      
      // Handle middleware response structure
      const bankData = (response.data as any)?.data || response.data;
      
      if (Array.isArray(bankData) && bankData.length > 0) {
        setBankInfo(bankData[0]);
      }
    } catch (error) {
      console.error('❌ [Profile] Bank info fetch error:', error);
    }
  };

  const fetchAddressInfo = async () => {
    try {
      console.log('🔄 [Profile] Fetching address info...');
      const response = await apiService.get('/profile/data_address_info');
      console.log('✅ [Profile] Address info loaded:', response.data);
      
      // Handle middleware response structure
      const addressData = (response.data as any)?.data || response.data;
      
      if (Array.isArray(addressData) && addressData.length > 0) {
        setAddressInfo(addressData[0]);
      }
    } catch (error) {
      console.error('❌ [Profile] Address info fetch error:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchPersonalInfo(),
        fetchBankInfo(), 
        fetchAddressInfo()
      ]);
    } catch (error) {
      console.error('❌ [Profile] Load profile data error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'bank' && !bankInfo) {
      setIsLoadingTab(true);
      await fetchBankInfo();
      setIsLoadingTab(false);
    } else if (tab === 'address' && !addressInfo) {
      setIsLoadingTab(true);
      await fetchAddressInfo();
      setIsLoadingTab(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  useEffect(() => {
    // Load profile data when component mounts
    loadProfileData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getVerificationStatus = () => {
    if (!personalInfo?.id_number) return 'pending';
    return personalInfo.id_number ? 'verified' : 'pending';
  };

  const renderPersonalInfo = () => {
    if (!personalInfo) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
        </View>
      );
    }

    const verificationStatus = getVerificationStatus();

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.avatarContainer}>
          {personalInfo.id_front ? (
            <Image 
              source={{ uri: personalInfo.id_front }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {personalInfo.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.verificationBadge}>
            {verificationStatus === 'verified' ? (
              <Ionicons name="checkmark-circle" size={24} color="#33FF57" />
            ) : verificationStatus === 'pending' ? (
              <Ionicons name="time" size={24} color="#FFA500" />
            ) : (
              <Ionicons name="close-circle" size={24} color="#FF5733" />
            )}
          </View>
        </View>
        
        <Text style={styles.name}>{personalInfo.name}</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{personalInfo.email || 'Chưa cập nhật'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{personalInfo.phone || 'Chưa cập nhật'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày sinh</Text>
            <Text style={styles.infoValue}>{formatDate(personalInfo.birth_date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giới tính</Text>
            <Text style={styles.infoValue}>{personalInfo.gender || 'Chưa cập nhật'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số CMND/CCCD</Text>
            <Text style={styles.infoValue}>{personalInfo.id_number || 'Chưa cập nhật'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày cấp</Text>
            <Text style={styles.infoValue}>{formatDate(personalInfo.id_issue_date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nơi cấp</Text>
            <Text style={styles.infoValue}>{personalInfo.id_issue_place || 'Chưa cập nhật'}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderBankInfo = () => {
    if (isLoadingTab) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải thông tin ngân hàng...</Text>
        </View>
      );
    }

    if (!bankInfo) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#DEE2E6" />
            <Text style={styles.emptyText}>Chưa có thông tin ngân hàng</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
            <Text style={styles.addButtonText}>Thêm tài khoản ngân hàng</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.bankCard}>
          <View style={styles.bankCardHeader}>
            <Text style={styles.bankName}>{bankInfo.bank_name}</Text>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          </View>
          
          <View style={styles.bankCardBody}>
            <Text style={styles.accountNumber}>{bankInfo.account_number}</Text>
            <Text style={styles.accountName}>{bankInfo.account_holder}</Text>
            <Text style={styles.bankBranch}>Chi nhánh: {bankInfo.branch}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
          <Text style={styles.addButtonText}>Thêm tài khoản ngân hàng</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderAddressInfo = () => {
    if (isLoadingTab) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải thông tin địa chỉ...</Text>
        </View>
      );
    }

    if (!addressInfo) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#DEE2E6" />
            <Text style={styles.emptyText}>Chưa có thông tin địa chỉ</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
            <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <Text style={styles.addressTitle}>Địa chỉ</Text>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          </View>
          
          <View style={styles.addressCardBody}>
            <Text style={styles.addressText}>
              {addressInfo.street}, {addressInfo.ward}, {addressInfo.district}, {addressInfo.province}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
          <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải hồ sơ cá nhân...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]} 
          onPress={() => handleTabChange('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Cá nhân
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bank' && styles.activeTab]} 
          onPress={() => handleTabChange('bank')}
        >
          <Text style={[styles.tabText, activeTab === 'bank' && styles.activeTabText]}>
            Ngân hàng
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'address' && styles.activeTab]} 
          onPress={() => handleTabChange('address')}
        >
          <Text style={[styles.tabText, activeTab === 'address' && styles.activeTabText]}>
            Địa chỉ
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'bank' && renderBankInfo()}
        {activeTab === 'address' && renderAddressInfo()}
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2B4BFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6C757D',
  },
  activeTabText: {
    color: '#2B4BFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#DEE2E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6C757D',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  infoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#2B4BFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  defaultBadge: {
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: {
    fontSize: 12,
    color: '#495057',
  },
  bankCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 16,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  bankBranch: {
    fontSize: 14,
    color: '#6C757D',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    color: '#2B4BFF',
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  addressCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  logoutContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
  },
  logoutButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 