#!/usr/bin/env python3
"""
Generate PWA icons for the application.
Creates simple placeholder icons in various sizes.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "icons"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Create a simple pothole detection icon
def create_icon(size):
    img = Image.new('RGBA', (size, size), (8, 26, 43))  # Dark navy background
    draw = ImageDraw.Draw(img)
    
    # Draw a road (rectangle with perspective)
    road_top = size * 0.3
    road_bottom = size * 0.9
    road_left_top = size * 0.35
    road_right_top = size * 0.65
    road_left_bottom = size * 0.1
    road_right_bottom = size * 0.9
    
    # Road surface
    draw.polygon([
        (road_left_top, road_top),
        (road_right_top, road_top),
        (road_right_bottom, road_bottom),
        (road_left_bottom, road_bottom)
    ], fill=(30, 58, 95))  # Darker blue for road
    
    # Road lines
    center_top = size * 0.5
    center_bottom = size * 0.5
    for i in range(3):
        y = road_top + (road_bottom - road_top) * (i + 0.5) / 3
        left = center_top - (center_top - road_left_top) * (y - road_top) / (road_bottom - road_top)
        right = center_top + (road_right_top - center_top) * (y - road_top) / (road_bottom - road_top)
        if i != 1:  # Dashed lines
            draw.line([(left, y), (right, y)], fill=(100, 200, 255), width=max(1, size // 100))
    
    # Draw a pothole (dark circle on road)
    pothole_x = size * 0.5
    pothole_y = road_top + (road_bottom - road_top) * 0.6
    pothole_radius = size * 0.12
    
    draw.ellipse([
        pothole_x - pothole_radius, pothole_y - pothole_radius,
        pothole_x + pothole_radius, pothole_y + pothole_radius
    ], fill=(0, 0, 0))
    
    # Add detection box around pothole (cyan rectangle)
    box_padding = pothole_radius * 1.3
    draw.rectangle([
        pothole_x - box_padding, pothole_y - box_padding,
        pothole_x + box_padding, pothole_y + box_padding
    ], outline=(0, 200, 255), width=max(2, size // 80))
    
    # Add small corner markers on detection box
    corner_size = size * 0.03
    corners = [
        (pothole_x - box_padding, pothole_y - box_padding),  # TL
        (pothole_x + box_padding, pothole_y - box_padding),  # TR
        (pothole_x - box_padding, pothole_y + box_padding),  # BL
        (pothole_x + box_padding, pothole_y + box_padding),  # BR
    ]
    for cx, cy in corners:
        draw.rectangle([
            cx - corner_size, cy - corner_size,
            cx + corner_size, cy + corner_size
        ], fill=(0, 200, 255))
    
    # App initials at bottom
    try:
        font_size = max(12, size // 10)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "PD"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text(
        (size//2 - text_w//2, size - text_h - size//20),
        text,
        fill=(0, 200, 255),
        font=font
    )
    
    return img

# Generate all icon sizes
for size in ICON_SIZES:
    img = create_icon(size)
    img.save(os.path.join(OUTPUT_DIR, f'pothole-{size}.png'))
    print(f"Created pothole-{size}.png")

# Create special icons for shortcuts
for name in ['detect', 'report', 'reports']:
    for size in [96]:
        img = create_icon(size)
        # Modify for specific shortcut
        draw = ImageDraw.Draw(img)
        if name == 'detect':
            # Add camera icon
            draw.rectangle([size*0.35, size*0.3, size*0.65, size*0.6], outline=(0,200,255), width=max(2, size//60))
            draw.ellipse([size*0.42, size*0.38, size*0.58, size*0.52], fill=(0,200,255))
        elif name == 'report':
            # Add plus/report icon
            draw.line([size*0.5, size*0.35, size*0.5, size*0.65], fill=(0,200,255), width=max(2, size//60))
            draw.line([size*0.35, size*0.5, size*0.65, size*0.5], fill=(0,200,255), width=max(2, size//60))
        elif name == 'reports':
            # Add list icon
            for i in range(3):
                y = size * 0.3 + i * size * 0.12
                draw.rectangle([size*0.3, y, size*0.7, y + size*0.08], outline=(0,200,255), width=max(2, size//60))
        img.save(OUTPUT_DIR / f'{name}-{size}.png')
        print(f"Created {name}-{size}.png")

print("\nAll icons generated successfully!")
