# Wallet & Ledger — Frontend

A React + Vite + Tailwind frontend for the Wallet & Ledger API.

## Before running: enable CORS on your backend

Your FastAPI backend needs to allow requests from this frontend's origin, or the
browser will block every API call. Add this to `app/main.py`, right after
`app = FastAPI(...)`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local dev only — restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart your backend (`uvicorn app.main:app --reload`) after adding this.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5500`.

## What it does

- Sign up / log in (JWT stored in browser local storage)
- View your accounts and their cached balances
- Create new accounts
- Send transfers between accounts (generates a fresh idempotency key per request)
- See this session's transfer activity in a ledger-style table

## What it doesn't do (yet)

- No persisted transaction history — the backend doesn't expose a "list my
  transactions" endpoint yet, so Activity only reflects the current browser
  session
- No token refresh handling — if your access token expires (default 30 min),
  you'll need to log in again
- `to_account_id` must be pasted in manually — there's no cross-user account
  picker, since the API correctly doesn't expose other users' accounts

## Config

The API base URL is set in `src/api.js`:
```js
export const API_BASE = "http://localhost:8000";
```
Change this if your backend runs on a different host or port.

## Design notes

Modern fintech dashboard aesthetic (in the vein of Mercury/Ramp) rather than
generic SaaS-card styling: flat panels with hairline borders instead of
shadowed cards, tabular monospace figures for every monetary amount (digit
alignment matters in financial UIs), and a single considered accent color
(deep emerald for credits/primary actions, warm amber-brown for debits) used
functionally rather than decoratively.
