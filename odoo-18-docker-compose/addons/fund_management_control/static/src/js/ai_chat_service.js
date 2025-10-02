/** @odoo-module **/

import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";

const aiChatService = {
    start(env) {
        const aiChat = {};
        
        /**
         * Gửi tin nhắn đến AI bot
         * @param {string} message - Tin nhắn của user
         * @param {Array} history - Lịch sử chat
         * @param {boolean} streaming - Có sử dụng streaming mode hay không
         * @returns {Promise} - Promise chứa kết quả hoặc channel name (nếu streaming)
         */
        async function chat(message, history, streaming) {
            try {
                const res = await rpc("/ai_chat/chat", {
                    "message": message,
                    "history": history,
                    "streaming": streaming,
                });
                return res;
            } catch (error) {
                console.error("AI Chat Service Error:", error);
                throw error;
            }
        }

        aiChat.chat = chat;
        return aiChat;
    }
};

registry.category("services").add("ai_chat", aiChatService);
