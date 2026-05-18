from sqlalchemy import ForeignKey, String, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class TrackStat(Base):
    __tablename__ = "track_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    track_id: Mapped[int] = mapped_column(ForeignKey("tracks.id"), nullable=False)
    platform_id: Mapped[int] = mapped_column(ForeignKey("platforms.id"), nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    streams: Mapped[int] = mapped_column(Integer, default=0)
    gross_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    artist_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    label_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(10), default="RUB")

    track: Mapped["Track"] = relationship("Track", back_populates="stats")
    platform: Mapped["Platform"] = relationship("Platform")
