from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager
import shutil
import uuid
import json
import os
from pathlib import Path
import yaml

from .database import get_db, init_db, User, Pothole, Report, UserRole
from .schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    PotholeCreate, PotholeUpdate, PotholeResponse, DetectionResult,
    ReportResponse, DashboardStats, SeverityLevel, PotholeStatus
)
from .auth import (
    get_password_hash, verify_password, create_access_token,
    authenticate_user, get_current_user, get_current_admin
)
from .ai_detection import detector, check_duplicates
from .pdf_generator import generate_pothole_report, generate_summary_report
from .config import (
    API_PORT, UPLOAD_DIR, REPORTS_DIR, MODEL_AVAILABLE,
    MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, CORS_ORIGINS
)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("Database initialized")
    print(f"AI Model Available: {MODEL_AVAILABLE}")
    yield
    # Shutdown
    print("Application shutdown")

# Initialize FastAPI app
app = FastAPI(
    title="AI-Based Pothole Detection and Road Condition Monitoring System",
    description="Smart city infrastructure monitoring using AI/ML",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static directories
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")


# Health check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_available": detector.model_loaded,
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== AUTHENTICATION ROUTES ====================

@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=UserRole.USER  # Default role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/api/auth/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)


# ==================== POTHOLE DETECTION ROUTES ====================

@app.post("/api/detect", response_model=DetectionResult)
async def detect_potholes(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and detect potholes in an image using AI."""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Save uploaded file
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Run AI detection
    detection_result = detector.detect_potholes(str(file_path))
    
    if not detection_result["success"]:
        # Clean up file if detection failed
        os.remove(file_path)
        return DetectionResult(
            potholes_detected=0,
            severity=SeverityLevel.LOW,
            confidence=0.0,
            bounding_boxes=[],
            image_path="",
            annotated_image_path="",
            message=detection_result["message"]
        )
    
    # Create annotated image with bounding boxes
    annotated_filename = f"annotated_{unique_filename}"
    annotated_path = UPLOAD_DIR / annotated_filename
    detector.draw_bounding_boxes(str(file_path), detection_result["bounding_boxes"], str(annotated_path))
    
    # Check for duplicates
    if latitude is not None and longitude is not None:
        existing_potholes = db.query(Pothole).filter(
            Pothole.status != PotholeStatus.REPAIRED
        ).all()
        duplicate_id = check_duplicates(latitude, longitude, existing_potholes)
    else:
        duplicate_id = None
    
    # Save to database - store only filename
    new_pothole = Pothole(
        user_id=current_user.id,
        latitude=latitude or 0.0,
        longitude=longitude or 0.0,
        road_name=road_name,
        image_path=unique_filename,  # Store only filename
        severity=detection_result["severity"],
        confidence=detection_result["confidence"],
        bounding_boxes=json.dumps(detection_result["bounding_boxes"]),
        status=PotholeStatus.PENDING,
        duplicate_of=duplicate_id,
        detection_method="ai"
    )
    
    db.add(new_pothole)
    db.commit()
    db.refresh(new_pothole)
    
    # Auto-generate report for high severity
    if detection_result["severity"] == SeverityLevel.HIGH:
        pothole_data = {
            "id": new_pothole.id,
            "road_name": road_name or "Unknown",
            "latitude": latitude or 0.0,
            "longitude": longitude or 0.0,
            "severity": detection_result["severity"],
            "confidence": detection_result["confidence"],
            "status": "pending",
            "detection_method": "ai",
            "created_at": new_pothole.created_at.isoformat(),
            "bounding_boxes": detection_result["bounding_boxes"],
            "image_path": str(file_path)  # Full path for PDF generation
        }
        
        try:
            report_path = generate_pothole_report(pothole_data)
            new_report = Report(
                pothole_id=new_pothole.id,
                user_id=current_user.id,
                report_path=report_path
            )
            db.add(new_report)
            db.commit()
        except Exception as e:
            print(f"Error generating report: {e}")
    
    # Return URL paths for frontend
    image_url = f"/uploads/{unique_filename}"
    annotated_url = f"/uploads/{annotated_filename}"
    return DetectionResult(
        potholes_detected=detection_result["potholes_detected"],
        severity=detection_result["severity"],
        confidence=detection_result["confidence"],
        bounding_boxes=detection_result["bounding_boxes"],
        image_path=image_url,
        annotated_image_path=annotated_url,
        message=detection_result["message"]
    )


@app.post("/api/detect/video", response_model=DetectionResult)
async def detect_potholes_video(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and detect potholes in a video using AI."""
    # Validate file type
    extension = Path(file.filename or "").suffix.lower()
    allowed_video_extensions = {".mp4", ".avi", ".mov"}
    allowed_video_mime_types = set(ALLOWED_VIDEO_TYPES) | {"video/quicktime", "video/x-msvideo"}
    if extension not in allowed_video_extensions or file.content_type not in allowed_video_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video type. Upload an MP4, AVI, or MOV file."
        )
    
    # Validate file size (50MB for videos)
    MAX_VIDEO_SIZE = 50 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 50MB"
        )
    
    # Save uploaded file
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Run AI detection on video
    detection_result = detector.detect_potholes_video(str(file_path))
    
    if not detection_result["success"]:
        # Clean up file if detection failed
        os.remove(file_path)
        return DetectionResult(
            potholes_detected=0,
            severity=SeverityLevel.LOW,
            confidence=0.0,
            bounding_boxes=[],
            image_path="",
            annotated_image_path="",
            message=detection_result["message"],
            detection_method="ai_video",
            frames_processed=detection_result.get("frames_processed", 0),
            total_frames=None,
            video_fps=None,
            all_detections=None,
            detections_across_frames=None,
            severity_basis="This estimate does not measure pothole depth."
        )
    
    # Check for duplicates
    if latitude is not None and longitude is not None:
        existing_potholes = db.query(Pothole).filter(
            Pothole.status != PotholeStatus.REPAIRED
        ).all()
        duplicate_id = check_duplicates(latitude, longitude, existing_potholes)
    else:
        duplicate_id = None
    
    # Save to database
    new_pothole = Pothole(
        user_id=current_user.id,
        latitude=latitude or 0.0,
        longitude=longitude or 0.0,
        road_name=road_name,
        image_path=unique_filename,  # Store video filename
        severity=detection_result["severity"],
        confidence=detection_result["confidence"],
        bounding_boxes=json.dumps(detection_result["bounding_boxes"]),
        status=PotholeStatus.PENDING,
        duplicate_of=duplicate_id,
        detection_method="ai_video"
    )
    
    db.add(new_pothole)
    db.commit()
    db.refresh(new_pothole)
    
    # Auto-generate report for high severity
    if detection_result["severity"] == SeverityLevel.HIGH:
        pothole_data = {
            "id": new_pothole.id,
            "road_name": road_name or "Unknown",
            "latitude": latitude or 0.0,
            "longitude": longitude or 0.0,
            "severity": detection_result["severity"],
            "confidence": detection_result["confidence"],
            "status": "pending",
            "detection_method": "ai_video",
            "created_at": new_pothole.created_at.isoformat(),
            "bounding_boxes": detection_result["bounding_boxes"],
            "image_path": str(file_path)
        }
        
        try:
            report_path = generate_pothole_report(pothole_data)
            new_report = Report(
                pothole_id=new_pothole.id,
                user_id=current_user.id,
                report_path=report_path
            )
            db.add(new_report)
            db.commit()
        except Exception as e:
            print(f"Error generating report: {e}")
    
    # Return URL paths for frontend
    video_url = f"/uploads/{unique_filename}"
    return DetectionResult(
        potholes_detected=detection_result["potholes_detected"],
        severity=detection_result["severity"],
        confidence=detection_result["confidence"],
        bounding_boxes=detection_result["bounding_boxes"],
        image_path=video_url,
        annotated_image_path="",
        message=detection_result["message"],
        detection_method="ai_video",
        frames_processed=detection_result.get("frames_processed"),
        total_frames=detection_result.get("total_frames"),
        video_fps=detection_result.get("video_fps"),
        all_detections=detection_result.get("all_detections"),
        detections_across_frames=detection_result.get("detections_across_frames"),
        severity_basis="This estimate does not measure pothole depth."
    )


