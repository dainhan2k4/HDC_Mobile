/** @odoo-module **/

import { Component, useState, mount, onMounted, xml } from "@odoo/owl";

// Constants
const OTP_CONFIG = {
    LENGTH: 6,
    FOCUS_DELAY_MS: 100,
    INPUT_MOVE_DELAY_MS: 0,
    INPUT_SELECTOR: '.smart-otp-input',
    DIGIT_REGEX: /^\d$/,
    NON_DIGIT_REGEX: /[^0-9]/g,
    TIMEOUT_SECONDS: 60,
    TIMER_INTERVAL_MS: 1000,
};

const MESSAGES = {
    TITLE_SMART: 'Xác thực Smart OTP',
    TITLE_SMS_EMAIL: 'Xác thực OTP',
    DESCRIPTION_SMART: 'Vui lòng kiểm tra mã Smart OTP trên ứng dụng SSI Iboard Pro',
    DESCRIPTION_SMS_EMAIL: 'Vui lòng nhập mã OTP đã được gửi qua SMS hoặc Email',
    INSTRUCTION_TITLE: 'Hướng dẫn:',
    INSTRUCTION_STEP_1_SMART: 'Mở ứng dụng SSI Iboard Pro trên điện thoại của bạn',
    INSTRUCTION_STEP_1_SMS_EMAIL: 'Kiểm tra SMS hoặc Email để lấy mã OTP',
    INSTRUCTION_STEP_2_SMART: 'Kiểm tra mã Smart OTP (6 chữ số)',
    INSTRUCTION_STEP_2_SMS_EMAIL: 'Lấy mã OTP 6 chữ số từ SMS hoặc Email',
    INSTRUCTION_STEP_3: 'Nhập mã OTP vào các ô bên dưới',
    LABEL_INPUT: 'Nhập mã OTP',
    BUTTON_CANCEL: 'Hủy',
    BUTTON_CONFIRM: 'Xác nhận',
    BUTTON_PROCESSING: 'Đang xử lý...',
    ERROR_INVALID_OTP: 'Mã OTP không hợp lệ',
    ERROR_INCOMPLETE_OTP: 'Vui lòng nhập đầy đủ 6 số OTP',
    TIMER_PREFIX: 'Thời gian còn lại:',
    TIMER_SUFFIX: 'giây',
};

const APP_NAME = 'SSI Iboard Pro';

