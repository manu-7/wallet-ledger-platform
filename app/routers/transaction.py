from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Account, Transaction, LedgerEntry
from app.schemas.transaction import TransferRequest, TransactionOut
from app.schemas.ledger_entry import LedgerEntryWithNoteOut
from app.services.transaction_service import transfer_funds

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/transfer", response_model=TransactionOut, status_code=201)
async def transfer(
    payload: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transaction = await transfer_funds(
        db=db,
        from_account_id=payload.from_account_id,
        to_account_id=payload.to_account_id,
        amount=payload.amount,
        idempotency_key=payload.idempotency_key,
        requesting_user_id=current_user.id,
        description=payload.description,
    )
    return transaction


@router.get("/history", response_model=list[LedgerEntryWithNoteOut])
async def get_transaction_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    """Returns every ledger entry (debit or credit) touching any account
    the current user owns, newest first. This is what powers a real
    'Payment History' view — persisted, not just what happened this
    browser session.
    """
    result = await db.execute(
        select(LedgerEntry, Transaction.description, Transaction.idempotency_key)
        .join(Transaction, LedgerEntry.transaction_id == Transaction.id)
        .join(Account, LedgerEntry.account_id == Account.id)
        .where(Account.user_id == current_user.id)
        .order_by(LedgerEntry.created_at.desc())
        .limit(limit)
    )

    rows = result.all()
    return [
        LedgerEntryWithNoteOut(
            id=entry.id,
            transaction_id=entry.transaction_id,
            account_id=entry.account_id,
            entry_type=entry.entry_type,
            amount=entry.amount,
            created_at=entry.created_at,
            description=description,
            idempotency_key=idempotency_key,
        )
        for entry, description, idempotency_key in rows
    ]