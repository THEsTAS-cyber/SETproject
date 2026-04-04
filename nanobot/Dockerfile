# Adapted from se-toolkit-lab-8
# Simplified for ProjectSET — without MCP packages

ARG REGISTRY_PREFIX_DOCKER_HUB
FROM ${REGISTRY_PREFIX_DOCKER_HUB:-}ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app/nanobot
COPY config.template.json pyproject.toml entrypoint.py ./
COPY workspace/ ./workspace/

# Use template as default config
RUN cp config.template.json config.json

RUN uv venv

# Install nanobot-ai (the core framework)
RUN uv pip install mcp "nanobot-ai @ https://github.com/HKUDS/nanobot/archive/e7d371ec1e6531b28898ec2c869ef338e8dd46ec.zip"

CMD ["python", "/app/nanobot/entrypoint.py"]
