# Project Idea — PS Store Price Comparator

## Product Definition

**End-user:** Gamers from Russia and CIS who use foreign PlayStation accounts (Turkey, Argentina, Poland, etc.) due to PS Store restrictions in their region.

**Problem:** After the PS Store suspension in Russia, users must find which region offers the lowest price for a specific game. This requires visiting each region's store individually, manually converting currencies, and tracking discounts. It is tedious and time-consuming.

**Product in one sentence:** A unified PS Store price comparison tool that automatically collects prices from 67 regions, converts them to rubles, and highlights the best deal for each game.

**Core feature:** Automated price collection from 67 PS Store regions every 12 hours with ruble conversion and best-price highlighting.

---

## Implementation Plan

### Version 1 — PS Store Price Catalog

**Does one thing well:** Browse and compare game prices across 67 PS Store regions with AI-powered Q&A.

**Backend:**
- FastAPI REST API with game catalog and price data
- Endpoints: `GET /games`, `GET /games/{id}`, `GET /games/search?q=`, `POST /auth/register`, `POST /auth/login`
- PostgreSQL database with SQLAlchemy
- Scheduled ETL job to fetch prices from PSPricing API every 12 hours

**Database:**
- `games` table: id, title, description, price, release_date, genres (array), rating, cover_url, created_at
- `users` table with JWT auth
- `wishlist` table for user favorites

**User panel (frontend-user):**
- Game catalog grid with search and filters (platform, type, genre)
- Game detail page with price comparison across 67 regions
- Wishlist page
- Nanobot chat widget (bottom-right corner)

**Nanobot:**
- MCP tools that query the backend API (`GET /games`, search, cheapest)
- Answers questions: "show me cheap games", "find Elden Ring", "what RPG games do you have?"
- Connected to Qwen via qwen-code-api

**Deliverable:** Fully functional price catalog — games are auto-imported, users browse + compare prices + ask nanobot.

---

### Version 2 — Enhanced Experience

**Builds on V1:**
- Price history chart on game page
- Price drop notifications for wishlist items (email or in-app)
- Export price list to CSV
- Side-by-side game comparison
- Deploy to a public URL (VPS + Caddy with HTTPS)

**New backend features:**
- Price history tracking table
- Notification service for wishlist items
- User accounts with enhanced profiles

**New frontend features:**
- Price history chart on game page
- Notifications center
- Export button (CSV)
- Comparison view for two games

**Nanobot improvements:**
- "Which game dropped in price the most?"
- "Notify me when God of War goes on sale"
- "Compare Elden Ring and Baldur's Gate 3 prices"

**Deliverable:** Public-facing PS Store price comparator with price history, notifications, and deployed availability.

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
                        │                       │
                        │              [PSPricing API (ETL)]
                        │
                        └──────────────→ [Admin Panel (future)]
```
