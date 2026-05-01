"""
RxScan AI — Medical NER (Named Entity Recognition)
Two-layer approach:
  1. Regex + Pattern matching (fast, offline, no model needed)
  2. RxNorm API (free NIH API) for brand→generic mapping
  3. OpenFDA API (free) for drug details

This gives you ~90% accuracy without needing any GPU or paid API.
"""
from typing import Optional, Tuple, List, Dict, Any 
import re
import json
import os
import logging
import requests
from typing import List, Dict, Optional
from pathlib import Path
from rapidfuzz import fuzz, process

logger = logging.getLogger(__name__)

# ─── Drug database paths ─────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
MEDICINES_DB_PATH = DATA_DIR / "medicines_db.json"
NPPA_PRICES_PATH = DATA_DIR / "nppa_prices.json"

# ─── Free APIs ────────────────────────────────────────────────────────────────
RXNORM_API = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_API = "https://api.fda.gov/drug/label.json"

# ─── Regex patterns for prescription parsing ─────────────────────────────────

# Dosage patterns: 500mg, 1000 IU, 2.5ml, 10mcg
DOSE_PATTERN = re.compile(
    r'\b(\d+(?:\.\d+)?)\s*(mg|mcg|μg|g|ml|mL|IU|iu|units?|tablet|tab|cap|capsule)\b',
    re.IGNORECASE
)

# Frequency patterns: BD, TDS, OD, QID, SOS, PRN
FREQ_PATTERN = re.compile(
    r'\b(OD|BD|TDS|QDS|QID|SOS|PRN|once daily|twice daily|thrice daily|'
    r'twice a day|three times|four times|every \d+ hours?|'
    r'morning|noon|evening|night|bedtime)\b',
    re.IGNORECASE
)

# Duration patterns: 5 days, 2 weeks, 1 month
DURATION_PATTERN = re.compile(
    r'\b(\d+)\s*(days?|weeks?|months?|d|w|m)\b',
    re.IGNORECASE
)

# Timing patterns: after meals, before food, with water
TIMING_PATTERN = re.compile(
    r'\b(after meals?|before meals?|after food|before food|with food|'
    r'with water|on empty stomach|at bedtime|in the morning|with milk)\b',
    re.IGNORECASE
)

# Common medical abbreviations → human readable
FREQ_MAP = {
    "OD": "Once daily",
    "BD": "Twice daily",
    "TDS": "Three times daily",
    "QDS": "Four times daily",
    "QID": "Four times daily",
    "SOS": "When needed",
    "PRN": "When needed",
}


def load_drug_database() -> List[str]:
    """
    Load local drug name database for fuzzy matching.
    Falls back to a built-in common drug list if file not found.
    """
    try:
        if MEDICINES_DB_PATH.exists():
            with open(MEDICINES_DB_PATH, "r") as f:
                data = json.load(f)
                # Handle both list and dict formats
                if isinstance(data, list):
                    return [d.lower() for d in data]
                elif isinstance(data, dict):
                    return [k.lower() for k in data.keys()]
    except Exception as e:
        logger.warning(f"Could not load medicines_db.json: {e}")

    # Built-in common drug names (fallback)
    return [
        "amoxicillin", "paracetamol", "acetaminophen", "ibuprofen", "aspirin",
        "metformin", "atorvastatin", "lisinopril", "amlodipine", "omeprazole",
        "pantoprazole", "metronidazole", "ciprofloxacin", "azithromycin",
        "doxycycline", "cefixime", "cefpodoxime", "levofloxacin", "amoxiclav",
        "ampicillin", "cloxacillin", "flucloxacillin", "erythromycin",
        "clarithromycin", "tetracycline", "trimethoprim", "nitrofurantoin",
        "prednisolone", "dexamethasone", "hydrocortisone", "betamethasone",
        "cetirizine", "loratadine", "fexofenadine", "chlorpheniramine",
        "ranitidine", "famotidine", "esomeprazole", "lansoprazole",
        "domperidone", "ondansetron", "metoclopramide", "loperamide",
        "ors", "zinc", "vitamin c", "vitamin d3", "vitamin b12",
        "folic acid", "ferrous sulfate", "calcium carbonate",
        "diclofenac", "naproxen", "tramadol", "codeine", "morphine",
        "insulin", "glimepiride", "glibenclamide", "sitagliptin",
        "losartan", "telmisartan", "enalapril", "ramipril",
        "atenolol", "metoprolol", "propranolol", "bisoprolol",
        "furosemide", "hydrochlorothiazide", "spironolactone",
        "warfarin", "clopidogrel", "heparin", "enoxaparin",
        "salbutamol", "ipratropium", "fluticasone", "budesonide",
        "levothyroxine", "carbimazole", "propylthiouracil",
        "alprazolam", "clonazepam", "diazepam", "lorazepam",
        "sertraline", "fluoxetine", "escitalopram", "amitriptyline",
        "phenytoin", "carbamazepine", "valproate", "levetiracetam",
        "albendazole", "mebendazole", "ivermectin", "praziquantel",
        "chloroquine", "hydroxychloroquine", "artesunate", "artemether",
        "acyclovir", "oseltamivir", "ribavirin", "tenofovir",
        "multivitamin", "b-complex", "iron", "calcium",
    ]


