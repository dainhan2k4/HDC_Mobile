import axios, { AxiosInstance } from 'axios';

// Types
export interface KycUploadResult {
  result: {
    success: boolean;
    error?: string;
    // Front ID fields
    fullName?: string;
    name?: string;
    idNumber?: string;
    id?: string;
    dob?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    address?: string;
    birthplace?: string;
    // Back ID fields
    data?: {
      init_date?: string;
      issue_date?: string;
      expiry_date?: string;
      place_of_issue?: string;
      place?: string;
      version?: string;
    };
    version?: string;
  };
}

export interface KycProcessResult {
  success?: boolean;
  orientation?: string;
  detected_raw?: string;
  expected?: string;
  message?: string;
}

export interface KycFile {
  uri: string;
  type?: string;
  name?: string;
}

// eKYC API Configuration
const EKYC_CONFIG = {
  BASE_URL: 'http://192.168.1.4:8000', // eKYC service port - sử dụng IP thực tế
  TIMEOUT: 30000, // 30 seconds for image processing
  HEADERS: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
  },
};

// Create axios instance for eKYC service
const ekycAxios: AxiosInstance = axios.create({
  baseURL: EKYC_CONFIG.BASE_URL,
  timeout: EKYC_CONFIG.TIMEOUT,
  headers: EKYC_CONFIG.HEADERS,
});

/**
 * OCR CCCD mặt trước
 * @param frontFile - File ảnh mặt trước
 */
export const processKYCFrontID = async (frontFile: KycFile): Promise<KycUploadResult> => {
  console.log('🔍 ekycApi.processKYCFrontID called with:', frontFile);
  
  // Validate file object
  if (!frontFile) {
    throw new Error('Không có file ảnh');
  }
  
  if (!frontFile.uri && !frontFile.name) {
    throw new Error('File object không hợp lệ');
  }
  
  try {
    console.log('🌐 [eKYC] Using endpoint: /api/ekyc/frontID');
    console.log('🌐 [eKYC] Full URL:', `${EKYC_CONFIG.BASE_URL}/api/ekyc/frontID`);
    
    const formData = new FormData();
    const fileObject = {
      uri: frontFile.uri,
      type: frontFile.type || 'image/jpeg',
      name: frontFile.name || 'front_id.jpg'
    } as any;
    
    formData.append('frontID', fileObject);
    
    console.log('📤 [eKYC] FormData created:');
    console.log('📁 [eKYC] File object:', fileObject);
    console.log('📊 [eKYC] FormData created with frontID key');
    
    console.log('📤 [eKYC] Sending request to eKYC service...');
    const response = await ekycAxios.post('/api/ekyc/frontID', formData);
    console.log('📥 [eKYC] Response received:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [eKYC] Error processing front ID:', error);
    console.error('🔍 [eKYC] Error details:', {
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
 * @param backFile - File ảnh mặt sau
 */
export const processKYCBackID = async (backFile: KycFile): Promise<KycUploadResult> => {
  console.log('🔍 ekycApi.processKYCBackID called with:', backFile);
  
  // Validate file object
  if (!backFile) {
    throw new Error('Không có file ảnh');
  }
  
  if (!backFile.uri && !backFile.name) {
    throw new Error('File object không hợp lệ');
  }
  
  try {
    console.log('🌐 [eKYC] Using endpoint: /api/ekyc/backID');
    console.log('🌐 [eKYC] Full URL:', `${EKYC_CONFIG.BASE_URL}/api/ekyc/backID`);
    
    const formData = new FormData();
    formData.append('backID', {
      uri: backFile.uri,
      type: backFile.type || 'image/jpeg',
      name: backFile.name || 'back_id.jpg'
    } as any);

    console.log('📤 [eKYC] Sending request to eKYC service...');
    const response = await ekycAxios.post('/api/ekyc/backID', formData);
    console.log('📥 [eKYC] Response received:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [eKYC] Error processing back ID:', error);
    console.error('🔍 [eKYC] Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw new Error('Không thể xử lý CCCD mặt sau');
  }
};

/**
 * Phát hiện hướng khuôn mặt
 * @param frameFile - File ảnh khuôn mặt
 * @param expected - Hướng mong muốn
 */
export const detectKYCOrientation = async (frameFile: KycFile, expected: string): Promise<KycProcessResult> => {
  try {
    console.log('🌐 [eKYC] Using endpoint: /api/ekyc/detection');
    
    const formData = new FormData();
    formData.append('frame', {
      uri: frameFile.uri,
      type: frameFile.type || 'image/jpeg',
      name: frameFile.name || 'detection.jpg'
    } as any);
    formData.append('expected', expected);

    const response = await ekycAxios.post('/api/ekyc/detection', formData);
    return response.data;
  } catch (error: any) {
    console.error('❌ [eKYC] Error detecting orientation:', error);
    throw new Error('Không thể phát hiện hướng khuôn mặt');
  }
};

/**
 * eKYC hoàn chỉnh
 * @param portraitFiles - 7 file ảnh khuôn mặt
 * @param frontFile - File ảnh CCCD mặt trước
 */
export const processFullKYC = async (portraitFiles: KycFile[], frontFile: KycFile): Promise<KycProcessResult> => {
  try {
    console.log('🌐 [eKYC] Using endpoint: /api/ekyc-process');
    
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

    const response = await ekycAxios.post('/api/ekyc-process', formData);
    return response.data;
  } catch (error: any) {
    console.error('❌ [eKYC] Error processing full KYC:', error);
    throw new Error('Không thể xử lý eKYC hoàn chỉnh');
  }
};

/**
 * Health check cho eKYC service
 */
export const checkKYCHealth = async (): Promise<boolean> => {
  try {
    const response = await ekycAxios.get('/api/health-check');
    return response.status === 200;
  } catch (error) {
    console.error('❌ [eKYC] Health check failed:', error);
    return false;
  }
};
