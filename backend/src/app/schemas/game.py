"""Pydantic schemas for game API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, computed_field


class PriceEntryOut(BaseModel):
    """Price entry output schema."""

    id: int
    region: str
    currency: str
    current_price: float | None
    original_price: float | None
    discount_percent: int | None
    ps_plus_price: float | None
    collection: str | None
    collected_at: datetime

    # PS Store link will be injected by router
    store_url: str | None = None

    model_config = {"from_attributes": True}


class GameCreate(BaseModel):
    """Schema for creating a game (admin)."""

    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    cover_url: str | None = None
    platforms: list[str] = Field(default_factory=list)
    content_type: str | None = None
    top_category: str | None = None
    audio_languages: list[str] = Field(default_factory=list)
    subtitle_languages: list[str] = Field(default_factory=list)
    release_date: datetime | None = None
    store_url: str | None = None


class GameOut(BaseModel):
    """Game output schema."""

    id: int
    ps_id: int | None
    sku: str | None
    title_id: str | None
    concept_id: int | None
    name: str
    description: str | None
    cover_url: str | None
    platforms: list[str]
    content_type: str | None
    top_category: str | None
    audio_languages: list[str]
    subtitle_languages: list[str]
    release_date: datetime | None
    store_url: str | None
    created_at: datetime
    modified_at: datetime | None
    last_synced_at: datetime | None
    price_entries: list[PriceEntryOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class GamePriceComparison(BaseModel):
    """Schema for comparing game prices across regions."""

    game_id: int
    name: str
    title_id: str | None
    cover_url: str | None
    prices: list[PriceEntryOut]

    model_config = {"from_attributes": True}


# ── Helper: build PS Store URL ──

_PS_STORE_BASE = "https://store.playstation.com"

# Region code → PS Store locale prefix
_REGION_STORE_MAP: dict[str, str] = {
    "ua": "uk-UA",
    "us": "en-US",
    "gb": "en-GB",
    "de": "de-DE",
    "fr": "fr-FR",
    "pl": "pl-PL",
    "tr": "tr-TR",
    "jp": "ja-JP",
    "br": "pt-BR",
    "au": "en-AU",
    "ru": "ru-RU",
    "ca": "en-CA",
    "mx": "es-MX",
    "ar": "es-AR",
    "kr": "ko-KR",
    "hk": "zh-HK",
    "tw": "zh-TW",
    "in": "en-IN",
}


def build_ps_store_url(region: str, title_id: str | None, sku_suffix: str | None = None) -> str | None:
    """Build a PS Store URL for a game in a given region."""
    if not title_id:
        return None
    locale = _REGION_STORE_MAP.get(region, "en-US")
    if sku_suffix:
        return f"{_PS_STORE_BASE}/{locale}/product/{title_id}/{sku_suffix}"
    return f"{_PS_STORE_BASE}/{locale}/product/{title_id}"


def inject_store_urls(game_data: dict[str, Any]) -> dict[str, Any]:
    """Inject store_url into each price_entry based on region + title_id + sku_suffix."""
    title_id = game_data.get("title_id")
    sku_suffix = game_data.get("sku_suffix")
    if "price_entries" in game_data and isinstance(game_data["price_entries"], list):
        for entry in game_data["price_entries"]:
            entry["store_url"] = build_ps_store_url(entry["region"], title_id, sku_suffix)
    return game_data
