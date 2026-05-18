from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.approval import Approval, ApprovalStep

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str


@router.get("")
def list_approvals(artist_id: int = Query(1), db: Session = Depends(get_db)):
    approvals = (
        db.query(Approval)
        .filter(Approval.artist_id == artist_id)
        .order_by(Approval.id.desc())
        .all()
    )
    return [_serialize(a) for a in approvals]


@router.patch("/{approval_id}/status")
def update_status(approval_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = body.status
    db.commit()
    return _serialize(approval)


def _serialize(a: Approval) -> dict:
    tracks = a.tracks_list.split("|") if a.tracks_list else []
    return {
        "id": a.id,
        "title": a.title,
        "tracks": tracks,
        "submitted_date": a.submitted_date.isoformat() if a.submitted_date else None,
        "status": a.status,
        "distributor": a.distributor,
        "planned_release": a.planned_release_date.isoformat() if a.planned_release_date else None,
        "timeline": [
            {
                "step": s.step_name,
                "status": s.status,
                "date": s.date.isoformat() if s.date else None,
            }
            for s in a.steps
        ],
    }
