# RoadGuard AI: ZIP मधून नवीन laptop वर installation

ही guide project चा ZIP मित्राच्या Windows laptop वर extract करून पहिल्यांदा चालवण्यासाठी आहे. Commands **PowerShell** साठी आहेत.

## 1. ZIP तयार/मिळवा आणि extract करा

Project चा ZIP पूर्णपणे extract करा. Extract झालेल्या root folder मध्ये `User`, `Admin` आणि `package.json` दिसले पाहिजेत. उदाहरणार्थ:

```text
D:\RoadGuard\AI_Pothole_Detection_Road_Condition_Monitoring\
  User\
  Admin\
  package.json
```

File Explorer मध्ये त्या root folder मध्ये जा, address bar मध्ये `powershell` लिहून Enter दाबा. पुढील सर्व commands याच root folder मधून चालवा.

## 2. आधी आवश्यक software install करा

- **Node.js LTS** (npm सहित)
- **Python 3.12, 64-bit** (Windows वर Python Launcher `py` सहित)
- ZIP extract करण्यासाठी Windows Explorer किंवा 7-Zip

Install झाल्यावर नवीन PowerShell उघडा आणि तपासा:

```powershell
node --version
npm.cmd --version
py -3.12 --version
```

यापैकी command सापडत नसेल तर संबंधित software install करून terminal पुन्हा उघडा.

## 3. User app चे dependencies बसवा

```powershell
npm.cmd install --prefix User
npm.cmd install --prefix User/frontend
py -3.12 -m venv User/backend/venv
User/backend/venv/Scripts/python.exe -m pip install --upgrade pip
User/backend/venv/Scripts/python.exe -m pip install -r User/backend/requirements.txt
```

पहिल्यांदा Python packages बसायला वेळ लागू शकतो; PyTorch/OpenCV packages मोठे आहेत.

Fresh database आणि सुरुवातीचा admin account तयार करा:

```powershell
User/backend/venv/Scripts/python.exe User/backend/create_admin.py
```

पहिला admin login: `admin` / `admin@123`. Login नंतर password बदला. सामान्य user हा User portal वरून register करू शकतो.

## 4. Admin app चे dependencies बसवा

```powershell
npm.cmd install --prefix Admin
npm.cmd install --prefix Admin/frontend
py -3.12 -m venv Admin/backend/venv
Admin/backend/venv/Scripts/python.exe -m pip install --upgrade pip
Admin/backend/venv/Scripts/python.exe -m pip install -r Admin/backend/requirements.txt
```

## 5. दोन्ही apps चालवा

**PowerShell विंडो 1 — User:** project root मधून:

```powershell
npm.cmd run dev
```

Launcher ने दाखवलेला User portal URL browser मध्ये उघडा. Default frontend `http://localhost:5173` आणि API `http://localhost:8005` असतात. ही विंडो चालू ठेवा.

**PowerShell विंडो 2 — Admin:** त्याच project root मधून:

```powershell
Set-Location Admin
npm.cmd run dev
```

Launcher ने दाखवलेला Admin URL uघडा. Default frontend `http://localhost:5175` आणि API `http://localhost:8006` असतात. Admin आणि User एकच database वापरतात, म्हणून User backend चालू असणे गरजेचे आहे. थांबवण्यासाठी संबंधित terminal मध्ये `Ctrl+C` दाबा.

## ZIP मध्ये कोणत्या गोष्टी येतात?

GitHub वरील **Download ZIP** किंवा Git source ZIP मध्ये खालील local/generated गोष्टी सहसा नसतात:

- `venv` आणि `node_modules` — प्रत्येक laptop वर पुन्हा तयार/install करा.
- `User/backend/models/pothole_detection.pt` — AI photo/video detection साठी trained model.
- `User/backend/road_monitoring.db` — जुन्या accounts आणि pothole records.
- `User/backend/uploads/` आणि `User/backend/reports/` — आधीचे media/reports.

Model ZIP मध्ये नसल्यास portals सुरू होतील आणि manual reporting चालेल; AI detection साठी model file स्वतंत्रपणे मिळवून `User/backend/models/pothole_detection.pt` या path वर ठेवा. जुना data हवा असल्यास database आणि संबंधित uploads/reports स्वतंत्रपणे copy करा. अगदी fresh setup मध्ये database admin script/backend ने तयार होईल.

## अडचणी आल्यास

- PowerShell मध्ये `source` चालत नाही. तो Bash command आहे; app सुरू करण्यासाठी venv activate करायची गरज नाही, वरील commands venv चा Python थेट वापरतात.
- `npm` execution policy error आल्यास `npm` ऐवजी `npm.cmd` वापरा.
- `Port ... already in use` आल्यास आधीचा User/Admin server terminal मध्ये `Ctrl+C` ने बंद करा; नंतर पुन्हा सुरू करा.
- Map चा रस्ता/tiles दिसण्यासाठी internet लागतो. AI model आणि map tiles वेगवेगळ्या गोष्टी आहेत.
- दुसऱ्या laptop वरून `venv` किंवा `node_modules` copy करू नका; त्या laptop वर commands वापरून नव्याने तयार करा.

सर्वसाधारण setup आणि इतर operating systems साठी [FRESH_INSTALLATION.md](FRESH_INSTALLATION.md) पहा.
