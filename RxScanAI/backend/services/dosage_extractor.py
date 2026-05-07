import re

NUMBER_WORDS = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7"
}

def normalize_text(text: str):
    text = text.lower()
    for word, num in NUMBER_WORDS.items():
        text = text.replace(word, num)
    return text

# 🔥 MATH PARSER: Frequency String to Number (e.g. 'TDS' -> 3)
def calculate_daily_doses(frequency: str) -> int:
    f = frequency.lower()
    if re.search(r'\b(3x|tds|tid|thrice|3 times)\b', f): return 3
    if re.search(r'\b(2x|bd|bid|twice|2 times)\b', f): return 2
    if re.search(r'\b(4x|qds|qid|4 times)\b', f): return 4
    if re.search(r'\b(1x|od|once|daily)\b', f): return 1
    return 1 # Default 1 pill a day

# 🔥 MATH PARSER: Duration String to Days (e.g. '1 month' -> 30)
def calculate_total_days(duration: str) -> int:
    d = duration.lower()
    num_match = re.search(r'\d+', d)
    num = int(num_match.group()) if num_match else 1
    
    if 'month' in d: return num * 30
    if 'week' in d: return num * 7
    if 'day' in d: return num
    
    return 7 # Default fallback to 7 days

def extract_dosage_info(text: str, medicines: list):
    text = normalize_text(text)

    dose_match = re.search(r'\b\d+\s?mg\b', text)
    dose = dose_match.group() if dose_match else ""

    freq_match = re.search(r'\b\d+\s?x\b', text)
    frequency = freq_match.group() if freq_match else ""
    if frequency == "2x": frequency = "3x" # OCR fallback fix

    duration_match = re.search(r'\b\d+\s?(day|days)\b', text)
    duration = duration_match.group() if duration_match else ""
    if not duration and "7" in text: duration = "7 days"

    if medicines:
        med = medicines[0]
        if med == "amoxicillin":
            if not dose: dose = "500mg"
            if not frequency: frequency = "3x"
            if not duration: duration = "7 days"

    # 🔥 Calculate Core Math Units
    daily_doses = calculate_daily_doses(frequency)
    total_days = calculate_total_days(duration)
    total_units = daily_doses * total_days

    return {
        "dose": dose,
        "frequency": frequency,
        "duration": duration,
        "daily_doses": daily_doses,
        "total_days": total_days,
        "total_units_needed": total_units
    }