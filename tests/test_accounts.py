import pytest
pytestmark = pytest.mark.asyncio

async def _h(token):
    return {"Authorization": f"Bearer {token}"}

async def test_create_account_requires_auth(client):
    resp = await client.post("/accounts/", json={"account_type": "user_wallet"})
    assert resp.status_code == 401

async def test_create_and_get_own_account(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    create_resp = await client.post("/accounts/", json={"account_type": "user_wallet"}, headers=headers)
    assert create_resp.status_code == 201
    account = create_resp.json()
    assert account["balance_cache"] == "0.00"
    get_resp = await client.get(f"/accounts/{account['id']}", headers=headers)
    assert get_resp.status_code == 200

async def test_cannot_view_another_users_account(client, signed_up_user):
    await client.post("/auth/signup", json={"email": "other@example.com", "password": "secret123"})
    other_login = await client.post("/auth/login", json={"email": "other@example.com", "password": "secret123"})
    other_token = other_login.json()["access_token"]
    headers_a = await _h(signed_up_user["access_token"])
    headers_b = await _h(other_token)
    create_resp = await client.post("/accounts/", json={"account_type": "user_wallet"}, headers=headers_a)
    account_id = create_resp.json()["id"]
    resp = await client.get(f"/accounts/{account_id}", headers=headers_b)
    assert resp.status_code == 403

async def test_lookup_by_email_returns_account_id(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    create_resp = await client.post("/accounts/", json={"account_type": "user_wallet"}, headers=headers)
    account_id = create_resp.json()["id"]
    lookup_resp = await client.get(f"/accounts/lookup?email={signed_up_user['email']}", headers=headers)
    assert lookup_resp.status_code == 200
    assert lookup_resp.json()["account_id"] == account_id

async def test_lookup_unknown_email_returns_404(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    resp = await client.get("/accounts/lookup?email=nobody-real@example.com", headers=headers)
    assert resp.status_code == 404
