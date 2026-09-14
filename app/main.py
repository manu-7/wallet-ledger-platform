from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, account, transaction
 
app = FastAPI(title="Wallet & Ledger Platform")
 
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(transaction.router)
 
 
@app.get("/health")
async def health():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)