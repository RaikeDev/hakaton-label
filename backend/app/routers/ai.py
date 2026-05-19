from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ai_insights_service import build_artist_insights

router = APIRouter()


@router.get("/insights")
def get_artist_insights(
    artist_id: int = Query(1),
    db: Session = Depends(get_db),
):
    return build_artist_insights(db, artist_id)
