import uuid
from datetime import datetime, timezone
from decimal import Decimal


from sqlalchemy import String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Account(Base):
    __tablename__ = "accounts"
 
    id:             Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:        Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    account_type:   Mapped[str] = mapped_column(String(50), default="user_wallet", nullable=False)
    balance_cache:  Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user:           Mapped["User"] = relationship(back_populates="accounts")
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(back_populates="account")
 