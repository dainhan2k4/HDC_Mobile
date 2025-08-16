import { FundContractProps } from './fundcontract';

// Root Stack Types
export type RootStackParamList = {
  SignatureScene: FundContractProps;
  ContractViewer: { signature: string; signedHtml: string };
  Auth: undefined;
  Main: undefined;
  FundBuy: { fundId: number; fundName: string; currentNav?: number };
  FundSell: { fundId: number; fundName: string; currentUnits: number; currentNav?: number };
  EditProfile: undefined;
  Kyc: {
    userData: any;
    patch?: boolean;
    onNavigateTop?: () => void;
  };
};

// Auth Stack Types
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
};

// Main Tab Types
export type MainTabParamList = {
  Portfolio: undefined;
  Fund_widget: undefined;
  transaction_management: undefined;
  assetmanagement: undefined;
  personal_profile: undefined;
};

// Fund Stack Types
export type FundStackParamList = {
  FundList: undefined;
  FundDetail: { fundId: number };
  FundBuy: { fundId: number };
  FundSell: { fundId: number };
}; 