@app.post("/api/potholes", response_model=PotholeResponse)
async def create_pothole_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    road_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    severity: SeverityLevel = Form(SeverityLevel.MEDIUM),
    confidence: float = Form(0.8),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually report a pothole (without AI detection). Supports optional image upload."""
    # Validate coordinates
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates"
        )
    
    # Handle image upload if provided
    image_filename = ""
    if file and file.filename:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        file_content = await file.read()
        if len(file_content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10MB"
            )
        
        file_extension = file.filename.split('.')[-1]
        image_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / image_filename
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    
    # Check for duplicates
    existing_potholes = db.query(Pothole).filter(
        Pothole.status != PotholeStatus.REPAIRED
    ).all()
    duplicate_id = check_duplicates(latitude, longitude, existing_potholes)
    
    new_pothole = Pothole(
        user_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
        road_name=road_name,
        image_path=image_filename,
        severity=severity,
        confidence=confidence,
        bounding_boxes=json.dumps([]),
        status=PotholeStatus.PENDING,
        duplicate_of=duplicate_id,
        description=description,
        detection_method="manual"
    )
    
    db.add(new_pothole)
    db.commit()
    db.refresh(new_pothole)
    
    # Keep the pothole report saved even if optional PDF generation fails.
    pothole_data = {
        "id": new_pothole.id,
        "road_name": road_name or "Unknown",
        "latitude": latitude,
        "longitude": longitude,
        "severity": severity.value,
        "confidence": confidence,
        "status": "pending",
        "detection_method": "manual",
        "created_at": new_pothole.created_at.isoformat(),
        "bounding_boxes": [],
        "image_path": str(UPLOAD_DIR / image_filename) if image_filename else "",
        "description": description
    }
    
    try:
        report_filename = generate_pothole_report(pothole_data)
        new_report = Report(
            pothole_id=new_pothole.id,
            user_id=current_user.id,
            report_path=f'/reports/{report_filename}'
        )
        db.add(new_report)
        db.commit()
    except Exception as e:
        print(f"Error generating report for manual pothole: {e}")
    
    return PotholeResponse.model_validate(new_pothole)


@app.get("/api/potholes", response_model=List[PotholeResponse])
def get_potholes(
    skip: int = 0,
    limit: int = 1000,
    status: Optional[PotholeStatus] = None,
    severity: Optional[SeverityLevel] = None,
    db: Session = Depends(get_db)
):
    """Get all potholes with optional filtering."""
    query = db.query(Pothole)
    
    if status:
        query = query.filter(Pothole.status == status)
    if severity:
        query = query.filter(Pothole.severity == severity)
    
    potholes = query.order_by(Pothole.created_at.desc()).offset(skip).limit(limit).all()
    return [PotholeResponse.model_validate(p) for p in potholes]


@app.get("/api/potholes/{pothole_id}", response_model=PotholeResponse)
def get_pothole(pothole_id: int, db: Session = Depends(get_db)):
    """Get a specific pothole by ID."""
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pothole not found"
        )
    return PotholeResponse.model_validate(pothole)


@app.put("/api/potholes/{pothole_id}", response_model=PotholeResponse)
def update_pothole(
    pothole_id: int,
    pothole_update: PotholeUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update pothole information (admin only)."""
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pothole not found"
        )
    
    # Update fields
    if pothole_update.status is not None:
        pothole.status = pothole_update.status
        if pothole_update.status == PotholeStatus.REPAIRED:
            pothole.repaired_at = datetime.utcnow()
    
    if pothole_update.road_name is not None:
        pothole.road_name = pothole_update.road_name
    
    if pothole_update.description is not None:
        pothole.description = pothole_update.description
    
    if pothole_update.duplicate_of is not None:
        pothole.duplicate_of = pothole_update.duplicate_of
    
    pothole.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(pothole)
    
    return PotholeResponse.model_validate(pothole)


