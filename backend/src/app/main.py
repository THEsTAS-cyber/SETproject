"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.scheduler import scheduler
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    print(f"Starting {settings.name}...")

    # Create tables if they don't exist
    print("Initializing database tables...")
    await init_db()
    print("Database tables ready.")

    # Start price sync scheduler
    await scheduler.start()

    yield

    # Stop price sync scheduler
    await scheduler.stop()
    print(f"Shutting down {settings.name}...")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.name,
        debug=settings.debug,
        lifespan=lifespan,
    )

    # CORS middleware
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Health check endpoint
    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok", "service": settings.name}

    # Include routers
    from app.routers import admin, games
    app.include_router(games.router)
    app.include_router(admin.router)

    return app


app = create_app()
