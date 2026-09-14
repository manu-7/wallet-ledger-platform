# Wallet & Ledger Platform

A backend system for managing user wallets through a proper **double-entry ledger** - the same accounting pattern used by real fintech infrastructure providers (payment processors, banking-as-a-service platforms) to guarantee that money is never silently created, lost, or duplicated.

Instead of storing a mutable `balance` field and updating it on every transaction, every money movement writes an immutable pair of ledger entries - one debit, one credit. A wallet's balance is always *derived* from summing its ledger, making the system self-verifying and auditable by design.

## Why double-entry, not a transactions table

Most simple wallet implementations look like this:

```
transactions: id, from_wallet, to_wallet, amount, timestamp
```

This logs *events*, but balance is still a mutable column that can silently drift from reality if a bug ever touches it. There's nothing to check it against.

This project instead enforces the accounting identity:

```
SUM(debits) == SUM(credits)   — for every transaction, always
```

Every transfer creates two rows tied to one `transaction_id`. A reconciliation job periodically verifies this invariant holds across the entire ledger - if it doesn't, something is structurally wrong, and the system can prove it rather than hope it isn't.

## Core features

- **Double-entry ledger** — append-only `ledger_entries` table; balances are never stored as source of truth, only cached for fast reads
- **Idempotent transfers** — a unique `idempotency_key` per transaction (enforced at the database level) makes retried requests safe; a duplicate request returns the original result instead of double-processing
- **Concurrency-safe transfers** — row-level locking (`SELECT ... FOR UPDATE`) prevents two simultaneous requests from double-spending the same balance
- **JWT authentication** — access + refresh token flow; every transfer is authorized against the caller's own account, checked atomically alongside the balance
- **Deposits stay double-entry** — adding money isn't a bare balance increment; it's a transfer from a dedicated "system funding" account, so every rupee in the system — even money entering from outside — has a matching debit and credit
- **Cached balance reads** — cache-aside pattern with invalidation on write, so high-traffic balance lookups don't hit the ledger on every request
- **Automated reconciliation** — a background job re-verifies the debit/credit invariant across the ledger and flags mismatches

## Tech stack

- **FastAPI** — async API layer
- **PostgreSQL** — source of truth, with SQLAlchemy (async) + Alembic for migrations
- **Redis** — idempotency keys, balance caching
- **Celery** — background reconciliation jobs
- **JWT (python-jose) + bcrypt (passlib)** — authentication

## Schema overview

| Table | Purpose |
|---|---|
| `users` | Account holders |
| `accounts` | One or more wallets per user; `balance_cache` is a cache, never the source of truth |
| `transactions` | Groups a pair of ledger entries; carries the idempotency key |
| `ledger_entries` | Append-only debit/credit rows — the actual ledger |

## Frontend

A React + Vite + Tailwind dashboard in `frontend/` — sign up/log in, view
accounts, send transfers by recipient email (never raw UUIDs), and see full
payment history. See `frontend/README.md` for setup.

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

**Redis** (required for caching and Celery's broker):
```bash
docker run -d --name wallet-redis -p 6379:6379 redis
```

**Celery** (reconciliation worker + scheduler, run in two separate terminals):
```bash
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

To manually trigger a reconciliation check without waiting for the schedule:
```bash
python -c "from app.services.reconciliation_service import run_ledger_reconciliation; print(run_ledger_reconciliation())"
```

## A note on Celery in production

Celery requires an always-on worker process, which most free-tier hosting
platforms don't support (they're built around request/response web servers,
not persistent background processes). For a production deployment, this
would run as a dedicated background worker service (e.g. Render's
Background Worker type, or a Kubernetes Deployment) alongside a managed
Redis instance. For this portfolio deployment, Celery runs locally as
designed above; the reconciliation logic itself
(`app/services/reconciliation_service.py`) is decoupled from Celery and can
be invoked directly or via a simple cron/scheduled script if a free-tier
deployment without a persistent worker is preferred.

## Status

Core schema, auth, transfer logic (idempotent + concurrency-safe), Redis
caching, transaction history, and Celery-based reconciliation are complete
and tested. Automated test suite is the next planned addition.
