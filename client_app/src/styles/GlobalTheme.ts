/**
 * Global Theme Configuration
 * Định nghĩa toàn bộ hệ thống màu sắc, gradient và theme cho ứng dụng
 */

// Màu sắc chính dựa trên hình ảnh
export const AppColors = {
  // Màu chính - Orange gradient như trong hình
  primary: {
    main: '#FF6B35',        // Orange chính
    light: '#FF8A65',       // Orange nhạt
    dark: '#E65100',        // Orange đậm
    gradient: ['#FF6B35', '#FF8A65', '#FFB74D'], // Gradient orange
  },
  
  // Màu phụ - Blue tones
  secondary: {
    main: '#2B4BFF',        // Blue chính
    light: '#36A2EB',       // Blue nhạt
    dark: '#1A237E',        // Blue đậm
    gradient: ['#2B4BFF', '#36A2EB', '#4FC3F7'], // Gradient blue
  },
  
  // Màu nền và surface
  background: {
    primary: '#FFFFFF',      // Nền trắng chính
    secondary: '#F8F9FA',    // Nền xám nhạt
    tertiary: '#F5F5F5',     // Nền xám
    dark: '#121212',         // Nền tối
    card: '#FFFFFF',         // Nền card
    modal: 'rgba(0, 0, 0, 0.5)', // Overlay modal
  },
  
  // Màu text
  text: {
    primary: '#1A1A1A',      // Text chính
    secondary: '#666666',    // Text phụ
    tertiary: '#999999',     // Text mờ
    inverse: '#FFFFFF',      // Text trên nền tối
    placeholder: '#CCCCCC',  // Placeholder text
  },
  
  // Màu trạng thái
  status: {
    success: '#4CAF50',      // Xanh lá - thành công
    warning: '#FF9800',      // Cam - cảnh báo
    error: '#F44336',        // Đỏ - lỗi
    info: '#2196F3',         // Xanh dương - thông tin
  },
  
  // Màu biểu đồ (cho PieChart và các chart khác)
  chart: [
    '#FF6B35',  // Orange chính
    '#2B4BFF',  // Blue chính
    '#4BC0C0',  // Xanh ngọc
    '#FFCE56',  // Vàng
    '#FF6384',  // Hồng
    '#9966FF',  // Tím
    '#36A2EB',  // Blue nhạt
    '#FF8A65',  // Orange nhạt
  ],
  
  // Màu border và divider
  border: {
    light: '#E0E0E0',        // Border nhạt
    medium: '#CCCCCC',       // Border trung bình
    dark: '#999999',         // Border đậm
  },
  
  // Màu shadow
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
  }
};

// Gradient definitions
export const AppGradients = {
  // Gradient chính - Orange 
  primary: {
    colors: ['#FF6B35', '#FF8A65'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Gradient phụ - Blue
  secondary: {
    colors: ['#2B4BFF', '#36A2EB'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Gradient cho button
  button: {
    colors: ['#FF6B35', '#FF8A65', '#FFB74D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  
  // Gradient cho header
  header: {
    colors: ['#FF6B35', '#FF8A65'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Gradient cho card
  card: {
    colors: ['#FFFFFF', '#F8F9FA'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  
  // Gradient tối
  dark: {
    colors: ['#2C2C2C', '#1A1A1A'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  }
} as const;

// Typography system
export const AppTypography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  }
};

// Spacing system
export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius system
export const AppBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadow system
export const AppShadows = {
  sm: {
    shadowColor: AppColors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: AppColors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: AppColors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: AppColors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 16,
  }
};

// Component styles
export const AppComponents = {
  // Button styles
  button: {
    primary: {
      backgroundColor: AppColors.primary.main,
      borderRadius: AppBorderRadius.md,
      paddingVertical: AppSpacing.md,
      paddingHorizontal: AppSpacing.lg,
      ...AppShadows.sm,
    },
    secondary: {
      backgroundColor: AppColors.secondary.main,
      borderRadius: AppBorderRadius.md,
      paddingVertical: AppSpacing.md,
      paddingHorizontal: AppSpacing.lg,
      ...AppShadows.sm,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: AppColors.primary.main,
      borderRadius: AppBorderRadius.md,
      paddingVertical: AppSpacing.md,
      paddingHorizontal: AppSpacing.lg,
    }
  },
  
  // Card styles
  card: {
    default: {
      backgroundColor: AppColors.background.card,
      borderRadius: AppBorderRadius.lg,
      padding: AppSpacing.md,
      ...AppShadows.sm,
    },
    elevated: {
      backgroundColor: AppColors.background.card,
      borderRadius: AppBorderRadius.lg,
      padding: AppSpacing.md,
      ...AppShadows.md,
    }
  },
  
  // Input styles
  input: {
    default: {
      backgroundColor: AppColors.background.primary,
      borderWidth: 1,
      borderColor: AppColors.border.light,
      borderRadius: AppBorderRadius.md,
      paddingVertical: AppSpacing.sm,
      paddingHorizontal: AppSpacing.md,
      fontSize: AppTypography.fontSize.base,
      color: AppColors.text.primary,
    },
    focused: {
      borderColor: AppColors.primary.main,
      ...AppShadows.sm,
    }
  }
};

// Theme configuration
export const AppTheme = {
  colors: AppColors,
  gradients: AppGradients,
  typography: AppTypography,
  spacing: AppSpacing,
  borderRadius: AppBorderRadius,
  shadows: AppShadows,
  components: AppComponents,
};

// Export default theme
export default AppTheme;
