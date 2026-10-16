import os
import sys
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import enum
import bcrypt
from jose import JWTError, jwt

# Determine database path (default to shared road_monitoring.db in parent backend folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_DIR = os.path.dirname(BASE_DIR)
PROJECT_ROOT = os.path.dirname(ADMIN_DIR)
# Read the User backend JWT settings without importing its AI/training stack.
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DB_PATH = os.path.join(PROJECT_ROOT, "User", "backend", "road_monitoring.db")
UPLOADS_DIR = os.path.join(PROJECT_ROOT, "User", "backend", "uploads")

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class PotholeStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REPAIRED = "repaired"
    REJECTED = "rejected"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

def enum_values(enum_class):
    return [e.value for e in enum_class]

# Models (matches existing project schema)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole, values_callable=enum_values), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Pothole(Base):
    __tablename__ = "potholes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_name = Column(String(200))
    image_path = Column(String(500), nullable=False)
    severity = Column(Enum(SeverityLevel, values_callable=enum_values), nullable=False)
    confidence = Column(Float, nullable=False)
    bounding_boxes = Column(Text)
    status = Column(Enum(PotholeStatus, values_callable=enum_values), default=PotholeStatus.PENDING, nullable=False)
    duplicate_of = Column(Integer, ForeignKey("potholes.id"), nullable=True)
    description = Column(Text)
    detection_method = Column(String(50), default="ai")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    repaired_at = Column(DateTime, nullable=True)

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    pothole_id = Column(Integer, ForeignKey("potholes.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_path = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="generated")

# Pydantic Schemas
class PotholeStatusUpdate(BaseModel):
    status: PotholeStatus
    repaired_notes: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: UserRole
    is_active: Optional[bool] = None

class AdminLogin(BaseModel):
    username: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

admin_bearer = HTTPBearer(auto_error=False)

def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(admin_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Admin authentication required")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user

app = FastAPI(
    title="Road Condition AI - Dedicated Admin Backend",
    version="2.0.0",
    description="FastAPI Backend for Dedicated Road Condition Monitoring Admin Console"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded detection photos
if os.path.exists(UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.post("/api/admin/login")
def admin_login(creds: AdminLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    if not user or not user.is_active or user.role != UserRole.ADMIN or not bcrypt.checkpw(creds.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = jwt.encode({"sub": user.username, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "user": {"username": user.username, "role": user.role.value, "full_name": user.full_name or user.username, "email": user.email}}

@app.get("/api/admin/session")
def admin_session(current_admin: User = Depends(get_current_admin)):
    return {"username": current_admin.username, "role": current_admin.role.value, "full_name": current_admin.full_name or current_admin.username, "email": current_admin.email}

@app.get("/api/admin/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(func.count().select().select_from(User.__table__)).scalar_one()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Admin database is unavailable") from exc
    return {"status": "healthy", "service": "Dedicated Admin Backend", "db_connected": True}

@app.get("/api/admin/stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    total_potholes = db.query(Pothole).count()
    pending = db.query(Pothole).filter(Pothole.status == PotholeStatus.PENDING).count()
    verified = db.query(Pothole).filter(Pothole.status == PotholeStatus.VERIFIED).count()
    repaired = db.query(Pothole).filter(Pothole.status == PotholeStatus.REPAIRED).count()
    rejected = db.query(Pothole).filter(Pothole.status == PotholeStatus.REJECTED).count()

    high_severity = db.query(Pothole).filter(Pothole.severity == SeverityLevel.HIGH).count()
    medium_severity = db.query(Pothole).filter(Pothole.severity == SeverityLevel.MEDIUM).count()
    low_severity = db.query(Pothole).filter(Pothole.severity == SeverityLevel.LOW).count()

    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    total_reports = db.query(Report).count()

    # Recent 5 entries
    recent_detections = db.query(Pothole).order_by(Pothole.created_at.desc()).limit(5).all()

    return {
        "summary": {
            "total_potholes": total_potholes,
            "pending": pending,
            "verified": verified,
            "repaired": repaired,
            "rejected": rejected,
            "total_users": total_users,
            "admin_users": admin_users,
            "total_reports": total_reports
        },
        "severity_distribution": {
            "high": high_severity,
            "medium": medium_severity,
            "low": low_severity
        },
        "recent_activity": [
            {
                "id": p.id,
                "road_name": p.road_name or "Unknown Location",
                "severity": p.severity.value if hasattr(p.severity, 'value') else str(p.severity),
                "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                "confidence": round(p.confidence, 2) if p.confidence else 0.0,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in recent_detections
        ]
    }

@app.get("/api/admin/potholes")
def get_all_potholes(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = db.query(Pothole)
    if status and status != "all":
        query = query.filter(Pothole.status == status)
    if severity and severity != "all":
        query = query.filter(Pothole.severity == severity)
    if search:
        query = query.filter(
            (Pothole.road_name.ilike(f"%{search}%")) |
            (Pothole.description.ilike(f"%{search}%"))
        )
    
    potholes = query.order_by(Pothole.created_at.desc()).all()
    
    results = []
    for p in potholes:
        user = db.query(User).filter(User.id == p.user_id).first() if p.user_id else None
        
        # normalize image url
        img_url = p.image_path
        if img_url and not img_url.startswith("http"):
            # if relative or backend url, construct proper static link
            clean_path = os.path.basename(img_url)
            img_url = f"http://localhost:8005/uploads/{clean_path}"

        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "reported_by": user.username if user else "Anonymous / AI Agent",
            "latitude": p.latitude,
            "longitude": p.longitude,
            "road_name": p.road_name or "Unnamed Road",
            "image_path": img_url,
            "severity": p.severity.value if hasattr(p.severity, 'value') else str(p.severity),
            "confidence": round(p.confidence, 2) if p.confidence else 0.0,
            "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
            "description": p.description,
            "detection_method": p.detection_method,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "repaired_at": p.repaired_at.isoformat() if p.repaired_at else None
        })
    return results

@app.patch("/api/admin/potholes/{pothole_id}/status")
def update_pothole_status(
    pothole_id: int,
    payload: PotholeStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    
    pothole.status = payload.status
    if payload.status == PotholeStatus.REPAIRED:
        pothole.repaired_at = datetime.utcnow()
    else:
        pothole.repaired_at = None
    
    if payload.repaired_notes:
        pothole.description = f"{pothole.description or ''}\n[Admin Note]: {payload.repaired_notes}".strip()

    pothole.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pothole)
    return {"message": "Status updated successfully", "id": pothole.id, "status": pothole.status}

@app.delete("/api/admin/potholes/{pothole_id}")
def delete_pothole(pothole_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    pothole = db.query(Pothole).filter(Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    db.delete(pothole)
    db.commit()
    return {"message": "Pothole record deleted successfully", "id": pothole_id}

@app.get("/api/admin/users")
def get_users(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    results = []
    for u in users:
        report_count = db.query(Pothole).filter(Pothole.user_id == u.id).count()
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "reports_submitted": report_count
        })
    return results

@app.patch("/api/admin/users/{user_id}")
def update_user(user_id: int, payload: UserRoleUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user_id": user.id, "role": user.role}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete the account currently signed in")
    if user.role == UserRole.ADMIN:
        remaining_admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True, User.id != user.id).count()
        if remaining_admins == 0:
            raise HTTPException(status_code=400, detail="At least one active administrator account must remain")
    owned_potholes = db.query(Pothole).filter(Pothole.user_id == user.id).all()
    owned_reports = db.query(Report).filter(Report.user_id == user.id).all()
    owned_pothole_ids = db.query(Pothole.id).filter(Pothole.user_id == user.id).subquery()
    for pothole in owned_potholes:
        if pothole.image_path:
            media_path = os.path.abspath(os.path.join(UPLOADS_DIR, os.path.basename(pothole.image_path)))
            if os.path.commonpath([os.path.abspath(UPLOADS_DIR), media_path]) == os.path.abspath(UPLOADS_DIR):
                try:
                    if os.path.isfile(media_path):
                        os.remove(media_path)
                except OSError:
                    pass
    reports_dir = os.path.join(PROJECT_ROOT, "User", "backend", "reports")
    for report in owned_reports:
        if report.report_path:
            pdf_path = os.path.abspath(os.path.join(reports_dir, os.path.basename(report.report_path)))
            if os.path.commonpath([os.path.abspath(reports_dir), pdf_path]) == os.path.abspath(reports_dir):
                try:
                    if os.path.isfile(pdf_path):
                        os.remove(pdf_path)
                except OSError:
                    pass
    db.query(Report).filter(Report.pothole_id.in_(owned_pothole_ids)).update({Report.pothole_id: None}, synchronize_session=False)
    db.query(Pothole).filter(Pothole.duplicate_of.in_(owned_pothole_ids)).update({Pothole.duplicate_of: None}, synchronize_session=False)
    db.query(Report).filter(Report.user_id == user.id).delete(synchronize_session=False)
    db.query(Pothole).filter(Pothole.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return {"message": "User and associated submissions/reports deleted", "user_id": user_id}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ADMIN_API_PORT", "8006"))
    print(f"[Admin Backend] Starting on http://127.0.0.1:{port} (Linked DB: {DB_PATH})")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
