# Adapted from se-toolkit-lab-8

ARG REGISTRY_PREFIX_DOCKER_HUB
FROM ${REGISTRY_PREFIX_DOCKER_HUB:-}ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app/nanobot
COPY config.template.json config.json pyproject.toml entrypoint.py ./
COPY workspace/ ./workspace/

RUN uv venv

# Install nanobot-ai + nanobot-websocket-channel + mcp-games
COPY --from=workspace /mcp/mcp-games /tmp/mcp-games
COPY --from=workspace /nanobot-websocket-channel/nanobot-webchat /tmp/nanobot-webchat
COPY --from=workspace /nanobot-websocket-channel/nanobot-channel-protocol /tmp/nanobot-channel-protocol
RUN uv pip install mcp websockets aiohttp \
    /tmp/nanobot-channel-protocol \
    /tmp/nanobot-webchat \
    /tmp/mcp-games \
    "nanobot-ai @ https://github.com/HKUDS/nanobot/archive/e7d371ec1e6531b28898ec2c869ef338e8dd46ec.zip"

# Ensure webchat is enabled in config
RUN python -c "import json; c=json.load(open('/app/nanobot/config.json')); c['channels']['webchat']={'enabled':True,'allowFrom':['*']}; json.dump(c,open('/app/nanobot/config.json','w'),indent=2)"

CMD ["python", "/app/nanobot/entrypoint.py"]
