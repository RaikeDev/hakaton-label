from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.artist import Artist
from app.models.track import Track
from app.models.track_stat import TrackStat
from app.models.transaction import Transaction
from app.models.platform import Platform

router = APIRouter()


@router.get("")
def get_dashboard(artist_id: int = Query(1), db: Session = Depends(get_db)):
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        return {}

    tracks = db.query(Track).filter(Track.artist_id == artist_id).all()
    track_ids = [t.id for t in tracks]

    total_streams = db.query(func.sum(TrackStat.streams)).filter(
        TrackStat.track_id.in_(track_ids)
    ).scalar() or 0

    period_revenue = db.query(func.sum(TrackStat.artist_revenue)).filter(
        TrackStat.track_id.in_(track_ids)
    ).scalar() or 0

    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.type.in_(["income", "sync", "advance"]),
    ).scalar() or 0

    payouts = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.type == "payout",
    ).scalar() or 0

    balance = round(float(income) + float(payouts), 2)

    pending_payout = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.type == "income",
        Transaction.status == "pending",
    ).scalar() or 0

    top_tracks = []
    for t in sorted(tracks, key=lambda x: (
        db.query(func.sum(TrackStat.streams)).filter(TrackStat.track_id == x.id).scalar() or 0
    ), reverse=True)[:5]:
        t_streams = db.query(func.sum(TrackStat.streams)).filter(TrackStat.track_id == t.id).scalar() or 0
        t_revenue = db.query(func.sum(TrackStat.artist_revenue)).filter(TrackStat.track_id == t.id).scalar() or 0
        top_tracks.append({
            "id": t.id,
            "title": t.title,
            "streams": int(t_streams),
            "revenue": float(t_revenue),
            "trend": 0,
            "cover_url": t.cover_url,
            "isrc": t.isrc,
        })

    recent_txs = (
        db.query(Transaction)
        .filter(Transaction.artist_id == artist_id)
        .order_by(Transaction.date.desc())
        .limit(10)
        .all()
    )

    monthly_revenue = _build_monthly_revenue(track_ids, db)

    return {
        "artist": {
            "id": artist.id,
            "name": artist.stage_name,
            "real_name": artist.real_name,
            "genre": artist.genre,
            "label": artist.label_name,
            "balance": balance,
            "pending_payout": float(pending_payout),
            "artist_share_percent": float(artist.artist_share_percent),
            "contract_since": artist.contract_since.isoformat() if artist.contract_since else None,
            "avatar_url": artist.avatar_url,
        },
        "summary": {
            "total_streams": int(total_streams),
            "period_revenue": float(period_revenue),
            "balance": balance,
            "tracks_count": len(tracks),
        },
        "monthly_revenue": monthly_revenue,
        "top_tracks": top_tracks,
        "recent_transactions": [
            {
                "id": tx.id,
                "date": tx.date.isoformat(),
                "type": tx.type,
                "description": tx.description,
                "amount": float(tx.amount),
                "status": tx.status,
            }
            for tx in recent_txs
        ],
    }


def _build_monthly_revenue(track_ids: list[int], db: Session) -> list[dict]:
    if not track_ids:
        return []

    platforms = db.query(Platform).all()
    platform_map = {p.id: p.code for p in platforms}

    stats = db.query(TrackStat).filter(TrackStat.track_id.in_(track_ids)).all()

    months: dict[str, dict] = {}
    for s in stats:
        period = s.period
        if period not in months:
            months[period] = {p.code: 0 for p in platforms}
            months[period]["total"] = 0
            months[period]["month"] = period
        code = platform_map.get(s.platform_id, "other")
        months[period][code] = months[period].get(code, 0) + float(s.artist_revenue)
        months[period]["total"] += float(s.artist_revenue)
        months[period]["streams"] = months[period].get("streams", 0) + s.streams

    return sorted(months.values(), key=lambda x: x["month"])
