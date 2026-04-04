#!/usr/bin/env python3
"""Resolve environment variables into config and launch nanobot gateway.

Simplified for ProjectSET — without MCP packages.
Add MCP servers back when you install mcp-lms / mcp-obs.
"""

import json
import os
from pathlib import Path


def main():
    config_path = Path("/app/nanobot/config.json")
    resolved_path = Path("/tmp/config.resolved.json")
    workspace_path = Path("/app/nanobot/workspace")

    with open(config_path) as f:
        config = json.load(f)

    # Override from environment
    if llm_key := os.environ.get("LLM_API_KEY"):
        config["providers"]["custom"]["apiKey"] = llm_key
    if llm_base := os.environ.get("LLM_API_BASE_URL"):
        config["providers"]["custom"]["apiBase"] = llm_base
    if llm_model := os.environ.get("LLM_API_MODEL"):
        config["agents"]["defaults"]["model"] = llm_model
    if gateway_host := os.environ.get("NANOBOT_GATEWAY_CONTAINER_ADDRESS"):
        config["gateway"]["host"] = gateway_host
    if gateway_port := os.environ.get("NANOBOT_GATEWAY_CONTAINER_PORT"):
        config["gateway"]["port"] = int(gateway_port)

    # MCP servers — set venv Python if present
    venv_python = "/app/nanobot/.venv/bin/python"
    for server_name in config.get("tools", {}).get("mcpServers", {}):
        config["tools"]["mcpServers"][server_name]["command"] = venv_python

    with open(resolved_path, "w") as f:
        json.dump(config, f, indent=2)

    nanobot_bin = "/app/nanobot/.venv/bin/nanobot"
    os.execv(nanobot_bin, [nanobot_bin, "gateway", "--config", str(resolved_path), "--workspace", str(workspace_path)])


if __name__ == "__main__":
    main()
