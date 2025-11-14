// Type declarations to fix React Native JSX component type errors with React 19
// This file helps TypeScript recognize React Native components as valid JSX elements

declare module 'react-native' {
  import { ComponentType, ReactElement } from 'react';
  
  export const View: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const Text: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const ActivityIndicator: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const TouchableOpacity: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const ScrollView: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const Modal: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const FlatList: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const TextInput: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const Switch: ComponentType<any> & {
    (props: any): ReactElement;
  };
  export const Alert: {
    alert: (...args: any[]) => void;
  };
  export const Dimensions: {
    get: (dimension: string) => { width: number; height: number };
    window: { width: number; height: number };
  };
  export const StyleSheet: any;
  export const Platform: any;
  export const Image: ComponentType<any> & {
    (props: any): ReactElement;
  };
}

