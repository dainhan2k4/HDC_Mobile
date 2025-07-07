import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ProfileScreen } from './ProfileScreen';
import { mockProfileData } from '../../config/mockData';

export const ProfileContainer: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Sử dụng mock data thay vì gọi API
      setTimeout(() => {
        setProfileData(mockProfileData);
        setIsLoading(false);
      }, 1000); // Simulate loading time
      
    } catch (error: any) {
      console.error('Error loading profile data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  if (isLoading) {
    return null; // Or show loading screen
  }

  return (
    <ProfileScreen 
      profileData={profileData}
      isLoading={isLoading}
    />
  );
}; 