# Backend Guide

The backend is a Python FastAPI service. It handles authentication, pothole reports, AI detection, analytics, model training/deployment, notifications, and PDF generation.

## Main folders

- `app/` contains the FastAPI application modules.
- `scripts/` contains startup/setup helpers, database maintenance utilities, and manual checks. Some manual checks change local data; inspect their README before running them.
- `tests/` is reserved for automated tests.
- `Dataset from kaggle/` contains the bundled YOLO dataset.
- `models/` stores active and versioned model weights.
- `datasets/` stores dataset registration metadata.
- `training_runs/` stores training outputs.
- `uploads/` stores user-uploaded images/videos; `reports/` stores generated PDFs.

The SQLite database is `road_monitoring.db` in the backend folder. SQLAlchemy tables and database sessions are defined in `app/database.py`; paths and runtime settings are in `app/config.py`.

## Train the pothole model

The trainer uses the local one-class dataset in `Dataset from kaggle/`. It never downloads another dataset or generates synthetic images. It keeps Roboflow variants of the same source image together in train, validation, and test splits, and includes the supplied `valid/` folder in the final holdout comparison.

From the `User` folder, run:

```bash
npm run train:model
```

Training defaults to 60 epochs at 640 pixels. It automatically uses CUDA when available; CPU training on this full dataset can take many hours. Training runs and candidate weights are saved under `backend/training_runs/`. The active model is replaced only when at least 100 held-out images are available and the candidate improves mAP50 without materially lowering precision.

The dataset and `.pt` weight files are intentionally ignored by Git because they are large local assets. Keep a separate backup of the dataset and trained weights when moving the project to another machine.

## Run the backend

From the project root, use:

```bash
npm run dev:backend
```

To run it manually, change to `backend` and activate the Python virtual environment:

```bash
cd backend
venv\Scripts\activate
python main.py
```

On macOS/Linux, activate with `source venv/bin/activate`. The default API address is `http://localhost:8003`; interactive API docs are at `/docs`. `API_PORT` changes the port. The root launcher selects a free port automatically and sets the frontend origin.

## Dependencies

Create a virtual environment and install the pinned dependencies from the repository root:

```bash
python -m venv backend/venv
backend/venv/Scripts/python -m pip install -r backend/requirements.txt
```

On macOS/Linux, use `backend/venv/bin/python`.

See the root [PROJECT_GUIDE.md](../PROJECT_GUIDE.md) for API areas, database records, model/data paths, and the complete run instructions.