@app.delete("/api/potholes/{pothole_id}")
def delete_pothole(
    pothole_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a pothole (admin only)."""
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pothole not found"
        )
    
    # Delete associated image file
    if os.path.exists(pothole.image_path):
        os.remove(pothole.image_path)
    
    db.delete(pothole)
    db.commit()
    
    return {"message": "Pothole deleted successfully"}


# ==================== USER-SPECIFIC ROUTES ====================

@app.get("/api/users/me/potholes", response_model=List[PotholeResponse])
def get_my_potholes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get potholes reported by current user."""
    potholes = db.query(Pothole).filter(
        Pothole.user_id == current_user.id
    ).order_by(Pothole.created_at.desc()).all()
    return [PotholeResponse.model_validate(p) for p in potholes]


@app.get("/api/users/me/potholes-with-reports")
def get_my_potholes_with_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get potholes reported by current user along with their reports."""
    potholes = db.query(Pothole).filter(
        Pothole.user_id == current_user.id
    ).order_by(Pothole.created_at.desc()).all()
    
    result = []
    for pothole in potholes:
        pothole_data = PotholeResponse.model_validate(pothole)
        # Get associated reports
        reports = db.query(Report).filter(Report.pothole_id == pothole.id).all()
        pothole_data.reports = [ReportResponse.model_validate(r) for r in reports]
        result.append(pothole_data)
    
    return result


# ==================== REPORT ROUTES ====================

@app.post("/api/potholes/{pothole_id}/report", response_model=ReportResponse)
def generate_report(
    pothole_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a PDF report for a pothole."""
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pothole not found"
        )
    
    pothole_data = {
        "id": pothole.id,
        "road_name": pothole.road_name or "Unknown",
        "latitude": pothole.latitude,
        "longitude": pothole.longitude,
        "severity": pothole.severity.value,
        "confidence": pothole.confidence,
        "status": pothole.status.value,
        "detection_method": pothole.detection_method,
        "created_at": pothole.created_at.isoformat(),
        "bounding_boxes": json.loads(pothole.bounding_boxes) if pothole.bounding_boxes else [],
        "image_path": pothole.image_path,
        "description": pothole.description
    }
    
    try:
        report_filename = generate_pothole_report(pothole_data)
        new_report = Report(
            pothole_id=pothole_id,
            user_id=current_user.id,
            report_path=f'/reports/{report_filename}'
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return ReportResponse.model_validate(new_report)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )


@app.get("/api/reports", response_model=List[ReportResponse])
def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reports generated by current user."""
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.generated_at.desc()).all()
    return [ReportResponse.model_validate(r) for r in reports]


# ==================== ADMIN DASHBOARD ROUTES ====================

@app.get("/api/admin/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics (admin only)."""
    total_potholes = db.query(Pothole).count()
    new_potholes = db.query(Pothole).filter(
        Pothole.status == PotholeStatus.PENDING
    ).count()
    repaired_potholes = db.query(Pothole).filter(
        Pothole.status == PotholeStatus.REPAIRED
    ).count()
    pending_potholes = db.query(Pothole).filter(
        Pothole.status == PotholeStatus.PENDING
    ).count()
    
    # Severity distribution
    severity_dist = {
        "high": db.query(Pothole).filter(Pothole.severity == SeverityLevel.HIGH).count(),
        "medium": db.query(Pothole).filter(Pothole.severity == SeverityLevel.MEDIUM).count(),
        "low": db.query(Pothole).filter(Pothole.severity == SeverityLevel.LOW).count()
    }
    
    # Location-wise reports
    location_reports = db.query(
        Pothole.road_name,
        func.count(Pothole.id).label('count')
    ).group_by(Pothole.road_name).limit(10).all()
    
    location_data = [{"road": r[0] or "Unknown", "count": r[1]} for r in location_reports]
    
    # Detection trends (last 7 days)
    trends = db.query(
        func.date(Pothole.created_at).label('date'),
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.created_at >= datetime.utcnow() - timedelta(days=7)
    ).group_by(func.date(Pothole.created_at)).all()
    
    trend_data = [{"date": str(t[0]), "count": t[1]} for t in trends]
    
    return DashboardStats(
        total_potholes=total_potholes,
        new_potholes=new_potholes,
        pending_potholes=pending_potholes,
        repaired_potholes=repaired_potholes,
        severity_distribution=severity_dist,
        location_wise_reports=location_data,
        detection_trends=trend_data
    )


@app.get("/api/admin/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)."""
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]


from pydantic import BaseModel

class RoleUpdate(BaseModel):
    role: str