export class SmartOtpModal extends Component {
    static template = xml`
        <div t-if="props.show">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold"><t t-esc="getTitle()"/></h3>
                            <button type="button" class="text-white hover:text-gray-200 transition-colors" t-on-click="onClose">
                                <i class="fas fa-times text-lg"></i>
                            </button>
                        </div>
                        <p class="text-blue-100 mt-2"><t t-esc="getDescription()"/></p>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6">
                        <!-- Instruction -->
                        <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p class="text-sm text-gray-700 mb-2">
                                <strong><t t-esc="messages.INSTRUCTION_TITLE"/></strong>
                            </p>
                            <ol class="text-sm text-gray-600 list-decimal list-inside space-y-1">
                                <li><t t-esc="getInstructionStep1()"/></li>
                                <li><t t-esc="getInstructionStep2()"/></li>
                                <li><t t-esc="messages.INSTRUCTION_STEP_3"/></li>
                            </ol>
                        </div>
                        
                        <!-- OTP Input -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3"><t t-esc="messages.LABEL_INPUT"/></label>
                            <div class="flex gap-2 justify-center">
                                <t t-foreach="otpIndices" t-as="i" t-key="i">
                                    <input 
                                        type="text" 
                                        maxlength="1" 
                                        class="smart-otp-input w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
                                        t-att-data-index="i"
                                        t-att-value="state.otpCodes[i]"
                                        t-on-input="onOTPInput"
                                        t-on-keydown="onOTPKeydown"
                                    />
                                </t>
                            </div>
                            <p class="text-red-500 text-sm mt-2" t-att-class="{hidden: !state.error}">
                                <t t-esc="state.error"/>
                            </p>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="flex gap-3">
                            <button type="button" class="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" t-on-click="onClose">
                                <i class="fas fa-times mr-2"></i>
                                <t t-esc="messages.BUTTON_CANCEL"/>
                            </button>
                            <button 
                                type="button" 
                                class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                t-att-disabled="!isValid() || state.loading"
                                t-on-click="onVerify"
                            >
                                <i class="fas fa-check mr-2"></i>
                                <t t-if="state.loading"><t t-esc="messages.BUTTON_PROCESSING"/></t>
                                <t t-else=""><t t-esc="messages.BUTTON_CONFIRM"/></t>
                            </button>
                        </div>
                        
                        <!-- Loading -->
                        <div class="mt-4 text-center" t-att-class="{hidden: !state.loading}">
                            <div class="inline-flex items-center text-blue-600">
                                <i class="fas fa-spinner fa-spin mr-2"></i>
                                <t t-esc="messages.BUTTON_PROCESSING"/>
                            </div>
                        </div>
                        
                        <!-- Timer -->
                        <div class="mt-4 text-center" t-att-class="{hidden: state.loading}">
                            <div class="inline-flex items-center text-gray-600 text-sm">
                                <i class="fas fa-clock mr-2"></i>
                                <t t-esc="messages.TIMER_PREFIX"/>
                                <span class="font-bold text-blue-600 ml-1" t-esc="state.timer"/>
                                <span class="ml-1" t-esc="messages.TIMER_SUFFIX"/>
                            </div>
                        </div>
                        
                        <!-- Debug Mode Toggle -->
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <label class="flex items-center justify-between cursor-pointer">
                                <div class="flex items-center">
                                    <i class="fas fa-bug text-orange-500 mr-2"></i>
                                    <span class="text-sm font-medium text-gray-700">Debug Mode</span>
                                    <span class="ml-2 text-xs text-gray-500">(Bỏ qua xác thực OTP)</span>
                                </div>
                                <div class="otp-debug-toggle">
                                    <input 
                                        type="checkbox" 
                                        t-att-checked="state.debugMode"
                                        t-on-change="onToggleDebug"
                                    />
                                    <span class="otp-debug-toggle-slider"></span>
                                </div>
                            </label>
                            <p t-if="state.debugMode" class="mt-2 text-xs text-orange-600 font-medium">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Chế độ debug đang bật - OTP sẽ được bỏ qua xác thực
                            </p>
                        </div>
                    </div>
                </div>
        </div>
    `;

    setup() {
        this.messages = MESSAGES;
        this.config = OTP_CONFIG;
        // Lấy loại OTP từ props, default là 'smart'
        this.otpType = this.props.otpType || 'smart';
        this._initializeState();
        this._initializeIndices();
        this._setupFocusOnMount();
    }
    
    getTitle() {
        return this.otpType === 'sms_email' ? this.messages.TITLE_SMS_EMAIL : this.messages.TITLE_SMART;
    }
    
    getDescription() {
        return this.otpType === 'sms_email' ? this.messages.DESCRIPTION_SMS_EMAIL : this.messages.DESCRIPTION_SMART;
    }
    
    getInstructionStep1() {
        return this.otpType === 'sms_email' ? this.messages.INSTRUCTION_STEP_1_SMS_EMAIL : this.messages.INSTRUCTION_STEP_1_SMART;
    }
    
    getInstructionStep2() {
        return this.otpType === 'sms_email' ? this.messages.INSTRUCTION_STEP_2_SMS_EMAIL : this.messages.INSTRUCTION_STEP_2_SMART;
    }

    _initializeState() {
        // Load debug mode từ localStorage
        const savedDebugMode = localStorage.getItem('otp_debug_mode') === 'true';
        
        this.state = useState({
            otpCodes: Array(this.config.LENGTH).fill(''),
            error: '',
            loading: false,
            timer: this.config.TIMEOUT_SECONDS,
            debugMode: savedDebugMode
        });
        this.timerInterval = null;
    }

