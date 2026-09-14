import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TransferRequest(BaseModel):
    from_account_id: uuid.UUID
    to_account_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    idempotency_key: str
    description: str | None = None


class DepositRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    idempotency_key: str
    description: str | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    description: str | None
    idempotency_key: str
    created_at: datetime