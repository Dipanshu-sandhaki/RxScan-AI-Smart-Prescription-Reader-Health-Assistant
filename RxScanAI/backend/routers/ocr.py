import time
import logging
import numpy as np
import cv2
import io
import re
from PIL import Image
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from models.ocr_model import run_ocr, is_models_loaded
# ✅ IMPORT THE NEW PRICE FUNCTION
from services.medicine_matcher import extract_medicines, get_medicine_price
from services.dosage_extractor import extract_dosage_info
from services.pdf_generator import generate_prescription_pdf

logger = logging.getLogger(__name__)
router = APIRouter()

class PDFGenerateRequest(BaseModel):
    medicines: list
    doctor_info: dict | None = None
    scan_confidence: float = 0.0
    processing_time_seconds: float = 0.0

def load_image(image_bytes: bytes) -> Image.Image:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None: raise ValueError("Invalid image")

    h, w = img.shape[:2]
    if w < 800:
        scale = 800 / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    if max(h, w) > 1600:
        scale = 1600 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    img = cv2.convertScaleAbs(img, alpha=1.6, beta=25)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    img = cv2.filter2D(img, -1, kernel)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_rgb)

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

@router.post("/scan")
async def scan_prescription(file: UploadFile = File(...), is_handwritten: bool = Form(default=True), language: str = Form(default="en")):
    start_time = time.time()
    if not file.content_type.startswith("image/"): raise HTTPException(status_code=400, detail="Only image files allowed")
    if not is_models_loaded(): raise HTTPException(status_code=503, detail="Model loading...")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0: raise HTTPException(status_code=400, detail="Empty file")

        image = load_image(image_bytes)
        text, confidence = run_ocr(image)

        if not text or len(text.strip()) < 3:
            raw_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            text, confidence = run_ocr(raw_img)

        if not text:
            return JSONResponse(content={"success": False, "message": "No text", "medicines": [], "scan_confidence": 0})

        cleaned = clean_text(text)
        medicines = extract_medicines(cleaned)
        dosage_info = extract_dosage_info(cleaned, medicines)
        elapsed = round(time.time() - start_time, 2)

        if confidence > 0.6: status = "high"
        elif confidence > 0.4: status = "medium"
        else: status = "low"

        # 🔥 SMART PRICING INJECTION
        prescription = []
        overall_total_cost = 0.0

        for med in medicines:
            dose = dosage_info["dose"] or "Not detected"
            freq = dosage_info["frequency"] or "Not detected"
            dur = dosage_info["duration"] or "Not detected"
            
            # Math execution
            price_per_unit = get_medicine_price(med)
            total_units = dosage_info.get("total_units_needed", 1)
            est_total_cost = round(price_per_unit * total_units, 2)
            
            overall_total_cost += est_total_cost

            prescription.append({
                "name": med,
                "dose": dose,
                "frequency": freq,
                "duration": dur,
                "estimated_price_per_unit": price_per_unit,
                "total_units_needed": total_units,
                "estimated_total_cost": est_total_cost, # 👈 Frontend reads this!
                "confidence": 0.96
            })

        summary = f"Medicine detected: {medicines[0].capitalize()}" if medicines else "No clear medicine detected"
        warnings = ["Low confidence — please verify with pharmacist"] if confidence < 0.4 else []

        return JSONResponse(content={
            "success": True,
            "processing_time_seconds": elapsed,
            "summary": summary,
            "medicines": prescription,
            "total_cost_estimate": overall_total_cost,
            "scan_confidence": confidence,
            "confidence_level": status,
            "warnings": warnings
        })

    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scan/health")
async def health():
    return {"models_loaded": is_models_loaded(), "status": "ready" if is_models_loaded() else "loading"}

@router.post("/pdf/download")
async def download_prescription_pdf(request: PDFGenerateRequest):
    try:
        pdf_buffer = generate_prescription_pdf({
            "medicines": request.medicines,
            "doctor_info": request.doctor_info,
            "scan_confidence": request.scan_confidence,
            "processing_time_seconds": request.processing_time_seconds,
        })
        pdf_data = pdf_buffer.getvalue()
        return StreamingResponse(
            iter([pdf_data]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=prescription.pdf", "Content-Length": str(len(pdf_data))}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")