    _initializeIndices() {
        this.otpIndices = Array.from({ length: this.config.LENGTH }, (_, i) => i);
    }

    _setupFocusOnMount() {
        onMounted(() => {
            setTimeout(() => {
                this._focusInput(0);
            }, this.config.FOCUS_DELAY_MS);
            
            // Khởi động timer đếm ngược
            this._startTimer();
        });
    }
    
    _startTimer() {
        // Clear timer cũ nếu có
        this._clearTimer();
        
        // Reset timer về giá trị ban đầu
        this.state.timer = this.config.TIMEOUT_SECONDS;
        
        // Bắt đầu đếm ngược
        this.timerInterval = setInterval(() => {
            if (this.state.timer > 0) {
                this.state.timer--;
            } else {
                // Hết thời gian - tự động đóng popup
                this._clearTimer();
                this._handleTimeout();
            }
        }, this.config.TIMER_INTERVAL_MS);
    }
    
    _clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    _handleTimeout() {
        // Đóng popup khi hết thời gian
        this._closePopup();
    }

    isValid() {
        return this.state.otpCodes.every(code => this.config.DIGIT_REGEX.test(code));
    }

    _getOTPInputs(parentElement) {
        return parentElement?.querySelectorAll(this.config.INPUT_SELECTOR) || [];
    }

    _focusInput(index) {
        const inputs = this._getOTPInputs(document);
        if (inputs && inputs[index]) {
            inputs[index].focus();
        }
    }

    _sanitizeInputValue(value) {
        return value.replace(this.config.NON_DIGIT_REGEX, '').slice(0, 1);
    }

    _moveToNextInput(currentIndex, parentElement) {
        if (currentIndex >= this.config.LENGTH - 1) {
            return;
        }

        setTimeout(() => {
            const inputs = this._getOTPInputs(parentElement);
            if (inputs && inputs[currentIndex + 1]) {
                inputs[currentIndex + 1].focus();
            }
        }, this.config.INPUT_MOVE_DELAY_MS);
    }

    _moveToPreviousInput(currentIndex, parentElement) {
        if (currentIndex <= 0) {
            return;
        }

        setTimeout(() => {
            const inputs = this._getOTPInputs(parentElement);
            if (inputs && inputs[currentIndex - 1]) {
                inputs[currentIndex - 1].focus();
            }
        }, this.config.INPUT_MOVE_DELAY_MS);
    }

    _clearInputAtIndex(index) {
        this.state.otpCodes[index] = '';
    }

    _updateInputValue(index, value) {
        this.state.otpCodes[index] = value;
        this.state.error = '';
    }

    onOTPInput(ev) {
        const index = parseInt(ev.target.dataset.index);
        const sanitizedValue = this._sanitizeInputValue(ev.target.value);
        
        this._updateInputValue(index, sanitizedValue);
        ev.target.value = sanitizedValue;
        
        if (sanitizedValue) {
            this._moveToNextInput(index, ev.target.parentElement);
        }
    }

    onOTPKeydown(ev) {
        const index = parseInt(ev.target.dataset.index);
        const isBackspace = ev.key === 'Backspace';
        const hasValue = !!ev.target.value;
        
        if (isBackspace && hasValue) {
            this._clearInputAtIndex(index);
            ev.target.value = '';
            return;
        }
        
        if (isBackspace && !hasValue) {
            this._moveToPreviousInput(index, ev.target.parentElement);
        }
    }

    _getOTPCode() {
        return this.state.otpCodes.join('');
    }

    _validateOTPCode() {
        if (!this.isValid()) {
            this.state.error = this.messages.ERROR_INCOMPLETE_OTP;
            return false;
        }
        return true;
    }

    _setLoadingState(loading) {
        this.state.loading = loading;
    }

