import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppColors, AppTypography, AppSpacing, AppBorderRadius, AppShadows } from '../../styles/GlobalTheme';

interface ImagePickerContainerProps {
  image: { uri: string; type?: string; name?: string } | null;
  onImageSelected: (image: { uri: string; type?: string; name?: string }) => void;
  placeholder?: string;
  style?: any;
}

const ImagePickerContainer: React.FC<ImagePickerContainerProps> = ({
  image,
  onImageSelected,
  placeholder = 'Chọn ảnh từ thư viện',
  style
}) => {
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        onImageSelected({
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'image.jpg'
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={pickImage}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image.uri }} style={styles.image} />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Thay đổi ảnh</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: AppBorderRadius.md,
    overflow: 'hidden',
    backgroundColor: AppColors.background.primary,
    borderWidth: 1,
    borderColor: AppColors.border.light,
    ...AppShadows.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.background.modal,
    padding: AppSpacing.sm,
    alignItems: 'center',
  },
  overlayText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.xs,
    fontWeight: AppTypography.fontWeight.semibold,
  },
  placeholderContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background.tertiary,
  },
  placeholderText: {
    color: AppColors.text.secondary,
    fontSize: AppTypography.fontSize.sm,
    textAlign: 'center',
  },
});

export default ImagePickerContainer;
