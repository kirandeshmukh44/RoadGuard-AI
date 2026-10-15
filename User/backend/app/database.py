from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

from .config import DATABASE_URL

# Create database engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"


class PotholeStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REPAIRED = "repaired"
    REJECTED = "rejected"


class SeverityLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


def enum_values(enum_class):
    """Get enum values for SQLAlchemy Enum."""
    return [e.value for e in enum_class]


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

    # Relationships
    potholes = relationship("Pothole", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


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
    bounding_boxes = Column(Text)  # JSON string of bounding boxes
    status = Column(Enum(PotholeStatus, values_callable=enum_values), default=PotholeStatus.PENDING, nullable=False)
    duplicate_of = Column(Integer, ForeignKey("potholes.id"), nullable=True)
    description = Column(Text)
    detection_method = Column(String(50), default="ai")  # 'ai' or 'manual'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    repaired_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="potholes")
    duplicate_pothole = relationship("Pothole", remote_side=[id])
    reports = relationship("Report", back_populates="pothole", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    pothole_id = Column(Integer, ForeignKey("potholes.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_path = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="generated")

    # Relationships
    pothole = relationship("Pothole", back_populates="reports")
    user = relationship("User", back_populates="reports")


# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
