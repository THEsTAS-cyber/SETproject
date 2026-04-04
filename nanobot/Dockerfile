# Adapted from se-toolkit-lab-8
# Simplified for ProjectSET — without MCP packages

ARG REGISTRY_PREFIX_DOCKER_HUB
FROM ${REGISTRY_PREFIX_DOCKER_HUB:-}ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app/nanobot
COPY config.template.json pyproject.toml entrypoint.py websocket_bridge.py ./
COPY workspace/ ./workspace/

# Use template as default config
RUN cp config.template.json config.json

RUN uv venv

# Install nanobot-ai + websockets + mcp-games
COPY ../mcp/mcp-games /tmp/mcp-games
RUN uv pip install mcp websockets /tmp/mcp-games "nanobot-ai @ https://github.com/HKUDS/nanobot/archive/e7d371ec1e6531b28898ec2c869ef338e8dd46ec.zip"

# Run gateway in background + websocket bridge on port 8765
CMD ["sh", "-c", "python /app/nanobot/entrypoint.py & sleep 5 && /app/nanobot/.venv/bin/python /app/nanobot/websocket_bridge.py"]
