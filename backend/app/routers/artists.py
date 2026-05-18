from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date

from app.db.session import get_db
from app.models.artist import Artist

router = APIRouter()


class ArtistCreate(BaseModel):
    stage_name: str
    real_name: str | None = None
    genre: str | None = None
    label_name: str = "Kamik"
    artist_share_percent: float = 70.0
    avatar_url: str | None = None


@router.get("")
def list_artists(db: Session = Depends(get_db)):
    artists = db.query(Artist).all()
    return [
        {
            "id": a.id,
            "stage_name": a.stage_name,
            "real_name": a.real_name,
            "genre": a.genre,
            "label_name": a.label_name,
            "artist_share_percent": float(a.artist_share_percent),
            "avatar_url": a.avatar_url,
            "contract_since": a.contract_since.isoformat() if a.contract_since else None,
        }
        for a in artists
    ]


@router.post("")
def create_artist(body: ArtistCreate, db: Session = Depends(get_db)):
    artist = Artist(**body.model_dump())
    db.add(artist)
    db.commit()
    db.refresh(artist)
    return {"id": artist.id, "stage_name": artist.stage_name}
