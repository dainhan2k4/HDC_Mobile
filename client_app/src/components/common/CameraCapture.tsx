import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppColors, AppTypography, AppSpacing, AppBorderRadius } from '../../styles/GlobalTheme';

interface CameraCaptureProps {
  onPhotoTaken: (photo: { uri: string; type?: string; name?: string }) => void;
  onClose: () => void;
  cameraType?: 'front' | 'back';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoTaken,
  onClose,
  cameraType = 'back'
}) => {
  console.log('🔍 [CameraCapture] Component initialized with cameraType:', cameraType);

  const takePicture = async () => {
    try {
      // Yêu cầu quyền truy cập camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      // Mở camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        onPhotoTaken({
          uri: photo.uri,
          type: 'image/jpeg',
          name: `camera_${Date.now()}.jpg`
        });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chụp ảnh</Text>
        <Text style={styles.subtitle}>Chọn cách chụp ảnh</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Text style={styles.captureButtonText}>Chụp ảnh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: AppSpacing.xl,
  },
  title: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.xl,
    fontWeight: AppTypography.fontWeight.bold,
    marginBottom: AppSpacing.sm,
  },
  subtitle: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.base,
    marginBottom: AppSpacing.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: AppSpacing.md,
  },
  captureButton: {
    backgroundColor: AppColors.primary.main,
    padding: AppSpacing.lg,
    borderRadius: AppBorderRadius.lg,
    alignItems: 'center',
  },
  captureButtonText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
  },
  closeButton: {
    backgroundColor: AppColors.background.modal,
    padding: AppSpacing.lg,
    borderRadius: AppBorderRadius.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
  },
});

export default CameraCapture;
