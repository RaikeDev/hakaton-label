from datetime import date
from sqlalchemy import String, Date, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    artist_id: Mapped[int] = mapped_column(ForeignKey("artists.id"), nullable=False)
    period: Mapped[str] = mapped_column(String(50), nullable=False)
    gross_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    commission: Mapped[float | None] = mapped_column(Numeric(12, 2))
    tax: Mapped[float | None] = mapped_column(Numeric(12, 2))
    net_payout: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    paid_date: Mapped[date | None] = mapped_column(Date)

    artist: Mapped["Artist"] = relationship("Artist", back_populates="payments")
