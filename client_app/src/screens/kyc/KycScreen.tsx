import { CommonActions } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, TextInput } from 'react-native';

// Import eKYC API mới - gọi trực tiếp đến eKYC service
import { 
    processKYCFrontID, 
    processKYCBackID, 
    detectKYCOrientation, 
    processFullKYC,
    KycFile,
    KycUploadResult,
    KycProcessResult
} from '../../api/ekycApi';

// Import các components đã implement
import ImagePickerContainer from '../../components/common/ImagePickerContainer';
import ButtonCustom from '../../components/common/ButtonCustom';
import CameraCapture from '../../components/common/CameraCapture';
import EditInfoForm from '../../components/common/EditInfoForm';

// Import theme colors từ hệ thống
import { AppColors, AppTypography, AppSpacing, AppBorderRadius, AppShadows } from '../../styles/GlobalTheme';

// Import API service
import { apiService } from '../../config/apiService';



interface KycScreenProps {
    navigation: any;
    route: any;
}

interface ImageData {
    uri: string;
    type?: string;
    name?: string;
}

interface OCRData {
    fullName?: string;
    idNumber?: string;
    dob?: string;
    gender?: string;
    nationality?: string;
    address?: string;
    birthplace?: string;
    init_date?: string;
    expiry_date?: string;
    place_of_issue?: string;
    version?: string;
    state_id?: string;
}

