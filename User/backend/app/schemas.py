from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import json


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class PotholeStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REPAIRED = "repaired"
    REJECTED = "rejected"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Pothole Schemas
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float


class PotholeBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    road_name: Optional[str] = None
    description: Optional[str] = None


class PotholeCreate(PotholeBase):
    image_path: str
    severity: SeverityLevel
    confidence: float = Field(..., ge=0, le=1)
    bounding_boxes: List[BoundingBox]
    detection_method: str = "ai"


class PotholeUpdate(BaseModel):
    status: Optional[PotholeStatus] = None
    road_name: Optional[str] = None
    description: Optional[str] = None
    duplicate_of: Optional[int] = None


class PotholeResponse(PotholeBase):
    id: int
    user_id: Optional[int]
    reported_by: Optional[str] = None
    image_path: str
    severity: SeverityLevel
    confidence: float
    bounding_boxes: List[BoundingBox]
    status: PotholeStatus
    duplicate_of: Optional[int]
    detection_method: str
    created_at: datetime
    updated_at: datetime
    repaired_at: Optional[datetime]
    reports: List[ReportResponse] = []

    @field_validator('bounding_boxes', mode='before')
    @classmethod
    def parse_bounding_boxes(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v or []

    class Config:
        from_attributes = True


# Detection Response
class DetectionResult(BaseModel):
    potholes_detected: int
    severity: SeverityLevel
    confidence: float
    bounding_boxes: List[BoundingBox]
    image_path: str
    annotated_image_path: str = ""
    message: str
    detection_method: str = "ai_image"
    frames_processed: Optional[int] = None
    total_frames: Optional[int] = None
    video_fps: Optional[float] = None
    all_detections: Optional[List[BoundingBox]] = None
    detections_across_frames: Optional[int] = None
    severity_basis: Optional[str] = None


# Report Schemas
class ReportResponse(BaseModel):
    id: int
    pothole_id: Optional[int]
    user_id: int
    report_path: str
    generated_at: datetime
    status: str

    class Config:
        from_attributes = True


# Statistics
class DashboardStats(BaseModel):
    total_potholes: int
    new_potholes: int
    pending_potholes: int
    repaired_potholes: int
    severity_distribution: dict
    location_wise_reports: List[dict]
    detection_trends: List[dict]
