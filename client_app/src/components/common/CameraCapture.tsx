import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        onPhotoTaken({
          uri: photo.uri,
          type: 'image/jpeg',
          name: `camera_${Date.now()}.jpg`
        });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    }
  };

  const toggleCameraType = () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Không có quyền truy cập camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
            <Text style={styles.flipButtonText}>Lật camera</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.dark,
  },
  camera: {
    flex: 1,
  },
  text: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.base,
    textAlign: 'center',
    marginTop: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: AppSpacing.lg,
    paddingTop: 50,
  },
  closeButton: {
    backgroundColor: AppColors.background.modal,
    padding: AppSpacing.sm,
    borderRadius: AppBorderRadius.sm,
  },
  closeButtonText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.sm,
    fontWeight: AppTypography.fontWeight.semibold,
  },
  flipButton: {
    backgroundColor: AppColors.background.modal,
    padding: AppSpacing.sm,
    borderRadius: AppBorderRadius.sm,
  },
  flipButtonText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.sm,
    fontWeight: AppTypography.fontWeight.semibold,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.background.primary,
  },
  button: {
    backgroundColor: AppColors.primary.main,
    padding: AppSpacing.md,
    borderRadius: AppBorderRadius.md,
    marginTop: AppSpacing.lg,
    alignSelf: 'center',
  },
  buttonText: {
    color: AppColors.text.inverse,
    fontSize: AppTypography.fontSize.base,
    fontWeight: AppTypography.fontWeight.semibold,
  },
});

export default CameraCapture;
