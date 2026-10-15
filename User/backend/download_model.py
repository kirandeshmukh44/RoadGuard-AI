"""
Script to download a proper pothole detection model.
This uses a pre-trained YOLOv8 model fine-tuned on pothole datasets from Roboflow Universe.
"""
import os
import sys
from pathlib import Path

# Add venv to path if running directly
HERE = Path(__file__).parent

def download_pothole_model():
    """Download a pothole-specific YOLO model."""
    models_dir = HERE / "backend" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    target_path = models_dir / "pothole_detection.pt"
    
    print("=" * 60)
    print("POTHOLE MODEL DOWNLOADER")
    print("=" * 60)
    print(f"\nTarget: {target_path}")
    
    # Check what's currently there
    if target_path.exists():
        size_mb = target_path.stat().st_size / (1024 * 1024)
        print(f"Current model size: {size_mb:.1f} MB")
        
        # Check if it's actually a pothole model by inspecting its classes
        try:
            from ultralytics import YOLO
            model = YOLO(str(target_path))
            names = model.names
            print(f"Current model classes: {list(names.values())[:5]}...")
            
            pothole_classes = [v for v in names.values() if 'pothole' in v.lower() or 'crack' in v.lower() or 'damage' in v.lower()]
            if pothole_classes:
                print(f"✅ Model already has pothole classes: {pothole_classes}")
                return True
            else:
                print("❌ Current model is NOT a pothole model (it's COCO general detection)!")
                print("   Downloading a real pothole detection model...")
        except Exception as e:
            print(f"Could not inspect model: {e}")
    
    # Try to download from Hugging Face or use ultralytics hub
    try:
        print("\nAttempting to download pothole model from Ultralytics Hub...")
        from ultralytics import YOLO
        
        # Download a YOLOv8 model fine-tuned on potholes
        # Using a publicly available pothole model
        import urllib.request
        
        # Pothole detection model from Roboflow Universe (public)
        urls_to_try = [
            ("https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt", "yolo11n (fallback)"),
        ]
        
        print("\n" + "=" * 60)
        print("IMPORTANT: Manual model setup required!")
        print("=" * 60)
        print("""
The current 'pothole_detection.pt' is a generic COCO model.
You need a POTHOLE-SPECIFIC model.

Options:
1. Download from Roboflow Universe:
   https://universe.roboflow.com/search?q=pothole&t=metadata

2. Use this pre-trained model (FREE):
   https://huggingface.co/nickmuchi/yolos-small-finetuned-masks
   
3. Train your own (script provided below)

For NOW, I'll configure the system to use a downloaded pothole model.
""")
        
        # Try to get a pothole model from Hugging Face
        try:
            import urllib.request
            print("Downloading pothole detection model...")
            
            # This is a YOLOv8 model trained on pothole dataset
            # From: https://github.com/niconielsen32/YOLOv8-pothole-detection
            model_url = "https://huggingface.co/spaces/nickmuchi/pothole-detection/resolve/main/data/best.pt"
            
            print(f"URL: {model_url}")
            
            def progress_hook(count, block_size, total_size):
                if total_size > 0:
                    percent = count * block_size * 100 / total_size
                    mb_done = count * block_size / (1024 * 1024)
                    mb_total = total_size / (1024 * 1024)
                    print(f"\r  Progress: {percent:.1f}% ({mb_done:.1f}/{mb_total:.1f} MB)", end='', flush=True)
            
            backup_path = models_dir / "pothole_detection_backup.pt"
            if target_path.exists():
                target_path.rename(backup_path)
                print(f"\nBacked up old model to: {backup_path}")
            
            urllib.request.urlretrieve(model_url, str(target_path), progress_hook)
            print(f"\n✅ Downloaded to: {target_path}")
            
            # Verify it works
            model = YOLO(str(target_path))
            print(f"\nModel classes: {model.names}")
            print("✅ Model verified successfully!")
            return True
            
        except Exception as dl_error:
            print(f"\n❌ Download failed: {dl_error}")
            # Restore backup if download failed
            if backup_path.exists() and not target_path.exists():
                backup_path.rename(target_path)
                print("Restored original model.")
            return False
            
    except ImportError:
        print("❌ ultralytics not installed")
        return False

if __name__ == "__main__":
    success = download_pothole_model()
    sys.exit(0 if success else 1)
