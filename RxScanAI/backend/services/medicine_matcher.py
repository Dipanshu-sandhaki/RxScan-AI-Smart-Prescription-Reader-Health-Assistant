from rapidfuzz import process, fuzz

MED_DB = [
    "amoxicillin",
    "paracetamol",
    "azithromycin",
    "ibuprofen",
    "cetirizine",
    "metformin",
    "omeprazole",
    "pantoprazole",
    "atorvastatin",
    "dolo",
    "crocin"
]


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

        # 🔥 LAYER 1: STRICT MATCH
        strict_match = process.extractOne(
            word,
            MED_DB,
            scorer=fuzz.ratio
        )

        if strict_match and strict_match[1] > 80:
            found.add(strict_match[0])
            continue

        # 🔥 LAYER 2: FALLBACK (loose but controlled)
        fuzzy_match = process.extractOne(
            word,
            MED_DB,
            scorer=fuzz.partial_ratio
        )

        if fuzzy_match and fuzzy_match[1] > 70:
            found.add(fuzzy_match[0])

    return list(found)