import redis.asyncio as redis

from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis() -> redis.Redis:
    return redis_client


# ---------- Balance caching (cache-aside pattern) ----------

BALANCE_CACHE_TTL_SECONDS = 300  # 5 minutes


def _balance_cache_key(account_id) -> str:
    return f"account:balance:{account_id}"


async def get_cached_balance(account_id) -> str | None:
    """Returns the cached balance as a string, or None on a cache miss."""
    return await redis_client.get(_balance_cache_key(account_id))


async def set_cached_balance(account_id, balance) -> None:
    await redis_client.set(
        _balance_cache_key(account_id), str(balance), ex=BALANCE_CACHE_TTL_SECONDS
    )


async def invalidate_balance_cache(account_id) -> None:
    """Called on any write that changes an account's balance. We invalidate
    rather than update-in-place, so the next read always re-derives from
    Postgres (the source of truth) instead of trusting a value we computed
    inside the cache layer.
    """
    await redis_client.delete(_balance_cache_key(account_id))