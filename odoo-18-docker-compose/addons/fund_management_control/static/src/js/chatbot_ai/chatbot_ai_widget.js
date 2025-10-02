console.log("Loading ChatbotAiWidget component...");

const { Component, xml, useState, onMounted, onWillUnmount, useRef } = window.owl;

/**
 * ChatbotAiWidget là một component OWL cho Floating Action Button (FAB) với khung chat AI streaming.
 * - Tương thích với cả môi trường Odoo và standalone OWL
 * - Xử lý các trường hợp lỗi kết nối AI
 * - Giao diện sử dụng Bootstrap 5
 */
class ChatbotAiWidget extends Component {
    static template = xml`  
    <div class="chatbot-fab-container">
        <!-- Floating Action Button -->
        <div class="fab-button" 
             t-on-click="toggleChat"
             t-att-class="state.isChatOpen ? 'fab-active' : ''">
            <i t-if="!state.isChatOpen" class="fas fa-robot"></i>
            <i t-if="state.isChatOpen" class="fas fa-times"></i>
        </div>

        <!-- Chat Window -->
        <div class="chat-window" 
             t-att-class="state.isChatOpen ? 'chat-window-open' : ''">
            <div class="chat-header">
                <div class="d-flex align-items-center">
                    <div class="chat-avatar me-2">
                        <i class="fas fa-robot text-white"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-white fw-semibold">FundBot</h6>
                        <small class="text-white-50">
                            <span t-if="state.isOnline" class="status-indicator online"></span>
                            <span t-if="!state.isOnline" class="status-indicator offline"></span>
                            <span t-esc="state.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'"></span>
                        </small>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <!-- Streaming Toggle -->
                    <div class="form-check form-switch me-3">
                        <input class="form-check-input" 
                               type="checkbox" 
                               t-model="state.isStreamingMode"
                               t-on-change="onStreamingToggle"
                               style="transform: scale(0.8);"/>
                        <label class="form-check-label text-white-50" style="font-size: 11px;">
                            Stream
                        </label>
                    </div>
                    <button class="btn-close btn-close-white" 
                            t-on-click="closeChat"></button>
                </div>
            </div>

            <!-- Error Alert -->
            <div t-if="state.error" class="alert alert-danger alert-dismissible m-2 mb-0" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span t-esc="state.error"></span>
                <button type="button" class="btn-close" t-on-click="dismissError"></button>
            </div>

            <div class="chat-body" t-ref="chatBody">
                <!-- Welcome Message -->
                <div class="message-container mb-3">
                    <div class="message bot-message">
                        <div class="message-content">
                            <p class="mb-2">👋 Xin chào! Tôi là FundBot - AI Assistant của hệ thống quản lý quỹ.</p>
                            <p class="mb-0">Tôi có thể giúp bạn:</p>
                            <ul class="mt-2 mb-0">
                                <li>Tìm hiểu thông tin về chứng chỉ quỹ</li>
                                <li>Hướng dẫn sử dụng hệ thống</li>
                                <li>Giải đáp các thắc mắc về đầu tư</li>
                            </ul>
                        </div>
                        <small class="message-time">Vừa xong</small>
                    </div>
                </div>

                <!-- Messages -->
                <t t-foreach="state.messages" t-as="message" t-key="message.id">
                    <div class="message-container mb-3">
                        <div t-att-class="'message ' + (message.isBot ? 'bot-message' : 'user-message')">
                            <div class="message-content">
                                <div t-if="message.isBot and message.isStreaming" class="streaming-content">
                                    <span t-esc="message.text"></span>
                                    <span class="streaming-cursor">|</span>
                                </div>
                                <p t-else="" class="mb-0" t-esc="message.text"></p>
                            </div>
                            <small class="message-time" t-esc="message.time"></small>
                        </div>
                    </div>
                </t>

                <!-- Typing indicator -->
                <div t-if="state.isTyping" class="message-container mb-3">
                    <div class="message bot-message">
                        <div class="message-content">
                            <div class="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chat-footer">
                <div class="input-group">
                    <input type="text" 
                           class="form-control" 
                           placeholder="Nhập tin nhắn..."
                           t-ref="messageInput"
                           t-model="state.currentMessage"
                           t-on-keydown="handleKeyDown"
                           t-att-disabled="state.isSending"/>
                    <button class="btn btn-primary" 
                            t-on-click="sendMessage"
                            t-att-disabled="!state.currentMessage.trim() || state.isSending">
                        <i t-if="!state.isSending" class="fas fa-paper-plane"></i>
                        <i t-if="state.isSending" class="fas fa-spinner fa-spin"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Chat Window Backdrop (Mobile) -->
        <div class="chat-backdrop" 
             t-att-class="state.isChatOpen ? 'chat-backdrop-show' : ''"
             t-on-click="closeChat"></div>
    </div>

    <style>
        .chatbot-fab-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* FAB Button Styles */
        .fab-button {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 1001;
        }

        .fab-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }

        .fab-button.fab-active {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            transform: rotate(180deg);
        }

        /* Chat Window Styles */
        .chat-window {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            transform: translateY(20px) scale(0.95);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .chat-window-open {
            transform: translateY(0) scale(1);
            opacity: 1;
            visibility: visible;
        }

        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16px;
            border-radius: 16px 16px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: white;
        }

        .chat-avatar {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
        }

        .status-indicator.online {
            background-color: #28a745;
        }

        .status-indicator.offline {
            background-color: #dc3545;
        }

        .chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8f9fa;
        }

        .chat-body::-webkit-scrollbar {
            width: 4px;
        }

        .chat-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-body::-webkit-scrollbar-thumb {
            background: #dee2e6;
            border-radius: 2px;
        }

        .message-container {
            display: flex;
            flex-direction: column;
        }

        .message {
            max-width: 80%;
            margin-bottom: 4px;
        }

        .bot-message {
            align-self: flex-start;
        }

        .bot-message .message-content {
            background: white;
            color: #333;
            padding: 12px 16px;
            border-radius: 18px 18px 18px 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .user-message {
            align-self: flex-end;
        }

        .user-message .message-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 18px 18px 4px 18px;
        }

        .message-time {
            color: #6c757d;
            font-size: 11px;
            margin-top: 4px;
        }

        .bot-message .message-time {
            text-align: left;
        }

        .user-message .message-time {
            text-align: right;
        }

        /* Streaming cursor animation */
        .streaming-content {
            position: relative;
        }

        .streaming-cursor {
            animation: blink 1s infinite;
            font-weight: bold;
        }

        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }

        /* Typing Indicator */
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            background: #6c757d;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }

        .chat-footer {
            padding: 16px;
            border-top: 1px solid #e9ecef;
            background: white;
            border-radius: 0 0 16px 16px;
        }

        .chat-footer .form-control {
            border: 1px solid #e9ecef;
            border-radius: 25px;
            padding: 12px 16px;
        }

        .chat-footer .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .chat-footer .btn {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .chat-window {
                bottom: 0;
                right: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 0;
                max-height: 100vh;
            }

            .chat-header {
                border-radius: 0;
                padding: 20px 16px;
            }

            .chat-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 999;
            }

            .chat-backdrop-show {
                opacity: 1;
                visibility: visible;
            }

            .fab-button {
                width: 56px;
                height: 56px;
                font-size: 20px;
            }
        }

        @media (max-width: 480px) {
            .chatbot-fab-container {
                bottom: 16px;
                right: 16px;
            }
        }

        /* List Styles in Messages */
        .message-content ul {
            padding-left: 20px;
            margin: 8px 0 0 0;
        }

        .message-content li {
            margin-bottom: 4px;
        }

        /* Alert custom styles */
        .alert {
            border-radius: 8px;
            font-size: 13px;
        }
    </style>
    `;

