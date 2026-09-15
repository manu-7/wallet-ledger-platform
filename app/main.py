import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.core.logging_config import configure_logging
from app.database import engine
from app.core.redis_client import redis_client
from app.routers import auth, account, transaction

configure_logging()
logger = logging.getLogger("wallet_ledger")

app = FastAPI(title="Wallet & Ledger Platform")

app.include_router(auth.router)
app.include_router(account.router)
app.include_router(transaction.router)


@app.get("/health")
async def health():
    checks = {"database": "unknown", "redis": "unknown"}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc.__class__.__name__}"
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc.__class__.__name__}"
    overall_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if overall_ok else 503,
        content={"status": "ok" if overall_ok else "degraded", "checks": checks},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
