/**
 * Colors configuration for the app with light and dark mode support
 * Integrated with the new global theme system
 * Import AppTheme from '../src/styles/GlobalTheme' for more comprehensive theming
 */

import { AppColors } from '../src/styles/GlobalTheme';

// Tint colors for navigation and UI elements
const tintColorLight = AppColors.primary.main; // Orange from theme
const tintColorDark = AppColors.text.inverse;   // White

// Legacy Colors export for backward compatibility
export const Colors = {
  light: {
    text: AppColors.text.primary,
    background: AppColors.background.primary,
    tint: tintColorLight,
    icon: AppColors.text.secondary,
    tabIconDefault: AppColors.text.secondary,
    tabIconSelected: tintColorLight,
    // Additional colors from global theme
    primary: AppColors.primary.main,
    secondary: AppColors.secondary.main,
    success: AppColors.status.success,
    warning: AppColors.status.warning,
    error: AppColors.status.error,
    info: AppColors.status.info,
  },
  dark: {
    text: AppColors.text.inverse,
    background: AppColors.background.dark,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional colors from global theme (adjusted for dark mode)
    primary: AppColors.primary.light,
    secondary: AppColors.secondary.light,
    success: AppColors.status.success,
    warning: AppColors.status.warning,
    error: AppColors.status.error,
    info: AppColors.status.info,
  },
};

// Re-export AppColors for direct access to the full theme
export { AppColors, AppTheme } from '../src/styles/GlobalTheme';
export { default as GlobalStyles } from '../src/styles/GlobalStyles';