    setup() {
        this.chatBodyRef = useRef("chatBody");
        this.messageInputRef = useRef("messageInput");
        this._sse = null; // Keep reference to active EventSource

        this.state = useState({
            isChatOpen: false,
            currentMessage: '',
            messages: [],
            isTyping: false,
            isSending: false,
            messageCounter: 0,
            isStreamingMode: true, // Mặc định bật streaming với SSE
            isOnline: true,
            error: null,
            currentStreamingMessage: null
        });

        // Khởi tạo AI Chat Service
        this.aiChatService = this._initializeAiChatService();

        onMounted(() => {
            console.log('ChatbotAiWidget mounted successfully');
            this._checkAiStatus();
        });

        onWillUnmount(() => {
            if (this._sse) {
                try { 
                    this._sse.close(); 
                } catch (_) {}
                this._sse = null;
            }
        });
    }

    _initializeAiChatService() {
        // """Khởi tạo AI Chat Service tùy theo môi trường."""
        try {
            // Kiểm tra xem có trong môi trường Odoo không
            if (typeof odoo !== 'undefined' && odoo.define) {
                // Thử sử dụng useService nếu có
                try {
                    const { useService } = window.owl;
                    return useService("ai_chat");
                } catch (e) {
                    console.log('useService not available, falling back to global service');
                }
            }
            
            // Fallback: sử dụng global service
            if (window.AiChatService) {
                return window.AiChatService;
            }
            
            // Tạo service đơn giản nếu không có gì
            return {
                chat: this._callAiChat.bind(this)
            };
        } catch (error) {
            console.warn('Error initializing AI Chat Service:', error);
            return {
                chat: this._callAiChat.bind(this)
            };
        }
    }

