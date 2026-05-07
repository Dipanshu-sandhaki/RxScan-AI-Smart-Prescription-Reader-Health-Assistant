import pandas as pd
import json
import re
import os

# ─── ROBUST FILE PATHS ───
# Get the exact folder where this script is located (backend/data)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CSV_FILE_PATH = os.path.join(SCRIPT_DIR, "nppaipdms.csv")
OUTPUT_JSON_PATH = os.path.join(SCRIPT_DIR, "medicines_db.json")

def clean_medicine_name(name):
    """Cleans the medicine name for better OCR matching"""
    name = str(name).lower()
    # Removes anything inside brackets if present (e.g., dosage info)
    name = re.sub(r'\(.*?\)', '', name) 
    return name.strip()

def extract_price(price_str):
    """Extracts only the float price from strings like '₹ 0.28(1 Tablet)'"""
    match = re.search(r'\d+\.\d+|\d+', str(price_str))
    if match:
        return float(match.group())
    return None

def build_database():
    print(f"Reading CSV File from: {CSV_FILE_PATH}...")
    
    if not os.path.exists(CSV_FILE_PATH):
        print("❌ Error: CSV file not found! Make sure 'nppaipdms.csv' is inside the 'backend/data' folder.")
        return
        
    try:
        # skiprows=1 handles the weird scraper headers in this specific Kaggle dataset
        df = pd.read_csv(CSV_FILE_PATH, skiprows=1)
    except Exception as e:
        print(f"❌ Failed to read CSV: {e}")
        return
        
    med_db = {}
    
    # Iterate through rows and extract data
    for index, row in df.iterrows():
        try:
            # Index 2 is Medicine Name, Index 5 is Price based on your CSV format
            raw_name = row.iloc[2]
            raw_price = row.iloc[5]
            
            if pd.isna(raw_name) or pd.isna(raw_price):
                continue
                
            clean_name = clean_medicine_name(raw_name)
            price = extract_price(raw_price)
            
            if clean_name and price is not None:
                # Overwrites if duplicate exists, keeping the latest price
                med_db[clean_name] = price
                
        except Exception:
            continue

    # ─── OVERWRITE THE OLD JSON ───
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(med_db, f, indent=4)
        
    print(f"✅ Success! Replaced old DB. Total {len(med_db)} medicines saved to {OUTPUT_JSON_PATH}")
    print("Restart your FastAPI backend to load the new prices!")

if __name__ == "__main__":
    build_database()