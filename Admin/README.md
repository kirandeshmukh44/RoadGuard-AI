# 🛡️ AI Pothole & Road Condition Monitoring - Dedicated Admin Portal

हा स्वतंत्र Admin Module **React + TailwindCSS + Python (FastAPI) + SQLite** स्टॅकवर तयार करण्यात आला आहे. हा मुख्य प्रोजेक्टच्या `road_monitoring.db` डेटाबेससोबत थेट जोडलेला आहे.

---

## 📁 फोल्डर रचना (Folder Structure)

```
Admin/
├── backend/
│   ├── main.py              # FastAPI REST API Backend (Port: 8006)
│   └── requirements.txt     # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React Admin Portal (Dashboard, Management, Map, Users)
│   │   ├── index.css        # TailwindCSS + Glassmorphism Styling
│   │   └── main.jsx         # Entry point
│   ├── vite.config.js       # Vite configuration with proxy to port 8006
│   └── package.json         # Node dependencies
├── run_admin.bat            # 1-Click Startup Script for Windows
└── README.md
```

---

## 🚀 ॲडमिन मॉड्युल कसे सुरू करावे (How to Run)

### पद्धत १: One-Click Startup (सोपी पद्धत)
फक्त **`Admin/run_admin.bat`** फाईलवर डबल-क्लिक करा. बॅकएंड आणि फ्रंटएंड दोन्ही वेगवेगळ्या विंडोमध्ये त्वरित सुरू होतील.

---

### पद्धत २: मॅन्यूअल रन (Manual Terminal Commands)

#### १. बॅकएंड सुरू करणे (FastAPI - Port 8006)
```powershell
cd "D:\Pravara Infotech\AI_Pothole_Detection_Road_Condition_Monitoring\Admin\backend"
python main.py
```
- **API URL:** `http://localhost:8006`
- **Swagger Docs:** `http://localhost:8006/docs`

#### २. फ्रंटएंड सुरू करणे (React + Vite - Port 5174)
```powershell
cd "D:\Pravara Infotech\AI_Pothole_Detection_Road_Condition_Monitoring\Admin\frontend"
npm run dev
```
- **Admin Portal URL:** `http://localhost:5174`

---

## 🌟 Admin Features

1. **Overview & Analytics Dashboard:**
   - Total Potholes, Pending, Repaired, आणि High Severity काउंट्स.
   - Severity Distribution Breakdown (High, Medium, Low Risk).
   - रिअल-टाईम GIS हिटमॅप स्नॅपशॉट.

2. **Pothole Management & Triage:**
   - Search by Road name, Reporter किंवा Notes.
   - Status Filters (Pending / Verified / Repaired / Rejected).
   - थेट फोटो इन्स्पेक्शन आणि AI कॉन्फिडन्स स्कोरिंग.
   - **One-click Status Action:** Verified, Mark Repaired, Reset Pending, Reject (False detection).
   - ॲडमिन रिझोल्यूशन नोट्स (Admin Notes) ॲड करण्याची सोय.

3. **Live GIS Interactive Map:**
   - OpenStreetMap + Leaflet इंटिग्रेशन.
   - कलर-कोडेड मार्कर्स:
     - 🔴 **Red:** High Severity
     - 🟡 **Amber:** Medium Severity
     - 🔵 **Cyan:** Low Severity
     - 🟢 **Green:** Repaired Potholes

4. **User & Staff Role Control:**
   - सर्व नोंदणीकृत युजर्सची यादी आणि त्यांनी रिपोर्ट केलेल्या खड्ड्यांची संख्या.
   - **Promote to Admin / Demote to User** रोल मॅनेजमेंट.
