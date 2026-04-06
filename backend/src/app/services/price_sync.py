"""Price synchronization service."""

import logging
from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game import Game, PriceEntry
from app.services.pspricing import PSPricingClient

logger = logging.getLogger(__name__)


class PriceSyncService:
    """Service for synchronizing prices from PSPricing API."""

    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session
        self.client = PSPricingClient()

    async def sync_all_regions(self) -> dict[str, int]:
        """Sync prices from all configured regions.

        Returns:
            Dict with stats: {region: games_synced_count}
        """
        stats = {}
        all_data = await self.client.fetch_all_regions()

        for data in all_data:
            region = data.get("meta", {}).get("region", "unknown")
            synced = await self._sync_region_data(data)
            stats[region] = synced
            logger.info(f"Synced {synced} games from region '{region}'")

        return stats

    async def _sync_region_data(self, data: dict) -> int:
        """Sync game data from a single region response.

        Args:
            data: Raw API response for one region

        Returns:
            Number of games synced
        """
        games_data = data.get("data", [])
        collection = data.get("meta", {}).get("collection")
        synced_count = 0

        for item in games_data:
            try:
                await self._upsert_game(item, collection)
                synced_count += 1
            except Exception as e:
                logger.error(f"Error syncing game {item.get('id')}: {e}")

        return synced_count

    async def _upsert_game(self, item: dict, collection: str | None) -> None:
        """Insert or update game and its price entry.

        Args:
            item: Raw game item from API
            collection: Collection name
        """
        parsed = PSPricingClient.parse_game_data(item)

        # Find or create game
        game = await self._find_or_create_game(parsed)

        # Create price entry
        await self._create_price_entry(game.id, parsed, collection)

        # Update game sync timestamp
        game.last_synced_at = datetime.utcnow()
        await self.db.flush()

    async def _find_or_create_game(self, parsed: dict) -> Game:
        """Find existing game or create new one.

        Priority for matching:
        1. ps_id (most reliable)
        2. title_id + name
        3. sku

        Args:
            parsed: Normalized game data

        Returns:
            Game instance (existing or new)
        """
        game = None

        # Try to find by ps_id
        if parsed.get("ps_id"):
            stmt = select(Game).where(Game.ps_id == parsed["ps_id"])
            result = await self.db.execute(stmt)
            game = result.scalar_one_or_none()

        # Try to find by title_id
        if not game and parsed.get("title_id"):
            stmt = select(Game).where(Game.title_id == parsed["title_id"])
            result = await self.db.execute(stmt)
            game = result.scalar_one_or_none()

        if game:
            # Update existing game
            self._update_game_fields(game, parsed)
            await self.db.flush()
        else:
            # Create new game
            game = Game(
                ps_id=parsed.get("ps_id"),
                sku=parsed.get("sku"),
                sku_suffix=parsed.get("sku_suffix"),
                title_id=parsed.get("title_id"),
                concept_id=parsed.get("concept_id"),
                name=parsed.get("name", ""),
                cover_url=parsed.get("cover_url"),
                platforms=parsed.get("platforms", []),
                content_type=parsed.get("content_type"),
                top_category=parsed.get("top_category"),
                audio_languages=parsed.get("audio_languages", []),
                subtitle_languages=parsed.get("subtitle_languages", []),
                release_date=parsed.get("release_date"),
                store_url=None,
            )
            self.db.add(game)
            await self.db.flush()

        return game

    def _update_game_fields(self, game: Game, parsed: dict) -> None:
        """Update game fields with new data if available.

        Args:
            game: Game instance to update
            parsed: New parsed data
        """
        if parsed.get("name"):
            game.name = parsed["name"]
        if parsed.get("cover_url"):
            game.cover_url = parsed["cover_url"]
        if parsed.get("platforms"):
            game.platforms = parsed["platforms"]
        if parsed.get("audio_languages"):
            game.audio_languages = parsed["audio_languages"]
        if parsed.get("subtitle_languages"):
            game.subtitle_languages = parsed["subtitle_languages"]
        if parsed.get("modified_at"):
            try:
                game.modified_at = datetime.fromisoformat(parsed["modified_at"])
            except (ValueError, TypeError):
                pass

    async def _create_price_entry(
        self, game_id: int, parsed: dict, collection: str | None
    ) -> None:
        """Create a new price entry for a game.

        Args:
            game_id: Game ID
            parsed: Normalized game data with pricing info
            collection: Collection name
        """
        region = parsed.get("region")
        if not region:
            logger.warning(f"No region in parsed data for game_id={game_id}")
            return

        # Check if entry already exists for this game+region+collection+time
        # To avoid duplicates, we'll delete old entries for same game+region
        # and create a new one (simplest approach for periodic sync)
        stmt = delete(PriceEntry).where(
            PriceEntry.game_id == game_id,
            PriceEntry.region == region,
        )
        await self.db.execute(stmt)

        # Create new entry
        price_entry = PriceEntry(
            game_id=game_id,
            region=region,
            currency=parsed.get("currency"),
            current_price=parsed.get("current_price"),
            original_price=parsed.get("original_price"),
            discount_percent=parsed.get("discount_percent"),
            ps_plus_price=parsed.get("ps_plus_price"),
            collection=collection,
            collected_at=datetime.utcnow(),
        )
        self.db.add(price_entry)
        await self.db.flush()
