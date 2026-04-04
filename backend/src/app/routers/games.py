"""Game CRUD router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.game import Game
from app.schemas.game import GameCreate, GameOut

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
    genre: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> list[Game]:
    """List all games, optionally filtered by genre."""
    stmt = select(Game).order_by(Game.created_at.desc()).offset(skip).limit(limit)
    if genre:
        stmt = stmt.where(Game.genres.contains([genre]))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{game_id}", response_model=GameOut)
async def get_game(
    game_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> Game:
    """Get a single game by ID."""
    game = await db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


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


@router.get("/search/", response_model=list[GameOut])
async def search_games(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db_session),
) -> list[Game]:
    """Search games by title or description."""
    stmt = (
        select(Game)
        .where(
            Game.title.ilike(f"%{q}%")
            | Game.description.ilike(f"%{q}%")
        )
        .order_by(Game.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
