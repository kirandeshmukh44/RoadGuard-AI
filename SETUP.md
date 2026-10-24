# 🚦 RoadGuard AI — Pothole Detection & Road Condition Monitoring

> **Final Year Project** | AI/ML + Full Stack Web Application

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Prerequisites](#-prerequisites-install-once)
4. [Quick Start](#-quick-start)
5. [Project Structure](#-project-structure)
6. [How run.py Works](#-how-runpy-works)
7. [Default Login Credentials](#-default-login-credentials)
8. [Features](#-features)
9. [API Documentation](#-api-documentation)
10. [Database Schema](#-database-schema)
11. [Troubleshooting](#-troubleshooting)

---

## 🧠 Project Overview

RoadGuard AI is an **AI-powered pothole detection and road condition monitoring system**. It uses a **YOLOv8 deep learning model** trained on real pothole images to detect potholes from uploaded photos or videos. The system provides a full web application for citizens to report potholes and an admin dashboard for road authorities to manage repairs.

### What It Does
- 📸 Detects potholes in images and videos using YOLOv8 AI
- 📍 Records GPS coordinates of potholes on an interactive map
- 📊 Classifies severity: **Low / Medium / High**
- 📄 Auto-generates PDF reports for high-severity potholes
- 👤 Role-based access: **User** (citizen) and **Admin** (authority)
- 🔄 Tracks pothole status: Pending → Verified → Repaired

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3.8+** | Programming language |
| **FastAPI** | REST API framework |
| **SQLAlchemy** | Database ORM |
| **SQLite** | Database |
| **YOLOv8 (Ultralytics)** | AI pothole detection model |
| **OpenCV** | Image processing |
| **PyTorch** | Deep learning framework |
| **JWT (jose)** | Authentication tokens |
| **bcrypt** | Password hashing |
| **ReportLab** | PDF report generation |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **React Router** | Page navigation |
| **Axios** | API requests |
| **Leaflet + OpenStreetMap** | Interactive maps |
| **Recharts** | Analytics charts |
| **Framer Motion** | Animations |

---

## ✅ Prerequisites (Install Once)

You need these two tools installed before running the project:

### 1. Python 3.8 or higher
- Download from: https://www.python.org/downloads/
- **Important:** Check ✅ **"Add Python to PATH"** during installation
- Verify: Open terminal → type `python --version`

### 2. Node.js (LTS version)
- Download from: https://nodejs.org/
- Install the **LTS** version (recommended)
- Verify: Open terminal → type `node --version`

> **That's all!** The `run.py` script handles everything else automatically.

---

## ⚡ Quick Start

### Step 1 — Copy the Project
Transfer the project folder to your laptop. Make sure `User/backend/models/pothole_detection.pt` is included.

### Step 2 — Start User Module

Open a terminal in the project folder and run:

```bash
cd User
python run.py
```

✅ App opens automatically at → **http://localhost:5173**

---

### Step 3 — Start Admin Module

Open a **second terminal** in the project folder and run:

```bash
cd Admin
python run.py
```

✅ Admin panel opens automatically at → **http://localhost:5175**

---

> **First-time setup takes 5–15 minutes** (downloading Python packages and Node modules).
> After that, every run starts in seconds.

---

## 📁 Project Structure

```
AI_Pothole_Detection_Road_Condition_Monitoring/
│
├── SETUP.md                         ← This file (all instructions)
├── .gitignore                        ← Git ignore rules
│
├── User/                            ← USER MODULE
│   ├── run.py                       ← ⭐ Run this to start User module
│   ├── frontend/                    ← React web app (port 5173)
│   │   ├── src/
│   │   │   ├── pages/               ← All page components
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Detect.jsx       ← AI detection page
│   │   │   │   ├── Report.jsx       ← Manual report page
│   │   │   │   ├── Map.jsx          ← Interactive map
│   │   │   │   ├── Dashboard.jsx    ← User dashboard
│   │   │   │   └── admin/           ← Admin pages
│   │   │   ├── components/          ← Reusable components
│   │   │   ├── api/                 ← API client functions
│   │   │   └── context/             ← Auth context
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── backend/                     ← FastAPI server (port 8005)
│       ├── app/
│       │   ├── main.py              ← All API endpoints
│       │   ├── config.py            ← App configuration
│       │   ├── database.py          ← Database models
│       │   ├── schemas.py           ← Pydantic schemas
│       │   ├── auth.py              ← JWT authentication
│       │   ├── ai_detection.py      ← YOLOv8 detection logic
│       │   ├── pdf_generator.py     ← PDF report generation
│       │   ├── notifications.py     ← Notification system
│       │   └── realtime.py          ← WebSocket support
│       ├── models/
│       │   └── pothole_detection.pt ← ⭐ AI model file (required)
│       ├── uploads/                 ← Uploaded images (auto-created)
│       ├── reports/                 ← Generated PDFs (auto-created)
│       ├── main.py                  ← Entry point for uvicorn
│       ├── requirements.txt         ← Python dependencies
│       ├── download_model.py        ← Script to download AI model
│       └── create_admin.py          ← Script to create admin user
│
├── Admin/                           ← ADMIN MODULE
│   ├── run.py                       ← ⭐ Run this to start Admin module
│   ├── frontend/                    ← React admin dashboard (port 5175)
│   │   ├── src/
│   │   │   ├── components/          ← Admin UI components
│   │   │   ├── pages/               ← Admin pages
│   │   │   └── main.jsx
│   │   └── package.json
│   │
│   └── backend/                     ← FastAPI admin server (port 8006)
│       ├── main.py                  ← Admin API endpoints
│       └── requirements.txt         ← Admin Python dependencies
│
└── ScreenShots/                     ← Project screenshots
```

---

## ⚙️ How `run.py` Works

When you run `python run.py`, the script does all of this automatically:

```
Step 1: Check Python version (needs 3.8+)
Step 2: Check Node.js is installed
Step 3: Create Python virtual environment (venv/) — first time only
Step 4: Install Python packages from requirements.txt — first time only
Step 5: Install Node.js packages (npm install) — first time only
Step 6: Start Backend server
Step 7: Start Frontend server
Step 8: Open browser automatically
```

**Second time onwards**, steps 3–5 are skipped (already done), so startup is very fast.

### Ports Used

| Service | Port | URL |
|---------|------|-----|
| User Frontend | 5173 | http://localhost:5173 |
| User Backend API | 8005 | http://localhost:8005 |
| Admin Frontend | 5175 | http://localhost:5175 |
| Admin Backend API | 8006 | http://localhost:8006 |

---

## 🔐 Default Login Credentials

### User Account
| Field | Value |
|-------|-------|
| Username | `user` |
| Password | `user123` |

### Admin Account
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> To create a new admin: `cd User/backend` → `python create_admin.py`

---

## 🌟 Features

### User Features
| Feature | Description |
|---------|-------------|
| **Register / Login** | Create account or login with JWT auth |
| **AI Detection** | Upload road image → YOLOv8 detects potholes |
| **Manual Report** | Report a pothole with GPS location manually |
| **Interactive Map** | View all potholes on OpenStreetMap |
| **My Reports** | Track your submitted reports |
| **PDF Download** | Download AI-generated PDF report |
| **Dashboard** | Personal stats and detection history |

### Admin Features
| Feature | Description |
|---------|-------------|
| **Admin Dashboard** | Overall statistics and trends |
| **Pothole Management** | Review, verify, or reject reports |
| **Status Updates** | Mark potholes as Repaired |
| **Analytics** | Charts for severity, status, trends |
| **User Management** | View all registered users |

### AI Model Details
| Property | Value |
|----------|-------|
| Model | YOLOv8 (custom trained) |
| Task | Object detection |
| Classes | Pothole |
| Input | Images (JPEG, PNG) / Videos (MP4, AVI, MOV) |
| Output | Bounding boxes + confidence scores |
| Severity | Auto-classified: Low / Medium / High |

---

## 📡 API Documentation

When the backend is running, visit the interactive API docs:

- **User API Docs:** http://localhost:8005/docs
- **Admin API Docs:** http://localhost:8006/docs

### Key API Endpoints (User Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, get JWT token |
| `POST` | `/api/detect/image` | Upload image for AI detection |
| `POST` | `/api/potholes/report` | Submit manual pothole report |
| `GET` | `/api/potholes/` | Get all potholes (with filters) |
| `GET` | `/api/potholes/map` | Get potholes for map view |
| `GET` | `/api/potholes/{id}/report` | Download PDF report |
| `GET` | `/api/user/dashboard` | Get user dashboard stats |

### Key API Endpoints (Admin Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/potholes` | Get all potholes |
| `PATCH` | `/api/admin/potholes/{id}/status` | Update pothole status |
| `DELETE` | `/api/admin/potholes/{id}` | Delete a pothole report |
| `GET` | `/api/admin/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/admin/analytics` | Analytics data |

---

## 🗄️ Database Schema

The project uses **SQLite** (single file: `User/backend/road_monitoring.db`).
Both User and Admin modules share this same database.

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `username` | String | Unique username |
| `email` | String | Unique email |
| `hashed_password` | String | bcrypt hashed |
| `full_name` | String | Display name |
| `role` | Enum | `user` or `admin` |
| `is_active` | Boolean | Account active |
| `created_at` | DateTime | Registration time |

### Potholes Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `user_id` | Integer | FK → Users |
| `latitude` | Float | GPS latitude |
| `longitude` | Float | GPS longitude |
| `road_name` | String | Road name |
| `image_path` | String | Path to image file |
| `severity` | Enum | `low`, `medium`, `high` |
| `confidence` | Float | AI confidence (0–1) |
| `bounding_boxes` | Text | JSON bounding box data |
| `status` | Enum | `pending`, `verified`, `repaired`, `rejected` |
| `description` | Text | Description |
| `detection_method` | String | `ai` or `manual` |
| `created_at` | DateTime | Report time |

### Reports Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `pothole_id` | Integer | FK → Potholes |
| `user_id` | Integer | FK → Users |
| `report_path` | String | Path to PDF file |
| `generated_at` | DateTime | Generation time |

---

## 🐛 Troubleshooting

### ❌ `python` is not recognized
**Problem:** Python is not installed or not in PATH.
**Fix:** Install Python from https://www.python.org → check "Add to PATH" ✅

---

### ❌ `node` is not recognized
**Problem:** Node.js is not installed.
**Fix:** Install Node.js LTS from https://nodejs.org

---

### ❌ Port already in use (port 5173 / 8005)
**Problem:** Another instance of the app is already running.
**Fix:** Close other terminals → press `Ctrl+C` in any running terminal → run again.

Or find and kill the process:
```bash
# Find which process is using port 8005
netstat -ano | findstr :8005

# Kill it (replace XXXX with PID from above)
taskkill /PID XXXX /F
```

---

### ❌ AI model not found / Detection not working
**Problem:** `pothole_detection.pt` is missing from `User/backend/models/`
**Fix:**
```bash
cd User/backend
python download_model.py
```
Or manually copy `pothole_detection.pt` into `User/backend/models/` folder.

---

### ❌ `pip install` fails with errors
**Problem:** Network issue or conflicting packages.
**Fix:**
```bash
cd User/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### ❌ Admin panel shows no data
**Problem:** Admin module connects to User's database. User module must be started first.
**Fix:** Start `User/run.py` **before** starting `Admin/run.py`.

---

### ❌ Frontend shows blank page / API errors
**Problem:** Backend not running or wrong port.
**Fix:** Make sure backend is running and check browser console (F12) for errors.

---

## 📸 Application Screenshots

See the `ScreenShots/` folder in the project root for UI screenshots.

---

## 🎓 Project Information

| Field | Details |
|-------|---------|
| **Project Type** | Final Year Project (B.E. / B.Tech) |
| **Domain** | AI/ML + Full Stack Web Development |
| **AI Technology** | Computer Vision, Object Detection |
| **Model** | YOLOv8 (custom trained on pothole dataset) |
| **Architecture** | REST API + React SPA |

---

*For any issues, check the Troubleshooting section above or contact your team.*