@app.put("/api/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if role_update.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    user.role = role_update.role
    db.commit()
    
    return {"message": f"User role updated to {role_update.role}"}


# ==================== MODEL TRAINING ROUTES ====================

from pydantic import BaseModel
from typing import List, Optional

class DatasetCreate(BaseModel):
    name: str
    description: str = ""
    dataset_path: str

class TrainingConfig(BaseModel):
    name: str
    base_model: str = "yolov8n.pt"
    dataset_version: str
    epochs: int = 50
    imgsz: int = 640
    batch: int = 16
    notes: str = ""

class ModelVersionResponse(BaseModel):
    version_id: str
    name: str
    base_model: str
    dataset_version: str
    epochs: int
    imgsz: int
    batch: int
    map50: float
    map50_95: float
    precision: float
    recall: float
    created_at: str
    model_path: str
    status: str
    notes: str

class DatasetVersionResponse(BaseModel):
    version_id: str
    name: str
    num_images: int
    num_annotations: int
    classes: List[str]
    train_split: float
    val_split: float
    created_at: str
    dataset_path: str
    description: str


@app.post("/api/admin/datasets", response_model=DatasetVersionResponse)
def register_dataset(
    dataset: DatasetCreate,
    current_user: User = Depends(get_current_admin)
):
    """Register a new dataset version (admin only)."""
    try:
        version = model_manager.register_dataset(dataset.name, dataset.dataset_path, dataset.description)
    except (ValueError, OSError, yaml.YAMLError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return DatasetVersionResponse(**version.__dict__)


@app.get("/api/admin/datasets", response_model=List[DatasetVersionResponse])
def list_datasets(
    current_user: User = Depends(get_current_admin)
):
    """List all dataset versions (admin only)."""
    return [DatasetVersionResponse(**d.__dict__) for d in model_manager.get_datasets()]


@app.post("/api/admin/training/start", response_model=ModelVersionResponse)
def start_training(
    config: TrainingConfig,
    current_user: User = Depends(get_current_admin)
):
    """Start a new model training run (admin only)."""
    try:
        version = model_manager.start_training(config.model_dump())
    except (ValueError, RuntimeError, OSError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ModelVersionResponse(**version.__dict__)


@app.get("/api/admin/training/versions", response_model=List[ModelVersionResponse])
def list_model_versions(
    current_user: User = Depends(get_current_admin)
):
    """List all model versions (admin only)."""
    return [ModelVersionResponse(**v.__dict__) for v in model_manager.get_versions()]


@app.post("/api/admin/training/deploy/{version_id}")
def deploy_model(
    version_id: str,
    current_user: User = Depends(get_current_admin)
):
    """Deploy a model version as the active model (admin only)."""
    success = model_manager.deploy_model(version_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to deploy model. Check version exists and is completed."
        )
    return {"message": f"Model {version_id} deployed successfully"}


@app.get("/api/admin/training/deployed", response_model=Optional[ModelVersionResponse])
def get_deployed_model(
    current_user: User = Depends(get_current_admin)
):
    """Get currently deployed model (admin only)."""
    version = model_manager.get_deployed_model()
    if version:
        return ModelVersionResponse(**version.__dict__)
    return None


# ==================== EXPORT ROUTES ====================

@app.get("/api/export/potholes/csv")
def export_potholes_csv(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Export all potholes as CSV (admin only)."""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    potholes = db.query(Pothole).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User ID', 'Latitude', 'Longitude', 'Road Name', 
                     'Description', 'Severity', 'Confidence', 'Status', 
                     'Detection Method', 'Created At', 'Updated At', 'Image Path'])
    
    for p in potholes:
        writer.writerow([
            p.id, p.user_id, p.latitude, p.longitude, p.road_name,
            p.description, p.severity.value if p.severity else '',
            p.confidence, p.status.value if p.status else '',
            p.detection_method, p.created_at, p.updated_at, p.image_path
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=potholes_export.csv"}
    )


@app.get("/api/export/potholes/geojson")
def export_potholes_geojson(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Export all potholes as GeoJSON (admin only)."""
    from fastapi.responses import JSONResponse
    
    potholes = db.query(Pothole).all()
    
    features = []
    for p in potholes:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [p.longitude, p.latitude]
            },
            "properties": {
                "id": p.id,
                "road_name": p.road_name,
                "description": p.description,
                "severity": p.severity.value if p.severity else '',
                "confidence": p.confidence,
                "status": p.status.value if p.status else '',
                "detection_method": p.detection_method,
                "created_at": p.created_at.isoformat() if p.created_at else '',
                "image_path": p.image_path
            }
        })
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return JSONResponse(
        content=geojson,
        headers={"Content-Disposition": "attachment; filename=potholes_export.geojson"}
    )


@app.get("/api/export/reports/summary")
def export_summary_report(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate and export summary report as PDF (admin only)."""
    from fastapi.responses import FileResponse
    
    # Get stats
    total = db.query(Pothole).count()
    by_severity = {
        "high": db.query(Pothole).filter(Pothole.severity == SeverityLevel.HIGH).count(),
        "medium": db.query(Pothole).filter(Pothole.severity == SeverityLevel.MEDIUM).count(),
        "low": db.query(Pothole).filter(Pothole.severity == SeverityLevel.LOW).count()
    }
    by_status = {
        "new": db.query(Pothole).filter(Pothole.status == PotholeStatus.NEW).count(),
        "pending": db.query(Pothole).filter(Pothole.status == PotholeStatus.PENDING).count(),
        "verified": db.query(Pothole).filter(Pothole.status == PotholeStatus.VERIFIED).count(),
        "repaired": db.query(Pothole).filter(Pothole.status == PotholeStatus.REPAIRED).count()
    }
    
    # Generate report
    report_filename = generate_summary_report({
        "total_potholes": total,
        "by_severity": by_severity,
        "by_status": by_status,
        "generated_at": datetime.utcnow().isoformat()
    })
    report_path = str(REPORTS_DIR / report_filename)
    
    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"summary_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )


# ==================== BATCH PROCESSING ROUTES ====================

@app.post("/api/detect/batch")
async def detect_batch(
    files: List[UploadFile] = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch detect potholes in multiple images (max 20 files)."""
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 files per batch"
        )
    
    # Validate and save files
    saved_files = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.content_type}"
            )
        
        content = await file.read()
        if len(content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large: {file.filename}"
            )
        
        ext = file.filename.split('.')[-1]
        unique_name = f"{uuid.uuid4()}.{ext}"
        path = UPLOAD_DIR / unique_name
        
        with open(path, "wb") as f:
            f.write(content)
        
        saved_files.append(str(path))
    
    # Run batch detection
    results = detector.detect_batch(saved_files)
    
    # Process results and save to DB
    response_results = []
    for result in results:
        if result["success"] and result["potholes_detected"] > 0:
            # Check duplicates
            dup_id = None
            if latitude and longitude:
                existing = db.query(Pothole).filter(Pothole.status != PotholeStatus.REPAIRED).all()
                dup_id = check_duplicates(latitude, longitude, existing)
            
            # Save to DB
            new_pothole = Pothole(
                user_id=current_user.id,
                latitude=latitude or 0.0,
                longitude=longitude or 0.0,
                road_name=road_name,
                image_path=os.path.basename(result["image_path"]),
                severity=result["severity"],
                confidence=result["confidence"],
                bounding_boxes=json.dumps(result["bounding_boxes"]),
                status=PotholeStatus.PENDING,
                duplicate_of=dup_id,
                detection_method="ai_batch"
            )
            db.add(new_pothole)
            db.commit()
            db.refresh(new_pothole)
            
            # High severity auto-report
            if result["severity"] == SeverityLevel.HIGH:
                pothole_data = {
                    "id": new_pothole.id,
                    "road_name": road_name or "Unknown",
                    "latitude": latitude or 0.0,
                    "longitude": longitude or 0.0,
                    "severity": result["severity"],
                    "confidence": result["confidence"],
                    "status": "pending",
                    "detection_method": "ai_batch",
                    "created_at": new_pothole.created_at.isoformat(),
                    "bounding_boxes": result["bounding_boxes"],
                    "image_path": result["image_path"]
                }
                try:
                    report_path = f'/reports/{generate_pothole_report(pothole_data)}'
                    new_report = Report(
                        pothole_id=new_pothole.id,
                        user_id=current_user.id,
                        report_path=report_path
                    )
                    db.add(new_report)
                    db.commit()
                    
                    # Send notification
                    notifier = get_notification_manager()
                    notifier.notify_high_severity_detection(pothole_data, report_path)
                except Exception as e:
                    print(f"Error in batch high severity: {e}")
        
        # Clean up file if no detection or error
        if not result["success"] or result["potholes_detected"] == 0:
            if os.path.exists(result["image_path"]):
                os.remove(result["image_path"])
        
        response_results.append({
            "image_path": f"/uploads/{os.path.basename(result['image_path'])}",
            "potholes_detected": result["potholes_detected"],
            "severity": result["severity"],
            "confidence": result["confidence"],
            "bounding_boxes": result["bounding_boxes"],
            "message": result["message"]
        })
    
    return {"results": response_results, "total_processed": len(results)}


