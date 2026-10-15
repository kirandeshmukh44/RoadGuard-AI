"""
Test script to verify YOLO model detection
"""
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ai_detection import detector
from app.config import CONFIDENCE_THRESHOLD, SEVERITY_THRESHOLDS

print("=" * 60)
print("YOLO Model Detection Test")
print("=" * 60)
print(f"\nModel Status: {'LOADED' if detector.model_loaded else 'NOT LOADED'}")
print(f"Confidence Threshold: {CONFIDENCE_THRESHOLD}")
print(f"Severity Thresholds: {SEVERITY_THRESHOLDS}")

if detector.model_loaded:
    print("\n✅ Model is loaded successfully!")
    print("\nModel Info:")
    try:
        if hasattr(detector.model, 'names'):
            print(f"Classes: {detector.model.names}")
        if hasattr(detector.model, 'args'):
            print(f"Input Size: {detector.model.args.get('imgsz', 'N/A')}")
    except Exception as e:
        print(f"Could not retrieve model info: {e}")
else:
    print("\n❌ Model is NOT loaded!")
    print("Please ensure:")
    print("1. Model file exists at: User/backend/models/pothole_detection.pt")
    print("2. Ultralytics package is installed")
    print("3. Model is properly trained")

print("\n" + "=" * 60)
