"""Game CRUD router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db_session
from app.models.game import Game, PriceEntry
from app.schemas.game import GameCreate, GameOut, GamePriceComparison

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("", response_model=GameOut, status_code=201)
async def create_game(
    data: GameCreate,
    db: AsyncSession = Depends(get_db_session),
) -> Game:
    """Admin: add a new game."""
    game = Game(**data.model_dump())
    db.add(game)
    await db.flush()
    await db.refresh(game)
    return game


@router.get("", response_model=list[GameOut])
async def list_games(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session),
) -> list[Game]:
    """List all games with their price entries."""
    stmt = (
        select(Game)
        .options(selectinload(Game.price_entries))
        .order_by(Game.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


# ── Specific paths MUST come before /{game_id} to avoid routing conflicts ──


@router.get("/search", response_model=list[GameOut])
async def search_games(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db_session),
) -> list[Game]:
    """Search games by name or description."""
    stmt = (
        select(Game)
        .options(selectinload(Game.price_entries))
        .where(
            or_(
                Game.name.ilike(f"%{q}%"),
                Game.description.ilike(f"%{q}%"),
            )
        )
        .order_by(Game.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/compare", response_model=list[GamePriceComparison])
async def compare_games_by_title(
    name: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    """Find games by name and return their price comparisons."""
    stmt = (
        select(Game)
        .options(selectinload(Game.price_entries))
        .where(Game.name.ilike(f"%{name}%"))
        .order_by(Game.created_at.desc())
    )
    result = await db.execute(stmt)
    games = list(result.scalars().all())

    return [
        {
            "game_id": game.id,
            "name": game.name,
            "title_id": game.title_id,
            "cover_url": game.cover_url,
            "prices": game.price_entries,
        }
        for game in games
    ]


@router.get("/{game_id}", response_model=GameOut)
async def get_game(
    game_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> Game:
    """Get a single game by ID with price entries."""
    stmt = (
        select(Game)
        .options(selectinload(Game.price_entries))
        .where(Game.id == game_id)
    )
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/{game_id}/prices", response_model=GamePriceComparison)
async def get_game_price_comparison(
    game_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get price comparison for a game across all regions."""
    stmt = (
        select(Game)
        .options(selectinload(Game.price_entries))
        .where(Game.id == game_id)
    )
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        "game_id": game.id,
        "name": game.name,
        "title_id": game.title_id,
        "cover_url": game.cover_url,
        "prices": game.price_entries,
    }


@router.delete("/{game_id}", status_code=204)
async def delete_game(
    game_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Admin: delete a game."""
    game = await db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    await db.delete(game)
