import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    print("[Userly API] Database tables initialized successfully.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?:\/\/.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount v1 routes (/api/v1/event, /api/v1/stats, /api/v1/sites)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve client tracking script at /userly.js
TRACKER_PATH = os.path.join(os.path.dirname(__file__), "tracker", "userly.js")

@app.get("/userly.js")
@app.get("/tracker.js")
async def serve_tracker_script():
    if os.path.exists(TRACKER_PATH):
        return FileResponse(
            TRACKER_PATH,
            media_type="application/javascript",
            headers={"Cache-Control": "public, max-age=3600"},
        )
    return Response(content="// Userly tracker unavailable", media_type="application/javascript")

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
