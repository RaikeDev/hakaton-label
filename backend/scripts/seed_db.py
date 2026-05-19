"""
Seed the database with demo data.
Run: python -m scripts.seed_db
"""
import os
import sys
from datetime import date

import bcrypt
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.session import Base, engine
from app.models.approval import Approval, ApprovalStep
from app.models.artist import Artist
from app.models.payment import Payment
from app.models.platform import Platform
from app.models.sync_case import SyncCase
from app.models.track import Track
from app.models.track_stat import TrackStat
from app.models.transaction import Transaction
from app.models.user import User


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def seed():
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        existing_artist = db.query(Artist).first()
        if existing_artist:
            repair_demo_data(db)
            print("DB already seeded, demo text repaired.")
            return

        platforms = [
            Platform(code="yandex", name="Яндекс Музыка", color="#FFCC00"),
            Platform(code="vk", name="VK Музыка", color="#4F8DFF"),
            Platform(code="spotify", name="Spotify", color="#1DB954"),
            Platform(code="sber", name="Звук", color="#21A038"),
            Platform(code="mts", name="МТС Музыка", color="#E42313"),
            Platform(code="apple", name="Apple Music", color="#FC3C44"),
        ]
        db.add_all(platforms)
        db.flush()
        platform_by_code = {platform.code: platform for platform in platforms}

        artist = Artist(
            stage_name="MAKO",
            real_name="Максим Ковалев",
            genre="Hip-Hop / R&B",
            label_name="Kamik",
            contract_since=date(2022, 3, 15),
            artist_share_percent=70,
            avatar_url="https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=120&h=120&fit=crop&crop=face",
        )
        db.add(artist)
        db.flush()

        db.add_all([
            User(
                email="artist@kamik.ru",
                password_hash=_hash("artist123"),
                role="artist",
                artist_id=artist.id,
            ),
            User(
                email="admin@kamik.ru",
                password_hash=_hash("admin123"),
                role="admin",
                artist_id=None,
            ),
        ])
        db.flush()

        tracks_data = [
            dict(
                title="Северный ветер",
                isrc="RURAM2412001",
                duration="3:42",
                release_date=date(2024, 11, 10),
                cover_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=2_100_000, vk=980_000, spotify=890_000, sber=540_000, mts=210_000, apple=100_310),
            ),
            dict(
                title="Неон",
                isrc="RURAM2408002",
                duration="2:58",
                release_date=date(2024, 8, 22),
                cover_url="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=1_500_000, vk=700_000, spotify=650_000, sber=380_000, mts=130_000, apple=51_200),
            ),
            dict(
                title="Дорога домой",
                isrc="RURAM2405003",
                duration="4:15",
                release_date=date(2024, 5, 1),
                cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=1_200_000, vk=600_000, spotify=560_000, sber=390_000, mts=140_000, apple=90_700),
            ),
            dict(
                title="Холод",
                isrc="RURAM2402004",
                duration="3:22",
                release_date=date(2024, 2, 14),
                cover_url="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=950_000, vk=480_000, spotify=420_000, sber=320_000, mts=110_000, apple=60_100),
            ),
            dict(
                title="Первый снег",
                isrc="RURAM2312005",
                duration="3:55",
                release_date=date(2023, 12, 1),
                cover_url="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=820_000, vk=400_000, spotify=310_000, sber=220_000, mts=90_000, apple=50_400),
            ),
            dict(
                title="Огни большого города",
                isrc="RURAM2309006",
                duration="3:10",
                release_date=date(2023, 9, 15),
                cover_url="https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=640_000, vk=310_000, spotify=260_000, sber=150_000, mts=60_000, apple=30_200),
            ),
            dict(
                title="Лето навсегда",
                isrc="RURAM2306007",
                duration="2:45",
                release_date=date(2023, 6, 20),
                cover_url="https://images.unsplash.com/photo-1520483601560-389dff434fdf?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=420_000, vk=210_000, spotify=180_000, sber=100_000, mts=40_000, apple=30_500),
            ),
            dict(
                title="Утро в Москве",
                isrc="RURAM2501008",
                duration="4:02",
                release_date=date(2025, 1, 20),
                cover_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
                platform_streams=dict(yandex=140_000, vk=70_000, spotify=55_000, sber=30_000, mts=12_000, apple=5_400),
            ),
        ]

        rates = dict(yandex=18.2, vk=16.8, spotify=14.6, sber=15.7, mts=18.1, apple=23.9)
        periods = ["2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02"]
        share = artist.artist_share_percent / 100

        track_objs = []
        for track_data in tracks_data:
            platform_streams = track_data.pop("platform_streams")
            track = Track(artist_id=artist.id, status="active", **track_data)
            db.add(track)
            db.flush()
            track_objs.append((track, platform_streams))

        for track, platform_streams in track_objs:
            for period in periods:
                for code, total_streams in platform_streams.items():
                    period_streams = total_streams // len(periods)
                    gross = round(period_streams * rates[code] / 1000, 2)
                    artist_revenue = round(gross * share, 2)
                    label_revenue = round(gross - artist_revenue, 2)
                    db.add(TrackStat(
                        track_id=track.id,
                        platform_id=platform_by_code[code].id,
                        period=period,
                        streams=period_streams,
                        gross_revenue=gross,
                        artist_revenue=artist_revenue,
                        label_revenue=label_revenue,
                        currency="RUB",
                    ))

        db.flush()

        transactions = [
            Transaction(artist_id=artist.id, date=date(2025, 2, 10), type="payout", description="Выплата за январь 2025", amount=-52_400.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 5), type="income", description="Роялти Яндекс Музыка — январь", amount=+38_200.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 5), type="income", description="Роялти VK Музыка — январь", amount=+16_500.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 5), type="income", description="Роялти Spotify — январь", amount=+15_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 5), type="income", description="Роялти Звук — январь", amount=+10_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 5), type="income", description="Роялти МТС Музыка — январь", amount=+4_500.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 1, 28), type="sync", description="Синхронизация — фильм «Нулевой пациент»", amount=+120_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 1, 10), type="payout", description="Выплата за декабрь 2024", amount=-85_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 1, 5), type="income", description="Роялти Яндекс Музыка — декабрь", amount=+48_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 1, 5), type="income", description="Роялти VK Музыка — декабрь", amount=+21_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2024, 12, 15), type="advance", description="Аванс за новый альбом", amount=+200_000.00, status="completed"),
            Transaction(artist_id=artist.id, date=date(2025, 2, 15), type="income", description="Роялти Apple Music — январь", amount=+2_800.00, status="pending"),
        ]
        db.add_all(transactions)

        payments = [
            Payment(artist_id=artist.id, period="Январь 2025", gross_amount=86_800, commission=8_680, tax=6_760, net_payout=71_360, status="paid", paid_date=date(2025, 2, 10)),
            Payment(artist_id=artist.id, period="Декабрь 2024", gross_amount=110_500, commission=11_050, tax=8_631, net_payout=90_819, status="paid", paid_date=date(2025, 1, 10)),
            Payment(artist_id=artist.id, period="Ноябрь 2024", gross_amount=95_000, commission=9_500, tax=7_410, net_payout=78_090, status="paid", paid_date=date(2024, 12, 10)),
            Payment(artist_id=artist.id, period="Октябрь 2024", gross_amount=79_500, commission=7_950, tax=6_201, net_payout=65_349, status="paid", paid_date=date(2024, 11, 10)),
            Payment(artist_id=artist.id, period="Февраль 2025", gross_amount=74_700, commission=None, tax=None, net_payout=62_748, status="pending", paid_date=None),
        ]
        db.add_all(payments)

        def make_approval(title, tracks_list, status, distributor, submitted, planned, steps):
            approval = Approval(
                artist_id=artist.id,
                title=title,
                tracks_list="|".join(tracks_list),
                status=status,
                distributor=distributor,
                submitted_date=submitted,
                planned_release_date=planned,
            )
            db.add(approval)
            db.flush()
            for position, (name, step_status, step_date) in enumerate(steps):
                db.add(ApprovalStep(approval_id=approval.id, step_name=name, status=step_status, date=step_date, position=position))
            return approval

        make_approval(
            "EP «Весна 2025»",
            ["Утро в Москве", "Таяние", "Апрель"],
            "in_review",
            "DistroKid",
            date(2025, 2, 1),
            date(2025, 3, 15),
            [
                ("Загрузка материала", "done", date(2025, 2, 1)),
                ("Мастеринг и QC", "done", date(2025, 2, 3)),
                ("Согласование лейбла", "done", date(2025, 2, 5)),
                ("Отправка дистрибьютору", "in_progress", date(2025, 2, 10)),
                ("Проверка платформами", "pending", None),
                ("Публикация", "pending", None),
            ],
        )
        make_approval(
            "Сингл «Цветение»",
            ["Цветение"],
            "approved",
            "ФОНД",
            date(2025, 1, 20),
            date(2025, 2, 20),
            [
                ("Загрузка материала", "done", date(2025, 1, 20)),
                ("Мастеринг и QC", "done", date(2025, 1, 22)),
                ("Согласование лейбла", "done", date(2025, 1, 24)),
                ("Отправка дистрибьютору", "done", date(2025, 1, 26)),
                ("Проверка платформами", "done", date(2025, 1, 28)),
                ("Публикация", "done", date(2025, 2, 20)),
            ],
        )
        make_approval(
            "Альбом «Ночной город»",
            ["Интро", "Неон", "Огни большого города", "Утро", "Финал"],
            "changes_requested",
            "DistroKid",
            date(2025, 2, 12),
            date(2025, 4, 1),
            [
                ("Загрузка материала", "done", date(2025, 2, 12)),
                ("Мастеринг и QC", "issue", date(2025, 2, 14)),
                ("Согласование лейбла", "pending", None),
                ("Отправка дистрибьютору", "pending", None),
                ("Проверка платформами", "pending", None),
                ("Публикация", "pending", None),
            ],
        )

        track_sv = next(track for track, _ in track_objs if track.title == "Северный ветер")
        track_dd = next(track for track, _ in track_objs if track.title == "Дорога домой")
        track_ln = next(track for track, _ in track_objs if track.title == "Лето навсегда")

        db.add_all([
            SyncCase(
                artist_id=artist.id,
                track_id=track_sv.id,
                title="Нулевой пациент",
                type="Фильм",
                scene="Финальная сцена — прощание героя",
                studio="Централ Партнершип",
                director="Константин Хабенский",
                release_date=date(2025, 1, 15),
                fee=120_000,
                royalty_rate=3.5,
                status="active",
                extra_streams=284_000,
                extra_revenue=9_940,
                cover_url="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=120&fit=crop",
            ),
            SyncCase(
                artist_id=artist.id,
                track_id=track_dd.id,
                title="Без границ",
                type="Сериал",
                scene="Титры 4 сезона",
                studio="НТВ",
                director="Нигина Сайфуллаева",
                release_date=date(2024, 9, 1),
                fee=65_000,
                royalty_rate=2.0,
                status="active",
                extra_streams=148_000,
                extra_revenue=2_960,
                cover_url="https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=120&fit=crop",
            ),
            SyncCase(
                artist_id=artist.id,
                track_id=track_ln.id,
                title="Реклама МТС",
                type="Реклама",
                scene="Летняя кампания 2024",
                studio="МТС",
                director=None,
                release_date=date(2024, 6, 1),
                fee=200_000,
                royalty_rate=0,
                status="completed",
                extra_streams=None,
                extra_revenue=0,
                cover_url="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=120&fit=crop",
            ),
        ])

        db.commit()
        print("Database seeded successfully.")
        print(f"   Artist: {artist.stage_name} (ID={artist.id})")
        print(f"   Tracks: {len(track_objs)}")
        print(f"   Platforms: {len(platforms)}")
        print("   Users: artist@kamik.ru / admin@kamik.ru")


