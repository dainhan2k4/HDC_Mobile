import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppColors, AppTypography, AppSpacing, AppBorderRadius } from '../../styles/GlobalTheme';

interface ButtonCustomProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger';
}

const ButtonCustom: React.FC<ButtonCustomProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  variant = 'primary'
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[variant]];
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${variant}Text`]];
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    }
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: {
    backgroundColor: AppColors.primary.main,
  },
  secondary: {
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.primary.main,
  },
  danger: {
    backgroundColor: AppColors.status.error,
  },
  disabled: {
    backgroundColor: AppColors.text.tertiary,
    opacity: 0.6,
  },
  text: {
    fontSize: AppTypography.fontSize.base,
    fontWeight: AppTypography.fontWeight.semibold,
  },
  primaryText: {
    color: AppColors.text.inverse,
  },
  secondaryText: {
    color: AppColors.primary.main,
  },
  dangerText: {
    color: AppColors.text.inverse,
  },
  disabledText: {
    color: AppColors.text.inverse,
  },
});

export default ButtonCustom;
