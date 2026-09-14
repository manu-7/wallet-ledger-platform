import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Account
from app.schemas.account import AccountCreate, AccountOut, AccountLookupOut
from app.schemas.transaction import DepositRequest, TransactionOut
from app.core.redis_client import get_cached_balance, set_cached_balance
from app.services.transaction_service import deposit_funds

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = Account(user_id=current_user.id, account_type=payload.account_type)
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.post("/{account_id}/deposit", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def deposit(
    account_id: uuid.UUID,
    payload: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Adds funds to an account from the system funding source. Stays
    double-entry: this writes a DEBIT against the system account and a
    CREDIT against the user's account, same as any other transfer —
    it is never a bare balance increment.
    """
    return await deposit_funds(
        db=db,
        to_account_id=account_id,
        amount=payload.amount,
        idempotency_key=payload.idempotency_key,
        requesting_user_id=current_user.id,
        description=payload.description,
    )


@router.get("/lookup", response_model=AccountLookupOut)
async def lookup_account_by_email(
    email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resolve a recipient's account by their email, for sending a transfer.

    Deliberately requires authentication (prevents anonymous enumeration of
    which emails are registered) and returns only the account id/type —
    never balance or the recipient's user_id.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for that email.",
        )

    # A user may have multiple accounts; resolve to their earliest
    # user_wallet account as the "primary" one for receiving transfers.
    result = await db.execute(
        select(Account)
        .where(Account.user_id == user.id, Account.account_type == "user_wallet")
        .order_by(Account.created_at.asc())
        .limit(1)
    )
    account = result.scalar_one_or_none()

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That user has no wallet account yet.",
        )

    return AccountLookupOut(account_id=account.id, account_type=account.account_type)


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()

    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    # Authorization: a user can only view their own account.
    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this account.",
        )

    # Cache-aside: try Redis first, fall back to the DB value already
    # loaded above, and populate the cache for next time.
    cached = await get_cached_balance(account.id)
    if cached is not None:
        account.balance_cache = cached
    else:
        await set_cached_balance(account.id, account.balance_cache)

    return account


@router.get("/", response_model=list[AccountOut])
async def list_my_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Account).where(Account.user_id == current_user.id))
    accounts = result.scalars().all()
    return accounts