RoadGuard AI: Installation on a New Laptop from a ZIP File

This guide explains how to extract the project ZIP file on a friend's Windows laptop and run it for the first time. All commands are for PowerShell.

1. Get the ZIP File and Extract It

Extract the project ZIP file completely. The extracted root folder should contain User, Admin, and package.json. For example:

D:\RoadGuard\AI_Pothole_Detection_Road_Condition_Monitoring\
  User\
  Admin\
  package.json


Open the root folder in File Explorer. Type powershell in the address bar and press Enter. Run all the following commands from this same root folder.

2. Install the Required Software First
Node.js LTS (including npm)
Python 3.12, 64-bit (including the Python Launcher py on Windows)
Windows Explorer or 7-Zip to extract the ZIP file

After installation, open a new PowerShell window and check the versions:

node --version
npm.cmd --version
py -3.12 --version


If any command is not recognized, install the required software and open PowerShell again.

3. Install the User App Dependencies
npm.cmd install --prefix User
npm.cmd install --prefix User/frontend
py -3.12 -m venv User/backend/venv
User/backend/venv/Scripts/python.exe -m pip install --upgrade pip
User/backend/venv/Scripts/python.exe -m pip install -r User/backend/requirements.txt


The first installation may take some time because Python packages such as PyTorch and OpenCV are large.

Create a fresh database and the first admin account:

User/backend/venv/Scripts/python.exe User/backend/create_admin.py


The first admin login details are:

Username: admin
Password: admin@123

Change the password after logging in. Regular users can register through the User portal.

4. Install the Admin App Dependencies
npm.cmd install --prefix Admin
npm.cmd install --prefix Admin/frontend
py -3.12 -m venv Admin/backend/venv
Admin/backend/venv/Scripts/python.exe -m pip install --upgrade pip
Admin/backend/venv/Scripts/python.exe -m pip install -r Admin/backend/requirements.txt

5. Run Both Apps

PowerShell Window 1 — User: Run this command from the project root folder:

npm.cmd run dev


Open the User portal URL shown by the launcher in your browser. The default URLs are:

Frontend: http://localhost:5173
API: http://localhost:8005

Keep this window running.

PowerShell Window 2 — Admin: Open another PowerShell window and run these commands from the same project root folder:

Set-Location Admin
npm.cmd run dev


Open the Admin URL shown by the launcher in your browser. The default URLs are:

Frontend: http://localhost:5175
API: http://localhost:8006

The Admin and User apps use the same database, so the User backend must be running.

To stop either app, press Ctrl+C in its terminal window.

What Is Included in the ZIP File?

A ZIP downloaded using GitHub's Download ZIP option or a Git source ZIP usually does not include the following local or generated files and folders:

venv and node_modules — Create or install these again on each laptop.
User/backend/models/pothole_detection.pt — The trained model needed for AI-based photo/video detection.
User/backend/road_monitoring.db — The database containing existing user accounts and pothole records.
User/backend/uploads/ and User/backend/reports/ — Previously uploaded media files and reports.

If the model is not included in the ZIP, the portals may still start and manual reporting may work. However, AI-based detection requires the model file. Get the model separately and place it at this path:

User/backend/models/pothole_detection.pt

If you need the old data, copy the database and its related uploads and reports separately.

For a completely fresh setup, the database will be created by the admin script or backend.

Troubleshooting
PowerShell does not support the source command because it is a Bash command. You do not need to activate the virtual environment. The commands above directly use the Python executable inside the virtual environment.
If npm shows an execution policy error, use npm.cmd instead of npm.
If you see a Port ... already in use error, stop the previous User or Admin server by pressing Ctrl+C in its terminal window. Then start it again.
An internet connection is required to load map roads and tiles. The AI model and map tiles are separate things.
Do not copy venv or node_modules from another laptop. Create them again on the new laptop by running the commands given in this guide.

For general installation instructions and other operating systems, see FRESH_INSTALLATION.md.