const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Cấu hình alias paths tương thích với babel-plugin-module-resolver
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/screens': path.resolve(__dirname, 'src/screens'),
  '@/config': path.resolve(__dirname, 'src/config'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/navigation': path.resolve(__dirname, 'src/navigation'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/assets': path.resolve(__dirname, 'assets'),
  '@/constants': path.resolve(__dirname, 'constants'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
};

// Thêm extensions để hỗ trợ
config.resolver.extensions = [
  '.ios.ts',
  '.android.ts',
  '.ts',
  '.ios.tsx',
  '.android.tsx',
  '.tsx',
  '.jsx',
  '.js',
  '.json',
];

module.exports = config; 