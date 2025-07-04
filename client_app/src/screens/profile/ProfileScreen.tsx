import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Dữ liệu mẫu cho hồ sơ
const dummyProfile = {
  personalInfo: {
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    dateOfBirth: '01/01/1990',
    gender: 'Nam',
    idNumber: '123456789012',
    idIssueDate: '01/01/2020',
    idIssuePlace: 'Hà Nội',
    taxCode: '1234567890',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    verificationStatus: 'verified', // verified, pending, rejected
  },
  bankInfo: {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN A',
    branch: 'Hà Nội',
    isDefault: true,
  },
  addressInfo: {
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Dịch Vọng Hậu',
    address: 'Số 123 Xuân Thủy',
    isDefault: true,
  }
};

export const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  
  const renderPersonalInfo = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.avatarContainer}>
        {dummyProfile.personalInfo.avatar ? (
          <Image 
            source={{ uri: dummyProfile.personalInfo.avatar }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {dummyProfile.personalInfo.fullName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.verificationBadge}>
          {dummyProfile.personalInfo.verificationStatus === 'verified' ? (
            <Ionicons name="checkmark-circle" size={24} color="#33FF57" />
          ) : dummyProfile.personalInfo.verificationStatus === 'pending' ? (
            <Ionicons name="time" size={24} color="#FFA500" />
          ) : (
            <Ionicons name="close-circle" size={24} color="#FF5733" />
          )}
        </View>
      </View>
      
      <Text style={styles.name}>{dummyProfile.personalInfo.fullName}</Text>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày sinh</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.dateOfBirth}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giới tính</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.gender}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số CMND/CCCD</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.idNumber}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày cấp</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.idIssueDate}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nơi cấp</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.idIssuePlace}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã số thuế</Text>
          <Text style={styles.infoValue}>{dummyProfile.personalInfo.taxCode}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderBankInfo = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.bankCard}>
        <View style={styles.bankCardHeader}>
          <Text style={styles.bankName}>{dummyProfile.bankInfo.bankName}</Text>
          {dummyProfile.bankInfo.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bankCardBody}>
          <Text style={styles.accountNumber}>{dummyProfile.bankInfo.accountNumber}</Text>
          <Text style={styles.accountName}>{dummyProfile.bankInfo.accountName}</Text>
          <Text style={styles.bankBranch}>Chi nhánh: {dummyProfile.bankInfo.branch}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
        <Text style={styles.addButtonText}>Thêm tài khoản ngân hàng</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderAddressInfo = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.addressCard}>
        <View style={styles.addressCardHeader}>
          <Text style={styles.addressTitle}>Địa chỉ</Text>
          {dummyProfile.addressInfo.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
        
        <View style={styles.addressCardBody}>
          <Text style={styles.addressText}>
            {dummyProfile.addressInfo.address}, {dummyProfile.addressInfo.ward}, {dummyProfile.addressInfo.district}, {dummyProfile.addressInfo.province}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color="#2B4BFF" />
        <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]} 
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Cá nhân
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bank' && styles.activeTab]} 
          onPress={() => setActiveTab('bank')}
        >
          <Text style={[styles.tabText, activeTab === 'bank' && styles.activeTabText]}>
            Ngân hàng
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'address' && styles.activeTab]} 
          onPress={() => setActiveTab('address')}
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
  },
  sectionContainer: {
    padding: 16,
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
}); 