const KycScreen: React.FC<KycScreenProps> = ({ navigation, route }) => {
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
    const [frontImage, setFrontImage] = useState<ImageData | null>(null);
    const [backImage, setBackImage] = useState<ImageData | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [extractedData, setExtractedData] = useState<OCRData | null>(null);
    const [frontOCRData, setFrontOCRData] = useState<OCRData | null>(null);
    const [backOCRData, setBackOCRData] = useState<OCRData | null>(null);
    const [showOCR, setShowOCR] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [patch, setPatch] = useState<boolean>(false);
    const [onNavigateTop, setOnNavigateTop] = useState<(() => void) | null>(null);
    
    // KYC API states
    const [frontId, setFrontId] = useState<string | null>(null);
    const [backId, setBackId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    
    // Form data state
    const [formData, setFormData] = useState<OCRData>({
        fullName: '',
        idNumber: '',
        dob: '',
        gender: '',
        nationality: '',
        address: '',
        birthplace: '',
        init_date: '',
        expiry_date: '',
        place_of_issue: '',
        version: '',
        state_id: ''
    });

    useEffect(() => {
        const params = route?.params;
        if (params) {
            setPatch(params.patch || false);
            setOnNavigateTop(params.onNavigateTop || null);
        }
        
        // TODO: Implement loadKYCData khi có API
        if (params?.userData?.id) {
            loadKYCData(params.userData.id);
        }
    }, [route?.params]);

    const loadKYCData = async (userId: string) => {
        // TODO: Implement KYC API
        console.log('KYC API not implemented yet for user:', userId);
    };

    const handlePhotoTaken = (photo: ImageData) => {
        if (cameraType === 'front') {
            setFrontImage(photo);
            setShowCamera(false);
            setCurrentStep(1);
            processOCRFront(photo);
        } else {
            setBackImage(photo);
            setShowCamera(false);
            setCurrentStep(2);
            processOCRBack(photo);
        }
    };

    const processOCRFront = async (photo: ImageData) => {
        if (!photo) {
            Alert.alert('Lỗi', 'Không có ảnh mặt trước để xử lý');
            return;
        }

        try {
            console.log('🔍 [KYC] Bắt đầu xử lý OCR mặt trước...');
            console.log('📸 [KYC] Photo data:', {
                uri: photo.uri,
                type: photo.type,
                name: photo.name
            });
            
            setIsProcessing(true);
            
            // Convert image to Blob for API
            console.log('🔄 [KYC] Converting image to blob...');
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            console.log('✅ [KYC] Blob created:', {
                size: blob.size,
                type: blob.type
            });
            
            // Upload to KYC API
            console.log('🚀 [KYC] Calling processKYCFrontID...');
            const kycFile: KycFile = {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || 'front_id.jpg'
            };
            console.log('📁 [KYC] KYC File object:', kycFile);
            
            const result = await processKYCFrontID(kycFile);
            console.log('✅ [KYC] API Response:', result);
            
            // Kiểm tra response structure từ eKYC service
            if (result.result && result.result.error) {
                // OCR failed - show error
                const errorMessage = result.result.error || 'Không thể xử lý ảnh CCCD';
                console.log('❌ [KYC] OCR failed:', errorMessage);
                Alert.alert('Lỗi OCR', errorMessage);
                return;
            }
            
            // OCR thành công - extract data
            if (result.result && (result.result.fullName || result.result.idNumber || result.result.name)) {
                console.log('📄 [KYC] OCR data found:', result.result);
                const ocrData: OCRData = {
                    fullName: result.result.fullName || result.result.name || '',
                    idNumber: result.result.idNumber || result.result.id || '',
                    dob: result.result.dob || result.result.dateOfBirth || '',
                    gender: result.result.gender === "Nam" ? 'male' : 'female',
                    nationality: result.result.nationality || '',
                    address: result.result.address || '',
                    birthplace: result.result.birthplace || ''
                };
                
                console.log('📋 [KYC] Processed OCR data:', ocrData);
                setFrontOCRData(ocrData);
                setExtractedData(prev => ({ ...prev, ...ocrData }));
                
                // Tự động cập nhật form data với thông tin OCR
                setFormData((prevData: OCRData) => ({
                    ...prevData,
                    fullName: ocrData.fullName || '',
                    idNumber: ocrData.idNumber || '',
                    dob: ocrData.dob || '',
                    gender: ocrData.gender === 'male' ? 'Nam' : 'Nữ',
                    nationality: ocrData.nationality || '',
                    address: ocrData.address || '',
                    birthplace: ocrData.birthplace || '',
                    state_id: ocrData.state_id || ''
                }));
                
                console.log('✅ [KYC] Form data updated with OCR results');
                console.log('🎉 [KYC] OCR mặt trước hoàn thành thành công');
                Alert.alert('Thành công', 'Đã trích xuất thông tin từ mặt trước CCCD');
            } else {
                console.error('❌ [KYC] Unexpected response structure:', result);
                Alert.alert('Lỗi', 'Response không đúng định dạng từ server');
            }
        } catch (error: any) {
            console.error('❌ [KYC] Lỗi OCR mặt trước:', error);
            console.error('🔍 [KYC] Error details:', {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace',
                name: error?.name || 'Unknown error type'
            });
            
            // Log thêm thông tin về API call
            console.error('🌐 [KYC] API call failed for endpoint: http://192.168.1.4:8000/api/ekyc/frontID');
            console.error('📁 [KYC] Request data:', {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || 'front_id.jpg'
            });
            
            Alert.alert('Lỗi', 'Không thể xử lý ảnh mặt trước. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
            console.log('🏁 [KYC] Processing finished');
        }
    };

    const processOCRBack = async (photo: ImageData) => {
        if (!photo) {
            Alert.alert('Lỗi', 'Không có ảnh mặt sau để xử lý');
            return;
        }

        try {
            console.log('🔍 [KYC] Bắt đầu xử lý OCR mặt sau...');
            console.log('📸 [KYC] Photo data:', {
                uri: photo.uri,
                type: photo.type,
                name: photo.name
            });
            
            setIsProcessing(true);
            
            // Convert image to Blob for API
            console.log('🔄 [KYC] Converting image to blob...');
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            console.log('✅ [KYC] Blob created:', {
                size: blob.size,
                type: blob.type
            });
            
            // Upload to KYC API
            console.log('🚀 [KYC] Calling processKYCBackID...');
            const kycFile: KycFile = {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || 'back_id.jpg'
            };
            console.log('📁 [KYC] KYC File object:', kycFile);
            
            const result = await processKYCBackID(kycFile);
            console.log('✅ [KYC] API Response:', result);
            
            // Kiểm tra response structure từ eKYC service
            if (result.result && result.result.error) {
                // OCR failed - show error
                const errorMessage = result.result.error || 'Không thể xử lý ảnh CCCD';
                console.log('❌ [KYC] OCR failed:', errorMessage);
                Alert.alert('Lỗi OCR', errorMessage);
                return;
            }
            
            // OCR thành công - extract data
            if (result.result && result.result.data) {
                console.log('📄 [KYC] OCR data found:', result.result.data);
                const ocrData: OCRData = {
                    init_date: result.result.data.init_date || result.result.data.issue_date || '',
                    expiry_date: result.result.data.expiry_date || '',
                    place_of_issue: result.result.data.place_of_issue || result.result.data.place || '',
                    version: result.result.data.version || result.result.version || ''
                };
                
                console.log('📋 [KYC] Processed OCR data:', ocrData);
                setBackOCRData(ocrData);
                setExtractedData(prev => ({ ...prev, ...ocrData }));
                
                // Tự động cập nhật form data với thông tin OCR mặt sau
                setFormData((prevData: OCRData) => ({
                    ...prevData,
                    init_date: ocrData.init_date || '',
                    expiry_date: ocrData.expiry_date || '',
                    place_of_issue: ocrData.place_of_issue || '',
                    version: ocrData.version || ''
                }));
                
                console.log('✅ [KYC] Form data updated with back OCR results');
                console.log('🎉 [KYC] OCR mặt sau hoàn thành thành công');
                Alert.alert('Thành công', 'Đã trích xuất thông tin từ mặt sau CCCD');
            } else {
                console.error('❌ [KYC] Unexpected response structure:', result);
                Alert.alert('Lỗi', 'Response không đúng định dạng từ server');
            }
        } catch (error: any) {
            console.error('❌ [KYC] Lỗi OCR mặt sau:', error);
            console.error('🔍 [KYC] Error details:', {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace',
                name: error?.name || 'Unknown error type'
            });
            
            // Log thêm thông tin về API call
            console.error('🌐 [KYC] API call failed for endpoint: http://192.168.1.4:8000/api/ekyc/backID');
            console.error('📁 [KYC] Request data:', {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || 'back_id.jpg'
            });
            
            Alert.alert('Lỗi', 'Không thể xử lý ảnh mặt sau. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
            console.log('🏁 [KYC] Processing finished');
        }
    };

    const handleOCRComplete = (extractedData: OCRData) => {
        console.log('OCR Complete với data:', extractedData);
        
        setExtractedData(extractedData);
        setShowOCR(false);
        
        console.log('Hiển thị form chỉnh sửa...');
        handleShowEditForm();
    };

    const handleShowEditForm = () => {
        console.log('showEditForm được gọi');
        setShowEditForm(true);
    };

    const handleEditSave = (updatedData: OCRData) => {
        setExtractedData(updatedData);
        setShowEditForm(false);
        
        // Sau khi lưu thông tin OCR, chuyển sang face detection
        startFaceDetection();
    };

    const startFaceDetection = () => {
        // Navigate to face detection screen
        navigation.navigate('FaceDetection' as never, {
            kycData: extractedData,
            onComplete: handleFaceDetectionComplete
        } as never);
    };

    const handleFaceDetectionComplete = (result: any) => {
        console.log('Face detection completed:', result);
        
        // Sau khi hoàn thành face detection, submit KYC data
        submitKYCData();
    };

    const handleEditCancel = () => {
        setShowEditForm(false);
    };

    const confirmExtractedData = () => {
        if (!extractedData) {
            Alert.alert('Lỗi', 'Không có dữ liệu để xác nhận');
            return;
        }

        setCurrentStep(1);
        Alert.alert('Thành công', 'Thông tin đã được xác nhận. Vui lòng chụp ảnh mặt sau CCCD.');
    };

    const openCamera = (type: 'front' | 'back') => {
        console.log('🔍 [KYC] openCamera called with type:', type);
        
        // Đảm bảo type luôn có giá trị hợp lệ
        const validType = type === 'front' || type === 'back' ? type : 'front';
        
        console.log('🔍 [KYC] Setting camera type to:', validType);
        setShowCamera(true);
        setCameraType(validType);
    };

    const handleImagePicker = (image: ImageData, type: 'front' | 'back') => {
        console.log('🔍 [KYC] handleImagePicker called with type:', type);
        
        // Đảm bảo type luôn có giá trị hợp lệ
        const validType = type === 'front' || type === 'back' ? type : 'front';
        
        if (validType === 'front') {
            console.log('🔍 [KYC] Processing front image');
            setFrontImage(image);
            setCurrentStep(1);
            processOCRFront(image);
        } else {
            console.log('🔍 [KYC] Processing back image');
            setBackImage(image);
            setCurrentStep(2);
            processOCRBack(image);
        }
    };

    const handleSubmit = () => {
        if (!frontImage || !backImage) {
            Alert.alert('Thông báo', 'Vui lòng chụp đầy đủ ảnh mặt trước và sau của CCCD');
            return;
        }

        if (!frontOCRData || !backOCRData) {
            Alert.alert('Thông báo', 'Vui lòng hoàn thành OCR cho cả hai mặt CCCD');
            return;
        }

        navigateToFaceDetection();
    };

    const navigateToFaceDetection = () => {
        // Chuyển sang face detection
        startFaceDetection();
    };

    // Function này đã được thay thế bằng function mới ở trên

    const completeKYCWithFaceDetection = async (completeData: any) => {
        try {
            console.log('Completing KYC with face detection:', completeData);
            
            // Process KYC with uploaded files
            if (frontId && backId) {
                // Convert images to KycFile format
                const portraitFiles: KycFile[] = [];
                
                const result = await processFullKYC(portraitFiles, {
                    uri: frontImage?.uri || '',
                    type: frontImage?.type || 'image/jpeg',
                    name: frontImage?.name || 'front_id.jpg'
                });
                
                Alert.alert(
                    'Thành công!', 
                    'Đã hoàn thành xác thực KYC và khuôn mặt!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (patch) {
                                    if (onNavigateTop) {
                                        onNavigateTop();
                                    }
                                    navigation.popToTop();
                                } else {
                                    navigation.dispatch(CommonActions.reset({
                                        index: 0,
                                        routes: [
                                            { 
                                                name: 'Main',
                                                params: {} 
                                            }
                                        ]
                                    }));
                                }
                            }
                        }
                    ]
                );
            } else {
                throw new Error('Missing front or back ID');
            }
        } catch (error) {
            console.error('Complete KYC Error:', error);
            Alert.alert('Lỗi', 'Không thể hoàn thành KYC. Vui lòng thử lại.');
        }
    };

    const submitKYCData = async () => {
        try {
            const combinedData = {
                ...frontOCRData,
                ...backOCRData,
                frontImageUri: frontImage?.uri,
                backImageUri: backImage?.uri
            };
            
            console.log('Submitting KYC data:', combinedData);
            
            // Lưu thông tin KYC vào hệ thống database
            console.log('💾 [KYC] Saving KYC data to database...');
            
            // Gọi saveKYCUserData để lưu vào database
            await saveKYCUserData(combinedData);
            console.log('✅ [KYC] Data saved to database successfully');
            
            // Process KYC if we have both IDs
            if (frontId && backId) {
                // Convert images to KycFile format
                const portraitFiles: KycFile[] = [];
                
                const result = await processFullKYC(portraitFiles, {
                    uri: frontImage?.uri || '',
                    type: frontImage?.type || 'image/jpeg',
                    name: frontImage?.name || 'front_id.jpg'
                });
                
                console.log('KYC processed successfully:', result);
                handleKYCCompleteLocal();
            } else {
                console.log('KYC data ready to submit:', combinedData);
                handleKYCComplete();
            }
            
        } catch (error: any) {
            console.error('KYC Submit Error:', error);
            
            // Kiểm tra nếu lỗi là do database constraint
            const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi không xác định';
            console.log('🔍 [KYC] Error message:', errorMessage);
            
            // Hiển thị thông báo lỗi cụ thể
            Alert.alert(
                'Lỗi lưu dữ liệu', 
                `Không thể lưu dữ liệu KYC vào hệ thống.\n\nChi tiết lỗi: ${errorMessage}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`,
                [
                    {
                        text: 'Thử lại',
                        onPress: () => {
                            console.log('🔄 [KYC] User requested retry');
                            // Có thể thêm logic retry ở đây
                        }
                    },
                    {
                        text: 'Hủy',
                        style: 'cancel'
                    }
                ]
            );
        }
    };

               // Lưu thông tin KYC vào hệ thống
           const saveKYCUserData = async (kycData: any) => {
               try {
                   console.log('🔄 [KYC] Đang lưu thông tin người dùng...');
                   
                   // Kiểm tra xem có profile hiện tại không
                   console.log('🔍 [KYC] Checking existing profile...');
                   try {
                       const existingProfile = await apiService.get('/profile/data_personal_profile');
                       console.log('✅ [KYC] Existing profile found:', existingProfile.data);
                       
                       // Nếu có profile, chỉ update
                       if (existingProfile.data && Array.isArray(existingProfile.data) && existingProfile.data.length > 0) {
                           console.log('📝 [KYC] Updating existing profile...');
                       } else {
                           console.log('🆕 [KYC] No existing profile, will create new one...');
                       }
                   } catch (profileError) {
                       console.log('⚠️ [KYC] Could not check existing profile:', profileError);
                   }
                   
                   // Sử dụng formData đã được cập nhật từ OCR
                   const userData = {
                       name: formData.fullName || kycData.fullName || 'Chưa cập nhật',
                       id_number: formData.idNumber || kycData.idNumber || 'Chưa cập nhật',
                       birth_date: formData.dob || kycData.dob || '2000-01-01', // Default date
                       gender: formData.gender === 'male' ? 'Nam' : 'Nữ', // Default gender
                       nationality: 1, // Default Vietnam ID
                       id_type: 'id_card', // Default ID type
                       id_issue_date: formData.init_date || kycData.init_date || '2000-01-01', // Default date
                       id_issue_place: formData.place_of_issue || kycData.place_of_issue || 'Chưa cập nhật',
                       address: formData.address || kycData.address || 'Chưa cập nhật',
                       birthplace: formData.birthplace || kycData.birthplace || 'Chưa cập nhật',
                       id_expiry_date: formData.expiry_date || kycData.expiry_date || '2030-01-01', // Default expiry
                       kyc_status: 'completed',
                       kyc_completed_at: new Date().toISOString(),
                       front_id_image: kycData.frontImageUri || '',
                       back_id_image: kycData.backImageUri || '',
                       state_id: kycData.state_id || ''
                   };
            
            console.log('📋 [KYC] User data to save:', userData);
            
                               // Validate dữ liệu trước khi gửi - đảm bảo tất cả field required có giá trị
                   const validatedData = Object.fromEntries(
                       Object.entries(userData).map(([key, value]) => {
                           if (value === null || value === undefined || value === '') {
                               switch (key) {
                                   case 'nationality':
                                       return [key, 1]; // Vietnam ID
                                   case 'gender':
                                       return [key, 'male']; // Default gender
                                   case 'id_type':
                                       return [key, 'id_card']; // Default ID type
                                   case 'birth_date':
                                   case 'id_issue_date':
                                       return [key, '2000-01-01']; // Default date
                                   case 'id_expiry_date':
                                       return [key, '2030-01-01']; // Default expiry
                                   default:
                                       return [key, 'Chưa cập nhật'];
                               }
                           }
                           return [key, value];
                       })
                   );
            
            console.log('✅ [KYC] Validated data:', validatedData);
            
                               // Đảm bảo nationality không bao giờ null - sử dụng ID thay vì string
                   const finalData = {
                       ...validatedData,
                       nationality: typeof validatedData.nationality === 'number' ? validatedData.nationality : 1
                   };
            
                               // Debug: Kiểm tra từng field trước khi gửi
                   console.log('🔍 [KYC] Debug nationality field:', {
                       original: kycData.nationality,
                       processed: userData.nationality,
                       validated: validatedData.nationality,
                       final: finalData.nationality,
                       type: typeof finalData.nationality
                   });
                   
                   // Debug: Kiểm tra tất cả field required
                   
            
            console.log('🎯 [KYC] Final data to send:', finalData);
            
                   // Gọi API để lưu thông tin cá nhân
                   console.log('🔄 [KYC] Saving personal profile data to DATABASE...');
                   
                   // Debug: Kiểm tra userData trước khi tạo dataToSend
                   
                   
                   // Debug: Kiểm tra dữ liệu trước khi gửi
                   const dataToSend = {
                       name: userData.name,
                       phone: "1234567890", // Sẽ được cập nhật sau
                       birth_date: userData.birth_date,
                       gender: userData.gender,
                       nationality: userData.nationality,
                       id_type: 'id_card', // Hardcode để đảm bảo có giá trị
                       id_number: userData.id_number,
                       id_issue_date: userData.id_issue_date,
                       id_issue_place: userData.id_issue_place,
                       front_id_image: userData.front_id_image,
                       back_id_image: userData.back_id_image
                   };
                   
                   console.log('🔍 [KYC] Data to send to API:', JSON.stringify(dataToSend, null, 2));
                   
                   try {
                       const { updatePersonalProfile } = await import('../../api/profileApi');
                       const saveResult = await updatePersonalProfile(dataToSend);
                       console.log('✅ [KYC] Personal profile saved successfully to DATABASE');
                       console.log('🔍 [KYC] Save result:', saveResult);
                       
                       // Clear cache and verify data was saved
                       console.log('🔄 [KYC] Clearing cache and verifying saved data...');
                       await clearCacheAndVerify();
                       
                   } catch (saveError) {
                       console.error('❌ [KYC] Failed to save personal profile to DATABASE:', saveError);
                       // Throw error để ngắt flow nếu không lưu được database
                       throw saveError;
                   }
            
                               // Gọi API để lưu thông tin địa chỉ
                   console.log('🏠 [KYC] Saving address data to database...');
                   
                   const addressData = {
                       street: kycData.address || 'Chưa cập nhật',
                       ward: 'Chưa cập nhật',
                       district: 'Chưa cập nhật',
                       province: 'Chưa cập nhật',
                       is_default: true
                   };
                   
                   console.log('📦 [KYC] Address data to send:', JSON.stringify(addressData, null, 2));
                   
                   
            
            console.log('🎉 [KYC] Thông tin người dùng đã được lưu vào DATABASE thành công!');
            
            // Cập nhật trạng thái KYC trong context nếu cần
            updateKYCStatus();
            
                           } catch (error: any) {
                       console.error('❌ [KYC] Error saving user data:', error);
                       console.error('🔍 [KYC] Error details:', {
                           message: error?.message,
                           status: error?.response?.status,
                           data: error?.response?.data
                       });
                       
                       // Hiển thị thông báo lỗi cụ thể cho người dùng
                       const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi không xác định';
                       console.log('⚠️ [KYC] Lỗi lưu dữ liệu:', errorMessage);
                       
                       // Log lỗi và throw để người dùng biết có vấn đề với database
                       console.log('❌ [KYC] Database save failed with error:', errorMessage);
                       throw error;
                   }
    };

    // Function to clear cache and verify data was actually saved
    const clearCacheAndVerify = async () => {
        try {
            // Wait a bit for save to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('🧹 [KYC] Clearing cache to force fresh data...');
            // Add cache busting query param
            const timestamp = Date.now();
            
            console.log('🔍 [KYC] Fetching fresh data to verify...');
            const response = await apiService.get(`/profile/data_personal_profile?_t=${timestamp}`);
            
            console.log('📋 [KYC] Retrieved fresh data:', response.data);
            
            if (response.data && response.data.length > 0) {
                const profile = response.data[0];
                console.log('✅ [KYC] Data verification successful! Found profile:', {
                    name: profile.name,
                    id_number: profile.id_number,
                    phone: profile.phone,
                    birth_date: profile.birth_date,
                    id_type: profile.id_type
                });
                
                // Check if it's the new KYC data
                if (profile.id_number === formData.idNumber || profile.name === formData.fullName) {
                    console.log('🎉 [KYC] NEW KYC DATA CONFIRMED! Successfully saved to database!');
                } else {
                    console.log('⚠️ [KYC] Old data still showing - save might not have worked');
                }
            } else {
                console.log('⚠️ [KYC] No profile data found after save - potential issue!');
            }
        } catch (verifyError) {
            console.error('❌ [KYC] Failed to verify saved data:', verifyError);
        }
    };

    const completeKYC = async (kycData: any) => {
        submitKYCData();
    };

    const handleKYCComplete = () => {
        Alert.alert(
            '🎉 KYC Hoàn thành!', 
            'Xác thực KYC đã hoàn thành thành công! Thông tin cá nhân đã được lưu vào DATABASE. Bạn có thể sử dụng đầy đủ các tính năng của ứng dụng.',
            [
                {
                    text: 'Tuyệt vời!',
                    onPress: () => {
                        if (patch) {
                            if (onNavigateTop) {
                                onNavigateTop();
                            }
                            navigation.popToTop();
                        } else {
                            navigation.dispatch(CommonActions.reset({
                                index: 0,
                                routes: [
                                    { 
                                        name: 'Main',
                                        params: {} 
                                    }
                                ]
                            }));
                        }
                    }
                }
            ]
        );
    };

    const handleKYCCompleteLocal = () => {
        Alert.alert(
            '🎉 KYC Hoàn thành!', 
            'Xác thực KYC đã hoàn thành thành công! Thông tin đã được lưu vào thiết bị. Bạn có thể sử dụng đầy đủ các tính năng của ứng dụng.',
            [
                {
                    text: 'Tuyệt vời!',
                    onPress: () => {
                        if (patch) {
                            if (onNavigateTop) {
                                onNavigateTop();
                            }
                            navigation.popToTop();
                        } else {
                            navigation.dispatch(CommonActions.reset({
                                index: 0,
                                routes: [
                                    { 
                                        name: 'Main',
                                        params: {} 
                                    }
                                ]
                            }));
                        }
                    }
                }
            ]
        );
    };

    const renderCameraView = () => {
        if (!showCamera) return null;

        return (
            <CameraCapture
                onPhotoTaken={handlePhotoTaken}
                onClose={() => setShowCamera(false)}
                cameraType={cameraType}
            />
        );
    };

    // Form chỉnh sửa thông tin OCR
    const renderEditForm = () => {
        if (!showEditForm || !extractedData) return null;

        return (
            <View style={styles.editFormContainer}>
                <View style={styles.editFormHeader}>
                    <Text style={styles.editFormTitle}>Chỉnh sửa thông tin</Text>
                    <TouchableOpacity onPress={handleEditCancel} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.editFormContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Họ và tên</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.fullName}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, fullName: text }))}
                            placeholder="Nhập họ và tên"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Số CCCD</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.idNumber}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, idNumber: text }))}
                            placeholder="Nhập số CCCD"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Ngày sinh</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.dob}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, dob: text }))}
                            placeholder="DD/MM/YYYY"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Giới tính</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.gender === 'male' ? 'Nam' : 'Nữ'}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, gender: text === 'Nam' ? 'male' : 'female' }))}
                            placeholder="Nam/Nữ"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Quốc tịch</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.nationality}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, nationality: text }))}
                            placeholder="Việt Nam"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Địa chỉ</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={extractedData.address}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, address: text }))}
                            placeholder="Nhập địa chỉ"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nơi sinh</Text>
                        <TextInput
                            style={styles.textInput}
                            value={extractedData.birthplace}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, birthplace: text }))}
                            placeholder="Nhập nơi sinh"
                        />
                    </View>

                    {extractedData.init_date && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ngày cấp</Text>
                            <TextInput
                                style={styles.textInput}
                                value={extractedData.init_date}
                                onChangeText={(text) => setExtractedData(prev => ({ ...prev, init_date: text }))}
                                placeholder="DD/MM/YYYY"
                            />
                        </View>
                    )}

                    {extractedData.expiry_date && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ngày hết hạn</Text>
                            <TextInput
                                style={styles.textInput}
                                value={extractedData.expiry_date}
                                onChangeText={(text) => setExtractedData(prev => ({ ...prev, expiry_date: text }))}
                                placeholder="DD/MM/YYYY"
                            />
                        </View>
                    )}

                    {extractedData.place_of_issue && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nơi cấp</Text>
                            <TextInput
                                style={styles.textInput}
                                value={extractedData.place_of_issue}
                                onChangeText={(text) => setExtractedData(prev => ({ ...prev, place_of_issue: text }))}
                                placeholder="Nhập nơi cấp"
                            />
                        </View>
                    )}
                </ScrollView>

                <View style={styles.editFormActions}>
                    <TouchableOpacity onPress={handleEditCancel} style={[styles.actionButton, styles.cancelButton]}>
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditSave(extractedData)} style={[styles.actionButton, styles.saveButton]}>
                        <Text style={styles.saveButtonText}>Lưu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderExtractedInfo = () => {
        if (!frontOCRData && !backOCRData) return null;

        return (
            <View style={styles.extractedInfoContainer}>
                <Text style={styles.extractedInfoTitle}>Thông tin đã trích xuất</Text>
                
                {/* Nút hiển thị form data đã được cập nhật */}
                <TouchableOpacity 
                    style={styles.viewFormButton}
                    onPress={() => {
                        console.log('📋 [KYC] Current form data:', formData);
                        Alert.alert(
                            'Thông tin Form',
                            `Họ tên: ${formData.fullName || 'Chưa có'}\n` +
                            `Số CCCD: ${formData.idNumber || 'Chưa có'}\n` +
                            `Ngày sinh: ${formData.dob || 'Chưa có'}\n` +
                            `Giới tính: ${formData.gender || 'Chưa có'}\n` +
                            `Quốc tịch: ${formData.nationality || 'Chưa có'}\n` +
                            `Địa chỉ: ${formData.address || 'Chưa có'}\n` +
                            `Quê quán: ${formData.birthplace || 'Chưa có'}\n` +
                            `Ngày cấp: ${formData.init_date || 'Chưa có'}\n` +
                            `Nơi cấp: ${formData.place_of_issue || 'Chưa có'}\n` +
                            `Ngày hết hạn: ${formData.expiry_date || 'Chưa có'}`
                        );
                    }}
                >
                    <Text style={styles.viewFormButtonText}>Xem thông tin đã cập nhật</Text>
                </TouchableOpacity>
                
                {frontOCRData && (
                    <View style={styles.ocrSection}>
                        <Text style={styles.ocrSectionTitle}>Mặt trước CCCD</Text>
                        {frontOCRData.fullName && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Họ tên:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.fullName}</Text>
                            </View>
                        )}
                        {frontOCRData.idNumber && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Số CCCD:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.idNumber}</Text>
                            </View>
                        )}
                        {frontOCRData.dob && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Ngày sinh:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.dob}</Text>
                            </View>
                        )}
                        {frontOCRData.gender && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Giới tính:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.gender}</Text>
                            </View>
                        )}
                        {frontOCRData.nationality && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Quốc tịch:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.nationality}</Text>
                            </View>
                        )}
                        {frontOCRData.address && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Nơi thường trú:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.address}</Text>
                            </View>
                        )}
                        {frontOCRData.birthplace && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Quê quán:</Text>
                                <Text style={styles.extractedInfoValue}>{frontOCRData.birthplace}</Text>
                            </View>
                        )}
                    </View>
                )}

                {backOCRData && (
                    <View style={styles.ocrSection}>
                        <Text style={styles.ocrSectionTitle}>Mặt sau CCCD</Text>
                        {backOCRData.init_date && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Ngày cấp:</Text>
                                <Text style={styles.extractedInfoValue}>{backOCRData.init_date}</Text>
                            </View>
                        )}
                        {backOCRData.expiry_date && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Ngày hết hạn:</Text>
                                <Text style={styles.extractedInfoValue}>{backOCRData.expiry_date}</Text>
                            </View>
                        )}
                        {backOCRData.place_of_issue && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Nơi cấp:</Text>
                                <Text style={styles.extractedInfoValue}>{backOCRData.place_of_issue}</Text>
                            </View>
                        )}
                        {backOCRData.version && (
                            <View style={styles.extractedInfoRow}>
                                <Text style={styles.extractedInfoLabel}>Phiên bản:</Text>
                                <Text style={styles.extractedInfoValue}>{backOCRData.version}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.editButtonContainer}>
                    <ButtonCustom
                        title="Chỉnh sửa thông tin"
                        onPress={handleShowEditForm}
                        variant="secondary"
                        style={styles.editButton}
                    />
                </View>
            </View>
        );
    };

    const renderImageSection = (title: string, image: ImageData | null, type: 'front' | 'back', isCompleted: boolean) => {
        console.log('🔍 [KYC] renderImageSection called with:', { title, type, isCompleted });
        
        // Đảm bảo type luôn có giá trị hợp lệ
        const validType = type === 'front' || type === 'back' ? type : 'front';
        
        return (
            <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.imageContainer}>
                    <ImagePickerContainer
                        image={image}
                        onImageSelected={(selectedImage) => handleImagePicker(selectedImage, validType)}
                        placeholder="Chọn từ thư viện"
                        style={styles.imagePicker}
                    />
                    <View style={styles.cameraButtonContainer}>
                        <ButtonCustom
                            title={isProcessing ? 'Đang xử lý...' : 'Chụp ảnh'}
                            onPress={() => {
                                console.log('🔍 [KYC] Camera button pressed for type:', validType);
                                if (!isProcessing) {
                                    openCamera(validType);
                                }
                            }}
                            disabled={isProcessing}
                            variant="primary"
                            style={styles.cameraButton}
                        />
                    </View>
                </View>
                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>Hoàn thành</Text>
                    </View>
                )}
            </View>
        );
    };

    if (showCamera) {
        return renderCameraView();
    }

    // Cập nhật trạng thái KYC trong context
    const updateKYCStatus = () => {
        try {
            console.log('🔄 [KYC] Cập nhật trạng thái KYC...');
            
            // Có thể thêm logic để cập nhật context hoặc global state ở đây
            // Ví dụ: cập nhật user context với trạng thái KYC mới
            
            console.log('✅ [KYC] Trạng thái KYC đã được cập nhật');
        } catch (error) {
            console.error('❌ [KYC] Error updating KYC status:', error);
        }
    };



    if (showEditForm) {
        return renderEditForm();
    }

    return (
        <View style={styles.container}>
            {/* TODO: Implement HeaderTransparent component */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Xác thực KYC</Text>
            </View>
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Chụp ảnh CCCD</Text>
                    <Text style={styles.subtitle}>
                        Chụp đầy đủ ảnh mặt trước và sau CCCD để tự động nhập thông tin
                    </Text>
                </View>

                {renderExtractedInfo()}

                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, frontOCRData && styles.progressDotActive]} />
                        <Text style={styles.progressText}>Mặt trước + OCR</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, backOCRData && styles.progressDotActive]} />
                        <Text style={styles.progressText}>Mặt sau + OCR</Text>
                    </View>
                </View>

                {renderImageSection(
                    'Mặt trước CCCD',
                    frontImage,
                    'front',
                    !!frontOCRData
                )}

                {(() => {
                    console.log('🔍 [KYC] Rendering back image section');
                    return renderImageSection(
                        'Mặt sau CCCD (Tự động OCR)',
                        backImage,
                        'back',
                        !!backImage && !!backOCRData
                    );
                })()}

                <View style={styles.submitContainer}>
                    <ButtonCustom
                        title="Hoàn thành KYC (Bypass Face Detection)"
                        onPress={handleSubmit}
                        disabled={!(frontOCRData && backOCRData)}
                        variant="primary"
                        style={styles.submitButton}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 30,
        flex: 1,
        backgroundColor: AppColors.background.tertiary,
    },
    header: {
        alignItems: 'center',
        marginBottom: AppSpacing.lg,
        paddingTop: AppSpacing.md,
    },
    headerTitle: {
        fontSize: AppTypography.fontSize.xl,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.text.primary,
    },

    content: {
        flex: 1,
        padding: AppSpacing.md,
    },
    title: {
        fontSize: AppTypography.fontSize.xl,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.text.primary,
        marginBottom: AppSpacing.sm,
    },
    subtitle: {
        fontSize: AppTypography.fontSize.sm,
        color: AppColors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: AppSpacing.xl,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: AppColors.text.tertiary,
        marginBottom: AppSpacing.xs,
    },
    progressDotActive: {
        backgroundColor: AppColors.primary.main,
    },
    progressText: {
        fontSize: AppTypography.fontSize.xs,
        color: AppColors.text.secondary,
    },
    progressLine: {
        width: 60,
        height: 2,
        backgroundColor: AppColors.text.tertiary,
        marginHorizontal: AppSpacing.md,
    },
    imageSection: {
        marginBottom: AppSpacing.lg,
    },
    sectionTitle: {
        fontSize: AppTypography.fontSize.sm,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.text.primary,
        marginBottom: AppSpacing.md,
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    imagePicker: {
        flex: 1,
        marginRight: AppSpacing.md,
    },
    cameraButtonContainer: {
        width: 100,
    },
    cameraButton: {
        width: 100,
    },
    completedBadge: {
        backgroundColor: AppColors.status.success,
        paddingHorizontal: AppSpacing.sm,
        paddingVertical: AppSpacing.xs,
        borderRadius: AppBorderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: AppSpacing.sm,
    },
    completedText: {
        color: AppColors.text.inverse,
        fontSize: AppTypography.fontSize.xs,
        fontWeight: AppTypography.fontWeight.bold,
    },
    submitContainer: {
        marginTop: AppSpacing.xl,
        marginBottom: AppSpacing.lg,
    },
    submitButton: {
        width: '100%',
    },

    extractedInfoContainer: {
        backgroundColor: AppColors.background.primary,
        borderRadius: AppBorderRadius.md,
        padding: AppSpacing.md,
        marginBottom: AppSpacing.lg,
        ...AppShadows.md,
    },
    extractedInfoTitle: {
        fontSize: AppTypography.fontSize.lg,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.text.primary,
        marginBottom: AppSpacing.sm,
    },
    extractedInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: AppSpacing.xs,
    },
    extractedInfoLabel: {
        fontSize: AppTypography.fontSize.xs,
        color: AppColors.text.secondary,
        fontWeight: AppTypography.fontWeight.bold,
    },
    extractedInfoValue: {
        fontSize: AppTypography.fontSize.xs,
        color: AppColors.text.primary,
        fontWeight: AppTypography.fontWeight.bold,
    },
    ocrSection: {
        backgroundColor: AppColors.background.secondary,
        borderRadius: AppBorderRadius.sm,
        padding: AppSpacing.sm,
        marginBottom: AppSpacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: AppColors.status.success,
    },
    ocrSectionTitle: {
        fontSize: AppTypography.fontSize.sm,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.status.success,
        marginBottom: AppSpacing.xs,
    },
    editButtonContainer: {
        marginTop: AppSpacing.md,
        alignItems: 'center',
    },
    editButton: {
        width: '100%',
    },

    // New styles for edit form
    editFormContainer: {
        backgroundColor: AppColors.background.primary,
        borderRadius: AppBorderRadius.md,
        padding: AppSpacing.md,
        paddingTop: AppSpacing['3xl'],
        marginBottom: AppSpacing.lg,
        ...AppShadows.md,
    },
    editFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: AppSpacing.sm,
    },
    editFormTitle: {
        fontSize: AppTypography.fontSize.lg,
        fontWeight: AppTypography.fontWeight.bold,
        color: AppColors.text.primary,
    },
    closeButton: {
        padding: AppSpacing.xs,
    },
    closeButtonText: {
        fontSize: AppTypography.fontSize.lg,
        color: AppColors.text.secondary,
    },
    editFormContent: {
        marginBottom: AppSpacing.md,
    },
    inputGroup: {
        marginBottom: AppSpacing.md,
    },
    inputLabel: {
        fontSize: AppTypography.fontSize.xs,
        color: AppColors.text.secondary,
        fontWeight: AppTypography.fontWeight.bold,
        marginBottom: AppSpacing.xs,
    },
    textInput: {
        borderWidth: 1,
        borderColor: AppColors.border.light,
        borderRadius: AppBorderRadius.sm,
        padding: AppSpacing.sm,
        fontSize: AppTypography.fontSize.xs,
        color: AppColors.text.primary,
    },
    textArea: {
        minHeight: 80,
        paddingTop: AppSpacing.sm,
    },
    editFormActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: AppSpacing.md,
    },
    actionButton: {
        paddingVertical: AppSpacing.sm,
        paddingHorizontal: AppSpacing.md,
        borderRadius: AppBorderRadius.sm,
    },
    cancelButton: {
        backgroundColor: AppColors.status.error,
    },
    cancelButtonText: {
        color: AppColors.text.inverse,
        fontSize: AppTypography.fontSize.xs,
        fontWeight: AppTypography.fontWeight.bold,
    },
    saveButton: {
        backgroundColor: AppColors.primary.main,
    },
    saveButtonText: {
        color: AppColors.text.inverse,
        fontSize: AppTypography.fontSize.xs,
        fontWeight: AppTypography.fontWeight.bold,
    },
    viewFormButton: {
        backgroundColor: AppColors.primary.main,
        padding: AppSpacing.sm,
        borderRadius: AppBorderRadius.sm,
        marginBottom: AppSpacing.sm,
        alignItems: 'center',
    },
    viewFormButtonText: {
        color: AppColors.text.inverse,
        fontSize: AppTypography.fontSize.sm,
        fontWeight: AppTypography.fontWeight.bold,
    },
});

export default KycScreen;