import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Account, Transaction, LedgerEntry, EntryType
from app.core.redis_client import invalidate_balance_cache


async def transfer_funds(
    db: AsyncSession,
    from_account_id: uuid.UUID,
    to_account_id: uuid.UUID,
    amount: Decimal,
    idempotency_key: str,
    requesting_user_id: uuid.UUID,
    description: str | None = None,
) -> Transaction:
    if from_account_id == to_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to the same account.",
        )

    # --- Idempotency check ---
    # If this exact request was already processed, return the existing
    # transaction instead of creating new ledger entries.
    existing = await db.execute(
        select(Transaction).where(Transaction.idempotency_key == idempotency_key)
    )
    existing_txn = existing.scalar_one_or_none()
    if existing_txn is not None:
        return existing_txn

    # --- Row-level locking ---
    # Lock both accounts in a consistent order (by id) to avoid deadlocks
    # when two transfers happen between the same pair of accounts in
    # opposite directions at the same time.
    account_ids_in_order = sorted([from_account_id, to_account_id], key=str)
    result = await db.execute(
        select(Account)
        .where(Account.id.in_(account_ids_in_order))
        .with_for_update()
    )
    accounts = {acc.id: acc for acc in result.scalars().all()}

    from_account = accounts.get(from_account_id)
    to_account = accounts.get(to_account_id)

    if from_account is None or to_account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="One or both accounts not found."
        )

    # --- Authorization ---
    # The caller must own the source account. Checked here, inside the
    # locked section, so it can't go stale between check and debit.
    if from_account.user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to transfer from this account.",
        )

    # --- Balance validation ---
    # The system funding account is exempt: it represents money entering
    # the ledger from outside (deposits), not a real bounded balance.
    if from_account.account_type != "system_funding" and from_account.balance_cache < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance."
        )

    # --- Create transaction + paired ledger entries ---
    transaction = Transaction(idempotency_key=idempotency_key, description=description)
    db.add(transaction)
    await db.flush()  # get transaction.id without committing yet

    debit_entry = LedgerEntry(
        transaction_id=transaction.id,
        account_id=from_account.id,
        entry_type=EntryType.DEBIT,
        amount=amount,
    )
    credit_entry = LedgerEntry(
        transaction_id=transaction.id,
        account_id=to_account.id,
        entry_type=EntryType.CREDIT,
        amount=amount,
    )
    db.add_all([debit_entry, credit_entry])

    # --- Update cached balances (still derived correctness enforced by ledger) ---
    from_account.balance_cache -= amount
    to_account.balance_cache += amount

    try:
        await db.commit()
    except IntegrityError:
        # Unique constraint on idempotency_key caught a race: another
        # request with the same key committed first. Roll back and
        # return that transaction instead.
        await db.rollback()
        existing = await db.execute(
            select(Transaction).where(Transaction.idempotency_key == idempotency_key)
        )
        return existing.scalar_one()

    await db.refresh(transaction)

    # Invalidate cached balances for both accounts — next read will
    # re-derive from Postgres rather than serve a stale cached value.
    await invalidate_balance_cache(from_account.id)
    await invalidate_balance_cache(to_account.id)

    return transaction

async def deposit_funds(
    db: AsyncSession,
    to_account_id: uuid.UUID,
    amount: Decimal,
    idempotency_key: str,
    requesting_user_id: uuid.UUID,
    description: str | None = None,
) -> Transaction:
    """A deposit is a transfer FROM the system funding account TO the
    user's account. Kept as its own function (rather than reusing
    transfer_funds with a bypass flag) because the authorization direction
    is inverted: the caller must own the DESTINATION account, not the
    source — the source is always the system account.
    """
    from app.services.system_accounts import get_or_create_system_funding_account

    # --- Idempotency check ---
    existing = await db.execute(
        select(Transaction).where(Transaction.idempotency_key == idempotency_key)
    )
    existing_txn = existing.scalar_one_or_none()
    if existing_txn is not None:
        return existing_txn

    funding_account = await get_or_create_system_funding_account(db)

    # --- Row-level locking (same consistent-order pattern as transfers) ---
    account_ids_in_order = sorted([funding_account.id, to_account_id], key=str)
    result = await db.execute(
        select(Account).where(Account.id.in_(account_ids_in_order)).with_for_update()
    )
    accounts = {acc.id: acc for acc in result.scalars().all()}

    to_account = accounts.get(to_account_id)
    funding_account = accounts.get(funding_account.id)

    if to_account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    # --- Authorization: caller must own the account being funded ---
    if to_account.user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to deposit into this account.",
        )

    # --- Create transaction + paired ledger entries ---
    transaction = Transaction(
        idempotency_key=idempotency_key, description=description or "Deposit"
    )
    db.add(transaction)
    await db.flush()

    debit_entry = LedgerEntry(
        transaction_id=transaction.id,
        account_id=funding_account.id,
        entry_type=EntryType.DEBIT,
        amount=amount,
    )
    credit_entry = LedgerEntry(
        transaction_id=transaction.id,
        account_id=to_account.id,
        entry_type=EntryType.CREDIT,
        amount=amount,
    )
    db.add_all([debit_entry, credit_entry])

    to_account.balance_cache += amount
    # The system funding account's balance_cache is allowed to go negative
    # by design — it represents money entering the ledger from outside,
    # not a real bounded balance. Its true "balance" is meaningless; only
    # the ledger entries matter for reconciliation.
    funding_account.balance_cache -= amount

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.execute(
            select(Transaction).where(Transaction.idempotency_key == idempotency_key)
        )
        return existing.scalar_one()

    await db.refresh(transaction)
    await invalidate_balance_cache(to_account.id)
    await invalidate_balance_cache(funding_account.id)

    return transaction
