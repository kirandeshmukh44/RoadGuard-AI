from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from pathlib import Path
import os

from .config import REPORTS_DIR


def generate_pothole_report(pothole_data: dict, output_filename: str = None) -> str:
    """
    Generate a PDF report for a pothole detection.
    
    Args:
        pothole_data: Dictionary containing pothole information
        output_filename: Optional custom filename for the PDF
        
    Returns:
        Path to the generated PDF file
    """
    if output_filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"pothole_report_{pothole_data.get('id', 'unknown')}_{timestamp}.pdf"
    
    output_path = REPORTS_DIR / output_filename
    
    # Create PDF document
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Story container
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0a192f'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#112240'),
        spaceAfter=12,
        spaceBefore=20
    )
    
    # Title
    title = Paragraph("Pothole Detection Report", title_style)
    story.append(title)
    story.append(Spacer(1, 0.2 * inch))
    
    # Report metadata
    report_date = Paragraph(
        f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        styles['Normal']
    )
    story.append(report_date)
    story.append(Spacer(1, 0.3 * inch))
    
    # Pothole details table
    details_data = [
        ["Pothole ID", str(pothole_data.get('id', 'N/A'))],
        ["Road Name", pothole_data.get('road_name', 'N/A')],
        ["Location", f"{pothole_data.get('latitude', 0):.6f}, {pothole_data.get('longitude', 0):.6f}"],
        ["Severity", pothole_data.get('severity', 'N/A').upper()],
        ["Confidence", f"{pothole_data.get('confidence', 0):.2%}"],
        ["Status", pothole_data.get('status', 'N/A').upper()],
        ["Detection Date", pothole_data.get('created_at', 'N/A')],
        ["Detection Method", pothole_data.get('detection_method', 'N/A').upper()],
    ]
    
    # Create table
    details_table = Table(details_data, colWidths=[2.5 * inch, 3 * inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#00d4ff')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 0.4 * inch))
    
    # Description
    if pothole_data.get('description'):
        story.append(Paragraph("Description", heading_style))
        desc_para = Paragraph(pothole_data['description'], styles['Normal'])
        story.append(desc_para)
        story.append(Spacer(1, 0.3 * inch))
    
    # Detection details
    story.append(Paragraph("Detection Details", heading_style))
    
    bounding_boxes = pothole_data.get('bounding_boxes', [])
    if bounding_boxes:
        bb_data = [["Pothole #", "X1", "Y1", "X2", "Y2", "Confidence"]]
        for i, bb in enumerate(bounding_boxes, 1):
            bb_data.append([
                str(i),
                f"{bb.get('x1', 0):.2f}",
                f"{bb.get('y1', 0):.2f}",
                f"{bb.get('x2', 0):.2f}",
                f"{bb.get('y2', 0):.2f}",
                f"{bb.get('confidence', 0):.2%}"
            ])
        
        bb_table = Table(bb_data, colWidths=[0.8 * inch, 1 * inch, 1 * inch, 1 * inch, 1 * inch, 1.2 * inch])
        bb_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a192f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(bb_table)
    else:
        story.append(Paragraph("No bounding box data available", styles['Normal']))
    
    story.append(Spacer(1, 0.4 * inch))
    
    # Add image if available
    image_path = pothole_data.get('image_path')
    if image_path and os.path.exists(image_path):
        story.append(Paragraph("Pothole Image", heading_style))
        try:
            img = Image(image_path, width=5 * inch, height=3.5 * inch)
            img.hAlign = 'CENTER'
            story.append(img)
        except Exception as e:
            story.append(Paragraph(f"Error loading image: {str(e)}", styles['Normal']))
    
    story.append(Spacer(1, 0.5 * inch))
    
    # Footer
    footer = Paragraph(
        "<i>This report was automatically generated by the AI-Based Pothole Detection System</i>",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
    )
    story.append(footer)
    
    # Build PDF
    doc.build(story)
    
    return output_filename


def generate_summary_report(potholes: list, output_filename: str = None) -> str:
    """
    Generate a summary PDF report for multiple potholes.
    
    Args:
        potholes: List of pothole dictionaries
        output_filename: Optional custom filename for the PDF
        
    Returns:
        Path to the generated PDF file
    """
    if output_filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"pothole_summary_{timestamp}.pdf"
    
    output_path = REPORTS_DIR / output_filename
    
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0a192f'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    title = Paragraph("Pothole Detection Summary Report", title_style)
    story.append(title)
    story.append(Spacer(1, 0.2 * inch))
    
    # Summary statistics
    total = len(potholes)
    high_severity = sum(1 for p in potholes if p.get('severity') == 'high')
    medium_severity = sum(1 for p in potholes if p.get('severity') == 'medium')
    low_severity = sum(1 for p in potholes if p.get('severity') == 'low')
    repaired = sum(1 for p in potholes if p.get('status') == 'repaired')
    pending = sum(1 for p in potholes if p.get('status') == 'pending')
    
    stats_data = [
        ["Total Potholes", str(total)],
        ["High Severity", str(high_severity)],
        ["Medium Severity", str(medium_severity)],
        ["Low Severity", str(low_severity)],
        ["Repaired", str(repaired)],
        ["Pending Repair", str(pending)],
    ]
    
    stats_table = Table(stats_data, colWidths=[2.5 * inch, 2 * inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#00d4ff')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 0.4 * inch))
    
    # Detailed table
    story.append(Paragraph("Detailed Records", styles['Heading2']))
    
    table_data = [["ID", "Road", "Severity", "Status", "Date"]]
    for p in potholes[:50]:  # Limit to 50 records
        table_data.append([
            str(p.get('id', 'N/A')),
            p.get('road_name', 'N/A')[:20],
            p.get('severity', 'N/A').upper(),
            p.get('status', 'N/A').upper(),
            p.get('created_at', 'N/A')[:10]
        ])
    
    detail_table = Table(table_data, colWidths=[0.5 * inch, 2 * inch, 1 * inch, 1 * inch, 1.2 * inch])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a192f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    story.append(detail_table)
    
    doc.build(story)
    
    return output_filename
