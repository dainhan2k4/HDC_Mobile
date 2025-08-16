import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import ButtonCustom from './ButtonCustom';
import { AppColors, AppTypography, AppSpacing, AppBorderRadius, AppShadows } from '../../styles/GlobalTheme';

interface OCRData {
  fullName?: string;
  idNumber?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  birthplace?: string;
  init_date?: string;
  expiry_date?: string;
  place_of_issue?: string;
  version?: string;
}

interface EditInfoFormProps {
  initialData: OCRData;
  onSave: (data: OCRData) => void;
  onCancel: () => void;
}

const EditInfoForm: React.FC<EditInfoFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<OCRData>(initialData);

  const updateField = (field: keyof OCRData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.fullName?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    if (!formData.idNumber?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số CCCD');
      return;
    }
    if (!formData.dob?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày sinh');
      return;
    }

    onSave(formData);
  };

  const renderField = (label: string, field: keyof OCRData, placeholder?: string) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={formData[field] || ''}
        onChangeText={(text) => updateField(field, text)}
        placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
        <Text style={styles.subtitle}>Kiểm tra và chỉnh sửa thông tin đã trích xuất</Text>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          {renderField('Họ tên', 'fullName', 'Nhập họ tên đầy đủ')}
          {renderField('Số CCCD', 'idNumber', 'Nhập số CCCD')}
          {renderField('Ngày sinh', 'dob', 'DD/MM/YYYY')}
          {renderField('Giới tính', 'gender', 'Nam/Nữ')}
          {renderField('Quốc tịch', 'nationality', 'Việt Nam')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          {renderField('Nơi thường trú', 'address', 'Nhập địa chỉ thường trú')}
          {renderField('Quê quán', 'birthplace', 'Nhập quê quán')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin CCCD</Text>
          {renderField('Ngày cấp', 'init_date', 'DD/MM/YYYY')}
          {renderField('Ngày hết hạn', 'expiry_date', 'DD/MM/YYYY')}
          {renderField('Nơi cấp', 'place_of_issue', 'Nhập nơi cấp CCCD')}
          {renderField('Phiên bản', 'version', 'Nhập phiên bản CCCD')}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <ButtonCustom
          title="Hủy"
          onPress={onCancel}
          variant="secondary"
          style={styles.cancelButton}
        />
        <ButtonCustom
          title="Lưu thông tin"
          onPress={handleSave}
          variant="primary"
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.tertiary,
  },
  header: {
    padding: AppSpacing.lg,
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.light,
  },
  title: {
    fontSize: AppTypography.fontSize.xl,
    fontWeight: AppTypography.fontWeight.bold,
    color: AppColors.text.primary,
    marginBottom: AppSpacing.sm,
  },
  subtitle: {
    fontSize: AppTypography.fontSize.sm,
    color: AppColors.text.secondary,
  },
  formContainer: {
    flex: 1,
    padding: AppSpacing.lg,
  },
  section: {
    backgroundColor: AppColors.background.primary,
    borderRadius: AppBorderRadius.md,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.md,
    ...AppShadows.sm,
  },
  sectionTitle: {
    fontSize: AppTypography.fontSize.base,
    fontWeight: AppTypography.fontWeight.bold,
    color: AppColors.text.primary,
    marginBottom: AppSpacing.md,
  },
  fieldContainer: {
    marginBottom: AppSpacing.md,
  },
  fieldLabel: {
    fontSize: AppTypography.fontSize.sm,
    fontWeight: AppTypography.fontWeight.semibold,
    color: AppColors.text.primary,
    marginBottom: AppSpacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppColors.border.light,
    borderRadius: AppBorderRadius.md,
    padding: AppSpacing.sm,
    fontSize: AppTypography.fontSize.base,
    backgroundColor: AppColors.background.primary,
    color: AppColors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: AppSpacing.lg,
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.light,
  },
  cancelButton: {
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: AppSpacing.sm,
  },
});

export default EditInfoForm;
