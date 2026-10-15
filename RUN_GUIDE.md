# 🚀 Quick Start Guide - Pothole Detection System

## 📂 Project Structure

```
AI_Pothole_Detection_Road_Condition_Monitoring/
├── User/                          # User Module
│   ├── start.bat                 # Windows: Double-click to start
│   ├── start.py                  # Python: Run to start
│   ├── package.json              # NPM scripts
│   ├── backend/                   # Backend (Port 8005)
│   └── frontend/                  # Frontend (Port 5173)
│
└── Admin/                         # Admin Module
    ├── start.bat                 # Windows: Double-click to start
    ├── start.py                  # Python: Run to start
    ├── package.json              # NPM scripts
    ├── backend/                   # Backend (Port 8006)
    └── frontend/                  # Frontend (Port 5175)
```

## 🎯 How to Run

### **Option 1: Windows - Double-click .bat file (Easiest)**

#### **User Module**
1. Go to `User` folder
2. Double-click `start.bat`
3. Both Backend and Frontend will start automatically
4. Open browser: http://localhost:5173

#### **Admin Module**
1. Go to `Admin` folder
2. Double-click `start.bat`
3. Both Backend and Frontend will start automatically
4. Open browser: http://localhost:5175

---

### **Option 2: Python Script**

#### **User Module**
```bash
cd User
python start.py
```

#### **Admin Module**
```bash
cd Admin
python start.py
```

---

### **Option 3: NPM Commands**

#### **User Module**
```bash
cd User
npm install
npm run dev
```

#### **Admin Module**
```bash
cd Admin
npm install
npm run dev
```

---

## 🔐 Login Credentials

### **User Module**
- **Username**: `user`
- **Password**: `user123`

### **Admin Module**
- **Username**: `admin`
- **Password**: `admin123`

---

## 📡 URLs

| Module | Backend | Frontend |
|--------|---------|----------|
| User | http://localhost:8005 | http://localhost:5173 |
| Admin | http://localhost:8006 | http://localhost:5175 |

---

## 🤖 AI Model Status

✅ **YOLO Model is LOADED and WORKING**
- Location: `User/backend/models/pothole_detection.pt`
- Active on User Backend (Port 8005)

---

## 🛑 How to Stop

### **If using .bat file:**
- Close the command windows that opened

### **If using Python script:**
- Press `Ctrl+C` in the terminal

### **If using NPM:**
- Press `Ctrl+C` in the terminal

---

## 📱 Features

### **User Module**
- ✅ AI pothole detection with YOLO
- ✅ Manual pothole reporting
- ✅ Interactive map view
- ✅ GPS location tracking
- ✅ Report history
- ✅ Download PDF reports

### **Admin Module**
- ✅ View all potholes
- ✅ Update repair status
- ✅ Analytics dashboard
- ✅ User management
- ✅ Generate summary reports

---

## 🎓 For Presentation

1. **User Module Demo:**
   - Open http://localhost:5173
   - Login with user credentials
   - Show AI detection feature
   - Show map visualization
   - Show report generation

2. **Admin Module Demo:**
   - Open http://localhost:5175
   - Login with admin credentials
   - Show dashboard statistics
   - Show pothole management
   - Show analytics charts

---

## ⚠️ Troubleshooting

### **Port already in use?**
- User Backend: Change port in `User/backend/main.py`
- Admin Backend: Change port in `Admin/backend/main.py`
- Frontend: Vite will automatically find next available port

### **Python not found?**
- Make sure Python 3.12 is installed
- Virtual environment should be in `backend/venv`

### **Node modules not found?**
- Run `npm install` in the folder
- Delete `node_modules` and reinstall if needed

---

## ✅ Ready to Use!

Both modules are now separate and can run independently. Use the `start.bat` file for easiest experience!
