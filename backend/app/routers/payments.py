from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.payment import Payment
from app.models.transaction import Transaction

router = APIRouter()


class MarkPaidRequest(BaseModel):
    paid_date: date


@router.get("")
def list_payments(artist_id: int = Query(1), db: Session = Depends(get_db)):
    payments = (
        db.query(Payment)
        .filter(Payment.artist_id == artist_id)
        .order_by(Payment.id.desc())
        .all()
    )
    return [
        {
            "id": payment.id,
            "period": payment.period,
            "amount": float(payment.gross_amount),
            "payout": float(payment.net_payout),
            "tax": float(payment.tax) if payment.tax else None,
            "commission": float(payment.commission) if payment.commission else None,
            "status": payment.status,
            "paid_date": payment.paid_date.isoformat() if payment.paid_date else None,
        }
        for payment in payments
    ]


@router.post("/{payment_id}/approve")
def approve_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "paid":
        raise HTTPException(status_code=409, detail="Payment is already paid")

    payment.status = "approved"
    db.commit()
    return {"id": payment.id, "status": payment.status}


@router.post("/{payment_id}/mark-paid")
def mark_paid(payment_id: int, body: MarkPaidRequest, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "paid":
        raise HTTPException(status_code=409, detail="Payment is already paid")
    if payment.status != "approved":
        raise HTTPException(status_code=409, detail="Payment must be approved before transfer")

    payment.status = "paid"
    payment.paid_date = body.paid_date
    db.add(Transaction(
        artist_id=payment.artist_id,
        date=body.paid_date,
        type="payout",
        description=f"Выплата за {payment.period}",
        amount=-payment.net_payout,
        status="completed",
    ))
    db.commit()
    return {"id": payment.id, "status": payment.status}
