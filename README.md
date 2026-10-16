# RoadGuard AI — Pothole Detection & Road Condition Monitoring

RoadGuard AI has two applications: the **User portal** for reporting and detecting potholes, and the **Admin portal** for managing reports and viewing the shared road map. Both backends use the User backend's SQLite database.

For a complete new-laptop setup, see [FRESH_INSTALLATION.md](FRESH_INSTALLATION.md). For Windows installation from a downloaded ZIP, see [ZIP_INSTALLATION.md](ZIP_INSTALLATION.md).

## Requirements

- Windows 10/11, macOS, or Linux
- Node.js (includes npm)
- Python 3.12 recommended
- Internet connection for installing dependencies and loading OpenStreetMap tiles

## Start the User portal (Windows PowerShell)

Run these commands from the repository root:

```powershell
npm.cmd install --prefix User
npm.cmd install --prefix User/frontend
py -3.12 -m venv User/backend/venv
User/backend/venv/Scripts/python.exe -m pip install -r User/backend/requirements.txt
npm.cmd --prefix User run dev
```

The root `npm run dev` launcher starts the User backend and frontend. Open the URLs printed by the launcher. To activate the environment manually in PowerShell, use:

```powershell
.\User\backend\venv\Scripts\Activate.ps1
```

In Command Prompt, use `User\backend\venv\Scripts\activate.bat`. In Git Bash on Windows, use `source User/backend/venv/Scripts/activate`. On macOS/Linux, create the venv with `python3 -m venv User/backend/venv`, install with `User/backend/venv/bin/python -m pip install -r User/backend/requirements.txt`, then activate with `source User/backend/venv/bin/activate`.

## Start the Admin portal

Open a second terminal at the repository root:

```powershell
npm.cmd install --prefix Admin
npm.cmd install --prefix Admin/frontend
py -3.12 -m venv Admin/backend/venv
Admin/backend/venv/Scripts/python.exe -m pip install -r Admin/backend/requirements.txt
npm.cmd --prefix Admin run dev
```

The Admin launcher starts its backend and frontend and prints their URLs. The two portals share pothole records through `User/backend/road_monitoring.db`.

## Moving the project to another laptop

Copy or clone the source project, then install its Node and Python dependencies on that laptop using the steps above. Do not copy your existing `venv` or `node_modules`; they are machine-specific and ignored by Git.

Large/private runtime assets are also ignored by Git: trained YOLO `.pt` model files, datasets, the SQLite database, uploads, and generated reports. Copy those separately if the new laptop needs the same trained AI model and existing accounts/reports. Without `User/backend/models/pothole_detection.pt`, the portals can start and manual reporting works, but AI photo/video detection will report that the model is unavailable. OpenStreetMap's base map tiles require internet on first load.

## Build

```powershell
npm.cmd --prefix User/frontend run build
npm.cmd --prefix Admin/frontend run build
```
