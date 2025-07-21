import React from 'react';
import { useRoute } from '@react-navigation/native';
import ContractViewer from '../../screens/contract/ContractViewer';

export const ContractViewerWrapper = () => {
  const route = useRoute();
  return <ContractViewer {...(route.params as any)} />;
}; 