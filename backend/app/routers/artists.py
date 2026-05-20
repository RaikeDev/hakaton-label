from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

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
    datalens_url: str | None = None


class ArtistDataLensUpdate(BaseModel):
    datalens_url: str | None = None


class ArtistPayoutDetailsUpdate(BaseModel):
    bank_name: str | None = None
    account_number: str | None = None
    recipient_name: str | None = None


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
            "datalens_url": a.datalens_url,
            "contract_since": a.contract_since.isoformat() if a.contract_since else None,
            "bank_name": a.bank_name,
            "account_number": a.account_number,
            "recipient_name": a.recipient_name,
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


@router.patch("/{artist_id}/datalens")
def update_artist_datalens(artist_id: int, body: ArtistDataLensUpdate, db: Session = Depends(get_db)):
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    datalens_url = body.datalens_url.strip() if body.datalens_url else None
    if datalens_url and not datalens_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Ссылка DataLens должна начинаться с http:// или https://")

    artist.datalens_url = datalens_url
    db.commit()
    db.refresh(artist)

    return {
        "id": artist.id,
        "stage_name": artist.stage_name,
        "datalens_url": artist.datalens_url,
    }


@router.patch("/{artist_id}/payout-details")
def update_artist_payout_details(artist_id: int, body: ArtistPayoutDetailsUpdate, db: Session = Depends(get_db)):
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    artist.bank_name = (body.bank_name or "").strip() or None
    artist.account_number = (body.account_number or "").strip() or None
    artist.recipient_name = (body.recipient_name or "").strip() or None
    db.commit()
    db.refresh(artist)

    return {
        "id": artist.id,
        "bank_name": artist.bank_name,
        "account_number": artist.account_number,
        "recipient_name": artist.recipient_name,
    }
