import { apiService } from '../config/apiService';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * OCR Service - Clean và đơn giản
 */

// Types
export interface KycUploadResult {
  id: string;
  ocr?: Record<string, any>;
  detection?: any;
}

export interface KycProcessResult {
  request_id: string;
  status?: 'pending' | 'approved' | 'rejected';
  result?: Record<string, any>;
}

export interface KycFile {
  uri: string;
  type?: string;
  name?: string;
}

/**
 * OCR CCCD mặt trước
 * @param {KycFile} frontFile - File ảnh mặt trước
 */
export const processKYCFrontID = async (frontFile: KycFile): Promise<KycUploadResult> => {
  console.log('🔍 kycApi.processKYCFrontID called with:', frontFile);
  
  // Validate file object
  if (!frontFile) {
    throw new Error('Không có file ảnh');
  }
  
  if (!frontFile.uri && !frontFile.name) {
    throw new Error('File object không hợp lệ');
  }
  
  try {
    console.log('🌐 [KYC] Using endpoint:', API_ENDPOINTS.KYC.FRONT_ID);
    console.log('🌐 [KYC] Full URL will be:', `${apiService['axiosInstance'].defaults.baseURL}${API_ENDPOINTS.KYC.FRONT_ID}`);
    
    const formData = new FormData();
    formData.append('file', {
      uri: frontFile.uri,
      type: frontFile.type || 'image/jpeg',
      name: frontFile.name || 'front_id.jpg'
    } as any);

    console.log('📤 [KYC] Sending request to API...');
    const response = await apiService.post<KycUploadResult>(API_ENDPOINTS.KYC.FRONT_ID, formData);
    console.log('📥 [KYC] API Response received:', response);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('❌ [KYC] API returned error:', response.error);
      throw new Error(response.error || 'Không thể xử lý CCCD mặt trước');
    }
  } catch (error: any) {
    console.error('❌ [KYC] Error processing front ID:', error);
    console.error('🔍 [KYC] Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw new Error('Không thể xử lý CCCD mặt trước');
  }
};

/**
 * OCR CCCD mặt sau
 * @param {KycFile} backFile - File ảnh mặt sau
 */
export const processKYCBackID = async (backFile: KycFile): Promise<KycUploadResult> => {
  console.log('🔍 kycApi.processKYCBackID called with:', backFile);
  
  // Validate file object
  if (!backFile) {
    throw new Error('Không có file ảnh');
  }
  
  if (!backFile.uri && !backFile.name) {
    throw new Error('File object không hợp lệ');
  }
  
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: backFile.uri,
      type: backFile.type || 'image/jpeg',
      name: backFile.name || 'back_id.jpg'
    } as any);

    const response = await apiService.post<KycUploadResult>(API_ENDPOINTS.KYC.BACK_ID, formData);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Không thể xử lý CCCD mặt sau');
    }
  } catch (error) {
    console.error('Error processing back ID:', error);
    throw new Error('Không thể xử lý CCCD mặt sau');
  }
};

/**
 * Phát hiện hướng khuôn mặt
 * @param {KycFile} frameFile - File ảnh khuôn mặt
 * @param {string} expected - Hướng mong muốn
 */
export const detectKYCOrientation = async (frameFile: KycFile, expected: string): Promise<KycProcessResult> => {
  const result = await processKYCOrientationInternal(frameFile, expected);
  return result;
};

/**
 * Internal function for orientation detection
 */
const processKYCOrientationInternal = async (frameFile: KycFile, expected: string): Promise<KycProcessResult> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: frameFile.uri,
      type: frameFile.type || 'image/jpeg',
      name: frameFile.name || 'detection.jpg'
    } as any);
    formData.append('expected', expected);

    const response = await apiService.post<KycProcessResult>(API_ENDPOINTS.KYC.DETECTION, formData);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Không thể phát hiện hướng khuôn mặt');
    }
  } catch (error) {
    console.error('Error detecting orientation:', error);
    throw new Error('Không thể phát hiện hướng khuôn mặt');
  }
};

/**
 * eKYC hoàn chỉnh
 * @param {Array} portraitFiles - 7 file ảnh khuôn mặt
 * @param {KycFile} frontFile - File ảnh CCCD mặt trước
 */
export const processFullKYC = async (portraitFiles: KycFile[], frontFile: KycFile): Promise<KycProcessResult> => {
  const result = await processFullKYCInternal(portraitFiles, frontFile);
  return result;
};

/**
 * Internal function for full KYC processing
 */
const processFullKYCInternal = async (portraitFiles: KycFile[], frontFile: KycFile): Promise<KycProcessResult> => {
  try {
    const formData = new FormData();
    
    // Thêm file CCCD mặt trước
    formData.append('front_id', {
      uri: frontFile.uri,
      type: frontFile.type || 'image/jpeg',
      name: frontFile.name || 'front_id.jpg'
    } as any);

    // Thêm các file ảnh khuôn mặt
    portraitFiles.forEach((file, index) => {
      formData.append(`portraits[${index}]`, {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `portrait-${index}.jpg`
      } as any);
    });

    const response = await apiService.post<KycProcessResult>(API_ENDPOINTS.KYC.PROCESS, formData);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Không thể xử lý eKYC hoàn chỉnh');
    }
  } catch (error) {
    console.error('Error processing full KYC:', error);
    throw new Error('Không thể xử lý eKYC hoàn chỉnh');
  }
};

/**
 * Submit complete KYC data (CCCD OCR + Face Detection)
 * @param {Object} completeData - Dữ liệu KYC đầy đủ
 */
export const submitCompleteKYC = async (completeData: any) => {
  console.log('Submitting complete KYC data:', completeData);
  
  // Tạm thời return success - có thể implement API call thực tế sau
  return {
    success: true,
    message: 'KYC data submitted successfully',
    data: completeData
  };
  
  // TODO: Implement actual API call
  // const result = await KYCApi.submitCompleteKYC(completeData);
  // return result;
};

export const KycApi = {
  processKYCFrontID,
  processKYCBackID,
  detectKYCOrientation,
  processFullKYC,
  submitCompleteKYC
};