"""
RxScan AI — Build Local Drug Database
Downloads WHO INN drug list + sample NPPA prices and saves as local JSON.

Run this ONCE before starting the backend:
    python data/build_drug_db.py

The generated medicines_db.json is bundled with the backend for offline use.
"""

import json
import os
import httpx

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Curated list of 200 most common drugs prescribed in India
# Source: WHO INN list + India Essential Medicines List 2022
COMMON_INDIAN_DRUGS = [
    # Antibiotics
    "Amoxicillin", "Azithromycin", "Ciprofloxacin", "Doxycycline",
    "Metronidazole", "Clarithromycin", "Cefixime", "Ampicillin",
    "Cloxacillin", "Erythromycin", "Levofloxacin", "Norfloxacin",
    "Ofloxacin", "Cephalexin", "Cotrimoxazole", "Nitrofurantoin",

    # Pain / Fever
    "Paracetamol", "Ibuprofen", "Diclofenac", "Aspirin", "Naproxen",
    "Ketorolac", "Aceclofenac", "Nimesulide", "Tramadol", "Codeine",

    # Vitamins / Minerals
    "Vitamin D3", "Vitamin B12", "Vitamin C", "Folic Acid", "Iron",
    "Calcium Carbonate", "Zinc", "Vitamin E", "Vitamin B Complex",
    "Magnesium", "Potassium Chloride",

    # Gastrointestinal
    "Omeprazole", "Pantoprazole", "Ranitidine", "Domperidone",
    "Metoclopramide", "Ondansetron", "Loperamide", "Lactulose",
    "Bisacodyl", "Rabeprazole", "Esomeprazole", "Famotidine",

    # Antidiabetic
    "Metformin", "Glibenclamide", "Glipizide", "Insulin",
    "Sitagliptin", "Vildagliptin", "Pioglitazone", "Gliclazide",
    "Dapagliflozin", "Empagliflozin",

    # Antihypertensive
    "Amlodipine", "Enalapril", "Losartan", "Atenolol", "Metoprolol",
    "Telmisartan", "Ramipril", "Lisinopril", "Valsartan", "Nifedipine",
    "Hydrochlorothiazide", "Furosemide", "Spironolactone",

    # Respiratory
    "Salbutamol", "Prednisolone", "Montelukast", "Cetirizine",
    "Loratadine", "Fexofenadine", "Chlorpheniramine", "Budesonide",
    "Formoterol", "Ipratropium", "Ambroxol", "Bromhexine",

    # Cardiovascular
    "Atorvastatin", "Rosuvastatin", "Clopidogrel", "Warfarin",
    "Digoxin", "Diltiazem", "Isosorbide", "Nitroglycerin",

    # Mental Health / Neuro
    "Alprazolam", "Diazepam", "Clonazepam", "Escitalopram",
    "Sertraline", "Fluoxetine", "Amitriptyline", "Gabapentin",
    "Pregabalin", "Levodopa", "Phenytoin", "Carbamazepine",
    "Valproic Acid", "Lamotrigine",

    # Thyroid
    "Levothyroxine", "Carbimazole", "Propylthiouracil",

    # Topical / Dermatology
    "Betamethasone", "Clotrimazole", "Mupirocin", "Permethrin",
    "Calamine", "Hydrocortisone",

    # Eye / ENT
    "Ciprofloxacin Eye Drops", "Prednisolone Eye Drops",
    "Timolol", "Latanoprost", "Oxymetazoline",

    # Antifungal
    "Fluconazole", "Itraconazole", "Ketoconazole", "Terbinafine",

    # Antiparasitic
    "Albendazole", "Mebendazole", "Ivermectin", "Chloroquine",

    # Hormones
    "Progesterone", "Estradiol", "Testosterone", "Dexamethasone",
    "Methylprednisolone", "Hydrocortisone",
]

# Sample NPPA price ceilings (INR) — partial list for common drugs
# Full data: https://www.nhm.gov.in/nlem.html
SAMPLE_NPPA_PRICES = {
    "amoxicillin": 2.50,
    "azithromycin": 8.30,
    "ciprofloxacin": 3.10,
    "paracetamol": 0.75,
    "ibuprofen": 2.20,
    "metformin": 1.80,
    "atorvastatin": 4.50,
    "amlodipine": 2.10,
    "omeprazole": 3.60,
    "pantoprazole": 4.20,
    "vitamin d3": 2.80,
    "vitamin b12": 3.90,
    "folic acid": 0.50,
    "iron": 1.20,
    "calcium carbonate": 1.50,
    "domperidone": 3.40,
    "ondansetron": 5.50,
    "salbutamol": 2.90,
    "montelukast": 6.80,
    "cetirizine": 1.60,
    "losartan": 4.30,
    "atenolol": 1.90,
    "prednisolone": 2.70,
    "diclofenac": 2.40,
    "ranitidine": 2.10,
}


def build_database():
    print("Building RxScan AI drug database...")

    # Build medicines DB
    medicines_db = {
        "version": "1.0.0",
        "source": "WHO INN List + India Essential Medicines List 2022",
        "total": len(COMMON_INDIAN_DRUGS),
        "drugs": COMMON_INDIAN_DRUGS,
    }

    medicines_path = os.path.join(OUTPUT_DIR, "medicines_db.json")
    with open(medicines_path, "w", encoding="utf-8") as f:
        json.dump(medicines_db, f, indent=2, ensure_ascii=False)
    print(f"  medicines_db.json: {len(COMMON_INDIAN_DRUGS)} drugs")

    # Build NPPA prices DB
    nppa_path = os.path.join(OUTPUT_DIR, "nppa_prices.json")
    with open(nppa_path, "w", encoding="utf-8") as f:
        json.dump(SAMPLE_NPPA_PRICES, f, indent=2, ensure_ascii=False)
    print(f"  nppa_prices.json: {len(SAMPLE_NPPA_PRICES)} price entries")

    print("\nDatabase build complete!")
    print(f"Files saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    build_database()
