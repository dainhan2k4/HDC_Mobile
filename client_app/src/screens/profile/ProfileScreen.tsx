import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { PersonalInfo, BankInfo, AddressInfo } from '../../types/profile';
import { apiService } from '../../config/apiService';
import { useNavigation } from '@react-navigation/native';
import formatVND from '../../hooks/formatCurrency';

export const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [accountBalance, setAccountBalance] = useState<any>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    consumer_id: '',
    consumer_secret: '',
    account: '',
    private_key: ''
  });
  const { signOut } = useAuth();
  const navigation = useNavigation();
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

  const fetchAccountBalance = async () => {
    try {
      setIsLoadingBalance(true);
      console.log('💰 [Profile] Fetching account balance...');
      const response = await apiService.getAccountBalance();
      console.log('📊 [Profile] Account balance response:', JSON.stringify(response, null, 2));
      
      // Kiểm tra nhiều format response
      let balanceData = null;
      
      if (response.success && response.data) {
        // Format 1: response.data.status === 'success' && response.data.balance (từ Odoo)
        if (response.data.status === 'success' && response.data.balance) {
          const balance = response.data.balance;
          // Transform từ Odoo format sang client format
          balanceData = {
            account: balance.raw_data?.account || balance.account || 'N/A',
            available_balance: balance.available_cash || balance.cash_balance || 0,
            balance: balance.cash_balance || 0,
            purchasing_power: balance.purchasing_power || 0,
            last_sync: balance.last_sync,
            raw_data: balance.raw_data
          };
        }
        // Format 2: response.data.status === 'success' && response.data.data
        else if (response.data.status === 'success' && response.data.data) {
          balanceData = response.data.data;
        }
        // Format 3: response.data trực tiếp là balance data
        else if (response.data.account || response.data.available_balance !== undefined || response.data.available_cash !== undefined) {
          balanceData = response.data;
        }
        // Format 4: response.data có nested data
        else if (response.data.data && (response.data.data.account || response.data.data.available_balance !== undefined)) {
          balanceData = response.data.data;
        }
      }
      // Format 5: response trực tiếp là balance data
      else if (response.account || response.available_balance !== undefined) {
        balanceData = response;
      }
      
      if (balanceData) {
        console.log('✅ [Profile] Account balance data:', balanceData);
        setAccountBalance(balanceData);
      } else {
        console.log('⚠️ [Profile] No balance data found in response');
        // Nếu có message lỗi, log ra
        if (response.data?.message) {
          console.log('📝 [Profile] Response message:', response.data.message);
        }
        setAccountBalance(null);
      }
    } catch (error: any) {
      console.error('❌ [Profile] Account balance fetch error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      console.error('❌ [Profile] Error details:', errorMessage);
      setAccountBalance(null);
    } finally {
      setIsLoadingBalance(false);
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
    } else if (tab === 'account') {
      await fetchAccountBalance();
    }
  };

  const handleLinkAccount = async () => {
    if (!linkFormData.consumer_id || !linkFormData.consumer_secret || !linkFormData.account || !linkFormData.private_key) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsLinking(true);
      console.log('🔗 [Profile] Linking SSI account...', {
        consumer_id: linkFormData.consumer_id.substring(0, 10) + '...',
        account: linkFormData.account,
        has_secret: !!linkFormData.consumer_secret,
        has_key: !!linkFormData.private_key
      });
      
      const response = await apiService.linkSSIAccount(linkFormData);
      console.log('📊 [Profile] Link account response:', JSON.stringify(response, null, 2));
      
      // Kiểm tra response structure
      const isSuccess = response.success === true || 
                        (response.data && response.data.status === 'success') ||
                        (response.status === 'success');
      
      if (isSuccess) {
        const successMessage = response.message || 
                              response.data?.message || 
                              'Đã liên kết tài khoản SSI thành công';
        
        Alert.alert('Thành công', successMessage, [
          {
            text: 'OK',
            onPress: async () => {
              setShowLinkModal(false);
              setLinkFormData({
                consumer_id: '',
                consumer_secret: '',
                account: '',
                private_key: ''
              });
              // Đợi một chút rồi fetch balance để đảm bảo data đã được lưu
              setTimeout(() => {
                fetchAccountBalance();
              }, 500);
            }
          }
        ]);
      } else {
        const errorMessage = response.message || 
                            response.data?.message || 
                            response.error ||
                            'Không thể liên kết tài khoản';
        console.error('❌ [Profile] Link account failed:', errorMessage);
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ [Profile] Link account error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Không thể liên kết tài khoản SSI';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLinking(false);
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
        
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile' as never)}>
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
  
  const renderAccountInfo = () => {
    if (isLoadingBalance) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B4BFF" />
          <Text style={styles.loadingText}>Đang tải thông tin tài khoản...</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        {/* Account Balance Section */}
        <View style={styles.accountCard}>
          <View style={styles.accountCardHeader}>
            <Text style={styles.accountCardTitle}>Số dư tài khoản</Text>
            <TouchableOpacity onPress={fetchAccountBalance}>
              <Ionicons name="refresh" size={20} color="#2B4BFF" />
            </TouchableOpacity>
          </View>
          
          {accountBalance ? (
            <View style={styles.accountCardBody}>
              <Text style={styles.accountNumber}>
                Số TK {accountBalance.account || accountBalance.account_number || 'N/A'}
              </Text>
              <Text style={styles.accountBalance}>
                {formatVND(accountBalance.available_balance || accountBalance.balance || 0)}
              </Text>
              <Text style={styles.accountBalanceLabel}>Số dư khả dụng</Text>
              {accountBalance.last_sync && (
                <Text style={styles.lastSyncText}>
                  Cập nhật: {new Date(accountBalance.last_sync).toLocaleString('vi-VN')}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color="#DEE2E6" />
              <Text style={styles.emptyText}>Chưa có số dư</Text>
              <Text style={styles.emptySubtext}>
                {accountBalance === null 
                  ? 'Vui lòng liên kết tài khoản để xem số dư' 
                  : 'Đang tải số dư...'}
              </Text>
            </View>
          )}
        </View>

        {/* Link Account Section */}
        <View style={styles.linkAccountCard}>
          <View style={styles.linkAccountHeader}>
            <Ionicons name="link" size={24} color="#28A745" />
            <Text style={styles.linkAccountTitle}>Liên kết tài khoản</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.linkAccountButton}
            onPress={() => setShowLinkModal(true)}
          >
            <View style={styles.ssiLogoWrapper}>
              <Text style={styles.ssiLogoText}>SSI</Text>
            </View>
            <View style={styles.linkAccountButtonContent}>
              <Text style={styles.linkAccountButtonTitle}>SSI</Text>
              <Text style={styles.linkAccountButtonSubtitle}>Nhấp để liên kết</Text>
            </View>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity 
          style={styles.kycButton} 
          onPress={() => {
            console.log('KYC button clicked from Profile, trying navigation...');
            try {
              (navigation as any).navigate('Kyc', { userData: { name: personalInfo?.name || 'User' } });
              console.log('✅ Navigation to KYC successful');
            } catch (error) {
              console.error('❌ Navigation to KYC failed:', error);
              Alert.alert('Lỗi', 'Không thể mở màn hình KYC');
            }
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.kycButtonText}>KYC</Text>
        </TouchableOpacity>
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
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'account' && styles.activeTab]} 
          onPress={() => handleTabChange('account')}
        >
          <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>
            Tài khoản
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'bank' && renderBankInfo()}
        {activeTab === 'address' && renderAddressInfo()}
        {activeTab === 'account' && renderAccountInfo()}
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Link Account Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="link" size={24} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Liên kết tài khoản</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Consumer ID <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={linkFormData.consumer_id}
                  onChangeText={(text) => setLinkFormData({ ...linkFormData, consumer_id: text })}
                  placeholder="Nhập Consumer ID từ SSI"
                  editable={!isLinking}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Consumer Secret <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={linkFormData.consumer_secret}
                  onChangeText={(text) => setLinkFormData({ ...linkFormData, consumer_secret: text })}
                  placeholder="Nhập Consumer Secret từ SSI"
                  secureTextEntry
                  editable={!isLinking}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Số tài khoản <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={linkFormData.account}
                  onChangeText={(text) => setLinkFormData({ ...linkFormData, account: text })}
                  placeholder="Nhập số tài khoản SSI"
                  editable={!isLinking}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Private Key (Base64) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={linkFormData.private_key}
                  onChangeText={(text) => setLinkFormData({ ...linkFormData, private_key: text })}
                  placeholder="Nhập Private Key từ SSI"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!isLinking}
                />
                <Text style={styles.formHint}>Vui lòng nhập Private Key từ SSI</Text>
              </View>

              <TouchableOpacity
                style={[styles.linkButton, isLinking && styles.linkButtonDisabled]}
                onPress={handleLinkAccount}
                disabled={isLinking}
              >
                {isLinking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color="#FFFFFF" />
                    <Text style={styles.linkButtonText}>Liên kết tài khoản</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  kycButton: {
    backgroundColor: '#2B4BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  accountCard: {
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
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  accountCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 16,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  accountBalanceLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  lastSyncText: {
    fontSize: 11,
    color: '#6C757D',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  linkAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  linkAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkAccountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 8,
  },
  linkAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderStyle: 'dashed',
  },
  ssiLogoWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#28A745',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ssiLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  linkAccountButtonContent: {
    flex: 1,
  },
  linkAccountButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  linkAccountButtonSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#28A745',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalBody: {
    padding: 16,
    maxHeight: 600,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  required: {
    color: '#FF5733',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  formTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  linkButtonDisabled: {
    opacity: 0.6,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 