#!/usr/bin/env python3
"""
YOLO Model Setup Script for Pothole Detection

This script helps set up the YOLO model for pothole detection.
Since we cannot include a trained model in the repository, you have several options:

OPTION 1: Use a pre-trained model from Ultralytics Hub (requires internet)
    - Run: python download_model.py --pretrained

OPTION 2: Train your own model (recommended for best results)
    1. Collect and annotate pothole images (use LabelImg or Roboflow)
    2. Train using: yolo train model=yolov8n.pt data=pothole.yaml epochs=50
    3. Copy the best.pt to backend/models/pothole_detection.pt

OPTION 3: Download a community model (if available)
    - Check Ultralytics Hub or Roboflow Universe for pothole detection models

For development/testing without a model:
    - The system will work but show "AI model not available" message
    - You can still test manual reporting and other features

Requirements:
    - ultralytics package (already in requirements.txt)
    - PyTorch (already in requirements.txt)
"""

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODELS_DIR / "pothole_detection.pt"

def download_pretrained():
    """Download a pre-trained YOLOv8 model and note that it needs fine-tuning."""
    try:
        from ultralytics import YOLO
        
        print("Downloading YOLOv8n (nano) model...")
        model = YOLO('yolov8n.pt')  # This downloads the model
        
        # Save to our models directory
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        model.save(str(MODEL_PATH))
        
        print(f"Model saved to {MODEL_PATH}")
        print("\nNOTE: This is a general COCO-trained model, NOT trained for pothole detection.")
        print("For accurate pothole detection, you MUST train/fine-tune this model on pothole data.")
        print("See the README for training instructions.")
        
    except Exception as e:
        print(f"Error downloading model: {e}")
        return False
    
    return True

def check_model():
    """Check if model exists and is valid."""
    if MODEL_PATH.exists():
        try:
            from ultralytics import YOLO
            model = YOLO(str(MODEL_PATH))
            print(f"Model found at {MODEL_PATH}")
            print(f"Model info: {model.info() if hasattr(model, 'info') else 'Loaded successfully'}")
            return True
        except Exception as e:
            print(f"Model exists but failed to load: {e}")
            return False
    else:
        print(f"No model found at {MODEL_PATH}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description="YOLO Model Setup for Pothole Detection")
    parser.add_argument("--check", action="store_true", help="Check if model exists and is valid")
    parser.add_argument("--pretrained", action="store_true", help="Download pre-trained YOLOv8n model")
    parser.add_argument("--train", action="store_true", help="Show training instructions")
    
    args = parser.parse_args()
    
    if args.check:
        check_model()
    elif args.pretrained:
        download_pretrained()
    elif args.train:
        print_training_instructions()
    else:
        parser.print_help()

def print_training_instructions():
    print("""
POTHOLE DETECTION MODEL TRAINING INSTRUCTIONS
=============================================

1. DATA PREPARATION:
   - Collect 500+ images of roads with and without potholes
   - Use annotation tool (LabelImg, CVAT, Roboflow) to draw bounding boxes around potholes
   - Export in YOLO format (one .txt file per image with: class_id x_center y_center width height)

2. DATASET STRUCTURE:
   datasets/pothole/
   ├── train/
   │   ├── images/
   │   └── labels/
   ├── val/
   │   ├── images/
   │   └── labels/
   └── data.yaml

3. DATA.YAML EXAMPLE:
   path: datasets/pothole
   train: train/images
   val: val/images
   names:
     0: pothole

4. TRAINING COMMAND:
   yolo train model=yolov8n.pt data=datasets/pothole/data.yaml epochs=100 imgsz=640 batch=16

5. AFTER TRAINING:
   - Best model will be at: runs/detect/train/weights/best.pt
   - Copy to: backend/models/pothole_detection.pt
   - Restart backend server

6. VALIDATION:
   yolo val model=backend/models/pothole_detection.pt data=datasets/pothole/data.yaml

For more details, see: https://docs.ultralytics.com/
""")

if __name__ == "__main__":
    main()
