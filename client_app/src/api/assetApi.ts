import { apiService } from '../config/apiService';

// Get asset management - dùng middleware endpoint
export const getAssetManagement = async (): Promise<any> => {
  try {
    const response = await apiService.getAssetManagement();
    // Middleware trả về { success: true, data: {...} }
    return response.data || response;
  } catch (error) {
    console.error('Error fetching asset management data:', error);
    throw error;
  }
};