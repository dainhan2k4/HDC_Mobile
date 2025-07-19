/**
 * GradientView Component
 * Component wrapper để sử dụng gradient dễ dàng trong toàn bộ app
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppGradients } from '../../styles/GlobalTheme';

interface GradientViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientType?: keyof typeof AppGradients;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientView: React.FC<GradientViewProps> = ({
  children,
  style,
  gradientType = 'primary',
  colors,
  start,
  end,
}) => {
  const gradient = AppGradients[gradientType];
  
  const gradientColors = colors || [...gradient.colors];
  
  return (
    <LinearGradient
      colors={gradientColors as any}
      start={start || gradient.start}
      end={end || gradient.end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export default GradientView;
