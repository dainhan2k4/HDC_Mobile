# -*- coding: utf-8 -*-

import json
import threading
import uuid
import logging
from odoo import http
from odoo.http import request, Response

try:
    from .ai.ai_bot import AiBot
except ImportError:
    from ..ai.ai_bot import AiBot

_logger = logging.getLogger(__name__)


class AiChatController(http.Controller):

    @http.route(
        "/ai_chat/health",
        type="json",
        auth="user",
        website=True,
        methods=["GET", "POST"],
    )
    def health_check(self):
        """Health check endpoint"""
        return {
            "status": "ok",
            "message": "AI Chat Controller is running",
            "longpolling_available": self._check_longpolling_available(),
        }

    def _check_longpolling_available(self):
        """Kiểm tra xem longpolling có available không"""
        try:
            # Kiểm tra xem có workers không
            workers = request.env.registry._longpolling
            return workers is not None
        except:
            return False

    @http.route(
        "/ai_chat/chat", type="json", auth="user", website=True, methods=["POST"]
    )
    def ai_chat(self, message=None, history=None, streaming=False):
        """
        Controller xử lý yêu cầu chat từ frontend.
        """
        _logger.info("AI Chat endpoint called with streaming=%s", streaming)

        env = request.env

        # Validate parameters
        if history is None:
            history = []
        if message is None:
            message = ""

        try:
            # Khởi tạo bot
            bot = AiBot(env)
            _logger.info("AiBot initialized successfully")

            if streaming:
                # Kiểm tra longpolling availability
                if not self._check_longpolling_available():
                    _logger.warning(
                        "Longpolling not available, falling back to batch mode"
                    )
                    res = bot.chat_batch(message, history)
                    return res

                # Tạo channel riêng cho mỗi user để streaming
                user_id = request.env.user.id
                channel_name = f"ai_bot_stream_{user_id}_{uuid.uuid4().hex[:8]}"

                _logger.info("Starting streaming chat for channel: %s", channel_name)

                # Thêm message hiện tại vào history
                full_history = list(history or [])
                if message:
                    full_history.append({"role": "user", "content": message})

                # Chạy streaming trong thread riêng
                thread = threading.Thread(
                    target=bot.start_streaming_chat, args=(full_history, channel_name)
                )
                thread.daemon = True
                thread.start()

                return {
                    "channel": channel_name,
                    "status": "streaming_started",
                    "longpolling_available": True,
                }
            else:
                # Mode batch
                _logger.info("Processing batch chat")
                res = bot.chat_batch(message, history)
                return res

        except ImportError as e:
            error_msg = "Thư viện AI chưa được cài đặt. Vui lòng chạy: pip install openai 'semantic-kernel==1.35.2'"
            _logger.error("AI_DEPENDENCIES_MISSING: %s", str(e))
            return {
                "error": "AI_DEPENDENCIES_MISSING",
                "message": error_msg,
            }
        except ConnectionError as e:
            error_msg = f"Không thể kết nối đến mô hình AI: {str(e)}"
            _logger.error("AI_CONNECTION_ERROR: %s", error_msg)
            return {
                "error": "AI_CONNECTION_ERROR",
                "message": error_msg,
            }
        except Exception as e:
            error_msg = f"Đã xảy ra lỗi: {str(e)}"
            _logger.error("AI_GENERAL_ERROR: %s", error_msg, exc_info=True)
            return {"error": "AI_GENERAL_ERROR", "message": error_msg}

    @http.route(
        "/ai_chat/test_longpolling",
        type="json",
        auth="user",
        website=True,
        methods=["POST"],
    )
    def test_longpolling(self):
        """Test endpoint để kiểm tra longpolling"""
        try:
            # Test gửi một notification qua bus
            user_id = request.env.user.id
            test_channel = f"test_longpolling_{user_id}"

            request.env["bus.bus"]._sendone(
                request.env.cr.dbname,
                test_channel,
                {
                    "message": "Longpolling test successful",
                    "timestamp": str(uuid.uuid4()),
                },
            )

            return {
                "status": "success",
                "channel": test_channel,
                "message": "Test notification sent",
            }
        except Exception as e:
            _logger.error("Longpolling test failed: %s", e)
            return {"status": "error", "message": str(e)}
