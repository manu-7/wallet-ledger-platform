import pytest
pytestmark = pytest.mark.asyncio

async def test_signup_creates_user(client):
    resp = await client.post("/auth/signup", json={"email": "alice@example.com", "password": "secret123"})
    assert resp.status_code == 201
    assert "password_hash" not in resp.json()

async def test_signup_duplicate_email_rejected(client):
    await client.post("/auth/signup", json={"email": "bob@example.com", "password": "secret123"})
    resp = await client.post("/auth/signup", json={"email": "bob@example.com", "password": "different"})
    assert resp.status_code == 409

async def test_login_success_returns_tokens(client):
    await client.post("/auth/signup", json={"email": "carol@example.com", "password": "secret123"})
    resp = await client.post("/auth/login", json={"email": "carol@example.com", "password": "secret123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

async def test_login_wrong_password_rejected(client):
    await client.post("/auth/signup", json={"email": "dave@example.com", "password": "secret123"})
    resp = await client.post("/auth/login", json={"email": "dave@example.com", "password": "wrongpassword"})
    assert resp.status_code == 401
