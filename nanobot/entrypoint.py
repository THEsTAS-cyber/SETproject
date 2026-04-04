#!/usr/bin/env python3
"""Launch nanobot gateway + websocket bridge together."""

import json
import os
import signal
import subprocess
import sys
import time
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

    # MCP servers — set venv Python
    venv_python = "/app/nanobot/.venv/bin/python"
    for server_name in config.get("tools", {}).get("mcpServers", {}):
        config["tools"]["mcpServers"][server_name]["command"] = venv_python

    with open(resolved_path, "w") as f:
        json.dump(config, f, indent=2)

    # Launch gateway
    gateway_port = config["gateway"]["port"]
    nanobot_bin = "/app/nanobot/.venv/bin/nanobot"
    print(f"Starting nanobot gateway on port {gateway_port}...")
    gateway_proc = subprocess.Popen(
        [nanobot_bin, "gateway", "--config", str(resolved_path), "--workspace", str(workspace_path)],
    )

    # Wait for gateway to be ready
    print("Waiting for gateway...")
    time.sleep(10)
    print("Starting websocket bridge...")

    # Launch bridge in foreground
    bridge_proc = subprocess.Popen(
        [venv_python, "/app/nanobot/websocket_bridge.py"],
    )

    # Wait for either process to exit
    try:
        gateway_proc.wait()
    except KeyboardInterrupt:
        pass
    finally:
        bridge_proc.terminate()
        gateway_proc.terminate()


if __name__ == "__main__":
    main()
