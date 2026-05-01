"""
RxScan AI — Prescription Parser
Combines OCR output + NER extraction into clean structured data.
"""

import logging
from typing import Dict, List, Optional
from models.ner_model import (
    extract_medicines_from_text,
    get_nppa_price,
    get_drug_info_rxnorm,
)

logger = logging.getLogger(__name__)

# Estimated price per unit (INR) when NPPA data unavailable
DEFAULT_PRICES = {
    "tablet": 5.0,
    "capsule": 6.0,
    "syrup": 45.0,
    "injection": 80.0,
    "default": 8.0,
}


def parse_prescription(raw_text: str, overall_confidence: float) -> Dict:
    """
    Full prescription parsing pipeline.
    
    Input: raw OCR text
    Output: structured prescription data ready for frontend

    Returns:
    {
        "raw_text": "...",
        "medicines": [...],
        "doctor_info": {...},
        "total_cost_estimate": 245.0,
        "scan_confidence": 0.87,
        "warnings": [...]
    }
    """
    medicines = extract_medicines_from_text(raw_text)
    doctor_info = _extract_doctor_info(raw_text)
    patient_info = _extract_patient_info(raw_text)

    # Enrich medicines with prices
    enriched = _enrich_medicines_with_prices(medicines)

    # Calculate total cost estimate
    total_cost = _calculate_total_cost(enriched)

    # Generate warnings for low-confidence results
    warnings = _generate_warnings(enriched, overall_confidence)

    return {
        "raw_text": raw_text,
        "medicines": enriched,
        "doctor_info": doctor_info,
        "patient_info": patient_info,
        "total_cost_estimate": total_cost,
        "scan_confidence": overall_confidence,
        "medicine_count": len(enriched),
        "warnings": warnings,
    }


def _extract_doctor_info(text: str) -> Dict:
    """Extract doctor name and qualifications from text."""
    import re

    doctor = {"name": "", "qualifications": "", "reg_no": ""}

    # Look for Dr. prefix
    dr_match = re.search(
        r'(Dr\.?\s+[A-Z][a-zA-Z\s]+?)(?:\s+[A-Z]{2,}|\n|,|$)', text
    )
    if dr_match:
        doctor["name"] = dr_match.group(1).strip()

    # Look for qualifications (MBBS, MD, etc.)
    qual_match = re.search(
        r'\b(MBBS|MD|MS|DM|MCh|FRCS|MRCP|DNB|MDS|BDS)[\s,]+([A-Z\s,]+)',
        text
    )
    if qual_match:
        doctor["qualifications"] = qual_match.group(0).strip()[:100]

    # Look for registration number
    reg_match = re.search(r'Reg\.?\s*No\.?\s*:?\s*(\w+)', text, re.IGNORECASE)
    if reg_match:
        doctor["reg_no"] = reg_match.group(1)

    return doctor


def _extract_patient_info(text: str) -> Dict:
    """Extract patient name and age from prescription text."""
    import re

    patient = {"name": "", "age": "", "gender": ""}

    # Patient name
    name_match = re.search(
        r'(?:Patient|Name|Pt\.?)\s*:?\s*([A-Z][a-zA-Z\s]+?)(?:\n|,|\d|$)',
        text, re.IGNORECASE
    )
    if name_match:
        patient["name"] = name_match.group(1).strip()[:50]

    # Age
    age_match = re.search(r'\b(\d{1,3})\s*(?:years?|yrs?|Y\.?O\.?)\b', text, re.IGNORECASE)
    if age_match:
        patient["age"] = f"{age_match.group(1)} years"

    # Gender
    if re.search(r'\b(male|M)\b', text, re.IGNORECASE):
        patient["gender"] = "Male"
    elif re.search(r'\b(female|F)\b', text, re.IGNORECASE):
        patient["gender"] = "Female"

    return patient


def _enrich_medicines_with_prices(medicines: List[Dict]) -> List[Dict]:
    """Add price estimates to each medicine."""
    enriched = []
    for med in medicines:
        try:
            price = get_nppa_price(med["name"])
            if price is None:
                price = DEFAULT_PRICES["default"]

            med["estimated_price_per_unit"] = round(price, 2)

            # Calculate total for course
            units = _estimate_total_units(med)
            med["total_units_needed"] = units
            med["estimated_total_cost"] = round(price * units, 2)

        except Exception as e:
            logger.warning(f"Price enrichment failed for {med['name']}: {e}")
            med["estimated_price_per_unit"] = DEFAULT_PRICES["default"]
            med["total_units_needed"] = 0
            med["estimated_total_cost"] = 0.0

        enriched.append(med)

    return enriched


def _estimate_total_units(medicine: Dict) -> int:
    """
    Estimate total units (tablets/capsules) needed for the full course.
    Based on frequency and duration.
    """
    freq_map = {
        "once daily": 1, "twice daily": 2, "three times daily": 3,
        "four times daily": 4, "when needed": 0,
        "od": 1, "bd": 2, "tds": 3, "qid": 4, "qds": 4,
    }

    freq_text = medicine.get("frequency", "").lower()
    daily = 0
    for key, val in freq_map.items():
        if key in freq_text:
            daily = val
            break
    if daily == 0:
        daily = 1  # default

    # Parse duration
    import re
    dur_text = medicine.get("duration", "")
    dur_match = re.search(r'(\d+)\s*(day|week|month)', dur_text, re.IGNORECASE)
    if dur_match:
        num = int(dur_match.group(1))
        unit = dur_match.group(2).lower()
        if "week" in unit:
            days = num * 7
        elif "month" in unit:
            days = num * 30
        else:
            days = num
    else:
        days = 7  # default 1 week

    return daily * days


def _calculate_total_cost(medicines: List[Dict]) -> float:
    """Sum up estimated costs for all medicines."""
    total = sum(m.get("estimated_total_cost", 0.0) for m in medicines)
    return round(total, 2)


def _generate_warnings(medicines: List[Dict], confidence: float) -> List[str]:
    """Generate user-facing warnings."""
    warnings = []

    if confidence < 0.65:
        warnings.append(
            "⚠️ Low scan confidence. Please verify medicines with your pharmacist."
        )
    elif confidence < 0.80:
        warnings.append(
            "📋 Some text may be unclear. Please verify the prescription manually."
        )

    low_conf_meds = [m["name"] for m in medicines if m.get("confidence", 1.0) < 0.70]
    if low_conf_meds:
        warnings.append(
            f"⚠️ Uncertain medicine names: {', '.join(low_conf_meds)}. Please verify."
        )

    if not medicines:
        warnings.append(
            "❌ No medicines detected. Please try scanning again in better lighting."
        )

    return warnings