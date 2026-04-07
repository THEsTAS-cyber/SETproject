"""PSPricing API client service."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.settings import settings

logger = logging.getLogger(__name__)


class PSPricingClient:
    """Client for PSPricing B2B API."""

    def __init__(self) -> None:
        self.base_url = settings.pspricing_base_url.rstrip("/")
        self.collection = settings.pspricing_collection
        self.timeout = 30.0

    async def fetch_collection(self, region: str) -> dict[str, Any] | None:
        """Fetch game data for a specific region.

        Args:
            region: Region code (e.g. 'us', 'tr', 'ar')

        Returns:
            Parsed JSON response or None on error
        """
        url = f"{self.base_url}{region}/collection/{self.collection}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning(f"Failed to fetch {region}: {e}")
            return None

    async def fetch_all_regions(self) -> list[dict[str, Any]]:
        """Fetch data from all configured regions.

        Returns:
            List of (region, data) tuples
        """
        results = []
        for region in settings.pspricing_regions:
            data = await self.fetch_collection(region)
            if data:
                results.append(data)
        return results