# ==================== NOTIFICATION ROUTES ====================

class TestNotification(BaseModel):
    type: str  # email, sms, webhook
    message: str = "Test notification from Pothole Detection System"

@app.post("/api/admin/notifications/test")
def test_notification(
    notification: TestNotification,
    current_user: User = Depends(get_current_admin)
):
    """Test notification delivery (admin only)."""
    notifier = get_notification_manager()
    results = {}
    
    if notification.type == "email":
        results["email"] = notifier.send_email(
            "Test Notification",
            f"<p>{notification.message}</p>"
        )
    elif notification.type == "sms":
        results["sms"] = notifier.send_sms(notification.message)
    elif notification.type == "webhook":
        results["webhook"] = notifier.send_webhook({
            "event": "test",
            "message": notification.message,
            "timestamp": datetime.now().isoformat()
        })
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification type. Use: email, sms, or webhook"
        )
    
    return {"results": results}


@app.post("/api/admin/notifications/daily-summary")
def send_daily_summary(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Send daily summary notification (admin only)."""
    # Get today's stats
    today = datetime.utcnow().date()
    total = db.query(Pothole).count()
    today_count = db.query(Pothole).filter(
        func.date(Pothole.created_at) == today
    ).count()
    high = db.query(Pothole).filter(Pothole.severity == SeverityLevel.HIGH).count()
    medium = db.query(Pothole).filter(Pothole.severity == SeverityLevel.MEDIUM).count()
    low = db.query(Pothole).filter(Pothole.severity == SeverityLevel.LOW).count()
    repaired = db.query(Pothole).filter(Pothole.status == PotholeStatus.REPAIRED).count()
    
    stats = {
        "total_detections": total,
        "today_detections": today_count,
        "high_severity": high,
        "medium_severity": medium,
        "low_severity": low,
        "repaired": repaired
    }
    
    notifier = get_notification_manager()
    results = notifier.notify_daily_summary(stats)
    
    return {"stats": stats, "notification_results": results}


# ==================== WEBSOCKET FOR REAL-TIME DETECTION ====================

@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    """WebSocket endpoint for real-time camera detection."""
    await websocket_endpoint(websocket)


# ==================== ADVANCED ANALYTICS ROUTES ====================

@app.get("/api/analytics/overview")
def get_analytics_overview(
    days: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics overview (admin only)."""
    from datetime import timedelta
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily trends
    daily_trends = db.query(
        func.date(Pothole.created_at).label('date'),
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.created_at >= start_date
    ).group_by(func.date(Pothole.created_at)).all()
    
    # Severity trends
    severity_trends = db.query(
        func.date(Pothole.created_at).label('date'),
        Pothole.severity,
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.created_at >= start_date
    ).group_by(func.date(Pothole.created_at), Pothole.severity).all()
    
    # Detection method trends
    method_trends = db.query(
        func.date(Pothole.created_at).label('date'),
        Pothole.detection_method,
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.created_at >= start_date
    ).group_by(func.date(Pothole.created_at), Pothole.detection_method).all()
    
    # Status trends
    status_trends = db.query(
        func.date(Pothole.created_at).label('date'),
        Pothole.status,
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.created_at >= start_date
    ).group_by(func.date(Pothole.created_at), Pothole.status).all()
    
    # Top roads by pothole count
    top_roads = db.query(
        Pothole.road_name,
        func.count(Pothole.id).label('count')
    ).filter(
        Pothole.road_name.isnot(None)
    ).group_by(Pothole.road_name).order_by(
        func.count(Pothole.id).desc()
    ).limit(10).all()
    
    # Confidence distribution
    confidence_dist = db.query(
        func.floor(Pothole.confidence * 10) / 10,
        func.count(Pothole.id)
    ).filter(
        Pothole.confidence.isnot(None)
    ).group_by(
        func.floor(Pothole.confidence * 10) / 10
    ).all()
    
    # User activity
    user_activity = db.query(
        User.username,
        func.count(Pothole.id).label('reports')
    ).join(Pothole).group_by(User.username).order_by(
        func.count(Pothole.id).desc()
    ).limit(10).all()
    
    return {
        "period_days": days,
        "daily_trends": [{"date": str(d[0]), "count": d[1]} for d in daily_trends],
        "severity_trends": [
            {"date": str(s[0]), "severity": s[1].value if s[1] else None, "count": s[2]} 
            for s in severity_trends
        ],
        "method_trends": [
            {"date": str(m[0]), "method": m[1], "count": m[2]} 
            for m in method_trends
        ],
        "status_trends": [
            {"date": str(s[0]), "status": s[1].value if s[1] else None, "count": s[2]} 
            for s in status_trends
        ],
        "top_roads": [{"road": r[0], "count": r[1]} for r in top_roads],
        "confidence_distribution": [
            {"range": f"{c[0]:.1f}-{c[0]+0.1:.1f}", "count": c[1]} for c in confidence_dist
        ],
        "user_activity": [{"username": u[0], "reports": u[1]} for u in user_activity]
    }


@app.get("/api/analytics/heatmap")
def get_heatmap_data(
    bounds: Optional[str] = None,  # "min_lat,min_lon,max_lat,max_lon"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pothole data for heatmap visualization."""
    query = db.query(Pothole).filter(
        Pothole.latitude.isnot(None),
        Pothole.longitude.isnot(None)
    )
    
    if bounds:
        try:
            min_lat, min_lon, max_lat, max_lon = map(float, bounds.split(','))
            query = query.filter(
                Pothole.latitude >= min_lat,
                Pothole.latitude <= max_lat,
                Pothole.longitude >= min_lon,
                Pothole.longitude <= max_lon
            )
        except:
            pass
    
    potholes = query.limit(1000).all()
    
    return {
        "points": [
            {
                "lat": p.latitude,
                "lng": p.longitude,
                "weight": 1.0 + (p.confidence or 0.5),
                "severity": p.severity.value if p.severity else "low",
                "id": p.id
            }
            for p in potholes
        ]
    }


@app.get("/api/analytics/road-condition/{road_name}")
def get_road_condition(
    road_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed condition report for a specific road."""
    potholes = db.query(Pothole).filter(
        Pothole.road_name == road_name
    ).order_by(Pothole.created_at.desc()).all()
    
    if not potholes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Road not found"
        )
    
    total = len(potholes)
    high = sum(1 for p in potholes if p.severity == SeverityLevel.HIGH)
    medium = sum(1 for p in potholes if p.severity == SeverityLevel.MEDIUM)
    low = sum(1 for p in potholes if p.severity == SeverityLevel.LOW)
    repaired = sum(1 for p in potholes if p.status == PotholeStatus.REPAIRED)
    pending = sum(1 for p in potholes if p.status in [PotholeStatus.NEW, PotholeStatus.PENDING])
    verified = sum(1 for p in potholes if p.status == PotholeStatus.VERIFIED)
    
    # Calculate road condition score (0-100, higher = worse)
    severity_weights = {"high": 3, "medium": 2, "low": 1}
    weighted_score = sum(severity_weights.get(p.severity.value, 1) for p in potholes)
    max_possible = total * 3
    condition_score = (weighted_score / max_possible * 100) if max_possible > 0 else 0
    
    return {
        "road_name": road_name,
        "total_potholes": total,
        "by_severity": {"high": high, "medium": medium, "low": low},
        "by_status": {"repaired": repaired, "pending": pending, "verified": verified},
        "condition_score": round(condition_score, 1),
        "condition_rating": "Critical" if condition_score > 70 else "Poor" if condition_score > 40 else "Fair" if condition_score > 20 else "Good",
        "latest_detection": potholes[0].created_at.isoformat() if potholes else None,
        "potholes": [
            {
                "id": p.id,
                "lat": p.latitude,
                "lng": p.longitude,
                "severity": p.severity.value if p.severity else None,
                "status": p.status.value if p.status else None,
                "confidence": p.confidence,
                "detection_method": p.detection_method,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in potholes[:50]
        ]
    }


@app.get("/api/search/potholes")
def search_potholes(
    q: Optional[str] = None,
    road_name: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    detection_method: Optional[str] = None,
    min_confidence: Optional[float] = None,
    max_confidence: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Advanced search and filter for potholes."""
    query = db.query(Pothole)
    
    # Text search
    if q:
        query = query.filter(
            (Pothole.road_name.ilike(f"%{q}%")) |
            (Pothole.description.ilike(f"%{q}%"))
        )
    
    # Filters
    if road_name:
        query = query.filter(Pothole.road_name.ilike(f"%{road_name}%"))
    if severity:
        query = query.filter(Pothole.severity == severity)
    if status:
        query = query.filter(Pothole.status == status)
    if detection_method:
        query = query.filter(Pothole.detection_method == detection_method)
    if min_confidence is not None:
        query = query.filter(Pothole.confidence >= min_confidence)
    if max_confidence is not None:
        query = query.filter(Pothole.confidence <= max_confidence)
    if start_date:
        query = query.filter(Pothole.created_at >= start_date)
    if end_date:
        query = query.filter(Pothole.created_at <= end_date)
    if min_lat is not None:
        query = query.filter(Pothole.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(Pothole.latitude <= max_lat)
    if min_lon is not None:
        query = query.filter(Pothole.longitude >= min_lon)
    if max_lon is not None:
        query = query.filter(Pothole.longitude <= max_lon)
    
    # Sort
    sort_column = getattr(Pothole, sort_by, Pothole.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Pagination
    total = query.count()
    potholes = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "results": [PotholeResponse.model_validate(p) for p in potholes]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)
