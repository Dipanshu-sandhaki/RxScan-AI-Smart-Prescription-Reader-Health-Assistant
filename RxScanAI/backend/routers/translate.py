from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from deep_translator import GoogleTranslator, MyMemoryTranslator
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

SUPPORTED_LANGUAGES = {
    "hi": "Hindi", "bn": "Bengali", "ta": "Tamil", "te": "Telugu",
    "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
    "pa": "Punjabi", "or": "Odia", "ur": "Urdu", "en": "English",
}

DEFAULT_TARGET = os.getenv("TRANSLATION_TARGET_LANG", "hi")

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = DEFAULT_TARGET
    source_lang: str = "en"

class BulkTranslateRequest(BaseModel):
    lines: list[str]
    target_lang: str = DEFAULT_TARGET
    source_lang: str = "en"

# ─── BULLETPROOF SCHEMA FOR UI TRANSLATION ───
class FullTranslateRequest(BaseModel):
    target_lang: str
    data: dict  # Uses native dict for maximum compatibility

def translate_text(text: str, target: str, source: str = "en") -> tuple[str, str]:
    if not text.strip(): return text, "none"
    try:
        translated = GoogleTranslator(source=source, target=target).translate(text)
        if translated: return translated, "google"
    except Exception as e:
        logger.warning(f"GoogleTranslator failed: {e}")
    
    try:
        translated = MyMemoryTranslator(source=source, target=target).translate(text)
        if translated: return translated, "mymemory"
    except Exception as e:
        logger.error(f"MyMemoryTranslator failed: {e}")
        
    raise HTTPException(status_code=503, detail="Translation engines failed.")

# ─── THE NEW FULL TRANSLATION ENDPOINT ───
@router.post("/translate/full")
def translate_full_prescription(req: FullTranslateRequest):
    if req.target_lang not in SUPPORTED_LANGUAGES and req.target_lang != 'en':
        raise HTTPException(status_code=400, detail="Unsupported language")

    if req.target_lang == 'en':
        return {"success": True, "translated_data": req.data}

    translated_data = req.data.copy()

    try:
        if "warnings" in translated_data and translated_data["warnings"]:
            new_warnings = []
            for w in translated_data["warnings"]:
                t, _ = translate_text(w, req.target_lang)
                new_warnings.append(t)
            translated_data["warnings"] = new_warnings

        if "medicines" in translated_data:
            for med in translated_data["medicines"]:
                if med.get("name"): med["name"], _ = translate_text(med["name"], req.target_lang)
                if med.get("dose"): med["dose"], _ = translate_text(med["dose"], req.target_lang)
                elif med.get("dosage"): med["dosage"], _ = translate_text(med["dosage"], req.target_lang)
                if med.get("frequency"): med["frequency"], _ = translate_text(med["frequency"], req.target_lang)
                if med.get("duration"): med["duration"], _ = translate_text(med["duration"], req.target_lang)
                if med.get("timing"): med["timing"], _ = translate_text(med["timing"], req.target_lang)

        return {"success": True, "translated_data": translated_data}
    except Exception as e:
        logger.error(f"Full JSON translation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate data.")

@router.get("/languages")
def list_languages():
    return {"languages": [{"code": code, "name": name} for code, name in SUPPORTED_LANGUAGES.items()]}