/**
 * entrypoint.js for ChatbotAiWidget
 * - File này đảm bảo rằng ChatbotAiWidget được gắn vào đúng vị trí trên DOM
 * khi trang được tải xong.
 * - Nó sử dụng `WidgetMountingService` để xử lý việc gắn component một cách an toàn.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra sự tồn tại của WidgetMountingService.
    if (window.WidgetMountingService) {
        // Yêu cầu service gắn 'ChatbotAiWidget' vào container có ID là 'chatbotAiWidgetContainer'.
        // Container này sẽ được thêm vào file template layout chính.
        window.WidgetMountingService.mountWhenReady(
            'ChatbotAiWidget',        // Tên của lớp Component
            'chatbotAiWidgetContainer'  // ID của thẻ div container trong DOM
        );
    } else {
        console.error('WidgetMountingService is not available. Make sure it is loaded first in your assets.');
    }
});
