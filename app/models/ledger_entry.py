import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base 

class EntryType(str,enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"
    
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id:             Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False, index=True)
    account_id:     Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True)
    entry_type:     Mapped[EntryType] = mapped_column(Enum(EntryType),nullable=False)
    amount    :     Mapped[Decimal] = mapped_column(Numeric(18,2),nullable=False)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
    transaction:    Mapped["Transaction"] = relationship(back_populates="ledger_entries")
    account:        Mapped["Account"] = relationship(back_populates="ledger_entries")
