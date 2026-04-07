"""Price synchronization service."""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game import Game, PriceEntry
from app.services.pspricing import PSPricingClient

logger = logging.getLogger(__name__)


class PriceSyncService:
    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session
        self.client = PSPricingClient()

    async def sync_all_regions(self) -> dict[str, int]:
        from app.settings import settings
        stats = {}
        for region in settings.pspricing_regions:
            data = await self.client.fetch_collection(region)
            if data:
                synced = await self._sync_region(data, region)
                stats[region] = synced
                logger.info(f"Synced {synced} games from {region}")
        return stats

    async def _sync_region(self, data: dict, region: str) -> int:
        count = 0
        items = data.get("data", data.get("games", []))
        for item in items:
            try:
                await self._upsert(item, region)
                count += 1
            except Exception as e:
                logger.error(f"Error syncing {item.get('id')}: {e}")
        return count

    async def _upsert(self, item: dict, region: str) -> None:
        name = item.get("name", item.get("title"))
        if not name:
            return
        stmt = select(Game).where(Game.name == name)
        result = await self.db.execute(stmt)
        game = result.scalar_one_or_none()
        if not game:
            game = Game(
                name=name,
                platforms=item.get("platforms", []),
                cover_url=item.get("cover_url"),
                store_url=item.get("store_url"),
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(game)
            await self.db.flush()

        pd = item.get("price", item.get("pricing", {}))
        price = pd.get("current_price", pd.get("price"))
        if price is None:
            return
        entry = PriceEntry(
            game_id=game.id,
            region=region,
            currency=pd.get("currency", "USD"),
            current_price=float(price),
            original_price=float(pd["original_price"]) if pd.get("original_price") else None,
            discount_percent=int(pd.get("discount_percent", 0)),
            collected_at=datetime.now(timezone.utc),
        )
        self.db.add(entry)
        await self.db.flush()
