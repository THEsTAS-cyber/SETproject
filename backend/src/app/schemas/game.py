"""Pydantic schemas for game API."""

from pydantic import BaseModel, Field


class GameCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    price: float = Field(..., ge=0)
    cover_url: str | None = None
    genres: list[str] = Field(default_factory=list)
    rating: float | None = Field(None, ge=0, le=5)
    store_url: str | None = None


class GameOut(BaseModel):
    id: int
    title: str
    description: str | None
    price: float
    cover_url: str | None
    genres: list[str]
    rating: float | None
    store_url: str | None

    model_config = {"from_attributes": True}
