import { apiService } from '../config/apiService';

export const getAssetManagement = async (): Promise<any> => {
  try {
    // Use the dedicated helper which already attaches the session cookie and
    // points to the correct REST endpoint ("/asset/management").
    const response = await apiService.getAssetManagement();
    // Middleware có thể trả về hai định dạng:
    // 1) { success: true, data: {...} }
    // 2) { totalAssets: ..., holdings: ... }
    const data = (response as any)?.data !== undefined ? (response as any).data : response;
    return data;
  } catch (error) {
    console.error('Error fetching asset management data:', error);
    throw error;
  }
};