"""
RxScan AI — API Test Script
Run this to verify all backend endpoints work correctly.

Usage:
  cd backend
  python test_apis.py

Make sure backend is running: uvicorn main:app --reload
"""

import requests
import json
import time
import sys
from io import BytesIO
from PIL import Image, ImageDraw

BASE_URL = "http://localhost:8000"

def print_ok(msg):   print(f"  ✅ {msg}")
def print_fail(msg): print(f"  ❌ {msg}")
def print_skip(msg): print(f"  ⏭️  {msg}")
def section(title):  print(f"\n{'='*50}\n🔹 {title}\n{'='*50}")


def create_test_prescription_image() -> bytes:
    """Create a synthetic prescription image for testing."""
    img = Image.new('RGB', (600, 400), color='white')
    draw = ImageDraw.Draw(img)

    lines = [
        "Dr. R. Sharma  MBBS, MD",
        "Apollo Hospital, New Delhi",
        "",
        "Amoxicillin 500mg  BD x 5 days  After meals",
        "Paracetamol 650mg  TDS x 3 days  With water",
        "Vitamin D3 1000 IU  OD x 30 days  Morning",
        "Pantoprazole 40mg  OD  Before food",
    ]
    y = 30
    for line in lines:
        draw.text((40, y), line, fill='black')
        y += 45

    buf = BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()


def test_health():
    section("1. Health Check")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        data = resp.json()
        if resp.status_code == 200 and data.get("status") == "ok":
            print_ok(f"Backend is online: {data}")
        else:
            print_fail(f"Unexpected response: {resp.status_code} {data}")
    except Exception as e:
        print_fail(f"Backend offline: {e}")
        print("\n⚠️  Start backend with: uvicorn main:app --reload")
        sys.exit(1)


def test_ocr_health():
    section("2. OCR Model Status")
    try:
        resp = requests.get(f"{BASE_URL}/api/scan/health", timeout=10)
        data = resp.json()
        loaded = data.get("models_loaded", False)
        if loaded:
            print_ok(f"TrOCR models loaded and ready")
        else:
            print_skip("Models still loading. Waiting 30 seconds...")
            time.sleep(30)
            resp2 = requests.get(f"{BASE_URL}/api/scan/health", timeout=10)
            data2 = resp2.json()
            if data2.get("models_loaded"):
                print_ok("Models now loaded!")
            else:
                print_fail("Models not loaded yet. Backend may need more time.")
    except Exception as e:
        print_fail(f"OCR health check failed: {e}")


def test_scan():
    section("3. POST /api/scan — Prescription Scan")
    try:
        print("  Creating test image...")
        image_bytes = create_test_prescription_image()

        print(f"  Sending image ({len(image_bytes)/1024:.1f}KB)...")
        start = time.time()

        resp = requests.post(
            f"{BASE_URL}/api/scan",
            files={"file": ("test_rx.jpg", image_bytes, "image/jpeg")},
            data={"is_handwritten": "false"},  # Use printed model for synthetic image
            timeout=120,
        )

        elapsed = round(time.time() - start, 2)

        if resp.status_code == 200:
            data = resp.json()
            print_ok(f"Scan completed in {elapsed}s")
            print(f"     Raw text: {repr(data.get('raw_text', '')[:100])}")
            print(f"     Lines detected: {data.get('lines_detected', 0)}")
            print(f"     Medicines found: {data.get('medicine_count', 0)}")
            print(f"     Confidence: {data.get('scan_confidence', 0):.0%}")
            print(f"     Estimated cost: ₹{data.get('total_cost_estimate', 0)}")

            meds = data.get('medicines', [])
            if meds:
                print(f"     Sample medicine: {meds[0]}")
        else:
            print_fail(f"HTTP {resp.status_code}: {resp.text[:200]}")

    except requests.Timeout:
        print_fail("Scan timed out. Models may be loading still.")
    except Exception as e:
        print_fail(f"Scan error: {e}")


def test_translation():
    section("4. POST /api/translate — Translation (MyMemory free API)")
    test_cases = [
        ("Take this medicine after meals", "hi", "Hindi"),
        ("Take this medicine after meals", "bn", "Bengali"),
        ("Take this medicine after meals", "ta", "Tamil"),
    ]

    for text, lang_code, lang_name in test_cases:
        try:
            resp = requests.post(
                f"{BASE_URL}/api/translate",
                json={"text": text, "target_language": lang_code},
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("translated_text", "")
                provider = data.get("provider", "unknown")
                print_ok(f"{lang_name} ({provider}): {translated}")
            else:
                print_fail(f"{lang_name}: HTTP {resp.status_code}")
        except Exception as e:
            print_fail(f"{lang_name}: {e}")


def test_languages():
    section("5. GET /api/languages — Language List")
    try:
        resp = requests.get(f"{BASE_URL}/api/languages", timeout=5)
        data = resp.json()
        count = data.get("count", 0)
        print_ok(f"{count} languages supported")
        langs = data.get("languages", [])[:5]
        for l in langs:
            print(f"     • {l['name']} ({l['code']})")
    except Exception as e:
        print_fail(f"Languages endpoint failed: {e}")


def test_pharmacy():
    section("6. GET /api/pharmacies/nearby — Pharmacy Finder")
    try:
        # Use Delhi coordinates for testing
        resp = requests.get(
            f"{BASE_URL}/api/pharmacies/nearby",
            params={"lat": 28.6139, "lng": 77.2090, "radius": 2000},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            count = data.get("count", 0)
            is_mock = data.get("is_mock_data", False)
            print_ok(f"Found {count} pharmacies {'(mock data)' if is_mock else '(real data)'}")
            for p in data.get("pharmacies", [])[:3]:
                print(f"     • {p['name']} — {p['distance_meters']}m away")
        else:
            print_fail(f"HTTP {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print_fail(f"Pharmacy search failed: {e}")


def test_drug_info():
    section("7. GET /api/drug/{name} — Drug Info (RxNorm + OpenFDA)")
    for drug in ["amoxicillin", "paracetamol", "metformin"]:
        try:
            resp = requests.get(f"{BASE_URL}/api/drug/{drug}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                rxnorm = data.get("rxnorm", {})
                found = rxnorm.get("found", False)
                print_ok(f"{drug}: RxNorm {'found' if found else 'not found'} | rxcui={rxnorm.get('rxcui', 'N/A')}")
            else:
                print_fail(f"{drug}: HTTP {resp.status_code}")
        except Exception as e:
            print_fail(f"{drug}: {e}")


def main():
    print("\n" + "🏥 RxScan AI — API Test Suite".center(52, "─"))
    print(f"Backend: {BASE_URL}")
    print("─" * 52)

    test_health()
    test_ocr_health()
    test_scan()
    test_translation()
    test_languages()
    test_pharmacy()
    test_drug_info()

    print("\n" + "─" * 52)
    print("✅ Test suite complete!")
    print("─" * 52 + "\n")


if __name__ == "__main__":
    main()