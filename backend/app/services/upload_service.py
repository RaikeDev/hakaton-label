import json
from datetime import date, datetime
from typing import IO

import pandas as pd
from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.models.platform import Platform
from app.models.track import Track
from app.models.track_stat import TrackStat
from app.models.transaction import Transaction
from app.models.upload import Upload
from app.services.finance_service import artist_revenue, label_revenue

REQUIRED_COLUMNS = {
    "artist_name", "track_title", "isrc", "platform",
    "period", "streams", "gross_revenue", "currency",
}

PLATFORM_ALIASES: dict[str, str] = {
    "яндекс музыка": "yandex",
    "yandex music": "yandex",
    "yandex": "yandex",
    "vk музыка": "vk",
    "vk music": "vk",
    "vk": "vk",
    "spotify": "spotify",
    "сберзвук": "sber",
    "sberzvouk": "sber",
    "звук": "sber",
    "sber": "sber",
    "мтс музыка": "mts",
    "mts music": "mts",
    "mts": "mts",
    "apple music": "apple",
    "apple": "apple",
}


def process_royalty_report(file_obj: IO[bytes], filename: str, db: Session, user_id: int | None = None) -> dict:
    upload = Upload(
        uploaded_by_user_id=user_id,
        filename=filename,
        status="processing",
    )
    db.add(upload)
    db.flush()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file_obj)
        else:
            df = pd.read_excel(file_obj)
    except Exception as e:
        upload.status = "failed"
        upload.error_log = str(e)
        db.commit()
        return {"upload_id": upload.id, "status": "failed", "message": str(e)}

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        upload.status = "failed"
        upload.error_log = f"Missing columns: {', '.join(missing)}"
        db.commit()
        return {"upload_id": upload.id, "status": "failed", "message": upload.error_log}

    upload.rows_total = len(df)
    errors = []
    success = 0

    platforms_cache: dict[str, Platform] = {
        p.code: p for p in db.query(Platform).all()
    }
    artists_cache: dict[str, Artist] = {
        a.stage_name.lower(): a for a in db.query(Artist).all()
    }

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-indexed + header
        try:
            artist_key = str(row["artist_name"]).strip().lower()
            artist = artists_cache.get(artist_key)
            if not artist:
                errors.append({"row": row_num, "message": f"Artist not found: {row['artist_name']}"})
                continue

            platform_raw = str(row["platform"]).strip().lower()
            platform_code = PLATFORM_ALIASES.get(platform_raw)
            if not platform_code:
                errors.append({"row": row_num, "message": f"Unknown platform: {row['platform']}"})
                continue

            platform = platforms_cache.get(platform_code)
            if not platform:
                errors.append({"row": row_num, "message": f"Platform not in DB: {platform_code}"})
                continue

            isrc = str(row.get("isrc", "")).strip() or None
            track_title = str(row["track_title"]).strip()

            track = None
            if isrc:
                track = db.query(Track).filter(Track.isrc == isrc).first()
            if not track:
                track = db.query(Track).filter(
                    Track.artist_id == artist.id,
                    Track.title == track_title,
                ).first()
            if not track:
                track = Track(
                    artist_id=artist.id,
                    title=track_title,
                    isrc=isrc,
                    status="active",
                )
                db.add(track)
                db.flush()

            period = str(row["period"]).strip()
            streams = int(row["streams"])
            gross = float(row["gross_revenue"])
            currency = str(row.get("currency", "RUB")).strip()

            a_rev = artist_revenue(gross, float(artist.artist_share_percent))
            l_rev = label_revenue(gross, float(artist.artist_share_percent))

            stat = TrackStat(
                track_id=track.id,
                platform_id=platform.id,
                period=period,
                streams=streams,
                gross_revenue=gross,
                artist_revenue=a_rev,
                label_revenue=l_rev,
                currency=currency,
            )
            db.add(stat)

            tx = Transaction(
                artist_id=artist.id,
                track_id=track.id,
                date=datetime.now().date(),
                type="income",
                description=f"Роялти {platform.name} — {period} ({track_title})",
                amount=a_rev,
                status="completed",
            )
            db.add(tx)
            success += 1

        except Exception as e:
            errors.append({"row": row_num, "message": str(e)})

    upload.rows_success = success
    upload.rows_failed = len(errors)
    upload.status = "completed" if success > 0 else "failed"
    if errors:
        upload.error_log = json.dumps(errors, ensure_ascii=False)

    db.commit()

    return {
        "upload_id": upload.id,
        "status": upload.status,
        "rows_total": upload.rows_total,
        "rows_success": success,
        "rows_failed": len(errors),
        "errors": errors[:20],
        "created_transactions": success,
        "created_track_stats": success,
    }
