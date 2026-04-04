# Entrypoint launches gateway + websocket bridge via shell
CMD ["sh", "-c", "/app/nanobot/.venv/bin/nanobot gateway --config /tmp/config.resolved.json --workspace /app/nanobot/workspace & sleep 10 && /app/nanobot/.venv/bin/python /app/nanobot/websocket_bridge.py"]
