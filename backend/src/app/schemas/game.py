"""Pydantic schemas for game API."""

from datetime import datetime

from pydantic import BaseModel, Field


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
