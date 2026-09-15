# Wallet & Ledger Platform

A backend system for managing user wallets through a proper **double-entry ledger** — the same accounting pattern used by real fintech infrastructure providers to guarantee that money is never silently created, lost, or duplicated.

Instead of storing a mutable `balance` field, every money movement writes an immutable pair of ledger entries — one debit, one credit. A wallet's balance is always *derived* from its ledger, making the system self-verifying and auditable by design.

## Core features

- **Double-entry ledger** — append-only `ledger_entries` table; balances are cached for fast reads but never trusted as source of truth
- **Idempotent transfers & deposits** — a unique `idempotency_key` per transaction (enforced at the database level) makes retried requests safe
- **Concurrency-safe transfers** — row-level locking (`SELECT ... FOR UPDATE`), lock order sorted by account ID to prevent deadlocks
- **Deposits stay double-entry** — adding money is a transfer from a dedicated system funding account, never a bare balance increment
- **JWT authentication** — access + refresh tokens; every transfer is authorized against the caller's own account, checked inside the locked transaction
- **Recipient lookup by email** — no raw UUIDs exposed to end users, ever
- **Cached balance reads** — cache-aside pattern with invalidation on write
- **Automated reconciliation** — a Celery job re-verifies the debit/credit invariant across the ledger on a schedule
- **Transaction history** — full persisted ledger view per user

## Tech stack

**Backend:** FastAPI, PostgreSQL (SQLAlchemy async + Alembic), Redis, Celery, JWT (python-jose) + bcrypt (passlib)
**Frontend:** React, Vite, Tailwind CSS, lucide-react

## Schema overview

| Table | Purpose |
|---|---|
| `users` | Account holders |
| `accounts` | One or more wallets per user; `balance_cache` is a cache, never source of truth |
| `transactions` | Groups a pair of ledger entries; carries the idempotency key |
| `ledger_entries` | Append-only debit/credit rows — the actual ledger |

## Running locally

**Backend:**
```bash
python -m venv venv
venv\Scripts\activate          # or source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Redis:**
```bash
docker run -d --name wallet-redis -p 6379:6379 redis
```

**Celery (reconciliation worker + scheduler, two terminals):**
```bash
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

## Running tests

Create a dedicated test database once:
```sql
CREATE DATABASE wallet_db_test;
```
Then:
```bash
pytest -v
```
Covers signup/login, account ownership/authorization, transfer correctness, insufficient-balance rejection, and — critically — that replaying an identical request with the same idempotency key never moves money twice. Tests also run automatically on every push via GitHub Actions.

## Running with Docker

- **`docker-compose.yml`** — local development, live code reload
- **`docker-compose.prod.yml`** — production-style: gunicorn with 4 uvicorn workers, non-root container user, no live code mount, `restart: unless-stopped`

```bash
cp .env.docker.example .env
# edit .env: real JWT_SECRET, real POSTGRES_PASSWORD
docker compose up --build
```

## A note on Celery in production

Celery requires an always-on worker process, which most free-tier hosting platforms don't support. For a real production deployment, this would run as a dedicated background worker service (e.g. Render's Background Worker type) alongside managed Redis. The reconciliation logic itself (`app/services/reconciliation_service.py`) is decoupled from Celery and can be invoked directly if a free-tier deployment without a persistent worker is preferred.

## Status

Core schema, auth, idempotent + concurrency-safe transfers, deposits, Redis caching, transaction history, Celery reconciliation, automated tests, CI, and a production Docker setup are complete.
