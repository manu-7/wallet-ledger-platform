import uuid
import pytest
pytestmark = pytest.mark.asyncio

async def _h(token):
    return {"Authorization": f"Bearer {token}"}

async def _create_account(client, token):
    headers = await _h(token)
    resp = await client.post("/accounts/", json={"account_type": "user_wallet"}, headers=headers)
    return resp.json()

async def _deposit(client, token, account_id, amount):
    headers = await _h(token)
    return await client.post(f"/accounts/{account_id}/deposit", json={"amount": amount, "idempotency_key": f"dep-{uuid.uuid4()}"}, headers=headers)

async def test_deposit_credits_account(client, signed_up_user):
    account = await _create_account(client, signed_up_user["access_token"])
    resp = await _deposit(client, signed_up_user["access_token"], account["id"], 500)
    assert resp.status_code == 201
    headers = await _h(signed_up_user["access_token"])
    get_resp = await client.get(f"/accounts/{account['id']}", headers=headers)
    assert get_resp.json()["balance_cache"] == "500.00"

async def test_transfer_moves_money_correctly(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    a = await _create_account(client, signed_up_user["access_token"])
    b = await _create_account(client, signed_up_user["access_token"])
    await _deposit(client, signed_up_user["access_token"], a["id"], 1000)
    resp = await client.post("/transactions/transfer", json={"from_account_id": a["id"], "to_account_id": b["id"], "amount": 300, "idempotency_key": f"tx-{uuid.uuid4()}"}, headers=headers)
    assert resp.status_code == 201
    a_after = (await client.get(f"/accounts/{a['id']}", headers=headers)).json()
    b_after = (await client.get(f"/accounts/{b['id']}", headers=headers)).json()
    assert a_after["balance_cache"] == "700.00"
    assert b_after["balance_cache"] == "300.00"

async def test_transfer_insufficient_balance_rejected(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    a = await _create_account(client, signed_up_user["access_token"])
    b = await _create_account(client, signed_up_user["access_token"])
    resp = await client.post("/transactions/transfer", json={"from_account_id": a["id"], "to_account_id": b["id"], "amount": 100, "idempotency_key": f"tx-{uuid.uuid4()}"}, headers=headers)
    assert resp.status_code == 400

async def test_transfer_to_same_account_rejected(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    a = await _create_account(client, signed_up_user["access_token"])
    await _deposit(client, signed_up_user["access_token"], a["id"], 500)
    resp = await client.post("/transactions/transfer", json={"from_account_id": a["id"], "to_account_id": a["id"], "amount": 100, "idempotency_key": f"tx-{uuid.uuid4()}"}, headers=headers)
    assert resp.status_code == 400

async def test_idempotency_prevents_duplicate_transfer(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    a = await _create_account(client, signed_up_user["access_token"])
    b = await _create_account(client, signed_up_user["access_token"])
    await _deposit(client, signed_up_user["access_token"], a["id"], 1000)
    key = f"tx-{uuid.uuid4()}"
    payload = {"from_account_id": a["id"], "to_account_id": b["id"], "amount": 200, "idempotency_key": key}
    first = await client.post("/transactions/transfer", json=payload, headers=headers)
    second = await client.post("/transactions/transfer", json=payload, headers=headers)
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    a_after = (await client.get(f"/accounts/{a['id']}", headers=headers)).json()
    b_after = (await client.get(f"/accounts/{b['id']}", headers=headers)).json()
    assert a_after["balance_cache"] == "800.00"
    assert b_after["balance_cache"] == "200.00"

async def test_cannot_transfer_from_account_you_dont_own(client, signed_up_user):
    await client.post("/auth/signup", json={"email": "victim@example.com", "password": "secret123"})
    other_login = await client.post("/auth/login", json={"email": "victim@example.com", "password": "secret123"})
    other_token = other_login.json()["access_token"]
    victim_account = await _create_account(client, other_token)
    await _deposit(client, other_token, victim_account["id"], 1000)
    attacker_account = await _create_account(client, signed_up_user["access_token"])
    headers = await _h(signed_up_user["access_token"])
    resp = await client.post("/transactions/transfer", json={"from_account_id": victim_account["id"], "to_account_id": attacker_account["id"], "amount": 500, "idempotency_key": f"tx-{uuid.uuid4()}"}, headers=headers)
    assert resp.status_code == 403

async def test_transaction_history_reflects_transfer(client, signed_up_user):
    headers = await _h(signed_up_user["access_token"])
    a = await _create_account(client, signed_up_user["access_token"])
    b = await _create_account(client, signed_up_user["access_token"])
    await _deposit(client, signed_up_user["access_token"], a["id"], 1000)
    await client.post("/transactions/transfer", json={"from_account_id": a["id"], "to_account_id": b["id"], "amount": 150, "idempotency_key": f"tx-{uuid.uuid4()}", "description": "test note"}, headers=headers)
    history_resp = await client.get("/transactions/history", headers=headers)
    assert history_resp.status_code == 200
    entries = history_resp.json()
    assert len(entries) >= 3
    assert "test note" in [e["description"] for e in entries]
