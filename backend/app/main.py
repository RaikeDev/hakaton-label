from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, dashboard, artists, tracks, analytics, transactions, payments, approvals, syncs, uploads

app = FastAPI(title="Kamik Label Portal API", version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok", "service": "kamik-backend"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(artists.router, prefix="/api/artists", tags=["artists"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["tracks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["approvals"])
app.include_router(syncs.router, prefix="/api/syncs", tags=["syncs"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
