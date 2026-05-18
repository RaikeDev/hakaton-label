from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.track import Track
from app.models.track_stat import TrackStat
from app.models.platform import Platform

router = APIRouter()


@router.get("")
def get_analytics(
    artist_id: int = Query(1),
    period: str | None = Query(None),
    db: Session = Depends(get_db),
):
    tracks = db.query(Track).filter(Track.artist_id == artist_id).all()
    track_ids = [t.id for t in tracks]

    if not track_ids:
        return {"period": period, "platforms": [], "tracks": []}

    stat_q = db.query(TrackStat).filter(TrackStat.track_id.in_(track_ids))
    if period:
        stat_q = stat_q.filter(TrackStat.period == period)
    stats = stat_q.all()

    platforms = db.query(Platform).all()
    platform_map = {p.id: p for p in platforms}

    plat_agg: dict[int, dict] = {}
    for s in stats:
        pid = s.platform_id
        if pid not in plat_agg:
            p = platform_map.get(pid)
            plat_agg[pid] = {
                "platform": p.name if p else "Unknown",
                "code": p.code if p else "other",
                "color": p.color if p else "#888",
                "streams": 0,
                "revenue": 0.0,
            }
        plat_agg[pid]["streams"] += s.streams
        plat_agg[pid]["revenue"] += float(s.artist_revenue)

    track_agg: dict[int, dict] = {}
    track_map = {t.id: t for t in tracks}
    for s in stats:
        tid = s.track_id
        if tid not in track_agg:
            t = track_map.get(tid)
            track_agg[tid] = {
                "track_id": tid,
                "title": t.title if t else "Unknown",
                "streams": 0,
                "revenue": 0.0,
            }
        track_agg[tid]["streams"] += s.streams
        track_agg[tid]["revenue"] += float(s.artist_revenue)

    return {
        "period": period,
        "platforms": sorted(plat_agg.values(), key=lambda x: x["revenue"], reverse=True),
        "tracks": sorted(track_agg.values(), key=lambda x: x["streams"], reverse=True),
    }
