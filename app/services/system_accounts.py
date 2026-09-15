"""
System accounts represent counterparties that aren't real users — e.g. an
"external funding" source for deposits. Even money entering the platform
from outside stays double-entry: a deposit is a transfer FROM this account
TO the user's account, never a bare balance increment.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Account

SYSTEM_USER_EMAIL = "system@wallet-ledger.internal"
FUNDING_ACCOUNT_TYPE = "system_funding"


async def get_or_create_system_funding_account(db: AsyncSession) -> Account:
    result = await db.execute(select(User).where(User.email == SYSTEM_USER_EMAIL))
    system_user = result.scalar_one_or_none()

    if system_user is None:
        system_user = User(email=SYSTEM_USER_EMAIL, password_hash="!disabled!")
        db.add(system_user)
        await db.flush()

    result = await db.execute(
        select(Account).where(
            Account.user_id == system_user.id,
            Account.account_type == FUNDING_ACCOUNT_TYPE,
        )
    )
    funding_account = result.scalar_one_or_none()

    if funding_account is None:
        funding_account = Account(user_id=system_user.id, account_type=FUNDING_ACCOUNT_TYPE)
        db.add(funding_account)
        await db.flush()

    return funding_account
