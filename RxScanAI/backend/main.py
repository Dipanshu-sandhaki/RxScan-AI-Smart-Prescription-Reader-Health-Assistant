"""
RxScan AI — FastAPI Backend
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from routers import ocr, translate, pharmacy
from models.ocr_model import load_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup"""
    logger.info("🚀 RxScan AI Backend starting...")
    load_models()  # Pre-load TrOCR models into memory
    logger.info("✅ All models loaded. Ready!")
    yield
    logger.info("Backend shutting down.")


app = FastAPI(
    title="RxScan AI API",
    description="Smart Prescription Reader — OCR, NER, Translation, Pharmacy",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow ALL origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(ocr.router,      prefix="/api", tags=["OCR"])
app.include_router(translate.router, prefix="/api", tags=["Translation"])
app.include_router(pharmacy.router,  prefix="/api", tags=["Pharmacy"])


@app.get("/")
def root():
    return {
        "app": "RxScan AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "scan":      "POST /api/scan",
            "translate": "POST /api/translate",
            "pharmacy":  "GET  /api/pharmacies/nearby",
            "drug_info": "GET  /api/drug/{name}",
            "docs":      "GET  /docs",
        }
    }


@app.get("/health")
def health():
    return {"status": "ok", "message": "RxScan AI is healthy"}