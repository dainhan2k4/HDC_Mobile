import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { detectKYCOrientation } from '../../api/ekycApi';

// Các hướng cần phát hiện cho liveness
const DETECTION_STEPS = [
    { direction: 'center', instruction: 'Nhìn thẳng vào camera' },
    { direction: 'left', instruction: 'Quay mặt sang trái' },
    { direction: 'right', instruction: 'Quay mặt sang phải' },
    { direction: 'up', instruction: 'Ngước mặt lên trên' },
    { direction: 'center', instruction: 'Nhìn thẳng vào camera' }
];

const FaceDetectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const cameraRef = useRef<any>(null);
    const autoTimerRef = useRef<any>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [capturedFrames, setCapturedFrames] = useState<any[]>([]);
    const [detectionResults, setDetectionResults] = useState<any[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [lastDetectionTime, setLastDetectionTime] = useState(0);
    const [showCamera, setShowCamera] = useState(true);
    const [capturedImages, setCapturedImages] = useState<any[]>([]);
    
    // Use refs to avoid closure issues
    const currentStepRef = useRef(currentStep);
    const isProcessingRef = useRef(isProcessing);
    const isCompletedRef = useRef(isCompleted);


    useEffect(() => {
        console.log('FaceDetection mounted');
        
        // Lấy dữ liệu KYC từ navigation params
        const params = route?.params as any;
        if (params?.kycData) {
            console.log('Received KYC data:', params.kycData);
        }

        // Request camera permission
        requestCameraPermission();

        return () => {
            // Cleanup timer
            if (autoTimerRef.current) {
                clearInterval(autoTimerRef.current);
            }
            console.log('FaceDetection unmounted');
        };
    }, []);
    
    // Update refs when state changes
    useEffect(() => {
        currentStepRef.current = currentStep;
    }, [currentStep]);
    
    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);
    
    useEffect(() => {
        isCompletedRef.current = isCompleted;
    }, [isCompleted]);

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        // Start timer-based auto capture
        if (status === 'granted') {
            setTimeout(() => {
                startTimerCapture();
            }, 2000);
        }
    };

    const getCurrentStep = useCallback(() => {
        return DETECTION_STEPS[currentStepRef.current] || DETECTION_STEPS[0];
    }, []);

    const startTimerCapture = () => {
        console.log('Starting timer-based auto capture...');
        setFaceDetected(true); // Assume face always present
        
        autoTimerRef.current = setInterval(() => {
            if (!isProcessingRef.current && !isCompletedRef.current) {
                console.log('⏰ Timer triggered - auto capturing...');
                console.log(`📊 [DEBUG] Current state: isProcessing=${isProcessingRef.current}, isCompleted=${isCompletedRef.current}, currentStep=${currentStepRef.current}`);
                captureFrameForDetection();
            } else {
                console.log(`⏸️ Timer skipped: isProcessing=${isProcessingRef.current}, isCompleted=${isCompletedRef.current}`);
            }
        }, 4000); // Capture every 4 seconds
    };

    const captureFrameForDetection = async () => {
        if (!cameraRef.current || isProcessingRef.current || isCompletedRef.current) {
            return;
        }

        try {
            console.log('📸 Auto capturing frame for detection...');
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                skipProcessing: true
            });

            processDetection(photo);
        } catch (error) {
            console.log('Auto capture error:', error);
        }
    };

    const processDetection = async (photo: any) => {
        if (isProcessingRef.current) return;

        setIsProcessing(true);

        try {
            const currentStepObj = getCurrentStep();
            console.log(`🔍 [DEBUG] Current step: ${currentStepRef.current}, Direction: ${currentStepObj.direction}`);
            console.log(`Real API detection cho bước ${currentStepRef.current + 1}: ${currentStepObj.direction}`);

            // Gọi API detect orientation thực tế
            const result = await detectKYCOrientation(photo, currentStepObj.direction);
            console.log('API Detection result:', result);

            // Kiểm tra kết quả detection - giống logic file mẫu
            if (result && result.success) {
                console.log(`✅ Detected correct orientation: ${currentStepObj.direction} -> ${result.orientation}`);
                console.log(`📈 [DEBUG] Before moveToNextStep: currentStep=${currentStepRef.current}`);
                
                // Lưu frame thành công
                const newCapturedFrames = [...capturedFrames, photo];
                const newDetectionResults = [...detectionResults, result];

                setCapturedFrames(newCapturedFrames);
                setDetectionResults(newDetectionResults);

                // Chuyển sang bước tiếp theo
                moveToNextStep();
            } else {
                console.log(`❌ Incorrect orientation: Expected ${currentStepObj.direction}, Got ${result?.orientation || 'none'}`);
                console.log(`${result?.message || 'Keep trying...'}`);
                setIsProcessing(false);
            }
        } catch (error) {
            console.log('Face detection API error:', error);
            setIsProcessing(false);
        }
    };

    const moveToNextStep = () => {
        const nextStep = currentStepRef.current + 1;
        console.log(`🔄 [DEBUG] Moving from step ${currentStepRef.current} to step ${nextStep}`);
        
        if (nextStep >= DETECTION_STEPS.length) {
            console.log(`✅ [DEBUG] All steps completed!`);
            // Hoàn thành tất cả bước - dừng timer
            if (autoTimerRef.current) {
                clearInterval(autoTimerRef.current);
                autoTimerRef.current = null;
            }
            
            setIsCompleted(true);
            setIsProcessing(false);
            
            handleDetectionComplete();
        } else {
            // Chuyển sang bước tiếp theo
            console.log(`➡️ [DEBUG] Moving to next step: ${nextStep} (${DETECTION_STEPS[nextStep].direction})`);
            setCurrentStep(nextStep);
            setIsProcessing(false);
        }
    };

    const handleDetectionComplete = () => {
        Alert.alert(
            'Hoàn thành!',
            'Đã hoàn thành tất cả các bước xác thực khuôn mặt.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        // Lấy callback từ navigation params
                        const params = route?.params as any;
                        const onComplete = params?.onComplete;
                        
                        // Callback với kết quả
                        if (onComplete) {
                            onComplete({
                                images: capturedFrames,
                                results: detectionResults,
                                success: true
                            });
                        }
                        
                        // Quay về màn hình trước
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const resetDetection = () => {
        setCurrentStep(0);
        setIsProcessing(false);
        setShowCamera(true);
        setCapturedImages([]);
        setDetectionResults([]);
        setIsCompleted(false);
        setFaceDetected(false);
        
        // Restart timer capture - giống logic file mẫu
        if (autoTimerRef.current) {
            clearInterval(autoTimerRef.current);
        }
        setTimeout(() => {
            startTimerCapture();
        }, 1000);
    };



    const renderInstructions = () => {
        const currentStepObj = getCurrentStep();
        const progress = ((currentStep + 1) / DETECTION_STEPS.length) * 100;

        return (
            <View style={styles.instructionsContainer}>
                <Text style={styles.stepCounter}>
                    Bước {currentStep + 1}/{DETECTION_STEPS.length}
                </Text>
                
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                
                <Text style={styles.instruction}>
                    {currentStepObj.instruction}
                </Text>
                
                {isProcessing && (
                    <Text style={styles.processingText}>
                        Đang xử lý...
                    </Text>
                )}
            </View>
        );
    };

    const renderCompletedView = () => {
        return (
            <View style={styles.completedContainer}>
                <Text style={styles.completedTitle}>✅ Hoàn thành!</Text>
                <Text style={styles.completedText}>
                    Đã hoàn thành {DETECTION_STEPS.length} bước xác thực khuôn mặt
                </Text>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={resetDetection}
                    >
                        <Text style={styles.resetButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.completeButton]}
                        onPress={handleDetectionComplete}
                    >
                        <Text style={styles.completeButtonText}>Hoàn thành</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderCameraView = () => {
        if (hasPermission === null) {
            return (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Đang yêu cầu quyền camera...</Text>
                </View>
            );
        }

        if (hasPermission === false) {
            return (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Không có quyền truy cập camera</Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestCameraPermission}
                    >
                        <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                >
                    {/* Vòng tròn focus overlay */}
                    <View style={styles.focusOverlay}>
                        <View style={styles.focusCircle}>
                            <View style={[
                                styles.focusRing,
                                faceDetected && styles.focusRingDetected,
                                isProcessing && styles.focusRingProcessing
                            ]} />
                        </View>
                        
                        {/* Corner guides */}
                        <View style={styles.cornerGuides}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        
                        {/* Status indicators */}
                        {!faceDetected && !isProcessing && (
                            <View style={styles.statusIndicator}>
                                <Text style={styles.statusText}>👤 Đặt mặt vào khung</Text>
                            </View>
                        )}
                        
                        {faceDetected && !isProcessing && (
                            <View style={[styles.statusIndicator, styles.faceDetectedIndicator]}>
                                <Text style={styles.statusText}>✅ Đã phát hiện khuôn mặt</Text>
                            </View>
                        )}
                        
                        {isProcessing && (
                            <View style={[styles.statusIndicator, styles.processingIndicator]}>
                                <Text style={styles.statusText}>🔄 Đang xử lý...</Text>
                            </View>
                        )}
                    </View>
                </CameraView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xác thực khuôn mặt</Text>
                <View style={styles.headerSpacer} />
            </View>
            
            {isCompleted ? (
                renderCompletedView()
            ) : (
                <>
                    {renderInstructions()}
                    {renderCameraView()}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    instructionsContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stepCounter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 8,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    instruction: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    processingText: {
        fontSize: 16,
        color: '#007AFF',
        fontStyle: 'italic',
    },
    cameraContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 20,
    },
    permissionText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    focusOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusRing: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 3,
        borderColor: '#fff',
        opacity: 0.8,
    },
    focusRingDetected: {
        borderColor: '#FFD700',
        opacity: 1,
    },
    focusRingProcessing: {
        borderColor: '#4CAF50',
        opacity: 1,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    cornerGuides: {
        position: 'absolute',
        width: 220,
        height: 220,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#fff',
        opacity: 0.6,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 30,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    faceDetectedIndicator: {
        backgroundColor: 'rgba(255,215,0,0.9)',
    },
    processingIndicator: {
        backgroundColor: 'rgba(76,175,80,0.9)',
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    completedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    completedTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 16,
    },
    completedText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        flex: 1,
        marginHorizontal: 8,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#FF3B30',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    completeButton: {
        backgroundColor: '#007AFF',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

});

export default FaceDetectionScreen;