    async _checkAiStatus() {
        // """Kiểm tra trạng thái kết nối AI khi component được mount."""
        try {
            // Test với một tin nhắn đơn giản
            await this.aiChatService.chat("test", [], false);
            this.state.isOnline = true;
            console.log("AI service is online");
        } catch (error) {
            this.state.isOnline = false;
            console.error("AI service check failed:", {
                error: error.message,
                url: '/ai_chat/chat',
                details: error
            });
            
            // Không hiển thị lỗi ngay khi mount, chỉ khi user thực sự chat
            // this.state.error = "AI service không khả dụng";
        }
    }

    async _callAiChat(message, history, streaming) {
        // Chỉ gọi trực tiếp controller endpoint
        try {
            const response = await fetch('/ai_chat/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        message: message,
                        history: history,
                        streaming: streaming
                    },
                    id: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.message || 'Unknown AI error');
            }
            return data.result || data;
        } catch (error) {
            console.error('AI endpoint call failed:', error);
            throw new Error(`AI endpoint not accessible: ${error.message}`);
        }
    }

    toggleChat() {
        this.state.isChatOpen = !this.state.isChatOpen;
        
        // Focus input when opening chat
        if (this.state.isChatOpen) {
            setTimeout(() => {
                const input = this.messageInputRef.el;
                if (input) {
                    input.focus();
                }
            }, 300);
        }
    }

    closeChat() {
        this.state.isChatOpen = false;
    }

    dismissError() {
        this.state.error = null;
    }

    onStreamingToggle() {
        console.log('Streaming mode:', this.state.isStreamingMode);
    }

    handleKeyDown(ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const message = this.state.currentMessage.trim();
        if (!message || this.state.isSending) return;

        this.state.isSending = true;
        this.state.error = null;

        // Add user message
        const userMessage = {
            id: ++this.state.messageCounter,
            text: message,
            isBot: false,
            time: this.formatTime(new Date()),
            isStreaming: false
        };

        this.state.messages.push(userMessage);
        this.state.currentMessage = '';

        // Scroll to bottom
        this.scrollToBottom();

        // Chuẩn bị lịch sử chat cho API
        const chatHistory = this.state.messages
            .filter(msg => !msg.isStreaming)
            .map(msg => ({
                role: msg.isBot ? "assistant" : "user",
                content: msg.text
            }));

        try {
            if (this.state.isStreamingMode) {
                await this._handleSSEChat(message, chatHistory);
            } else {
                await this._handleBatchChat(message, chatHistory);
            }
        } catch (error) {
            this._handleChatError(error);
        }
    }

    async _handleSSEChat(message, chatHistory) {
        this.state.isTyping = true;

        // Create an empty bot message for live streaming
        const botMessage = {
            id: ++this.state.messageCounter,
            text: "",
            isBot: true,
            time: "",
            isStreaming: true,
        };
        this.state.messages.push(botMessage);
        this.state.currentStreamingMessage = botMessage;

        // Keep only recent turns to avoid very long URLs (tune as needed)
        const trimmed = chatHistory.slice(-10);
        const url =
            `/ai_chat/sse?message=${encodeURIComponent(message)}` +
            `&history=${encodeURIComponent(JSON.stringify(trimmed))}`;

        try {
            this._openSSE(url);
            this.state.isTyping = false;
        } catch (error) {
            this.state.isTyping = false;
            throw error;
        }
    }

    _openSSE(url) {
        // Close any previous SSE connection
        if (this._sse) {
            try { 
                this._sse.close(); 
            } catch (_) {}
            this._sse = null;
        }

        const es = new EventSource(url);
        this._sse = es;

        es.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data || "{}");
                if (payload.error) {
                    this._handleStreamError(payload.error);
                    return;
                }
                if (payload.content && this.state.currentStreamingMessage) {
                    this.state.currentStreamingMessage.text += payload.content;
                    this.scrollToBottom();
                }
            } catch (_) { 
                /* non-JSON line? ignore safely */ 
            }
        };

        es.addEventListener("done", () => {
            this._finalizeSSE();
        });

        es.onerror = () => {
            this._handleStreamError("SSE connection error");
        };
    }

    _finalizeSSE() {
        this.state.isTyping = false;
        this.state.isSending = false;
        if (this.state.currentStreamingMessage) {
            this.state.currentStreamingMessage.isStreaming = false;
            this.state.currentStreamingMessage.time = this.formatTime(new Date());
            this.state.currentStreamingMessage = null;
        }
        if (this._sse) {
            try { 
                this._sse.close(); 
            } catch (_) {}
            this._sse = null;
        }
        this.scrollToBottom();
    }

    async _handleBatchChat(message, chatHistory) {
        // """Xử lý chat trong batch mode."""
        this.state.isTyping = true;

        try {
            const response = await this.aiChatService.chat(message, chatHistory, false);
            
            if (response.error) {
                throw new Error(response.message || "Unknown AI error");
            }

            // Simulate typing delay cho batch mode
            setTimeout(() => {
                const botMessage = {
                    id: ++this.state.messageCounter,
                    text: response.content || "Xin lỗi, tôi không thể trả lời lúc này.",
                    isBot: true,
                    time: this.formatTime(new Date()),
                    isStreaming: false
                };

                this.state.isTyping = false;
                this.state.isSending = false;
                this.state.messages.push(botMessage);
                this.scrollToBottom();
            }, 1000);

        } catch (error) {
            this.state.isTyping = false;
            throw error;
        }
    }

    _handleStreamError(error) {
        // """Xử lý lỗi trong quá trình streaming."""
        this.state.isTyping = false;
        this.state.isSending = false;
        
        if (this.state.currentStreamingMessage) {
            this.state.currentStreamingMessage.isStreaming = false;
            if (!this.state.currentStreamingMessage.text.trim()) {
                this.state.currentStreamingMessage.text = "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.";
            }
        }
        
        this.state.error = `Lỗi streaming: ${error}`;
        
        if (this._sse) {
            try { 
                this._sse.close(); 
            } catch (_) {}
            this._sse = null;
        }
    }

    _handleChatError(error) {
        // """Xử lý lỗi chung trong quá trình chat."""
        this.state.isSending = false;
        this.state.isTyping = false;
        this.state.isOnline = false;

        console.error("Chat error:", error);

        // Hiển thị thông báo lỗi phù hợp
        let errorMessage = "Đã xảy ra lỗi khi kết nối với AI.";
        
        if (error.message && error.message.includes("AI_DEPENDENCIES_MISSING")) {
            errorMessage = "Thư viện AI chưa được cài đặt. Vui lòng liên hệ quản trị viên.";
        } else if (error.message && error.message.includes("AI_CONNECTION_ERROR")) {
            errorMessage = "Không thể kết nối đến mô hình AI. Vui lòng kiểm tra cấu hình.";
        }

        this.state.error = errorMessage;

        // Thêm tin nhắn lỗi vào chat
        const errorMessageObj = {
            id: ++this.state.messageCounter,
            text: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
            isBot: true,
            time: this.formatTime(new Date()),
            isStreaming: false
        };

        this.state.messages.push(errorMessageObj);
        this.scrollToBottom();
    }

    formatTime(date) {
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            const chatBody = this.chatBodyRef.el;
            if (chatBody) {
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }, 50);
    }
}

// Đăng ký component vào window để `WidgetMountingService` có thể tìm thấy.
if (!window.ChatbotAiWidget) {
    window.ChatbotAiWidget = ChatbotAiWidget;
    console.log("ChatbotAiWidget component loaded successfully.");
} else {
    console.log("ChatbotAiWidget already exists, skipping registration.");
}
