# Project Guide: RoadGuard AI

This guide explains what each part of the project does, how information moves through it, and how to run and maintain it locally.

## What the application does

RoadGuard AI lets people submit road pothole reports, inspect an interactive map, and review detection history. An administrator can review reports, manage users, view analytics, and manage the pothole detection model. The detection service uses a YOLO model to analyze images and video.

## How the parts fit together

```text
Browser (React frontend)
    | HTTP requests / WebSocket
    v
FastAPI backend (Python)
    |-- SQLite database: users, potholes, reports
    |-- YOLO model: image/video detection
    |-- Dataset: training and validation images/labels
    |-- File storage: uploaded images and generated PDFs
```

The frontend is the interface people use. It sends API requests to the backend. The backend checks the request and, when needed, reads or updates SQLite, runs AI detection, saves files, or generates reports. The backend returns JSON (or a file) for the frontend to display.

## Folder map

| Path | Purpose |
| --- | --- |
| `frontend/src/pages/` | Public pages; `frontend/src/pages/admin/` contains admin pages such as the dashboard, report management, analytics, and model training. |
| `frontend/src/components/` | Reusable interface pieces such as navigation and shared controls. |
| `frontend/src/api/` | Axios and API/WebSocket connection helpers. |
| `frontend/src/context/` | Shared frontend state, including authentication state. |
| `frontend/public/` | Static files served by Vite, including app icons and the PWA manifest. |
| `frontend/package.json` | Frontend dependencies and its own dev/build/lint commands. |
| `backend/app/main.py` | FastAPI app, routes, request handling, and app startup. |
| `backend/app/config.py` | Runtime paths, SQLite URL, security, AI thresholds, and CORS origins. |
| `backend/app/database.py` | SQLAlchemy tables, database connection, and session helpers. |
| `backend/app/schemas.py` | Data shapes used to validate API requests and responses. |
| `backend/app/auth.py` | Password hashing, login, tokens, and access checks. |
| `backend/app/ai_detection.py` | Loads the active YOLO weights and runs image detection. |
| `backend/app/model_training.py` | Dataset registration, training, validation, and model version management. |
| `backend/app/realtime.py` | WebSocket handling for live detection updates. |
| `backend/app/pdf_generator.py` | Creates downloadable PDF reports. |
| `backend/app/notifications.py` | Notification helpers used by admin workflows. |
| `backend/main.py` | Compatibility entry point used by the root development launcher. |
| `backend/requirements.txt` | Python dependencies. |
| `backend/road_monitoring.db` | Local SQLite application database. This is runtime data; keep a backup before replacing it. |
| `backend/Dataset from kaggle/` | YOLO dataset used for training/validation, including `data.yaml`, images, and labels. |
| `backend/models/pothole_detection.pt` | Active trained model weights loaded by the detection API. |
| `backend/models/` | Model files and version metadata. |
| `backend/datasets/` | Dataset registration/version metadata. |
| `backend/training_runs/` | Training output created during model training. |
| `backend/uploads/` | Images and videos uploaded through the app. |
| `backend/reports/` | Generated PDF files. |
| `backend/scripts/` | Setup, server, and maintenance utilities. `manual_checks/` are developer diagnostics; some can write to the local database. |
| `backend/tests/` | Home for automated backend tests. |
| `scripts/dev.mjs` | Root process launcher for both frontend and backend. |
| `scripts/backend.mjs` | Root helper to launch only the backend. |
| `package.json` | Root npm commands for the full project. |
| `yolov8n.pt` | Base YOLO weights used as a starting point for training, distinct from the active trained model. |

## Frontend

The frontend is a React single-page app built and served by Vite. Tailwind CSS and DaisyUI provide styling, and Framer Motion provides animations. React Router handles navigation. Axios calls the REST API; the map uses Leaflet; analytics use Recharts.

Important pages include:

- **Home / How It Works / About** explain the service.
- **Detect** submits images or videos for AI analysis.
- **Report** lets a user submit a pothole with location/details.
- **Road Map** displays reports by location.
- **Dashboard / History / My Reports / Profile** show user activity and account data.
- **Admin pages** in `frontend/src/pages/admin/` support report/user management, analytics, and model training.

Vite reads `VITE_API_URL` as the backend base URL. The root launcher sets this automatically, so the frontend follows the backend port selected at startup. The local `frontend/.env` is useful when running only Vite; use `frontend/.env.example` as the template for local configuration.

Useful commands from the repository root:

```bash
npm install --prefix frontend
npm run dev:frontend
npm run build
npm run lint
```

