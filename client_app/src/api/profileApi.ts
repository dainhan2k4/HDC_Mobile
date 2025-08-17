import { apiService } from '../config/apiService';
import { ApiResponse } from '../types/api';

// Profile API functions theo api_current.md

export interface PersonalProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  nationality: number;
  id_type: string;
  id_number: string;
  id_issue_date: string;
  id_issue_place: string;
  verification_status: string;
  kyc_level: string;
}

export interface BankInfo {
  id: number;
  account_holder: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  branch: string;
  is_primary: boolean;
}

export interface AddressInfo {
  id: number;
  street: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postal_code: string;
}

// Personal Profile methods

// Get personal profile using /data_personal_profile
export const getPersonalProfile = async (): Promise<PersonalProfile[]> => {
  try {
    const response = await apiService.getProfile();
    return (response.data as PersonalProfile[]) || [];
  } catch (error) {
    console.error('Error fetching personal profile:', error);
    throw error;
  }
};

// Update personal profile using /save_personal_profile
export const updatePersonalProfile = async (data: {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  nationality: number;
  id_type: string;
  id_number: string;
  id_issue_date: string;
  id_issue_place: string;
  front_id_image?: string;
  back_id_image?: string;
}): Promise<ApiResponse> => {
  try {
    // Gửi đầy đủ dữ liệu theo yêu cầu của Odoo controller
    const mappedData = {
      name: data.name,
      phone: data.phone,
      birth_date: data.birth_date,
      gender: data.gender,
      nationality: data.nationality,
      id_type: data.id_type,
      id_number: data.id_number,
      id_issue_date: data.id_issue_date,
      id_issue_place: data.id_issue_place,
      id_front: data.front_id_image || '',
      id_back: data.back_id_image || ''
    };
    
    console.log('📤 [ProfileAPI] Sending personal profile data:', mappedData);
    console.log('🔍 [ProfileAPI] id_type in mappedData:', mappedData.id_type);
    console.log('🔍 [ProfileAPI] All keys in mappedData:', Object.keys(mappedData));
    const response = await apiService.post('/save_personal_profile', mappedData);
    return response;
  } catch (error) {
    console.error('Error updating personal profile:', error);
    throw error;
  }
};

// Bank Information methods

// Get bank information using /data_bank_info
export const getBankInfo = async (): Promise<BankInfo[]> => {
  try {
    const response = await apiService.getBankAccounts();
    return (response.data as BankInfo[]) || [];
  } catch (error) {
    console.error('Error fetching bank info:', error);
    throw error;
  }
};

// Update bank information using /save_bank_info
export const updateBankInfo = async (data: {
  account_holder: string;
  account_number: string;
  bank_name: string;
  branch: string;
}): Promise<ApiResponse> => {
  try {
    const response = await apiService.addBankAccount(data);
    return response;
  } catch (error) {
    console.error('Error updating bank info:', error);
    throw error;
  }
};

// Address Information methods

// Get address information using /data_address_info
export const getAddressInfo = async (): Promise<AddressInfo[]> => {
  try {
    const response = await apiService.getAddress();
    return (response.data as AddressInfo[]) || [];
  } catch (error) {
    console.error('Error fetching address info:', error);
    throw error;
  }
};

// Update address information using /save_address_info
export const updateAddressInfo = async (data: {
  street: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postal_code: string;
}): Promise<ApiResponse> => {
  try {
    const response = await apiService.updateAddress({
      street: data.street,
      city: data.city,
      state: data.district,
      zip_code: data.postal_code,
      country: data.country,
      address_type: 'permanent'
    });
    return response;
  } catch (error) {
    console.error('Error updating address info:', error);
    throw error;
  }
};

// Upload ID image using /upload_id_image
export const uploadIdImage = async (idFront: File, idBack: File): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id_front', idFront);
    formData.append('id_back', idBack);
    
    const response = await apiService.post('/upload_id_image', formData);
    return response;
  } catch (error) {
    console.error('Error uploading ID images:', error);
    throw error;
  }
};

// Save all profile data using /save_all_profile_data
export const saveAllProfileData = async (data: {
  personal_info: Partial<PersonalProfile>;
  bank_info: Partial<BankInfo>;
  address_info: Partial<AddressInfo>;
}): Promise<ApiResponse> => {
  try {
    const response = await apiService.verifyAccount({
      id_number: data.personal_info.id_number || '',
      id_type: data.personal_info.id_type || '',
      id_issue_date: data.personal_info.id_issue_date || '',
      id_issue_place: data.personal_info.id_issue_place || ''
    });
    return response;
  } catch (error) {
    console.error('Error saving all profile data:', error);
    throw error;
  }
}; 