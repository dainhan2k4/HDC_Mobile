# -*- coding: utf-8 -*-
import asyncio
import logging
import queue
from odoo.api import Environment
from odoo.modules.registry import Registry

# Yêu cầu cài đặt các thư viện: pip install openai "semantic-kernel==1.35.2"
try:
    from semantic_kernel import Kernel
    from semantic_kernel.contents.chat_history import ChatHistory
    from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
    from semantic_kernel.agents import ChatCompletionAgent
    from openai import AsyncOpenAI
    import openai
except ImportError:
    logging.getLogger(__name__).warning(
        "Thư viện 'openai' hoặc 'semantic-kernel' chưa được cài đặt. Vui lòng chạy: pip install openai \"semantic-kernel==1.35.2\""
    )
    # Gán giá trị giả để Odoo không bị lỗi khi khởi động nếu thư viện thiếu
    Kernel, ChatHistory, OpenAIChatCompletion, ChatCompletionAgent, AsyncOpenAI = (
        None,
        None,
        None,
        None,
        None,
    )

_logger = logging.getLogger(__name__)


class AiBot:
    """
    Lớp xử lý logic cốt lõi của Chatbot AI.
    - Khởi tạo kết nối đến mô hình ngôn ngữ (ví dụ: LM Studio, OpenAI).
    - Xử lý lịch sử trò chuyện.
    - Thực hiện streaming các phản hồi về cho client qua Odoo Bus hoặc SSE.
    """

    # --- CẤU HÌNH KẾT NỐI MÔ HÌNH AI ---
    # Thay đổi các thông số này để kết nối với mô hình của bạn.

    # Ví dụ cho mô hình local chạy bằng LM Studio:
    API_KEY = "lm-studio"
    BASE_URL = "http://localhost:1234/v1"  # Đảm bảo URL và cổng chính xác
    AI_MODEL_ID = (
        "meta-llama-meta-llama-3.1-8b-instruct"  # Thay bằng tên model bạn đã tải
    )

    # Ví dụ cho OpenAI API (bỏ comment và điền API key của bạn):
    # API_KEY = "sk-..."
    # BASE_URL = None
    # AI_MODEL_ID = "gpt-4o"

    # Chỉ dẫn cho AI biết vai trò của nó
    AGENT_INSTRUCTIONS = """
        Your name is FundBot. You are a helpful AI assistant specialized in fund management for a Vietnamese company.
        Answer questions clearly, concisely, and primarily in Vietnamese.
        Your knowledge is based on fund certificates, investment schemes, and fees.
    """

    def __init__(self, env: Environment):
        if not env:
            raise Exception("Odoo Environment is required.")
        if not Kernel:
            _logger.error("Thư viện AI chưa được cài đặt. Chatbot sẽ không hoạt động.")
            raise ImportError(
                "Thư viện 'openai' hoặc 'semantic-kernel' chưa được cài đặt."
            )
        self.env = env
        self.kernel = self._initialize_kernel()
        self.agent = self._create_agent()

    def _initialize_kernel(self):
        """Khởi tạo Kernel của Semantic Kernel và dịch vụ AI."""
        try:
            # Kiểm tra kết nối trước khi khởi tạo
            self._test_connection()

            client = AsyncOpenAI(api_key=self.API_KEY, base_url=self.BASE_URL)
            service = OpenAIChatCompletion(
                service_id="fund_bot_service",
                ai_model_id=self.AI_MODEL_ID,
                async_client=client,
            )
            kernel = Kernel()
            kernel.add_service(service)
            _logger.info(
                "AI Kernel initialized successfully with model: %s", self.AI_MODEL_ID
            )
            return kernel
        except Exception as e:
            _logger.error("Không thể khởi tạo AI Kernel: %s", e, exc_info=True)
            raise ConnectionError(f"Không thể kết nối đến mô hình AI: {str(e)}")

    def _test_connection(self):
        """Kiểm tra kết nối đến API AI trước khi khởi tạo."""
        try:
            import requests
            import time

            # Test connection với timeout ngắn
            test_url = (
                f"{self.BASE_URL}/models"
                if self.BASE_URL
                else "https://api.openai.com/v1/models"
            )
            headers = {"Authorization": f"Bearer {self.API_KEY}"}

            response = requests.get(test_url, headers=headers, timeout=5)
            if response.status_code != 200:
                raise ConnectionError(f"API trả về status code: {response.status_code}")

        except requests.exceptions.ConnectionError:
            raise ConnectionError(
                "Không thể kết nối đến server AI. Vui lòng kiểm tra URL và khởi động LM Studio."
            )
        except requests.exceptions.Timeout:
            raise ConnectionError("Timeout khi kết nối đến server AI.")
        except Exception as e:
            _logger.warning(f"Không thể test connection: {e}")

    def _create_agent(self):
        if not self.kernel:
            raise RuntimeError("Kernel not initialized")
        try:
            return ChatCompletionAgent(
                kernel=self.kernel,
                name="FundBotAgent",
                instructions=self.AGENT_INSTRUCTIONS,
            )
        except Exception as e:
            _logger.error("Không thể tạo AI Agent: %s", e, exc_info=True)
            raise

    def _send_chunk_to_client(self, channel_name, payload):
        """Gửi một phần dữ liệu (chunk) qua Odoo Bus đến đúng kênh của người dùng."""
        try:
            # transaction độc lập với request HTTP chính
            with Registry(self.env.cr.dbname).cursor() as cr:
                env2 = Environment(cr, self.env.uid, self.env.context)
                # CHUẨN Odoo 18: _sendone(dbname, channel, message)
                env2["bus.bus"]._sendone(self.env.cr.dbname, channel_name, payload)
        except Exception as e:
            _logger.error(
                "Lỗi khi gửi dữ liệu qua Bus đến kênh '%s': %s", channel_name, e
            )

    def stream_to_queue(self, history, q: queue.Queue):
        """Run Semantic Kernel streaming and push chunks into a thread-safe queue.
        Items placed in the queue are dicts: {"content": str} | {"error": str} | {"stop": True}
        """

        async def _run():
            if not self.agent:
                q.put({"error": "AI agent is not available."})
                q.put({"stop": True})
                return

            chat_history = ChatHistory()
            for msg in history or []:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "user":
                    chat_history.add_user_message(content)
                elif role == "assistant":
                    chat_history.add_assistant_message(content)

            try:
                async for chunk in self.agent.invoke_stream(chat_history):
                    if chunk and getattr(chunk, "content", None):
                        q.put({"content": str(chunk.content)})
                q.put({"stop": True})
            except Exception as e:
                _logger.error("Error in stream_to_queue: %s", e, exc_info=True)
                q.put({"error": str(e)})
                q.put({"stop": True})

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_run())
        finally:
            loop.close()

    async def _stream_chat(self, history, channel_name):
        """
        Xử lý logic chat và stream kết quả về cho client.
        - Xây dựng lại lịch sử chat từ dữ liệu frontend gửi lên.
        - Gọi agent để nhận phản hồi dưới dạng stream.
        - Gửi từng phần phản hồi (chunk) về client.
        - Gửi tín hiệu kết thúc hoặc lỗi khi hoàn tất.
        """
        if not self.agent:
            self._send_chunk_to_client(
                channel_name, {"error": "AI agent is not available."}
            )
            return

        chat_history = ChatHistory()
        for message in history:
            role = message.get("role")
            content = message.get("content", "")
            if role == "user":
                chat_history.add_user_message(content)
            elif role == "assistant":
                chat_history.add_assistant_message(content)

        try:
            full_response = ""
            async for chunk in self.agent.invoke_stream(chat_history):
                if chunk and hasattr(chunk, "content") and chunk.content:
                    # FIX: Lấy content từ object thay vì concatenate trực tiếp
                    chunk_content = str(chunk.content)
                    full_response += chunk_content
                    self._send_chunk_to_client(channel_name, {"content": chunk_content})

            # Gửi tín hiệu kết thúc stream thành công
            self._send_chunk_to_client(channel_name, {"stop": True})
            _logger.info(
                "AI stream finished for channel %s. Full response length: %d",
                channel_name,
                len(full_response),
            )

        except Exception as e:
            _logger.error(
                "Lỗi trong quá trình stream AI cho kênh '%s': %s",
                channel_name,
                e,
                exc_info=True,
            )
            self._send_chunk_to_client(channel_name, {"error": str(e), "stop": True})

    def start_streaming_chat(self, history, channel_name):
        """
        Bắt đầu một phiên chat streaming.
        Hàm này được gọi từ một thread riêng để không block server Odoo.
        """
        # Chạy hàm async trong một event loop mới
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._stream_chat(history, channel_name))
        finally:
            loop.close()

    def chat_batch(self, message, history):
        """
        Xử lý chat trong mode batch (không streaming).
        Trả về kết quả hoàn chỉnh ngay lập tức.
        """
        if not self.agent:
            raise Exception("AI agent is not available.")

        async def _process_chat():
            chat_history = ChatHistory()
            for msg in history:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "user":
                    chat_history.add_user_message(content)
                elif role == "assistant":
                    chat_history.add_assistant_message(content)

            # Thêm tin nhắn mới của user
            chat_history.add_user_message(message)

            # Collect all chunks into a single response
            response = ""
            async for chunk in self.agent.invoke_stream(chat_history):
                if chunk and hasattr(chunk, "content") and chunk.content:
                    # FIX: Chuyển đổi content thành string
                    response += str(chunk.content)

            return {"content": response}

        try:
            # Sử dụng asyncio.run() - cách hiện đại nhất
            return asyncio.run(_process_chat())
        except Exception as e:
            _logger.error("Lỗi trong chat batch mode: %s", e, exc_info=True)
            raise
