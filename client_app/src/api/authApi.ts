import { apiService } from '../config/apiService';
import { ApiResponse } from '../types/api';

// Authentication API functions

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  token?: string;
  session_id?: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface OtpResponse {
  success: boolean;
  otp?: string;
  message?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// Login using /web/session/authenticate
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiService.login(email, password);
    return response as LoginResponse;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Signup with OTP using /web/signup/otp
export const signup = async (userData: SignupData): Promise<OtpResponse> => {
  try {
    const response = await apiService.signup(userData);
    return response as OtpResponse;
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
};

// Request OTP for email using /web/signup/otp
export const requestOtp = async (email: string): Promise<OtpResponse> => {
  try {
    const response = await apiService.requestSignupOtp(email);
    return response as OtpResponse;
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
};

// Verify OTP using /web/signup/verify-otp
export const verifyOtp = async (email: string, otp: string): Promise<OtpResponse> => {
  try {
    const response = await apiService.verifyOtp(email, otp);
    return response as OtpResponse;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Reset password using /web/reset_password
export const resetPassword = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await apiService.resetPassword(email);
    return response;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Refresh token using /web/session/refresh
export const refreshToken = async (): Promise<ApiResponse> => {
  try {
    const response = await apiService.refreshAccessToken();
    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

