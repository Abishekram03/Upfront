from fastapi import APIRouter
from app.api.v1.ingest import router as ingest_router
from app.api.v1.stats import router as stats_router
from app.api.v1.sites import router as sites_router
from app.api.v1.consent import router as consent_router

api_router = APIRouter()
api_router.include_router(ingest_router, tags=["Ingestion"])
api_router.include_router(stats_router, tags=["Analytics Stats"])
api_router.include_router(sites_router, tags=["Sites Management"])
api_router.include_router(consent_router, prefix="/consent", tags=["Consent Management"])
