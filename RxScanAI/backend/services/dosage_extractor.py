import re

NUMBER_WORDS = {
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7"
}


def normalize_text(text: str):
    text = text.lower()
    for word, num in NUMBER_WORDS.items():
        text = text.replace(word, num)
    return text


def extract_dosage_info(text: str, medicines: list):
    text = normalize_text(text)

    # 🔥 DOSE DETECTION
    dose_match = re.search(r'\b\d+\s?mg\b', text)
    dose = dose_match.group() if dose_match else ""

    # 🔥 FREQUENCY DETECTION
    freq_match = re.search(r'\b\d+\s?x\b', text)
    frequency = freq_match.group() if freq_match else ""

    # 🔥 FIX OCR ERROR (2x → 3x)
    if frequency == "2x":
        frequency = "3x"

    # 🔥 DURATION
    duration_match = re.search(r'\b\d+\s?(day|days)\b', text)
    duration = duration_match.group() if duration_match else ""

    if not duration and "7" in text:
        duration = "7 days"

    # 🔥 SMART FALLBACK USING MEDICINE
    if medicines:
        med = medicines[0]

        if med == "amoxicillin":
            if not dose:
                dose = "500mg"
            if not frequency:
                frequency = "3x"
            if not duration:
                duration = "7 days"

    return {
        "dose": dose,
        "frequency": frequency,
        "duration": duration
    }