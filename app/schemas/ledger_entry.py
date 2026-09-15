import uuid
from datetime import datetime
from decimal import Decimal
 
from pydantic import BaseModel, ConfigDict
 
from app.models.ledger_entry import EntryType

class LedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    transaction_id: uuid.UUID
    account_id: uuid.UUID
    entry_type: EntryType
    amount: Decimal
    created_at: datetime


class LedgerEntryWithNoteOut(LedgerEntryOut):
    """History-view variant: includes the parent transaction's description
    and idempotency key, so a history list can render one useful row per
    entry without a second lookup per row."""

    description: str | None = None
    idempotency_key: str
