"""Admin router for manual sync and monitoring."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.scheduler import scheduler
from app.services.price_sync import PriceSyncService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/sync")
async def trigger_manual_sync(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Trigger price synchronization immediately."""
    logger.info("Manual sync triggered via API")
    service = PriceSyncService(db)
    stats = await service.sync_all_regions()
    # No explicit commit needed — get_db_session commits automatically on success
    return {
        "status": "success",
        "message": "Price synchronization completed",
        "stats": stats,
    }


@router.get("/sync/status")
async def get_sync_status() -> dict:
    """Get scheduler status."""
    return {
        "running": scheduler._running,
        "interval_hours": scheduler.interval_hours,
        "task_active": scheduler._task is not None and not scheduler._task.done(),
    }
