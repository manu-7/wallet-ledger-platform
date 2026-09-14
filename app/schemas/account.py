import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    account_type: str = "user_wallet"


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    account_type: str
    balance_cache: Decimal
    created_at: datetime


class AccountLookupOut(BaseModel):
    """Minimal, privacy-safe response for resolving a recipient by email.
    Deliberately excludes balance and user_id — a sender should be able
    to confirm WHO they're paying, never see the recipient's financial data.
    """
    account_id: uuid.UUID
    account_type: str
    