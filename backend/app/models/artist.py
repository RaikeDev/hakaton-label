from datetime import date
from sqlalchemy import String, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[int] = mapped_column(primary_key=True)
    stage_name: Mapped[str] = mapped_column(String(120), nullable=False)
    real_name: Mapped[str | None] = mapped_column(String(120))
    genre: Mapped[str | None] = mapped_column(String(120))
    label_name: Mapped[str] = mapped_column(String(120), default="Kamik")
    contract_since: Mapped[date | None] = mapped_column(Date)
    artist_share_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=70)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    datalens_url: Mapped[str | None] = mapped_column(String(1000))
    bank_name: Mapped[str | None] = mapped_column(String(120))
    account_number: Mapped[str | None] = mapped_column(String(50))
    recipient_name: Mapped[str | None] = mapped_column(String(160))

    tracks: Mapped[list["Track"]] = relationship("Track", back_populates="artist")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="artist")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="artist")
    approvals: Mapped[list["Approval"]] = relationship("Approval", back_populates="artist")
    sync_cases: Mapped[list["SyncCase"]] = relationship("SyncCase", back_populates="artist")
    users: Mapped[list["User"]] = relationship("User", back_populates="artist")
