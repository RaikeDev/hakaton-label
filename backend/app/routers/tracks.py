from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date

from app.db.session import get_db
from app.models.track import Track
from app.models.track_stat import TrackStat

router = APIRouter()


class TrackCreate(BaseModel):
    artist_id: int
    title: str
    isrc: str | None = None
    duration: str | None = None
    release_date: date | None = None
    cover_url: str | None = None
    status: str = "active"


@router.get("")
def list_tracks(
    artist_id: int = Query(1),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Track).filter(Track.artist_id == artist_id)
    if search:
        q = q.filter(Track.title.ilike(f"%{search}%"))
    if status:
        q = q.filter(Track.status == status)
    tracks = q.all()

    result = []
    for t in tracks:
        streams = db.query(func.sum(TrackStat.streams)).filter(TrackStat.track_id == t.id).scalar() or 0
        revenue = db.query(func.sum(TrackStat.artist_revenue)).filter(TrackStat.track_id == t.id).scalar() or 0

        platform_streams: dict[str, int] = {}
        for stat in t.stats:
            code = stat.platform.code if stat.platform else "other"
            platform_streams[code] = platform_streams.get(code, 0) + stat.streams

        result.append({
            "id": t.id,
            "title": t.title,
            "duration": t.duration,
            "release_date": t.release_date.isoformat() if t.release_date else None,
            "streams": int(streams),
            "revenue": float(revenue),
            "trend": 0,
            "cover_url": t.cover_url,
            "status": t.status,
            "isrc": t.isrc,
            "platform_streams": platform_streams,
        })

    return sorted(result, key=lambda x: x["streams"], reverse=True)


@router.post("")
def create_track(body: TrackCreate, db: Session = Depends(get_db)):
    track = Track(**body.model_dump())
    db.add(track)
    db.commit()
    db.refresh(track)
    return {"id": track.id, "title": track.title}
