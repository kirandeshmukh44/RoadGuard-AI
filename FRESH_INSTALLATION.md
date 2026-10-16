# RoadGuard AI â€” Fresh Installation Guide

Use this guide when setting up the project on a new laptop. It covers Windows PowerShell first, then gives the equivalent environment activation commands for other terminals.

## 1. What you need

Install these before starting:

- **Node.js LTS** (npm is included)
- **Python 3.12, 64-bit** (include the Python Launcher / `py` command on Windows)
- **Git** if you are cloning the repository
- An internet connection for package installation and OpenStreetMap map tiles

The Python AI packages, especially PyTorch and OpenCV, are large and can take time to download. Use 64-bit Python 3.12 to match the pinned requirements.

## 2. Get the project files

Either clone the repository:

```powershell
git clone <repository-url>
cd AI_Pothole_Detection_Road_Condition_Monitoring
```

Or extract the project ZIP, then open PowerShell in the extracted project folder. The folder should contain `User`, `Admin`, and the root `package.json`.

All following commands are run from this project root unless stated otherwise.

## 3. Install the User portal

Install Node dependencies for the User launcher and frontend:

```powershell
npm.cmd install --prefix User
npm.cmd install --prefix User/frontend
```

Create the User backend's Python environment and install its packages:

```powershell
py -3.12 -m venv User/backend/venv
User/backend/venv/Scripts/python.exe -m pip install --upgrade pip
User/backend/venv/Scripts/python.exe -m pip install -r User/backend/requirements.txt
```

Create the initial admin account and fresh SQLite database:

```powershell
User/backend/venv/Scripts/python.exe User/backend/create_admin.py
```

The initial local admin login is `admin` / `admin@123`. Change that password after first use. Normal users can register from the User portal.

## 4. Start the User portal

From the project root:

```powershell
npm.cmd run dev
```

This starts the User frontend and backend. The usual URLs are:

- User portal: `http://localhost:5173`
- User API: `http://localhost:8005`
- API docs: `http://localhost:8005/docs`

Keep this terminal open while using the app. Press **Ctrl+C** there to stop the services.

## 5. Install and start the Admin portal

Keep the User services running. Open a second PowerShell window at the project root and install Admin dependencies:

```powershell
npm.cmd install --prefix Admin
npm.cmd install --prefix Admin/frontend
py -3.12 -m venv Admin/backend/venv
Admin/backend/venv/Scripts/python.exe -m pip install --upgrade pip
Admin/backend/venv/Scripts/python.exe -m pip install -r Admin/backend/requirements.txt
```

Start Admin:

```powershell
Set-Location Admin
npm.cmd run dev
```

The Admin launcher prints the actual portal and API URLs. Defaults are:

- Admin portal: `http://localhost:5175`
- Admin API: `http://localhost:8006`

Admin reads the same SQLite database as User, so keep the User backend available. Press **Ctrl+C** in the Admin terminal to stop Admin services.

## 6. AI model and existing data

Git intentionally excludes large local files. A fresh clone starts with a new database and does not automatically include:

- `User/backend/models/pothole_detection.pt` â€” trained YOLO weights
- `User/backend/Dataset from kaggle/` â€” training dataset
- `User/backend/road_monitoring.db` â€” existing users and pothole records
- Files under `User/backend/uploads/` and `User/backend/reports/`

Without `pothole_detection.pt`, both portals can start and manual reports can be used, but AI image/video detection will say that the model is unavailable. To use the same trained model and records from another laptop, transfer the model, database, uploads, and reports separately. Keep a backup before replacing a database.

Training a new model is optional and can take many hours, especially without a CUDA-capable GPU. See `User/backend/README.md` for the project's model training notes.

## 7. Virtual environment commands by shell

You do **not** need to activate the environment to start the app; the commands above call its Python executable directly.

If you want to activate it manually from the project root:

**PowerShell:**

```powershell
.\User\backend\venv\Scripts\Activate.ps1
```

**Command Prompt:**

```bat
User\backend\venv\Scripts\activate.bat
```

**Git Bash on Windows:**

```bash
source User/backend/venv/Scripts/activate
```

**macOS/Linux:** create and install with:

```bash
python3 -m venv User/backend/venv
User/backend/venv/bin/python -m pip install --upgrade pip
User/backend/venv/bin/python -m pip install -r User/backend/requirements.txt
```

Then activate with `source User/backend/venv/bin/activate`. The current combined npm launcher scripts are Windows-oriented; on macOS/Linux, start the Python backend with the environment's Python and the Vite frontend in separate terminals.

For the User portal, from the project root use one terminal for the backend:

```bash
User/backend/venv/bin/python User/backend/main.py
```

Use a second terminal for the frontend:

```bash
npm --prefix User/frontend run dev -- --host 127.0.0.1
```

For Admin, after installing its Node and Python dependencies, use one terminal for `Admin/backend/venv/bin/python Admin/backend/main.py` and another for `npm --prefix Admin/frontend run dev -- --host 127.0.0.1 --port 5175`. Keep the User backend running too, because Admin shares its database.

## 8. Common setup problems

### `source` is not recognized

`source` is a Bash command. In PowerShell, use the activation command shown in section 7, or skip activation and run the app commands above.

### `npm` is blocked by PowerShell execution policy

Use `npm.cmd` in PowerShell, as shown throughout this guide. This avoids invoking the blocked `npm.ps1` wrapper.

### `py -3.12` is not recognized

Install 64-bit Python 3.12 and enable the Python Launcher option. Reopen PowerShell after installation.

### Backend environment or frontend packages are missing

Run the relevant `py -3.12 -m venv ...`, pip install, and `npm.cmd install --prefix ...` commands above. The `venv` and `node_modules` folders are local to each laptop and are not included in Git.

### A port is already in use

Stop the other development server that uses the User default ports 5173/8005, then restart. Admin reports its selected URLs when it starts; use those printed URLs if it selects alternatives.

### Map has markers but no street background

The street layer uses OpenStreetMap tiles and needs internet access. Pothole records and map tiles are separate: tile delays do not mean the report API failed.

## 9. Production build (optional)

Build both frontends from the project root:

```powershell
npm.cmd --prefix User/frontend run build
npm.cmd --prefix Admin/frontend run build
```

For deployment, configure the production API URL/origin and provide the trained model and persistent database/media storage on the server.
