from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction

router = APIRouter()


@router.get("")
def list_transactions(
    artist_id: int = Query(1),
    limit: int = Query(50),
    db: Session = Depends(get_db),
):
    txs = (
        db.query(Transaction)
        .filter(Transaction.artist_id == artist_id)
        .order_by(Transaction.date.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": tx.id,
            "date": tx.date.isoformat(),
            "type": tx.type,
            "description": tx.description,
            "amount": float(tx.amount),
            "status": tx.status,
        }
        for tx in txs
    ]
