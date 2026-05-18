from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import io

from app.db.session import get_db
from app.services.upload_service import process_royalty_report

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.post("/royalty-report")
async def upload_royalty_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

    content = await file.read()
    result = process_royalty_report(io.BytesIO(content), file.filename, db)
    return result
