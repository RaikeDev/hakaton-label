import json
from datetime import datetime
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
    "artist_name",
    "track_title",
    "isrc",
    "platform",
    "period",
    "streams",
    "gross_revenue",
    "currency",
}

PLATFORM_ALIASES: dict[str, str] = {
    "яндекс музыка": "yandex",
    "yandex music": "yandex",
    "yandex": "yandex",
    "vk музыка": "vk",
    "вк музыка": "vk",
    "vk music": "vk",
    "vk": "vk",
    "вк": "vk",
    "spotify": "spotify",
    "сберзвук": "sber",
    "звук": "sber",
    "sberzvouk": "sber",
    "sber zvuk": "sber",
    "sber": "sber",
    "мтс музыка": "mts",
    "mts music": "mts",
    "mts": "mts",
    "apple music": "apple",
    "apple": "apple",
}


def _normalize_text(value: object) -> str:
    return str(value or "").strip().lower().replace("ё", "е")


def _empty_result(upload: Upload, status: str, message: str) -> dict:
    return {
        "upload_id": upload.id,
        "status": status,
        "rows_total": 0,
        "rows_success": 0,
        "rows_failed": 0,
        "errors": [],
        "created_transactions": 0,
        "created_track_stats": 0,
        "updated_track_stats": 0,
        "message": message,
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
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(file_obj)
        else:
            df = pd.read_excel(file_obj)
    except Exception as exc:
        upload.status = "failed"
        upload.error_log = str(exc)
        db.commit()
        return _empty_result(upload, "failed", f"Не удалось прочитать файл: {exc}")

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        upload.status = "failed"
        upload.error_log = f"Missing columns: {', '.join(sorted(missing))}"
        db.commit()
        return _empty_result(upload, "failed", f"Не хватает колонок: {', '.join(sorted(missing))}")

    upload.rows_total = len(df)
    errors: list[dict[str, object]] = []
    success = 0
    created_stats = 0
    updated_stats = 0
    created_transactions = 0

    platforms_cache: dict[str, Platform] = {p.code: p for p in db.query(Platform).all()}
    artists_cache: dict[str, Artist] = {_normalize_text(a.stage_name): a for a in db.query(Artist).all()}

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            artist_name = str(row["artist_name"]).strip()
            artist = artists_cache.get(_normalize_text(artist_name))
            if not artist:
                errors.append({"row": row_num, "message": f"Артист не найден: {artist_name}"})
                continue

            platform_name = str(row["platform"]).strip()
            platform_code = PLATFORM_ALIASES.get(_normalize_text(platform_name))
            if not platform_code:
                errors.append({"row": row_num, "message": f"Неизвестная платформа: {platform_name}"})
                continue

            platform = platforms_cache.get(platform_code)
            if not platform:
                errors.append({"row": row_num, "message": f"Платформа не заведена в базе: {platform_code}"})
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
            currency = str(row.get("currency", "RUB")).strip() or "RUB"

            a_rev = artist_revenue(gross, float(artist.artist_share_percent))
            l_rev = label_revenue(gross, float(artist.artist_share_percent))

            stat = db.query(TrackStat).filter(
                TrackStat.track_id == track.id,
                TrackStat.platform_id == platform.id,
                TrackStat.period == period,
            ).first()
            if stat:
                stat.streams = streams
                stat.gross_revenue = gross
                stat.artist_revenue = a_rev
                stat.label_revenue = l_rev
                stat.currency = currency
                updated_stats += 1
            else:
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
                created_stats += 1

            description = f"Роялти {platform.name} — {period} ({track_title})"
            tx = db.query(Transaction).filter(
                Transaction.artist_id == artist.id,
                Transaction.track_id == track.id,
                Transaction.type == "income",
                Transaction.description == description,
            ).first()
            if tx:
                tx.date = datetime.now().date()
                tx.amount = a_rev
                tx.status = "completed"
            else:
                tx = Transaction(
                    artist_id=artist.id,
                    track_id=track.id,
                    date=datetime.now().date(),
                    type="income",
                    description=description,
                    amount=a_rev,
                    status="completed",
                )
                db.add(tx)
                created_transactions += 1

            success += 1
        except Exception as exc:
            errors.append({"row": row_num, "message": str(exc)})

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
        "created_transactions": created_transactions,
        "created_track_stats": created_stats,
        "updated_track_stats": updated_stats,
        "message": (
            f"Импортировано строк: {success}. "
            f"Новых записей статистики: {created_stats}, обновлено: {updated_stats}."
        ),
    }
