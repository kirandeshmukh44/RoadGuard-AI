# AI-Based Pothole Detection and Road Condition Monitoring

RoadGuard AI is a road monitoring application for AI pothole detection, user reports, interactive mapping, analytics, and administrative review.

For a plain-language explanation of the frontend, backend, API, SQLite database, model, dataset, folders, and common tasks, read [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

## Technology

- **Frontend:** React, Vite, Tailwind CSS, DaisyUI, React Router, Axios, Leaflet, Recharts, and Framer Motion.
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, Ultralytics YOLO, PyTorch, OpenCV, and ReportLab.
- **Database:** SQLite at `backend/road_monitoring.db`.

## Prerequisites

- Node.js and npm
- Python 3.12 recommended

## Quick start

Install the dependencies once:

```bash
npm install --prefix frontend
python -m venv backend/venv
backend/venv/Scripts/python -m pip install -r backend/requirements.txt
```

On macOS/Linux, use `backend/venv/bin/python` instead of `backend/venv/Scripts/python`.

Start the frontend and backend from the project root:

```bash
npm run dev
```

In PowerShell, run `npm.cmd run dev` if the execution policy blocks `npm`. The launcher prints the frontend and API URLs; it uses ports 5173 and 8003 by default and chooses nearby free ports when needed. The API documentation is at the printed API URL followed by `/docs`. Press `Ctrl+C` to stop both services.

The root also provides `npm run dev:frontend`, `npm run dev:backend`, `npm run build`, and `npm run lint`.

## Top-level folders

```text
backend/       FastAPI application, SQLite file, model, dataset, uploads, reports
frontend/      React user interface and static assets
scripts/       Root development launchers
```

