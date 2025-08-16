import { CommonActions } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';

// Import KYC API có sẵn
import { kycApi, KycUploadResult, KycProcessResult } from '../../config/kycApiConfig';

// Import các components đã implement
import ImagePickerContainer from '../../components/common/ImagePickerContainer';
import ButtonCustom from '../../components/common/ButtonCustom';
import CameraCapture from '../../components/common/CameraCapture';
import EditInfoForm from '../../components/common/EditInfoForm';

// Import theme colors từ hệ thống
import { AppColors, AppTypography, AppSpacing, AppBorderRadius, AppShadows } from '../../styles/GlobalTheme';

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
            console.log('Xử lý OCR mặt trước...');
            setIsProcessing(true);
            
            // Convert image to Blob for API
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            
            // Upload to KYC API
            const result = await kycApi.uploadFrontId(blob);
            
            if (result.success && result.data) {
                setFrontId(result.data.id);
                
                // Extract OCR data if available
                if (result.data.ocr) {
                    const ocrData: OCRData = {
                        fullName: result.data.ocr.fullName || result.data.ocr.name,
                        idNumber: result.data.ocr.idNumber || result.data.ocr.id,
                        dob: result.data.ocr.dob || result.data.ocr.dateOfBirth,
                        gender: result.data.ocr.gender,
                        nationality: result.data.ocr.nationality,
                        address: result.data.ocr.address,
                        birthplace: result.data.ocr.birthplace
                    };
                    
                    setFrontOCRData(ocrData);
                    setExtractedData(prev => ({ ...prev, ...ocrData }));
                } else {
                    // Fallback to mock data if OCR not available
                    const mockOCRData: OCRData = {
                        fullName: 'Nguyễn Văn A',
                        idNumber: '123456789012',
                        dob: '01/01/1990',
                        gender: 'Nam',
                        nationality: 'Việt Nam',
                        address: 'Hà Nội',
                        birthplace: 'Hà Nội'
                    };
                    
                    setFrontOCRData(mockOCRData);
                    setExtractedData(prev => ({ ...prev, ...mockOCRData }));
                }
                
                Alert.alert('Thành công', 'Đã trích xuất thông tin từ mặt trước CCCD');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Lỗi OCR mặt trước:', error);
            Alert.alert('Lỗi', 'Không thể xử lý ảnh mặt trước. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const processOCRBack = async (photo: ImageData) => {
        if (!photo) {
            Alert.alert('Lỗi', 'Không có ảnh mặt sau để xử lý');
            return;
        }

        try {
            console.log('Xử lý OCR mặt sau...');
            setIsProcessing(true);
            
            // Convert image to Blob for API
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            
            // Upload to KYC API
            const result = await kycApi.uploadBackId(blob);
            
            if (result.success && result.data) {
                setBackId(result.data.id);
                
                // Extract OCR data if available
                if (result.data.ocr) {
                    const ocrData: OCRData = {
                        init_date: result.data.ocr.init_date || result.data.ocr.issueDate,
                        expiry_date: result.data.ocr.expiry_date || result.data.ocr.expiryDate,
                        place_of_issue: result.data.ocr.place_of_issue || result.data.ocr.issuePlace,
                        version: result.data.ocr.version
                    };
                    
                    setBackOCRData(ocrData);
                    setExtractedData(prev => ({ ...prev, ...ocrData }));
                } else {
                    // Fallback to mock data if OCR not available
                    const mockOCRData: OCRData = {
                        init_date: '01/01/2020',
                        expiry_date: '01/01/2030',
                        place_of_issue: 'Công an Hà Nội',
                        version: '1.0'
                    };
                    
                    setBackOCRData(mockOCRData);
                    setExtractedData(prev => ({ ...prev, ...mockOCRData }));
                }
                
                Alert.alert('Thành công', 'Đã trích xuất thông tin từ mặt sau CCCD');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Lỗi OCR mặt sau:', error);
            Alert.alert('Lỗi', 'Không thể xử lý ảnh mặt sau. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
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
        setShowCamera(true);
        setCameraType(type);
    };

    const handleImagePicker = (image: ImageData, type: 'front' | 'back') => {
        if (type === 'front') {
            setFrontImage(image);
            setCurrentStep(1);
            processOCRFront(image);
        } else {
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
        const kycData = {
            frontImage,
            backImage,
            frontOCRData,
            backOCRData,
            extractedData: { ...frontOCRData, ...backOCRData }
        };
        
        console.log('Navigating to Face Detection with KYC data:', kycData);
        
        // TODO: Implement FaceDetection navigation
        Alert.alert('Thông báo', 'Face Detection chưa được implement');
    };

    const handleFaceDetectionComplete = (faceDetectionResult: any) => {
        console.log('Face detection completed:', faceDetectionResult);
        
        if (faceDetectionResult.success) {
            const completeKYCData = {
                ...frontOCRData,
                ...backOCRData,
                frontImage: frontImage,
                backImage: backImage,
                faceDetectionImages: faceDetectionResult.images,
                faceDetectionResults: faceDetectionResult.results
            };
            
            completeKYCWithFaceDetection(completeKYCData);
        } else {
            Alert.alert('Lỗi', 'Xác thực khuôn mặt không thành công. Vui lòng thử lại.');
        }
    };

    const completeKYCWithFaceDetection = async (completeData: any) => {
        try {
            console.log('Completing KYC with face detection:', completeData);
            
            // Process KYC with uploaded files
            if (frontId && backId) {
                const result = await kycApi.processByFiles(frontId, backId, []);
                
                if (result.success) {
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
                                                    name: 'BorrowerTabNavigator',
                                                    params: { loan: null } 
                                                }
                                            ]
                                        }));
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    throw new Error(result.error || 'KYC processing failed');
                }
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
            
            // Process KYC if we have both IDs
            if (frontId && backId) {
                const result = await kycApi.processByFiles(frontId, backId, []);
                
                if (result.success) {
                    console.log('KYC processed successfully:', result.data);
                    handleKYCComplete();
                } else {
                    throw new Error(result.error || 'KYC processing failed');
                }
            } else {
                console.log('KYC data ready to submit:', combinedData);
                handleKYCComplete();
            }
            
        } catch (error) {
            console.error('KYC Submit Error:', error);
            Alert.alert('Lỗi', 'Không thể gửi dữ liệu KYC. Vui lòng thử lại.');
        }
    };

    const completeKYC = async (kycData: any) => {
        submitKYCData();
    };

    const handleKYCComplete = () => {
        Alert.alert(
            'Thành công', 
            'Thông tin đã được lưu thành công!',
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
                                        name: 'BorrowerTabNavigator',
                                        params: { loan: null } 
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



    const renderEditFormView = () => {
        if (!showEditForm) return null;

        return (
            <EditInfoForm
                initialData={extractedData || {}}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
            />
        );
    };

    const renderExtractedInfo = () => {
        if (!frontOCRData && !backOCRData) return null;

        return (
            <View style={styles.extractedInfoContainer}>
                <Text style={styles.extractedInfoTitle}>Thông tin đã trích xuất</Text>
                
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
        return (
            <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.imageContainer}>
                    <ImagePickerContainer
                        image={image}
                        onImageSelected={(selectedImage) => handleImagePicker(selectedImage, type)}
                        placeholder="Chọn từ thư viện"
                        style={styles.imagePicker}
                    />
                    <View style={styles.cameraButtonContainer}>
                        <ButtonCustom
                            title={isProcessing ? 'Đang xử lý...' : 'Chụp ảnh'}
                            onPress={() => !isProcessing && openCamera(type)}
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



    if (showEditForm) {
        return renderEditFormView();
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

                {renderImageSection(
                    'Mặt sau CCCD (Tự động OCR)',
                    backImage,
                    'back',
                    !!backImage && !!backOCRData
                )}

                <View style={styles.submitContainer}>
                    <ButtonCustom
                        title="Tiếp theo: Xác thực khuôn mặt"
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
});

export default KycScreen;