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
    # Основные
    "us": "en-US", "gb": "en-GB", "de": "de-DE", "fr": "fr-FR", "jp": "ja-JP", "au": "en-AU",
    # Восточная Европа
    "ua": "uk-UA", "pl": "pl-PL", "ru": "ru-RU", "kz": "ru-KZ", "by": "ru-BY",
    # Дешёвые
    "tr": "tr-TR", "ar": "es-AR", "th": "th-TH", "in": "en-IN", "eg": "ar-EG",
    "ng": "en-NG", "za": "en-ZA", "id": "id-ID", "ph": "en-PH", "mx": "es-MX",
    # Европа
    "es": "es-ES", "it": "it-IT", "nl": "nl-NL", "be": "nl-BE", "at": "de-AT",
    "ch": "de-CH", "se": "sv-SE", "no": "no-NO", "dk": "da-DK", "fi": "fi-FI",
    "pt": "pt-PT", "ie": "en-IE", "cz": "cs-CZ", "hu": "hu-HU", "ro": "ro-RO",
    "bg": "bg-BG", "hr": "hr-HR", "sk": "sk-SK", "si": "sl-SI", "lt": "lt-LT",
    "lv": "lv-LV", "ee": "et-EE", "lu": "de-LU", "mt": "en-MT", "cy": "el-CY",
    "is": "en-IS", "gr": "el-GR",
    # Азия
    "hk": "zh-HK", "kr": "ko-KR", "tw": "zh-TW", "sg": "en-SG", "my": "en-MY", "vn": "vi-VN",
    # Ближний Восток
    "sa": "ar-SA", "ae": "ar-AE", "il": "en-IL", "qa": "ar-QA", "kw": "ar-KW",
    "bh": "ar-BH", "om": "ar-OM", "jo": "ar-JO", "lb": "ar-LB",
    # Африка
    "ma": "fr-MA",
    # Северная Америка
    "ca": "en-CA",
    # Южная Америка
    "br": "pt-BR", "cl": "es-CL", "co": "es-CO", "pe": "es-PE", "ec": "es-EC",
    "uy": "es-UY", "py": "es-PY", "bo": "es-BO", "ve": "es-VE",
    "cr": "es-CR", "pa": "es-PA", "gt": "es-GT", "sv": "es-SV", "hn": "es-HN",
    "ni": "es-NI", "do": "es-DO",
    # Океания
    "nz": "en-NZ",
}


def build_ps_store_url(region: str, concept_id: int | None) -> str | None:
    """Build a PS Store URL for a game in a given region."""
    if not concept_id:
        return None
    locale = _REGION_STORE_MAP.get(region, "en-US")
    return f"{_PS_STORE_BASE}/{locale}/concept/{concept_id}"


def inject_store_urls(game_data: dict[str, Any]) -> dict[str, Any]:
    """Inject store_url into each price_entry based on region + concept_id."""
    concept_id = game_data.get("concept_id")
    if "price_entries" in game_data and isinstance(game_data["price_entries"], list):
        for entry in game_data["price_entries"]:
            entry["store_url"] = build_ps_store_url(entry["region"], concept_id)
    return game_data
