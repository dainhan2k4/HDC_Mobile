/**
 * GradientButton Component
 * Button với gradient background theo theme
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { GradientView } from './GradientView';
import { AppTheme } from '../../styles/GlobalTheme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientType?: 'primary' | 'secondary' | 'button';
  disabled?: boolean;
  loading?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  gradientType = 'primary',
  disabled = false,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <GradientView
        gradientType={gradientType}
        style={StyleSheet.flatten([
          styles.gradient,
          disabled && styles.disabled
        ])}
      >
        <Text style={[styles.text, textStyle]}>
          {loading ? 'Đang xử lý...' : title}
        </Text>
      </GradientView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: AppTheme.borderRadius.md,
    overflow: 'hidden',
    ...AppTheme.shadows.sm,
  },
  gradient: {
    paddingVertical: AppTheme.spacing.md,
    paddingHorizontal: AppTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    color: AppTheme.colors.text.inverse,
    fontSize: AppTheme.typography.fontSize.base,
    fontWeight: AppTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;
