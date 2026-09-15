import uuid

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import User, Account, Transaction, LedgerEntry  # noqa: F401

TEST_DATABASE_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + "/wallet_db_test"

test_engine = create_async_engine(TEST_DATABASE_URL, future=True)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    yield
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


async def _override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def signed_up_user(client):
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    password = "testpass123"
    await client.post("/auth/signup", json={"email": email, "password": password})
    login_resp = await client.post("/auth/login", json={"email": email, "password": password})
    tokens = login_resp.json()
    return {"email": email, "password": password, "access_token": tokens["access_token"]}
