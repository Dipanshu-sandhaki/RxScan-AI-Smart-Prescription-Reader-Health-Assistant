from rapidfuzz import process, fuzz

MED_DB = [
    "amoxicillin", "paracetamol", "azithromycin", "ibuprofen", "cetirizine",
    "metformin", "omeprazole", "pantoprazole", "atorvastatin", "dolo", "crocin"
]

# 🔥 PRICING DATABASE (Per Unit / Tablet Cost in INR)
MED_PRICES = {
    "amoxicillin": 8.50,
    "paracetamol": 2.00,
    "azithromycin": 22.00,
    "ibuprofen": 3.50,
    "cetirizine": 1.50,
    "metformin": 4.00,
    "omeprazole": 6.00,
    "pantoprazole": 8.00,
    "atorvastatin": 12.00,
    "dolo": 2.50,
    "crocin": 2.00
}

def get_medicine_price(name: str) -> float:
    """Returns the estimated per-unit price of the medicine."""
    return MED_PRICES.get(name.lower(), 5.0) # Fallback default 5.0 rupees

def is_valid_word(word: str):
    if len(word) < 4:
        return False
    if any(char.isdigit() for char in word):
        return False
    return True

def extract_medicines(text):
    words = text.lower().split()
    found = set()

    for word in words:
        if not is_valid_word(word):
            continue

        strict_match = process.extractOne(word, MED_DB, scorer=fuzz.ratio)
        if strict_match and strict_match[1] > 80:
            found.add(strict_match[0])
            continue

        fuzzy_match = process.extractOne(word, MED_DB, scorer=fuzz.partial_ratio)
        if fuzzy_match and fuzzy_match[1] > 70:
            found.add(fuzzy_match[0])

    return list(found)