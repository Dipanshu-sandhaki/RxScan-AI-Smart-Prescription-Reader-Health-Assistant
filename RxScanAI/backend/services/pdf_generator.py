# backend/services/pdf_generator.py

import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

# 🔥 NEW: Import PDF Font modules
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --- FONT SETUP FOR INDIAN LANGUAGES ---
FONT_NAME = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'

try:
    # Load Windows default 'Nirmala UI' font which supports Hindi, Tamil, Bengali, Telugu, etc.
    pdfmetrics.registerFont(TTFont('Nirmala', 'C:\\Windows\\Fonts\\nirmala.ttf'))
    pdfmetrics.registerFont(TTFont('Nirmala-Bold', 'C:\\Windows\\Fonts\\nirmalab.ttf'))
    FONT_NAME = 'Nirmala'
    FONT_BOLD = 'Nirmala-Bold'
except Exception as e:
    print(f"⚠️ Warning: Nirmala font not found. Text might not render correctly. Error: {e}")

# --- BRAND COLORS ---
BRAND_NAVY = colors.HexColor("#03101F")
BRAND_OCEAN = colors.HexColor("#013270")
BRAND_TEAL = colors.HexColor("#00C2D4")
BRAND_GRAY = colors.HexColor("#7A8490")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")

def generate_prescription_pdf(data: dict) -> io.BytesIO:
    """
    Generates a high-end, professional PDF report for the scanned prescription,
    now including Estimated Costs, Grand Totals, and UNICODE LANGUAGE SUPPORT.
    """
    buffer = io.BytesIO()
    
    # Setup Document (A4 Size)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=40
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles (Updated with Dynamic Font)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName=FONT_BOLD,
        fontSize=24,
        textColor=BRAND_NAVY,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=11,
        textColor=BRAND_GRAY,
        spaceAfter=20
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName=FONT_BOLD,
        fontSize=14,
        textColor=BRAND_OCEAN,
        spaceAfter=10,
        spaceBefore=15
    )

    normal_text = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=10,
        textColor=colors.black,
        leading=14
    )

    # 1. HEADER SECTION
    elements.append(Paragraph("RxScan AI", title_style))
    current_time = datetime.now().strftime("%B %d, %Y • %I:%M %p")
    elements.append(Paragraph(f"Official Medical Extraction Report | Generated: {current_time}", subtitle_style))
    
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_TEAL, spaceAfter=20, spaceBefore=5))

    # 2. DOCTOR INFO
    doctor_info = data.get("doctor_info") or {}
    doc_name = doctor_info.get("name") or "Unknown Provider"
    
    doc_details = f"<b>Prescribing Doctor:</b> {doc_name}<br/>"
    if doctor_info.get("qualifications"):
        doc_details += f"<b>Qualifications:</b> {doctor_info.get('qualifications')}<br/>"
    if doctor_info.get("reg_no"):
        doc_details += f"<b>Reg No:</b> {doctor_info.get('reg_no')}<br/>"
        
    elements.append(Paragraph(doc_details, normal_text))
    elements.append(Spacer(1, 15))

    # 3. MEDICINES TABLE WITH COST
    elements.append(Paragraph("Prescribed Medications & Estimates", section_header_style))
    
    medicines = data.get("medicines", [])
    
    # Table Header (Added Est. Cost)
    table_data = [["#", "Medicine Name", "Dosage", "Frequency", "Duration", "Est. Cost"]]
    
    grand_total = 0.0
    
    # Table Rows
    for idx, med in enumerate(medicines, 1):
        name = med.get("name", "N/A").title()
        dose = med.get("dose") or med.get("dosage") or "-"
        freq = med.get("frequency") or med.get("instructions") or "-"
        duration = med.get("duration", "-")
        
        # Safely extract and format cost
        try:
            cost_val = float(med.get("estimated_total_cost") or med.get("cost") or 0)
        except (ValueError, TypeError):
            cost_val = 0.0
            
        grand_total += cost_val
        cost_str = f"Rs. {cost_val}" if cost_val > 0 else "-"
        
        table_data.append([str(idx), name, dose, freq, duration, cost_str])
        
    # Append Grand Total Row at the end
    table_data.append(["", "", "", "", "Total Cost:", f"Rs. {round(grand_total, 2)}"])
        
    # Table Styling
    col_widths = [0.4 * inch, 2.0 * inch, 0.9 * inch, 1.2 * inch, 1.0 * inch, 1.1 * inch]
    med_table = Table(table_data, colWidths=col_widths)
    
    table_style = TableStyle([
        # Header Style
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_OCEAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        
        # Body Style (Uses Dynamic Indic Font)
        ('FONTNAME', (0, 1), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 1), (-1, -2), 'CENTER'),
        ('ALIGN', (1, 1), (1, -2), 'LEFT'),
        
        # Grid & Row Colors
        ('GRID', (0, 0), (-1, -2), 1, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, LIGHT_BG]),
        
        # Grand Total Row Styling
        ('FONTNAME', (-2, -1), (-1, -1), FONT_BOLD),
        ('TEXTCOLOR', (-2, -1), (-1, -1), BRAND_NAVY),
        ('ALIGN', (-2, -1), (-1, -1), 'RIGHT'),
        ('ALIGN', (-1, -1), (-1, -1), 'CENTER'),
        ('LINEABOVE', (-2, -1), (-1, -1), 1.5, BRAND_OCEAN),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
    ])
    
    med_table.setStyle(table_style)
    elements.append(med_table)
    elements.append(Spacer(1, 20))

    # 4. SCAN METRICS / AI DETAILS
    elements.append(Paragraph("AI Scan Diagnostics", section_header_style))
    
    conf = data.get("scan_confidence", 0)
    try:
        conf_pct = round(float(conf) * 100)
    except (ValueError, TypeError):
        conf_pct = 0
        
    proc_time = data.get("processing_time_seconds", 0)
    med_count = len(medicines)
    
    metrics_data = [
        ["Overall AI Accuracy:", f"{conf_pct}%"],
        ["Total Medicines Found:", str(med_count)],
        ["Processing Time:", f"{proc_time} seconds"]
    ]
    
    metrics_table = Table(metrics_data, colWidths=[2.5 * inch, 4.5 * inch])
    metrics_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), FONT_BOLD),
        ('FONTNAME', (1, 0), (1, -1), FONT_NAME),
        ('TEXTCOLOR', (0, 0), (-1, -1), BRAND_NAVY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, BORDER_COLOR), 
    ]))
    elements.append(metrics_table)
    
    elements.append(Spacer(1, 40))

    # 5. FOOTER & DISCLAIMER
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Italic'],
        fontName=FONT_NAME, # Changed to Nirmala for translated warnings if any
        fontSize=8,
        textColor=BRAND_GRAY,
        leading=12,
        alignment=1 
    )
    
    disclaimer_text = (
        "<b>IMPORTANT MEDICAL DISCLAIMER:</b><br/>"
        "This document was automatically generated by RxScan AI. "
        "Estimated costs are based on standard NPPA ceiling prices and may vary by pharmacy and brand. "
        "Always verify medications, dosages, and actual prices with your doctor or pharmacist."
    )
    
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=15))
    elements.append(Paragraph(disclaimer_text, disclaimer_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer