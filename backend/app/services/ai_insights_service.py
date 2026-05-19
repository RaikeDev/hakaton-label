from collections import defaultdict
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.models.platform import Platform
from app.models.track import Track
from app.models.track_stat import TrackStat
from app.models.transaction import Transaction


def build_artist_insights(db: Session, artist_id: int) -> dict:
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        return {"artist": None, "summary": {}, "insights": [], "actions": []}

    tracks = db.query(Track).filter(Track.artist_id == artist_id).all()
    track_ids = [track.id for track in tracks]
    if not track_ids:
        return {
            "artist": _artist_payload(artist),
            "summary": {"tracks_count": 0, "streams": 0, "revenue": 0, "periods": []},
            "insights": [
                {
                    "type": "risk",
                    "title": "Каталог пуст",
                    "description": "Добавьте релизы или загрузите отчет, чтобы получить рекомендации по росту каталога.",
                    "metric": "0 треков",
                    "confidence": 0.95,
                }
            ],
            "actions": ["Загрузить отчет роялти", "Добавить активные треки"],
        }

    stats = db.query(TrackStat).filter(TrackStat.track_id.in_(track_ids)).all()
    platforms = {platform.id: platform for platform in db.query(Platform).all()}
    track_map = {track.id: track for track in tracks}

    total_streams = sum(stat.streams for stat in stats)
    total_revenue = round(sum(float(stat.artist_revenue) for stat in stats), 2)
    periods = sorted({stat.period for stat in stats})

    platform_rows = _aggregate_platforms(stats, platforms)
    track_rows = _aggregate_tracks(stats, track_map)
    period_rows = _aggregate_periods(stats)
    transactions_summary = _transactions_summary(db, artist_id)

    insights = []
    insights.extend(_catalog_insights(track_rows, total_streams, total_revenue))
    insights.extend(_platform_insights(platform_rows, total_revenue))
    insights.extend(_period_insights(period_rows))
    insights.extend(_cashflow_insights(transactions_summary))

    return {
        "artist": _artist_payload(artist),
        "summary": {
            "tracks_count": len(tracks),
            "streams": int(total_streams),
            "revenue": total_revenue,
            "periods": periods,
            "platforms": platform_rows[:5],
            "top_tracks": track_rows[:5],
            "cashflow": transactions_summary,
            "generated_at": date.today().isoformat(),
        },
        "insights": insights[:6],
        "actions": _recommended_actions(insights),
    }


def _artist_payload(artist: Artist) -> dict:
    return {
        "id": artist.id,
        "name": artist.stage_name,
        "genre": artist.genre,
        "share_percent": float(artist.artist_share_percent),
    }


def _aggregate_platforms(stats: list[TrackStat], platforms: dict[int, Platform]) -> list[dict]:
    rows: dict[int, dict] = defaultdict(lambda: {"streams": 0, "revenue": 0.0})
    for stat in stats:
        row = rows[stat.platform_id]
        row["streams"] += stat.streams
        row["revenue"] += float(stat.artist_revenue)

    result = []
    for platform_id, row in rows.items():
        platform = platforms.get(platform_id)
        result.append({
            "code": platform.code if platform else "other",
            "name": platform.name if platform else "Другая платформа",
            "streams": int(row["streams"]),
            "revenue": round(row["revenue"], 2),
        })
    return sorted(result, key=lambda item: item["revenue"], reverse=True)


def _aggregate_tracks(stats: list[TrackStat], tracks: dict[int, Track]) -> list[dict]:
    rows: dict[int, dict] = defaultdict(lambda: {"streams": 0, "revenue": 0.0})
    for stat in stats:
        row = rows[stat.track_id]
        row["streams"] += stat.streams
        row["revenue"] += float(stat.artist_revenue)

    result = []
    for track_id, row in rows.items():
        track = tracks.get(track_id)
        result.append({
            "id": track_id,
            "title": track.title if track else "Неизвестный трек",
            "streams": int(row["streams"]),
            "revenue": round(row["revenue"], 2),
            "release_date": track.release_date.isoformat() if track and track.release_date else None,
        })
    return sorted(result, key=lambda item: item["streams"], reverse=True)


def _aggregate_periods(stats: list[TrackStat]) -> list[dict]:
    rows: dict[str, dict] = defaultdict(lambda: {"streams": 0, "revenue": 0.0})
    for stat in stats:
        row = rows[stat.period]
        row["streams"] += stat.streams
        row["revenue"] += float(stat.artist_revenue)

    return [
        {"period": period, "streams": int(row["streams"]), "revenue": round(row["revenue"], 2)}
        for period, row in sorted(rows.items())
    ]


