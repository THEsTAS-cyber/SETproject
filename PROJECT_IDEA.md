# Project Idea — Game Catalog

## Product Definition

**End-user:** Gamers looking for a curated, searchable catalog of games with pricing and metadata.

**Problem:** Game stores are fragmented across multiple platforms (Steam, Epic, GOG). Users waste time comparing prices, finding new releases, and discovering deals. A single curated catalog with an AI assistant solves this.

**Product in one sentence:** A curated game catalog with an AI-powered assistant that helps users discover games, compare prices, and find the best deals.

**Core feature:** Searchable game catalog with an AI chat assistant (nanobot) that answers natural-language questions like "what are the cheapest games right now?" or "show me new releases."

---

## Implementation Plan

### Version 1 — Curated Game Catalog

**Does one thing well:** Browse and search a manually curated game catalog with AI-powered Q&A.

**Backend:**
- FastAPI REST API with CRUD for games
- Endpoints: `GET /games`, `GET /games/{id}`, `GET /games/search?q=`, `POST /games` (admin)
- PostgreSQL database with SQLAlchemy

**Database:**
- `games` table: id, title, description, price, release_date, genres (array), rating, cover_url, created_at

**Admin panel (frontend-admin):**
- Simple form to add/edit/delete games
- Protected by a basic admin password or hardcoded check

**User panel (frontend-user):**
- Game catalog grid with search and filters (by genre, price)
- Game detail page
- Nanobot chat widget (bottom-right corner)

**Nanobot:**
- MCP tool that queries the backend API (`GET /games`, search)
- Answers questions: "cheapest games", "new releases", "RPG games under $20"
- Connected to Qwen via qwen-code-api

**Deliverable:** Fully functional catalog — admins add games, users browse + ask nanobot.

---

### Version 2 — PS Store Aggregator

**Builds on V1:**
- Automated game import from **PS Store** API instead of manual entry
- Price tracking: track price history, show discounts
- User favorites/wishlist
- Nanobot gets new MCP tools: price comparison, discount alerts, recommendations
- Deploy to a public URL (VPS + Caddy with HTTPS)

**New backend features:**
- ETL pipeline to fetch games from PS Store API on a schedule (cron / Celery beat)
- Price history table
- User accounts with favorites

**New frontend features:**
- Price history chart on game page
- "On sale" section on homepage
- User favorites page

**Nanobot improvements:**
- "What dropped in price the most on PS Store?"
- "Recommend me a PS5 RPG under $15"
- "Notify me when God of War goes on sale"

**Deliverable:** Public-facing PS Store game aggregator with automated data, deployed and available for use.

---

## Architecture

```
Version 1:

  [User Browser] ──→ [Caddy :42002] ──→ [Next.js User Panel]
                        │                    │
                        │              [Nanobot Widget]
                        │                    │
                        ├──────────────→ [Nanobot Gateway]
                        │                       │
                        │                  [Qwen Code API]
                        │
                        ├──────────────→ [FastAPI Backend]
                        │                       │
                        │                  [PostgreSQL]
                        │
                        └──────────────→ [Next.js Admin Panel]
```
