"""
Translation Router — RxScan AI
Uses deep-translator (Google Translate unofficial + MyMemory fallback)
Install: pip install deep-translator
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from deep_translator import GoogleTranslator, MyMemoryTranslator
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Supported Indian languages ────────────────────────────────────────────────
SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "ur": "Urdu",
    "en": "English",
}

DEFAULT_TARGET = os.getenv("TRANSLATION_TARGET_LANG", "hi")


# ── Schemas ───────────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    target_lang: str = Field(DEFAULT_TARGET, description="ISO 639-1 language code")
    source_lang: str = Field("en", description="Source language (default: English)")


class TranslateResponse(BaseModel):
    original: str
    translated: str
    source_lang: str
    target_lang: str
    target_lang_name: str
    engine_used: str


class BulkTranslateRequest(BaseModel):
    lines: list[str] = Field(..., max_length=30, description="List of prescription lines")
    target_lang: str = Field(DEFAULT_TARGET)
    source_lang: str = Field("en")


# ── Core translation logic ────────────────────────────────────────────────────

def translate_text(text: str, target: str, source: str = "en") -> tuple[str, str]:
    """
    Translate text. Returns (translated_text, engine_used).
    Primary: GoogleTranslator (free, no key)
    Fallback: MyMemoryTranslator (free, 1000 words/day)
    """
    if not text.strip():
        return text, "none"

    # Primary — Google Translate (unofficial, via deep-translator)
    try:
        translated = GoogleTranslator(source=source, target=target).translate(text)
        if translated:
            return translated, "google"
    except Exception as e:
        logger.warning(f"GoogleTranslator failed: {e}. Trying MyMemory...")

    # Fallback — MyMemory public API
    try:
        lang_pair = f"{source}-{target}"
        translated = MyMemoryTranslator(source=source, target=target).translate(text)
        if translated:
            return translated, "mymemory"
    except Exception as e:
        logger.error(f"MyMemoryTranslator also failed: {e}")

    raise HTTPException(
        status_code=503,
        detail="All translation engines failed. Please try again later."
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    """Translate a single block of text (e.g. a drug name + dosage line)."""
    if req.target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{req.target_lang}'. "
                   f"Supported: {list(SUPPORTED_LANGUAGES.keys())}"
        )

    if req.source_lang == req.target_lang:
        return TranslateResponse(
            original=req.text,
            translated=req.text,
            source_lang=req.source_lang,
            target_lang=req.target_lang,
            target_lang_name=SUPPORTED_LANGUAGES.get(req.target_lang, req.target_lang),
            engine_used="passthrough",
        )

    translated, engine = translate_text(req.text, req.target_lang, req.source_lang)

    return TranslateResponse(
        original=req.text,
        translated=translated,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
        target_lang_name=SUPPORTED_LANGUAGES.get(req.target_lang, req.target_lang),
        engine_used=engine,
    )


@router.post("/translate/bulk")
def translate_bulk(req: BulkTranslateRequest):
    """
    Translate multiple prescription lines at once.
    Joins them, translates in one API call (faster + cheaper on rate limits),
    then splits back.
    """
    if req.target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language '{req.target_lang}'")

    if not req.lines:
        return {"translations": [], "engine_used": "none"}

    # Use a delimiter unlikely to appear in prescriptions
    DELIMITER = " |||RXLINE||| "
    joined = DELIMITER.join(line.strip() for line in req.lines)

    translated_joined, engine = translate_text(joined, req.target_lang, req.source_lang)

    # Split back — fall back to per-line if delimiter got mangled
    translated_lines = translated_joined.split("|||RXLINE|||")
    if len(translated_lines) != len(req.lines):
        logger.warning("Delimiter mangled during translation, falling back to per-line mode.")
        translated_lines = []
        for line in req.lines:
            t, engine = translate_text(line, req.target_lang, req.source_lang)
            translated_lines.append(t)

    return {
        "translations": [
            {"original": orig, "translated": trans.strip()}
            for orig, trans in zip(req.lines, translated_lines)
        ],
        "target_lang": req.target_lang,
        "target_lang_name": SUPPORTED_LANGUAGES.get(req.target_lang),
        "engine_used": engine,
    }


@router.get("/languages")
def list_languages():
    """List all supported translation target languages."""
    return {
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    }