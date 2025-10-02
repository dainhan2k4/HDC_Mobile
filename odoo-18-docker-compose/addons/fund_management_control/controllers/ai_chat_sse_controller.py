# -*- coding: utf-8 -*-
import json
import time
import threading
import queue
import logging
from odoo import http
from odoo.http import request, Response

_logger = logging.getLogger(__name__)

try:
    # If your AiBot lives in fund_management_control/ai/ai_bot.py, keep this try path order
    from .ai.ai_bot import AiBot
except Exception:
    # Fallback if your structure differs
    from .ai_bot import AiBot


class AiChatSSEController(http.Controller):
    """SSE endpoint to stream AI responses to the browser."""

    @http.route("/ai_chat/sse", type="http", auth="user", website=True)
    def sse(self, **params):
        """
        Open an SSE stream. Accepts GET params:
          - message: current user message (string)
          - history: JSON-encoded array of {role, content}
        The server will stream chunks as:
          data: {"content": "..."}\n\n
        and finish with:
          event: done\n
          data: {"stop": true}\n\n
        Errors (if any) are sent as:
          data: {"error": "..."}\n\n
        """
        message = (params.get("message") or "").strip()
        raw_history = params.get("history") or "[]"

        try:
            history = json.loads(raw_history)
        except Exception:
            history = []

        if message:
            history.append({"role": "user", "content": message})

        # Init AI bot and a queue for streaming chunks
        bot = AiBot(request.env)
        q = queue.Queue()

        # Producer thread: bridges async stream → queue
        t = threading.Thread(target=bot.stream_to_queue, args=(history, q), daemon=True)
        t.start()

        def event_stream():
            # Suggest retry on reconnection
            yield "retry: 2000\n\n"
            # Immediate ping to flush headers fast (some proxies)
            yield ": ping\n\n"

            last_heartbeat = time.time()
            while True:
                try:
                    item = q.get(timeout=1.0)
                except queue.Empty:
                    # heartbeats keep the connection alive
                    now = time.time()
                    if now - last_heartbeat > 10:
                        yield ": keep-alive\n\n"
                        last_heartbeat = now
                    continue

                if isinstance(item, dict) and item.get("content"):
                    payload = json.dumps(
                        {"content": item["content"]}, ensure_ascii=False
                    )
                    yield f"data: {payload}\n\n"

                if isinstance(item, dict) and item.get("error"):
                    payload = json.dumps({"error": item["error"]}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"

                if isinstance(item, dict) and item.get("stop"):
                    yield "event: done\n"
                    yield 'data: {"stop": true}\n\n'
                    break

        headers = [
            ("Content-Type", "text/event-stream; charset=utf-8"),
            ("Cache-Control", "no-cache, no-transform"),
            ("Connection", "keep-alive"),
            ("X-Accel-Buffering", "no"),  # Nginx: disable buffering for SSE
        ]
        return Response(event_stream(), headers=headers, status=200)