def _transactions_summary(db: Session, artist_id: int) -> dict:
    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.type.in_(["income", "sync", "advance"]),
        Transaction.status == "completed",
    ).scalar() or 0
    payouts = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.type == "payout",
        Transaction.status == "completed",
    ).scalar() or 0
    pending = db.query(func.sum(Transaction.amount)).filter(
        Transaction.artist_id == artist_id,
        Transaction.status == "pending",
    ).scalar() or 0

    return {
        "income": round(float(income), 2),
        "payouts": round(abs(float(payouts)), 2),
        "pending": round(float(pending), 2),
        "balance": round(float(income) + float(payouts), 2),
    }


def _catalog_insights(tracks: list[dict], total_streams: int, total_revenue: float) -> list[dict]:
    if not tracks:
        return []

    top = tracks[0]
    stream_share = top["streams"] / total_streams if total_streams else 0
    revenue_share = top["revenue"] / total_revenue if total_revenue else 0

    insights = [{
        "type": "opportunity",
        "title": f"Лидер каталога: {top['title']}",
        "description": "Трек дает самый сильный вклад в прослушивания. Его стоит использовать как якорь для промо, плейлистинга и sync-питчинга.",
        "metric": f"{stream_share:.0%} прослушиваний каталога",
        "confidence": 0.88,
    }]

    if stream_share > 0.35:
        insights.append({
            "type": "risk",
            "title": "Высокая зависимость от одного трека",
            "description": "Каталог заметно зависит от одного релиза. Следующий приоритет: усилить второй эшелон треков и обновить промо-воронку.",
            "metric": f"{revenue_share:.0%} дохода от лидера",
            "confidence": 0.82,
        })

    return insights


def _platform_insights(platforms: list[dict], total_revenue: float) -> list[dict]:
    if not platforms or total_revenue <= 0:
        return []

    leader = platforms[0]
    leader_share = leader["revenue"] / total_revenue
    insights = [{
        "type": "opportunity",
        "title": f"Главный канал монетизации: {leader['name']}",
        "description": "Эта платформа уже показывает лучший доход. Имеет смысл проверить карточки релизов, обложки и регулярность питчинга именно здесь.",
        "metric": f"{leader_share:.0%} дохода",
        "confidence": 0.86,
    }]

    weak_platforms = [platform for platform in platforms if platform["streams"] > 0 and platform["revenue"] / max(platform["streams"], 1) < 0.012]
    if weak_platforms:
        weak = weak_platforms[-1]
        insights.append({
            "type": "risk",
            "title": f"Низкая доходность на {weak['name']}",
            "description": "Платформа дает прослушивания, но слабее конвертирует их в доход. Проверьте территорию, тип подписок и условия дистрибуции.",
            "metric": f"{weak['revenue'] / max(weak['streams'], 1) * 1000:.2f} ₽ / 1000 стримов",
            "confidence": 0.74,
        })

    return insights


def _period_insights(periods: list[dict]) -> list[dict]:
    if len(periods) < 2:
        return []

    previous = periods[-2]
    current = periods[-1]
    previous_revenue = previous["revenue"]
    current_revenue = current["revenue"]
    if previous_revenue <= 0:
        return []

    change = (current_revenue - previous_revenue) / previous_revenue
    insight_type = "opportunity" if change >= 0 else "risk"
    title = "Доход растет" if change >= 0 else "Доход снизился"
    description = (
        "Последний период лучше предыдущего. Зафиксируйте источники роста и повторите успешные действия."
        if change >= 0
        else "Последний период слабее предыдущего. Нужна проверка платформ, релизного календаря и плейлистингов."
    )

    return [{
        "type": insight_type,
        "title": title,
        "description": description,
        "metric": f"{change:+.1%} к {previous['period']}",
        "confidence": 0.8,
    }]


def _cashflow_insights(cashflow: dict) -> list[dict]:
    if cashflow["pending"] <= 0:
        return []

    return [{
        "type": "action",
        "title": "Есть неподтвержденный доход",
        "description": "В балансе есть pending-сумма. Проверьте документы и переведите ее в выплату после сверки.",
        "metric": f"{cashflow['pending']:,.0f} ₽".replace(",", " "),
        "confidence": 0.9,
    }]


def _recommended_actions(insights: list[dict]) -> list[str]:
    actions = []
    for insight in insights:
        if insight["type"] == "risk":
            actions.append("Проверить риск и назначить ответственного")
        if insight["type"] == "opportunity":
            actions.append("Запланировать промо-действие по найденной возможности")
        if insight["type"] == "action":
            actions.append("Закрыть операционный пункт в админке")

    unique_actions = list(dict.fromkeys(actions))
    return unique_actions[:4]
