from datetime import date
from sqlalchemy import String, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(primary_key=True)
    artist_id: Mapped[int] = mapped_column(ForeignKey("artists.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    tracks_list: Mapped[str | None] = mapped_column(String(1000))
    distributor: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(50), default="draft")
    submitted_date: Mapped[date | None] = mapped_column(Date)
    planned_release_date: Mapped[date | None] = mapped_column(Date)

    artist: Mapped["Artist"] = relationship("Artist", back_populates="approvals")
    steps: Mapped[list["ApprovalStep"]] = relationship(
        "ApprovalStep", back_populates="approval", order_by="ApprovalStep.position"
    )


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    approval_id: Mapped[int] = mapped_column(ForeignKey("approvals.id"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    approval: Mapped["Approval"] = relationship("Approval", back_populates="steps")
