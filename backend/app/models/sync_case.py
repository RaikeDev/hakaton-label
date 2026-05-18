from datetime import date
from sqlalchemy import String, Date, Numeric, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class SyncCase(Base):
    __tablename__ = "sync_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    artist_id: Mapped[int] = mapped_column(ForeignKey("artists.id"), nullable=False)
    track_id: Mapped[int | None] = mapped_column(ForeignKey("tracks.id"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    scene: Mapped[str | None] = mapped_column(String(500))
    studio: Mapped[str | None] = mapped_column(String(200))
    director: Mapped[str | None] = mapped_column(String(200))
    release_date: Mapped[date | None] = mapped_column(Date)
    fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    royalty_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    status: Mapped[str] = mapped_column(String(50), default="active")
    extra_streams: Mapped[int | None] = mapped_column(Integer)
    extra_revenue: Mapped[float | None] = mapped_column(Numeric(12, 2))
    cover_url: Mapped[str | None] = mapped_column(String(500))

    artist: Mapped["Artist"] = relationship("Artist", back_populates="sync_cases")
    track: Mapped["Track | None"] = relationship("Track", back_populates="sync_cases")
