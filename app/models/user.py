import uuid
from datetime import datetime,timezone

from sqlalchemy import String,DateTime
from sqlalchemy.orm import Mapped,mapped_column,relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id:             Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True, default=uuid.uuid4)
    email:          Mapped[str] = mapped_column(String(255),unique=True,index=True,nullable=False)
    password_hash:  Mapped[str] = mapped_column(String(255),nullable=False)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
    accounts:       Mapped[list["Account"]] = relationship(back_populates="user")