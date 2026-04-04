"""MCP server for game catalog queries."""

import os
import json
import urllib.request
from mcp.server.fastmcp import FastMCP

BACKEND_URL = os.environ.get("NANOBOT_LMS_BACKEND_URL", "http://backend:8000")

mcp = FastMCP("game-catalog")


@mcp.tool()
def list_games(genre: str | None = None) -> str:
    """List all games from the catalog. Optionally filter by genre.
    
    Args:
        genre: Optional genre filter (e.g. "RPG", "Action", "Sports")
    
    Returns:
        JSON string with game list including title, price, genres, rating
    """
    url = f"{BACKEND_URL}/api/games?limit=50"
    if genre:
        url += f"&genre={genre}"
    
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        games = json.loads(resp.read())
    
    if not games:
        return "No games found."
    
    lines = []
    for g in games:
        line = f"- {g['title']} — ${g['price']:.2f}"
        if g.get("genres"):
            line += f" [{', '.join(g['genres'])}]"
        if g.get("rating"):
            line += f" ★{g['rating']:.1f}"
        lines.append(line)
    
    return "\n".join(lines)


@mcp.tool()
def search_games(query: str) -> str:
    """Search games by title or description.
    
    Args:
        query: Search term
    
    Returns:
        JSON string with matching games
    """
    url = f"{BACKEND_URL}/api/games/search/?q={query}"
    
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        games = json.loads(resp.read())
    
    if not games:
        return f"No games found matching '{query}'."
    
    lines = []
    for g in games:
        line = f"- {g['title']} — ${g['price']:.2f}"
        if g.get("genres"):
            line += f" [{', '.join(g['genres'])}]"
        if g.get("rating"):
            line += f" ★{g['rating']:.1f}"
        lines.append(line)
    
    return "\n".join(lines)


@mcp.tool()
def cheapest_games(limit: int = 5) -> str:
    """Get the cheapest games from the catalog.
    
    Args:
        limit: Number of games to return (default 5)
    
    Returns:
        JSON string with cheapest games
    """
    url = f"{BACKEND_URL}/api/games?limit=100"
    
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        games = json.loads(resp.read())
    
    if not games:
        return "No games found."
    
    games.sort(key=lambda g: g["price"])
    cheapest = games[:limit]
    
    lines = []
    for g in cheapest:
        line = f"- {g['title']} — ${g['price']:.2f}"
        if g.get("genres"):
            line += f" [{', '.join(g['genres'])}]"
        lines.append(line)
    
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
