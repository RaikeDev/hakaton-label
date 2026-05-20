from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.approval import Approval, ApprovalStep

router = APIRouter()

DEFAULT_STEPS = [
    "Загрузка материала",
    "Мастеринг и QC",
    "Согласование лейбла",
    "Отправка дистрибьютору",
    "Проверка платформами",
    "Публикация",
]


class StatusUpdate(BaseModel):
    status: str


class ApprovalCreate(BaseModel):
    title: str
    distributor: str | None = None
    tracks: list[str] = []
    planned_release: date | None = None


@router.get("")
def list_approvals(artist_id: int = Query(1), db: Session = Depends(get_db)):
    approvals = (
        db.query(Approval)
        .filter(Approval.artist_id == artist_id)
        .order_by(Approval.id.desc())
        .all()
    )
    return [_serialize(a) for a in approvals]


@router.post("")
def create_approval(body: ApprovalCreate, artist_id: int = Query(1), db: Session = Depends(get_db)):
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Укажите название релиза")

    tracks = [t.strip() for t in body.tracks if t.strip()]
    approval = Approval(
        artist_id=artist_id,
        title=title,
        tracks_list="|".join(tracks) if tracks else None,
        distributor=(body.distributor or "").strip() or None,
        status="in_review",
        submitted_date=date.today(),
        planned_release_date=body.planned_release,
    )
    db.add(approval)
    db.flush()

    for position, step_name in enumerate(DEFAULT_STEPS):
        db.add(ApprovalStep(
            approval_id=approval.id,
            step_name=step_name,
            status="done" if position == 0 else "pending",
            date=date.today() if position == 0 else None,
            position=position,
        ))

    db.commit()
    db.refresh(approval)
    return _serialize(approval)


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