def repair_demo_data(db: Session):
    platform_names = {
        "yandex": "Яндекс Музыка",
        "vk": "VK Музыка",
        "spotify": "Spotify",
        "sber": "Звук",
        "mts": "МТС Музыка",
        "apple": "Apple Music",
    }
    for code, name in platform_names.items():
        platform = db.query(Platform).filter(Platform.code == code).first()
        if platform:
            platform.name = name

    artist = db.query(Artist).filter(Artist.stage_name == "MAKO").first()
    if artist:
        artist.real_name = "Максим Ковалев"
        artist.genre = "Hip-Hop / R&B"
        artist.label_name = "Kamik"

    track_titles = {
        "RURAM2412001": "Северный ветер",
        "RURAM2408002": "Неон",
        "RURAM2405003": "Дорога домой",
        "RURAM2402004": "Холод",
        "RURAM2312005": "Первый снег",
        "RURAM2309006": "Огни большого города",
        "RURAM2306007": "Лето навсегда",
        "RURAM2501008": "Утро в Москве",
    }
    for isrc, title in track_titles.items():
        track = db.query(Track).filter(Track.isrc == isrc).first()
        if track:
            track.title = title

    transaction_descriptions = {
        (date(2025, 2, 10), "payout", -52_400.00): "Выплата за январь 2025",
        (date(2025, 2, 5), "income", 38_200.00): "Роялти Яндекс Музыка — январь",
        (date(2025, 2, 5), "income", 16_500.00): "Роялти VK Музыка — январь",
        (date(2025, 2, 5), "income", 15_000.00): "Роялти Spotify — январь",
        (date(2025, 2, 5), "income", 10_000.00): "Роялти Звук — январь",
        (date(2025, 2, 5), "income", 4_500.00): "Роялти МТС Музыка — январь",
        (date(2025, 1, 28), "sync", 120_000.00): "Синхронизация — фильм «Нулевой пациент»",
        (date(2025, 1, 10), "payout", -85_000.00): "Выплата за декабрь 2024",
        (date(2025, 1, 5), "income", 48_000.00): "Роялти Яндекс Музыка — декабрь",
        (date(2025, 1, 5), "income", 21_000.00): "Роялти VK Музыка — декабрь",
        (date(2024, 12, 15), "advance", 200_000.00): "Аванс за новый альбом",
        (date(2025, 2, 15), "income", 2_800.00): "Роялти Apple Music — январь",
    }
    for (tx_date, tx_type, amount), description in transaction_descriptions.items():
        transaction = db.query(Transaction).filter(
            Transaction.date == tx_date,
            Transaction.type == tx_type,
            Transaction.amount == amount,
        ).first()
        if transaction:
            transaction.description = description

    payment_periods = {
        (date(2025, 2, 10), "paid", 86_800): "Январь 2025",
        (date(2025, 1, 10), "paid", 110_500): "Декабрь 2024",
        (date(2024, 12, 10), "paid", 95_000): "Ноябрь 2024",
        (date(2024, 11, 10), "paid", 79_500): "Октябрь 2024",
        (None, "pending", 74_700): "Февраль 2025",
    }
    for (paid_date, status, gross_amount), period in payment_periods.items():
        payment = db.query(Payment).filter(
            Payment.paid_date == paid_date,
            Payment.status == status,
            Payment.gross_amount == gross_amount,
        ).first()
        if payment:
            payment.period = period

    approvals = {
        (date(2025, 3, 15), "in_review"): ("EP «Весна 2025»", "Утро в Москве|Таяние|Апрель", "DistroKid"),
        (date(2025, 2, 20), "approved"): ("Сингл «Цветение»", "Цветение", "ФОНД"),
        (date(2025, 4, 1), "changes_requested"): ("Альбом «Ночной город»", "Интро|Неон|Огни большого города|Утро|Финал", "DistroKid"),
    }
    for (planned_release_date, status), (title, tracks_list, distributor) in approvals.items():
        approval = db.query(Approval).filter(
            Approval.planned_release_date == planned_release_date,
            Approval.status == status,
        ).first()
        if approval:
            approval.title = title
            approval.tracks_list = tracks_list
            approval.distributor = distributor

    step_names = {
        0: "Загрузка материала",
        1: "Мастеринг и QC",
        2: "Согласование лейбла",
        3: "Отправка дистрибьютору",
        4: "Проверка платформами",
        5: "Публикация",
    }
    steps = db.query(ApprovalStep).all()
    for step in steps:
        if step.position in step_names:
            step.step_name = step_names[step.position]

    sync_cases = {
        120_000: ("Нулевой пациент", "Фильм", "Финальная сцена — прощание героя", "Централ Партнершип", "Константин Хабенский"),
        65_000: ("Без границ", "Сериал", "Титры 4 сезона", "НТВ", "Нигина Сайфуллаева"),
        200_000: ("Реклама МТС", "Реклама", "Летняя кампания 2024", "МТС", None),
    }
    for fee, (title, case_type, scene, studio, director) in sync_cases.items():
        sync_case = db.query(SyncCase).filter(SyncCase.fee == fee).first()
        if sync_case:
            sync_case.title = title
            sync_case.type = case_type
            sync_case.scene = scene
            sync_case.studio = studio
            sync_case.director = director

    db.commit()


if __name__ == "__main__":
    seed()
