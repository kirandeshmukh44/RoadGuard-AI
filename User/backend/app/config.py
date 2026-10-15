import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Database
DATABASE_URL = f"sqlite:///{BASE_DIR}/backend/road_monitoring.db"
API_PORT = int(os.getenv("API_PORT", "8005"))

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# File Storage
UPLOAD_DIR = BASE_DIR / "backend" / "uploads"
MODELS_DIR = BASE_DIR / "backend" / "models"
REPORTS_DIR = BASE_DIR / "backend" / "reports"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# AI Model Configuration
YOLO_MODEL_PATH = MODELS_DIR / "pothole_detection.pt"  # Single-class pothole model
MODEL_AVAILABLE = YOLO_MODEL_PATH.exists()

# Detection Settings
CONFIDENCE_THRESHOLD = 0.15
IOU_THRESHOLD = 0.40  # Suppress more overlapping duplicate boxes
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/avi", "video/mov"]

# Inference Optimization Settings
MAX_INPUT_SIZE = 640  # Max input dimension for faster inference
ENABLE_HALF_PRECISION = True  # Use FP16 on GPU
ENABLE_TORCH_COMPILE = False  # Compilation causes a long first-request delay on CPU.

# Severity Classification (based on detection confidence and bounding box area)
SEVERITY_THRESHOLDS = {
    "LOW": 0.25,      # Lowered to match confidence threshold
    "MEDIUM": 0.50,   # Adjusted
    "HIGH": 0.75      # Adjusted
}

# Duplicate Detection
DUPLICATE_DISTANCE_THRESHOLD = 0.0001  # degrees (approximately 11 meters)
DUPLICATE_SIMILARITY_THRESHOLD = 0.85

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:3000",
]
if os.getenv("FRONTEND_ORIGIN"):
    CORS_ORIGINS.append(os.environ["FRONTEND_ORIGIN"])
