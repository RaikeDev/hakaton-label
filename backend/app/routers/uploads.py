import io
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.upload import Upload
from app.services.upload_service import process_royalty_report

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.get("/last")
def last_upload(db: Session = Depends(get_db)):
    upload = db.query(Upload).order_by(Upload.id.desc()).first()
    if not upload:
        return None
    return {
        "id": upload.id,
        "filename": upload.filename,
        "status": upload.status,
        "rows_total": upload.rows_total,
        "rows_success": upload.rows_success,
        "rows_failed": upload.rows_failed,
        "created_at": upload.created_at.isoformat() if upload.created_at else None,
    }


@router.post("/royalty-report")
async def upload_royalty_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Поддерживаются только CSV и Excel-файлы")

    content = await file.read()
    result = process_royalty_report(io.BytesIO(content), filename, db)
    return result


@router.post("/demo-royalty-report")
async def upload_demo_royalty_report(db: Session = Depends(get_db)):
    candidates = [
        Path("/app/demo-data/royalty_report_march.csv"),
        Path(__file__).resolve().parents[3] / "demo-data" / "royalty_report_march.csv",
        Path(__file__).resolve().parents[2] / "demo-data" / "royalty_report_march.csv",
    ]
    report_path = next((path for path in candidates if path.exists()), None)
    if not report_path:
        raise HTTPException(status_code=404, detail="Демо-отчет не найден")

    with report_path.open("rb") as report_file:
        result = process_royalty_report(report_file, report_path.name, db)
    return result
