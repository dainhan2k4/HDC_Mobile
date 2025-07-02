# Hướng dẫn sử dụng Alias trong Project

## Cấu hình đã hoàn thành

### 1. TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/screens/*": ["./src/screens/*"],
      "@/config/*": ["./src/config/*"],
      "@/types/*": ["./src/types/*"],
      "@/navigation/*": ["./src/navigation/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/assets/*": ["./assets/*"],
      "@/constants/*": ["./constants/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

### 2. Babel Configuration (babel.config.js)
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/config': './src/config',
            '@/types': './src/types',
            '@/navigation': './src/navigation',
            '@/hooks': './src/hooks',
            '@/assets': './assets',
            '@/constants': './constants',
            '@/utils': './src/utils',
          },
        },
      ],
    ],
  };
};
```

### 3. Metro Configuration (metro.config.js)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

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

module.exports = config;
```

## Cách sử dụng Alias

### Import từ thư mục src
```typescript
// ✅ Đúng - Sử dụng alias
import { apiService } from '@/config/api';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { FundCard } from '@/components/common/FundCard';

// ❌ Sai - Đường dẫn tương đối dài
import { apiService } from '../../config/api';
import { LoginScreen } from '../components/auth/LoginScreen';
```

### Import assets
```typescript
// ✅ Đúng - Sử dụng alias
import backgroundImage from '@/assets/images/background.jpg';
import logo from '@/assets/images/logo.png';

// ❌ Sai - Đường dẫn tương đối
import backgroundImage from '../../assets/images/background.jpg';
```

### Import constants
```typescript
// ✅ Đúng - Sử dụng alias
import { Colors } from '@/constants/Colors';

// ❌ Sai - Đường dẫn tương đối
import { Colors } from '../constants/Colors';
```

## Lưu ý quan trọng

### 1. Cấu trúc thư mục
- Alias `@/` trỏ đến thư mục `src/`
- Alias `@/components` trỏ đến `src/components/`
- Alias `@/assets` trỏ đến `assets/` (không phải src/assets)

### 2. Các file ngoài thư mục src
- Các file trong `components/` (không phải `src/components/`) cần sử dụng đường dẫn tương đối
- Các file trong `hooks/` (không phải `src/hooks/`) cần sử dụng đường dẫn tương đối
- Các file trong `constants/` (không phải `src/constants/`) cần sử dụng đường dẫn tương đối

### 3. Ví dụ sử dụng đúng
```typescript
// Trong file src/components/auth/LoginScreen.tsx
import { apiService } from '@/config/api';  // ✅ Đúng
import { Colors } from '@/constants/Colors'; // ✅ Đúng

// Trong file components/ThemedText.tsx
import { useThemeColor } from '../hooks/useThemeColor'; // ✅ Đúng
import { Colors } from '../constants/Colors'; // ✅ Đúng
```

## Troubleshooting

### Lỗi "Unable to resolve module"
1. Kiểm tra file có tồn tại không
2. Kiểm tra đường dẫn alias có đúng không
3. Restart Metro bundler: `yarn start --clear`

### Lỗi TypeScript
1. Kiểm tra tsconfig.json có đúng cấu hình không
2. Restart TypeScript server trong IDE
3. Chạy `yarn tsc --noEmit` để kiểm tra lỗi

## Restart sau khi cấu hình

Sau khi cấu hình alias, cần restart Metro bundler:

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại
yarn start --clear
```

Hoặc:

```bash
# Xóa cache và restart
yarn start --reset-cache
``` 