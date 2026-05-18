from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.sync_case import SyncCase

router = APIRouter()


class SyncCreate(BaseModel):
    artist_id: int
    track_id: int | None = None
    title: str
    type: str
    scene: str | None = None
    studio: str | None = None
    director: str | None = None
    release_date: date | None = None
    fee: float = 0
    royalty_rate: float = 0
    status: str = "active"
    cover_url: str | None = None


@router.get("")
def list_syncs(artist_id: int = Query(1), db: Session = Depends(get_db)):
    syncs = (
        db.query(SyncCase)
        .filter(SyncCase.artist_id == artist_id)
        .order_by(SyncCase.id.desc())
        .all()
    )
    return [_serialize(s) for s in syncs]


@router.post("")
def create_sync(body: SyncCreate, db: Session = Depends(get_db)):
    sync = SyncCase(**body.model_dump())
    db.add(sync)
    db.commit()
    db.refresh(sync)
    return _serialize(sync)


def _serialize(s: SyncCase) -> dict:
    track_title = s.track.title if s.track else None
    return {
        "id": s.id,
        "title": s.title,
        "type": s.type,
        "track": track_title,
        "scene": s.scene,
        "studio": s.studio,
        "director": s.director,
        "release_date": s.release_date.isoformat() if s.release_date else None,
        "fee": float(s.fee),
        "royalty_rate": float(s.royalty_rate),
        "status": s.status,
        "streams": s.extra_streams,
        "revenue": float(s.extra_revenue) if s.extra_revenue else 0,
        "cover_url": s.cover_url,
    }