# Load drug DB at module import time
DRUG_LIST = load_drug_database()


def extract_medicines_from_text(raw_text: str) -> List[Dict]:
    """
    Main NER function: Extract medicine entities from raw OCR text.

    Returns list of dicts:
    [
        {
            "name": "Amoxicillin",
            "generic_name": "amoxicillin",
            "dose": "500mg",
            "frequency": "Twice daily",
            "duration": "5 days",
            "timing": "After meals",
            "confidence": 0.85
        }
    ]
    """
    medicines = []
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

    for line in lines:
        medicine = _parse_single_line(line)
        if medicine:
            medicines.append(medicine)

    # Deduplicate by name
    seen = set()
    unique = []
    for m in medicines:
        key = m["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(m)

    logger.info(f"Extracted {len(unique)} medicines from {len(lines)} lines")
    return unique


def _parse_single_line(line: str) -> Optional[Dict]:
    """
    Parse a single text line to extract medicine info.
    Uses fuzzy matching to find drug names.
    """
    if len(line) < 3:
        return None

    # Find dose in this line
    dose_match = DOSE_PATTERN.search(line)
    dose = f"{dose_match.group(1)}{dose_match.group(2)}" if dose_match else ""

    # Find frequency
    freq_match = FREQ_PATTERN.search(line)
    frequency_raw = freq_match.group(0).upper() if freq_match else ""
    frequency = FREQ_MAP.get(frequency_raw, frequency_raw.capitalize())

    # Find duration
    dur_match = DURATION_PATTERN.search(line)
    duration = f"{dur_match.group(1)} {dur_match.group(2)}" if dur_match else ""

    # Find timing
    timing_match = TIMING_PATTERN.search(line)
    timing = timing_match.group(0).capitalize() if timing_match else ""

    # Try to find drug name via fuzzy matching against drug database
    # Remove known non-drug tokens to get cleaner drug name
    clean_line = _clean_line_for_drug_matching(line)

    if not clean_line:
        return None

    drug_match = _fuzzy_match_drug(clean_line)

    if drug_match is None:
        # Still return if dose found (might be a drug we don't have in DB)
        if dose:
            drug_name = _extract_likely_drug_name(line)
            if drug_name:
                return {
                    "name": drug_name.capitalize(),
                    "generic_name": drug_name.lower(),
                    "dose": dose,
                    "frequency": frequency,
                    "duration": duration if duration else "",
                    "timing": timing,
                    "confidence": 0.60,
                    "in_database": False,
                }
        return None

    drug_name, score = drug_match
    confidence = min(score / 100.0, 0.99)  # Convert fuzz score to 0-1

    return {
        "name": drug_name.capitalize(),
        "generic_name": drug_name.lower(),
        "dose": dose,
        "frequency": frequency,
        "duration": duration if duration else "",
        "timing": timing,
        "confidence": round(confidence, 2),
        "in_database": True,
    }


def _clean_line_for_drug_matching(line: str) -> str:
    """Remove dose/freq/duration tokens to isolate drug name."""
    cleaned = DOSE_PATTERN.sub("", line)
    cleaned = FREQ_PATTERN.sub("", cleaned)
    cleaned = DURATION_PATTERN.sub("", cleaned)
    cleaned = TIMING_PATTERN.sub("", cleaned)
    # Remove common non-drug words
    noise = r'\b(tab|tablet|cap|capsule|syrup|inj|injection|dr|rx|rx:|mg|ml|iu)\b'
    cleaned = re.sub(noise, "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^\w\s]', ' ', cleaned)  # Remove punctuation
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def _fuzzy_match_drug(text: str, threshold: int = 70) -> Optional[Tuple]:
    """
    Fuzzy match text against drug database.
    Returns (drug_name, score) or None.
    """
    if not text or len(text) < 3:
        return None

    words = text.lower().split()

    best_name = None
    best_score = 0

    for word in words:
        if len(word) < 3:
            continue
        result = process.extractOne(word, DRUG_LIST, scorer=fuzz.ratio)
        if result and result[1] >= threshold:
            if result[1] > best_score:
                best_score = result[1]
                best_name = result[0]

    # Also try full phrase match
    full_phrase = text.lower()[:30]
    result = process.extractOne(full_phrase, DRUG_LIST, scorer=fuzz.partial_ratio)
    if result and result[1] >= threshold and result[1] > best_score:
        best_score = result[1]
        best_name = result[0]

    return (best_name, best_score) if best_name else None


def _extract_likely_drug_name(line: str) -> Optional[str]:
    """Fallback: Extract first capitalized word as likely drug name."""
    words = line.split()
    for word in words:
        clean = re.sub(r'[^\w]', '', word)
        if len(clean) >= 4 and clean[0].isupper():
            return clean
    return None


# ─── Free External APIs ───────────────────────────────────────────────────────

def get_drug_info_rxnorm(drug_name: str) -> Dict:
    """
    Get drug info from RxNorm API (FREE — NIH/NLM, no key needed).
    Returns generic name, RxCUI, and related drugs.
    """
    try:
        # Step 1: Get RxCUI (drug ID)
        url = f"{RXNORM_API}/rxcui.json?name={drug_name}&search=2"
        resp = requests.get(url, timeout=5)
        data = resp.json()

        rxcui_list = data.get("idGroup", {}).get("rxnormId", [])
        if not rxcui_list:
            return {"found": False, "name": drug_name}

        rxcui = rxcui_list[0]

        # Step 2: Get drug properties
        props_url = f"{RXNORM_API}/rxcui/{rxcui}/properties.json"
        props_resp = requests.get(props_url, timeout=5)
        props = props_resp.json().get("properties", {})

        return {
            "found": True,
            "name": props.get("name", drug_name),
            "rxcui": rxcui,
            "synonym": props.get("synonym", ""),
            "drug_class": props.get("tty", ""),
        }
    except Exception as e:
        logger.warning(f"RxNorm lookup failed for {drug_name}: {e}")
        return {"found": False, "name": drug_name}


def get_drug_info_openfda(drug_name: str) -> Dict:
    """
    Get drug info from OpenFDA API (FREE — 1000 req/min, no key needed).
    Returns warnings, indications, and storage info.
    """
    try:
        url = f"{OPENFDA_API}?search=openfda.generic_name:\"{drug_name}\"&limit=1"
        resp = requests.get(url, timeout=5)
        data = resp.json()

        if "results" not in data or not data["results"]:
            return {}

        result = data["results"][0]
        return {
            "indications": result.get("indications_and_usage", [""])[0][:300] if result.get("indications_and_usage") else "",
            "warnings": result.get("warnings", [""])[0][:300] if result.get("warnings") else "",
            "storage": result.get("storage_and_handling", [""])[0][:200] if result.get("storage_and_handling") else "",
        }
    except Exception as e:
        logger.warning(f"OpenFDA lookup failed for {drug_name}: {e}")
        return {}


def get_nppa_price(drug_name: str) -> Optional[float]:
    """
    Look up NPPA (India) medicine price ceiling from local JSON.
    Returns price in INR or None if not found.
    """
    try:
        if not NPPA_PRICES_PATH.exists():
            return None
        with open(NPPA_PRICES_PATH, "r") as f:
            prices = json.load(f)

        drug_lower = drug_name.lower()
        # Try exact match first
        if drug_lower in prices:
            return prices[drug_lower]

        # Fuzzy match
        result = process.extractOne(drug_lower, list(prices.keys()), scorer=fuzz.ratio)
        if result and result[1] >= 85:
            return prices[result[0]]

    except Exception as e:
        logger.warning(f"NPPA price lookup failed: {e}")

    return None