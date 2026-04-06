"""Background scheduler for price synchronization."""

import asyncio
import logging
from datetime import datetime

from app.database import async_session_factory
from app.services.price_sync import PriceSyncService
from app.settings import settings

logger = logging.getLogger(__name__)


class PriceSyncScheduler:
    """Scheduler that runs price synchronization periodically."""

    def __init__(self) -> None:
        self.interval_hours = settings.pspricing_sync_interval_hours
        self.interval_seconds = self.interval_hours * 3600
        self._task: asyncio.Task | None = None
        self._running = False

    async def start(self) -> None:
        """Start the background scheduler."""
        if self._task is not None:
            logger.warning("Scheduler already running")
            return

        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(
            f"Price sync scheduler started "
            f"(interval: {self.interval_hours} hours)"
        )

    async def stop(self) -> None:
        """Stop the background scheduler."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Price sync scheduler stopped")

    async def _run_loop(self) -> None:
        """Main loop that runs synchronization periodically."""
        while self._running:
            try:
                logger.info(
                    f"Starting price sync at {datetime.utcnow().isoformat()}"
                )
                await self._run_sync()
            except Exception as e:
                logger.error(f"Error in price sync cycle: {e}", exc_info=True)

            # Wait for next iteration
            logger.info(
                f"Next sync in {self.interval_hours} hours "
                f"at {datetime.utcnow().isoformat()}"
            )
            try:
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break

    async def _run_sync(self) -> None:
        """Run a single synchronization cycle."""
        async with async_session_factory() as session:
            try:
                service = PriceSyncService(session)
                stats = await service.sync_all_regions()
                await session.commit()
                logger.info(f"Price sync completed successfully: {stats}")
            except Exception as e:
                await session.rollback()
                logger.error(f"Price sync failed: {e}", exc_info=True)
                raise

    async def run_once_now(self) -> None:
        """Trigger a sync immediately (useful for testing)."""
        logger.info("Manual sync triggered")
        await self._run_sync()


# Global scheduler instance
scheduler = PriceSyncScheduler()
