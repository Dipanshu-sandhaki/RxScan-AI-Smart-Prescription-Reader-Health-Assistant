"""
RxScan AI — PDF Generation Service
Generates professional prescription PDFs from OCR scan results
"""

from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_prescription_pdf(data: dict) -> BytesIO:
    """
    Generate a professional prescription PDF
    
    Args:
        data: Dictionary containing:
            - medicines: list of medicine dicts with name, dose, frequency, duration
            - doctor_info: dict with name, qualifications, reg_no
            - scan_confidence: float (0-1)
            - processing_time_seconds: float
            
    Returns:
        BytesIO object containing PDF data
    """
    
    # Create PDF in memory
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0066CC'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#333333'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#555555'),
        spaceAfter=2
    )
    
    # Build document elements
    elements = []
    
    # Header
    elements.append(Paragraph("RxScan AI", title_style))
    elements.append(Paragraph("Smart Prescription Reader", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Generation date
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements.append(Paragraph(f"<b>Generated:</b> {timestamp}", normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Doctor Information
    if data.get('doctor_info'):
        elements.append(Paragraph("<b>Doctor Information</b>", heading_style))
        doctor = data['doctor_info']
        doctor_data = [
            ['Name:', doctor.get('name', 'N/A')],
            ['Qualifications:', doctor.get('qualifications', 'N/A')],
            ['Registration No:', doctor.get('reg_no', 'N/A')],
        ]
        doctor_table = Table(doctor_data, colWidths=[1.5*inch, 3.5*inch])
        doctor_table.setStyle(TableStyle([
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(doctor_table)
        elements.append(Spacer(1, 0.15*inch))
    
    # Medicines
    elements.append(Paragraph("<b>Prescribed Medicines</b>", heading_style))
    
    medicines = data.get('medicines', [])
    if medicines:
        # Create medicines table
        medicine_data = [['#', 'Medicine', 'Dose', 'Frequency', 'Duration']]
        
        for i, med in enumerate(medicines, 1):
            medicine_data.append([
                str(i),
                med.get('name', 'N/A'),
                med.get('dose', 'N/A'),
                med.get('frequency', 'N/A'),
                med.get('duration', 'N/A'),
            ])
        
        med_table = Table(medicine_data, colWidths=[0.4*inch, 1.8*inch, 1.1*inch, 1.2*inch, 1.1*inch])
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066CC')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (4, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
        ]))
        elements.append(med_table)
    else:
        elements.append(Paragraph("No medicines detected", normal_style))
    
    elements.append(Spacer(1, 0.15*inch))
    
    # Scan Metadata
    elements.append(Paragraph("<b>Scan Details</b>", heading_style))
    confidence = data.get('scan_confidence', 0)
    confidence_pct = round(confidence * 100, 1)
    
    metadata = [
        ['AI Confidence:', f"{confidence_pct}%"],
        ['Processing Time:', f"{data.get('processing_time_seconds', 0):.2f}s"],
        ['Medicine Count:', str(len(medicines))],
    ]
    
    metadata_table = Table(metadata, colWidths=[2*inch, 3*inch])
    metadata_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 9),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#666666')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(metadata_table)
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Footer
    footer_text = (
        "<b>⚠️ Important:</b> This is an AI-generated document from prescription image scanning. "
        "Always verify medications and dosages with your pharmacist or doctor before consumption. "
        "This report is for informational purposes only."
    )
    elements.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#CC0000'),
        alignment=TA_LEFT,
    )))
    
    # Build PDF
    doc.build(elements)
    pdf_buffer.seek(0)
    return pdf_buffer