    _setError(message) {
        this.state.error = message || this.messages.ERROR_INVALID_OTP;
    }

    _clearError() {
        this.state.error = '';
    }

    onToggleDebug(ev) {
        const newDebugMode = ev.target.checked;
        this.state.debugMode = newDebugMode;
        // Lưu vào localStorage
        localStorage.setItem('otp_debug_mode', newDebugMode.toString());
        console.log('[OTP Debug] Debug mode:', newDebugMode ? 'ENABLED' : 'DISABLED');
    }

    async onVerify() {
        if (!this._validateOTPCode() || this.state.loading) {
            return;
        }

        const otp = this._getOTPCode();
        this._setLoadingState(true);
        this._clearError();
        
        // Dừng timer khi đang verify
        this._clearTimer();

        try {
            if (typeof this.props.onConfirm === 'function') {
                // Truyền debug mode vào callback
                await this.props.onConfirm(otp, this.state.debugMode);
                // Chỉ đóng popup khi xác nhận thành công
                this._closePopup();
            }
        } catch (error) {
            // Lỗi đã được xử lý trong onConfirm (SweetAlert), không đóng popup để user có thể thử lại
            this._setLoadingState(false);
            // Khởi động lại timer nếu verify thất bại
            this._startTimer();
        }
    }

    _closePopup() {
        // Dừng timer trước khi đóng
        this._clearTimer();
        
        if (typeof this.props.onClose === 'function') {
            this.props.onClose();
        }
    }

    _handleVerifyError(error) {
        this._setError(error?.message);
    }

    onClose() {
        // Dừng timer khi đóng popup
        this._clearTimer();
        
        if (typeof this.props.onClose === 'function') {
            this.props.onClose();
        }
    }
    
    // Cleanup khi component unmount
    willUnmount() {
        this._clearTimer();
    }
}

function createContainer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return container;
}

function createProps(options, cleanup) {
    return {
        show: true,
        otpType: options.otpType || 'smart', // Lấy loại OTP từ options
        onConfirm: async (otp, debugMode) => {
            // Popup đã được đóng trong onVerify, chỉ cần gọi callback
            // Truyền debug mode vào callback
            if (typeof options.onConfirm === 'function') {
                await options.onConfirm(otp, debugMode);
            }
            // Cleanup sau khi callback hoàn tất để đảm bảo container được xóa
            cleanup();
        },
        onClose: () => {
            if (typeof options.onClose === 'function') {
                options.onClose();
            }
            // Cleanup khi đóng popup (khi user click Hủy hoặc close button)
            cleanup();
        }
    };
}

function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

function mountComponent(container, props) {
    try {
        mount(SmartOtpModal, container, { props });
    } catch (error) {
        console.error('Error mounting SmartOtpModal:', error);
        cleanupContainer(container);
        throw error;
    }
}

export function openSmartOtp(options = {}) {
    // Find or create a container in the page content, not fullscreen overlay
    let container = document.querySelector('#smart-otp-container');
    
    if (!container) {
        // Create container in the main content area
        const mainContent = document.querySelector('.profile-container') || 
                           document.querySelector('main') || 
                           document.body;
        container = document.createElement('div');
        container.id = 'smart-otp-container';
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '1050'; // Z-index thấp hơn SweetAlert (thường là 1060)
        mainContent.appendChild(container);
    }
    
    let isCleanedUp = false;
    const cleanup = () => {
        if (!isCleanedUp && container && container.parentNode) {
            isCleanedUp = true;
            container.innerHTML = '';
        }
    };
    
    const props = createProps(options, cleanup);
    
    mountComponent(container, props);
    
    return { close: cleanup };
}

// Expose constants and config for testing/debugging
SmartOtpModal.OTP_CONFIG = OTP_CONFIG;
SmartOtpModal.MESSAGES = MESSAGES;

window.FundManagementSmartOTP = {
    open: openSmartOtp
};

