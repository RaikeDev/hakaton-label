from datetime import date
from sqlalchemy import String, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[int] = mapped_column(primary_key=True)
    artist_id: Mapped[int] = mapped_column(ForeignKey("artists.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    isrc: Mapped[str | None] = mapped_column(String(50), unique=True)
    duration: Mapped[str | None] = mapped_column(String(20))
    release_date: Mapped[date | None] = mapped_column(Date)
    cover_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="active")

    artist: Mapped["Artist"] = relationship("Artist", back_populates="tracks")
    stats: Mapped[list["TrackStat"]] = relationship("TrackStat", back_populates="track")
    sync_cases: Mapped[list["SyncCase"]] = relationship("SyncCase", back_populates="track")