## Backend and API

The backend is a FastAPI application served by Uvicorn. API routes are defined in `backend/app/main.py`. Open `/docs` on the backend URL for interactive Swagger API documentation and `/redoc` for the alternate reference.

Main API areas include:

- `/api/auth/...` - registration, login, and current user.
- `/api/detect` and `/api/detect/video` - image/video detection.
- `/api/potholes/...` - create, view, update, delete, and report potholes.
- `/api/admin/...` - admin dashboard, users, datasets, model training, and deployment.
- `/api/analytics/...` - overview, heatmap, and road condition summaries.
- `/api/export/...` - CSV, GeoJSON, and summary exports.
- `/ws/detect` - WebSocket endpoint for live detection updates.

The backend accepts `API_PORT` to choose its listening port. The root launcher sets it for you. For backend-only startup from the repository root, use `npm run dev:backend`. To start it manually, change to `backend` and run `python main.py` using the project's Python environment.

## SQLite database

This project uses SQLite, a database stored in a local file. The configured file is `backend/road_monitoring.db`. SQLAlchemy maps Python classes in `backend/app/database.py` to tables; the current main records are:

| Table/model | What it stores |
| --- | --- |
| `User` | Account identity, hashed password, role, and timestamps. |
| `Pothole` | Coordinates, road, image path, severity, confidence, detection boxes, status, and owner. |
| `Report` | Generated report file, owner, related pothole, and generation status. |

At startup, `init_db()` creates any missing tables. It does not replace the database file. Back up `road_monitoring.db` before manual edits or database replacement. Local runtime databases are excluded from Git to avoid committing personal or machine-specific data.

## AI model and dataset

The active detector loads `backend/models/pothole_detection.pt` when available. `yolov8n.pt` at the repository root is a base model for training; it is not the active deployed model. Admin training code registers a dataset, creates training and validation splits as needed, and saves model versions and training outputs under the backend directories. The bundled dataset path is `backend/Dataset from kaggle` and is prefilled in the model training page.

Training can be computationally intensive and may take a long time, depending on the machine and selected settings. Training creates artifacts in `backend/training_runs/` and `backend/models/`; preserve any model version you want to keep.

## Uploaded files and reports

Images/videos are stored under `backend/uploads/`; generated PDFs go under `backend/reports/`. The database stores paths and related metadata. Keep those folders alongside the database when backing up a local installation, otherwise database entries may point to files that are missing.

## Run the whole project

1. Install Node.js/npm and Python. Install frontend and backend dependencies once:

   ```bash
   npm install --prefix frontend
   python -m venv backend/venv
   backend/venv/Scripts/python -m pip install -r backend/requirements.txt
   ```

   On macOS/Linux, use `backend/venv/bin/python` instead of `backend/venv/Scripts/python`.

2. From the repository root, start both services:

   ```bash
   npm run dev
   ```

   In PowerShell, use `npm.cmd run dev` if the system's script policy blocks `npm`.

3. Open the frontend URL printed in the terminal. The launcher normally uses port 5173 for the frontend and 8003 for the API, and selects a free nearby port when either is busy. It also retries the backend on another port if a port becomes occupied between selection and startup. Append `/docs` to the printed API URL to open Swagger.

4. Press `Ctrl+C` in the terminal to stop both services.

## Common tasks

| Goal | Command / location |
| --- | --- |
| Start frontend and backend | Root: `npm run dev` |
| Start only frontend | Root: `npm run dev:frontend` |
| Start only backend | Root: `npm run dev:backend` |
| Build the frontend for deployment | Root: `npm run build` (output in `frontend/dist/`) |
| Check frontend style/lint rules | Root: `npm run lint` |
| Find API endpoints | `backend/app/main.py` or the running API's `/docs` page |
| Change backend settings | `backend/app/config.py` and environment variables |
| Change page UI | `frontend/src/pages/` and `frontend/src/components/` |
| Change API/database behavior | `backend/app/` |
| Change dataset | `backend/Dataset from kaggle/` and the model training page |

## Configuration and security notes

- `SECRET_KEY` can be set in the environment; replace the development fallback before deploying outside a local machine.
- `API_PORT` and `FRONTEND_ORIGIN` are set by the root launcher. `VITE_API_URL` is passed to Vite by the same launcher.
- Do not commit `.env` secrets, user databases, uploaded media, generated reports, or local training output.
- The root `.gitignore` excludes common local dependencies and runtime artifacts. The dataset and model weights are intentionally present project assets.

