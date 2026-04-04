"""Simple WebSocket chat server using Qwen Code API directly."""

import asyncio
import json
import os
import urllib.request
import urllib.error
import websockets
from websockets.asyncio.server import serve

LLM_API_KEY = os.environ.get("LLM_API_KEY", "demo-key")
LLM_API_BASE = os.environ.get("LLM_API_BASE_URL", "http://qwen-code-api:8080/v1")
LLM_MODEL = os.environ.get("LLM_API_MODEL", "coder-model")

SYSTEM_PROMPT = """You are a helpful assistant for a game catalog website. 
Help users discover games, find deals, and answer questions about games.
Be concise and friendly."""


def call_lllm(messages: list[dict]) -> str:
    """Call the LLM API synchronously."""
    payload = json.dumps({
        "model": LLM_MODEL,
        "messages": messages,
        "max_tokens": 1024,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{LLM_API_BASE}/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LLM_API_KEY}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
        return result["choices"][0]["message"]["content"]


async def handle_client(ws):
    """Handle a browser WebSocket connection."""
    print("Client connected")
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    async for raw in ws:
        try:
            data = json.loads(raw)
            user_message = data.get("content", data.get("message", "")).strip()
            if not user_message:
                continue

            print(f"User: {user_message}")
            messages.append({"role": "user", "content": user_message})

            reply = await asyncio.to_thread(call_lllm, messages)
            print(f"Bot: {reply}")
            messages.append({"role": "assistant", "content": reply})

            await ws.send(json.dumps({
                "type": "text",
                "content": reply,
                "format": "markdown",
            }))

        except Exception as e:
            print(f"Error: {e}")
            await ws.send(json.dumps({
                "type": "text",
                "content": f"Error: {str(e)}",
            }))


async def main():
    port = int(os.environ.get("WEBSOCKET_PORT", 8765))
    print(f"Chat server listening on :{port}")
    async with serve(handle_client, "0.0.0.0", port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
