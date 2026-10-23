import React, { useState, useEffect, useRef } from 'react';
import * as L from './vendor/leaflet/leaflet-src.esm.js';
import './vendor/leaflet/leaflet.css';
import {
  LayoutDashboard,
  MapPin,
  CheckCircle2,
  Clock,
  Wrench,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Camera,
  Navigation,
  FileSpreadsheet,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  KeyRound,
  Check
} from 'lucide-react';

const API_BASE = '/api/admin';
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (/^(data:|blob:)/i.test(imagePath)) return imagePath;
  try {
    const parsed = new URL(imagePath, window.location.origin);
    // Older running Admin API processes may still return localhost:8005 URLs.
    // Serve those shared uploads through the current Admin origin instead.
    if (parsed.pathname.startsWith('/uploads/')) return `${parsed.pathname}${parsed.search}`;
    return /^(https?:\/\/)/i.test(imagePath) ? imagePath : `/${parsed.pathname.replace(/^\/+/, '')}`;
  } catch {
    return imagePath;
  }
};
const isVideoPath = (mediaPath) => /\.(mp4|webm|mov|avi)(?:$|[?#])/i.test(mediaPath || '');
const isIndiaGps = (p) => Number(p.latitude) >= 6 && Number(p.latitude) <= 38
  && Number(p.longitude) >= 68 && Number(p.longitude) <= 98;

const adminFetch = (path, options = {}) => {
  const stored = localStorage.getItem('roadguard_admin_auth');
  let token = null;
  try { token = stored ? JSON.parse(stored)?.token : null; } catch { /* Invalid storage is treated as signed out. */ }
  if (!token || token.startsWith('admin-session-')) {
    localStorage.removeItem('roadguard_admin_auth');
    return Promise.reject(new Error('Admin session expired'));
  }
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...options, headers }).then((response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('roadguard_admin_auth');
      window.dispatchEvent(new Event('roadguard-admin-session-expired'));
    }
    return response;
  });
};

export default function App() {
  // Authentication State
  const [adminAuth, setAdminAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('roadguard_admin_auth');
      const auth = stored ? JSON.parse(stored) : null;
      return auth?.token && !auth.token.startsWith('admin-session-') ? auth : null;
    } catch {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [potholes, setPotholes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [potholeActionMessage, setPotholeActionMessage] = useState('');
  const [potholeActionError, setPotholeActionError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionError, setUserActionError] = useState('');

  // Map state
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Login handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('roadguard_admin_auth', JSON.stringify(data));
        setAdminAuth(data);
      } else {
        setLoginError(data.detail || 'Invalid admin credentials.');
      }
    } catch {
      setLoginError('Cannot reach the admin server. Please try again when the server is available.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('roadguard_admin_auth');
    setAdminAuth(null);
  };

  // Load stats & data
  const fetchData = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const [statsRes, potholesRes, usersRes] = await Promise.all([
        adminFetch('/stats').then(r => r.ok ? r.json() : null).catch(() => null),
        adminFetch('/potholes').then(r => r.ok ? r.json() : []).catch(() => []),
        adminFetch('/users').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      if (statsRes) setStats(statsRes);
      if (Array.isArray(potholesRes)) setPotholes(potholesRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    const token = adminAuth?.token;
    if (!token) return undefined;
    let active = true;

    fetchData();
    adminFetch('/session')
      .then((response) => {
        if (!response.ok) throw new Error('Admin session expired');
        return response.json();
      })
      .then((user) => {
        if (!active) return;
        setAdminAuth((current) => {
          if (current?.token !== token) return current;
          const refreshedAuth = { ...current, user };
          localStorage.setItem('roadguard_admin_auth', JSON.stringify(refreshedAuth));
          return refreshedAuth;
        });
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('roadguard_admin_auth');
        setAdminAuth(null);
      });

    return () => { active = false; };
  }, [adminAuth?.token]);

  useEffect(() => {
    if (!selectedPothole) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedPothole(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedPothole]);

  useEffect(() => {
    if (!adminAuth) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchData({ quiet: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [adminAuth?.token]);

  useEffect(() => {
    const handleSessionExpired = () => setAdminAuth(null);
    window.addEventListener('roadguard-admin-session-expired', handleSessionExpired);
    return () => window.removeEventListener('roadguard-admin-session-expired', handleSessionExpired);
  }, []);

  // Create a fresh Leaflet instance when switching between the dashboard and full map.
  useEffect(() => {
    if (activeTab !== 'map' && activeTab !== 'dashboard') return;
    if (!mapContainerRef.current) return undefined;

    const map = L.map(mapContainerRef.current, { center: [20.5937, 78.9629], zoom: 5, zoomControl: true, preferCanvas: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
    }).addTo(map);
    const markers = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersGroupRef.current = markers;
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
    };
  }, [activeTab]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markers = markersGroupRef.current;
    if (!map || !markers) return;
    markers.clearLayers();
    const validPotholes = potholes.filter(isIndiaGps);

    validPotholes.forEach((p) => {
      const color = p.status === 'repaired' ? '#10b981' : p.severity === 'high' ? '#ef4444' : p.severity === 'medium' ? '#f59e0b' : '#0284c7';
      const marker = L.circleMarker([Number(p.latitude), Number(p.longitude)], {
        radius: 9, fillColor: color, color: '#ffffff', weight: 2.5, opacity: 1, fillOpacity: 0.9,
      });
      const safeRoadName = String(p.road_name || 'Road Marker').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
      const safeReporter = String(p.reported_by || 'Unknown user').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
      marker.bindPopup(`<div style="font-size:13px;min-width:180px;padding:4px"><b>${safeRoadName}</b><br>Reported by: ${safeReporter}<br>Severity: ${p.severity}<br>Status: ${p.status}<br>Confidence: ${(Number(p.confidence || 0) * 100).toFixed(0)}%</div>`);
      marker.on('click', () => setSelectedPothole(p));
      markers.addLayer(marker);
    });
    if (validPotholes.length && !map._roadGuardDidFit) {
      const bounds = L.latLngBounds(validPotholes.map((p) => [Number(p.latitude), Number(p.longitude)]));
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      map._roadGuardDidFit = true;
    }
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [potholes, activeTab]);

  useEffect(() => {
    if (!selectedPothole) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedPothole(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedPothole]);

  // Status Updater
  const handleUpdateStatus = async (potholeId, newStatus) => {
    setUpdatingId(potholeId);
    setPotholeActionError('');
    setPotholeActionMessage('');
    try {
      const res = await adminFetch(`/potholes/${potholeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          repaired_notes: actionNotes || undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json().catch(() => ({}));
        setActionNotes('');
        setPotholes(prev => prev.map(p => p.id === potholeId ? { ...p, ...updated, status: newStatus } : p));
        if (selectedPothole && selectedPothole.id === potholeId) {
          setSelectedPothole(prev => ({ ...prev, ...updated, status: newStatus }));
        }
        setPotholeActionMessage(`Report marked ${newStatus}.`);
        adminFetch('/stats').then(r => r.json()).then(setStats).catch(() => {});
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Could not update report (${res.status}).`);
      }
    } catch (e) {
      console.error(e);
      setPotholeActionError(e.message || 'Could not update this report. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // User Role Switcher
  const handleToggleUserRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    setUserActionError('');
    try {
      const res = await adminFetch(`/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      } else {
        const body = await res.json().catch(() => ({}));
        setUserActionError(body.detail || `Could not update user role (${res.status}).`);
      }
    } catch (err) {
      console.error(err);
      setUserActionError(err.message || 'Could not update user role.');
    }
  };

  const handleDeleteUser = async (user) => {
    setUserActionError('');
    if (user.username === adminAuth?.user?.username) {
      setUserActionError('You cannot delete the account currently signed in.');
      return;
    }
    if (!window.confirm(`Delete ${user.full_name || user.username}? Their account, pothole submissions, and generated reports will be permanently removed.`)) return;
    try {
      const response = await adminFetch(`/users/${user.id}`, { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'Could not delete this user.');
      setUsers((previous) => previous.filter((item) => item.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
    } catch (error) {
      setUserActionError(error.message);
    }
  };

  const filteredPotholes = potholes.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSeverity = filterSeverity === 'all' || p.severity === filterSeverity;
    const matchSearch = !searchQuery || (
      (p.road_name && p.road_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.reported_by && p.reported_by.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchStatus && matchSeverity && matchSearch;
  });
  const indiaMappedPotholes = potholes.filter(isIndiaGps);
  const indiaContributors = new Set(indiaMappedPotholes.map((p) => p.user_id || p.reported_by).filter(Boolean)).size;

  // If not authenticated, render Admin Login screen
  if (!adminAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Soft Decorative Ambient Background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

        <div className="w-full max-w-md relative z-10">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl shadow-slate-200/60">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 items-center justify-center shadow-lg shadow-sky-500/30 mb-4 transform transition hover:scale-105">
                <Shield className="w-9 h-9 text-white" />
              </div>
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RoadGuard</h1>
                <span className="text-[11px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md tracking-wider">ADMIN</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Municipal AI Road Condition Monitoring Console
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-70 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Console</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back / Alternate links */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 text-sky-600 hover:text-sky-800 font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Go to User Portal (5173)</span>
              </a>
              <span className="font-mono text-[11px] text-slate-400">Port 8006 / 5175</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-68 border-r border-slate-200/90 bg-white/90 flex flex-col justify-between backdrop-blur-xl shadow-sm z-20">
        <div>
          {/* Logo Brand Header with Glowing Icon */}
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3.5 bg-gradient-to-r from-sky-50/50 to-transparent">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 transform transition hover:scale-105">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">RoadGuard</h1>
                <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded-md">ADMIN</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Smart AI Infrastructure</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 transform translate-x-1'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('potholes')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                activeTab === 'potholes'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 transform translate-x-1'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <AlertTriangle className="w-5 h-5" />
                <span>Pothole Management</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                activeTab === 'potholes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {potholes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                activeTab === 'map'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 transform translate-x-1'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Live Road Map</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 transform translate-x-1'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>User Management</span>
            </button>
          </nav>
        </div>

        {/* Database & Backend Sync Card */}
        <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center space-x-2 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>FastAPI Engine</span>
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">Online</span>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-200/60">
            <span>Linked Database</span>
            <span className="font-mono font-semibold text-slate-700 truncate max-w-[100px]" title="road_monitoring.db">
              road_monitoring.db
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
        {/* Top Header Bar */}
        <header className="h-18 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
              {activeTab === 'dashboard' && 'Municipal Command & Analytics'}
              {activeTab === 'potholes' && 'Potholes Audit & Triage Management'}
              {activeTab === 'map' && 'India Road Pothole Map'}
              {activeTab === 'users' && 'System Access & User Privileges'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Real-time synchronized with field cameras and user submissions</p>
          </div>

          <div className="flex items-center space-x-3">
              <button type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs hover:shadow transition-all duration-200 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md shadow-sky-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>User Web App (5173)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Admin User Profile & Sign Out */}
            <div className="flex items-center pl-3 border-l border-slate-200 space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {adminAuth?.user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {adminAuth?.user?.full_name || 'System Administrator'}
                    </p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1 py-0.2 rounded">ACTIVE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {adminAuth?.user?.username || 'admin'}
                  </p>
                </div>
              </div>

              <button type="button"
                onClick={handleAdminLogout}
                title="Sign out of Admin Console"
                className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 border border-rose-200/60 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Stat Cards Grid - Vibrant Light Neumorphism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Potholes */}
                <div className="light-glass-card p-6 rounded-3xl relative overflow-hidden border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Detections</span>
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mt-3 text-slate-900 tracking-tight">
                    {stats?.summary?.total_potholes ?? potholes.length}
                  </div>
                  <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Synchronized with SQLite</span>
                  </div>
                </div>

                {/* Pending */}
                <div className="light-glass-card p-6 rounded-3xl relative overflow-hidden border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-amber-700 font-bold">Pending Review</span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mt-3 text-amber-600 tracking-tight">
                    {stats?.summary?.pending ?? potholes.filter(p => p.status === 'pending').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting field maintenance inspection</p>
                </div>

                {/* Repaired */}
                <div className="light-glass-card p-6 rounded-3xl relative overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Fixed / Repaired</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mt-3 text-emerald-600 tracking-tight">
                    {stats?.summary?.repaired ?? potholes.filter(p => p.status === 'repaired').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Roads successfully resurfaced</p>
                </div>

                {/* High Severity */}
                <div className="light-glass-card p-6 rounded-3xl relative overflow-hidden border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-rose-700 font-bold">High Severity</span>
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mt-3 text-rose-600 tracking-tight">
                    {stats?.severity_distribution?.high ?? potholes.filter(p => p.severity === 'high').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Critical vehicle hazard zones</p>
                </div>
              </div>

              {/* Map & Severity Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 light-glass-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-base">
                        <MapPin className="w-5 h-5 text-sky-500" />
                        <span>Live GIS Road Network Map</span>
                      </h3>
                      <p className="text-xs text-slate-500">Free OpenStreetMap tiles with GPS geo-coordinates</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 bg-sky-50 px-3 py-1.5 rounded-xl transition hover:bg-sky-100"
                    >
                      <span>Expanded View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[21rem] rounded-2xl overflow-hidden border border-slate-200 z-10 shadow-inner"
                  />
                </div>

                <div className="light-glass-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 flex items-center space-x-2 text-base">
                      <Layers className="w-5 h-5 text-indigo-500" />
                      <span>Severity Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">AI YOLOv8 classification breakdown</p>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                          <span className="text-rose-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> High Severity
                          </span>
                          <span className="text-slate-800 font-mono">
                            {stats?.severity_distribution?.high || 0} Spots
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, ((stats?.severity_distribution?.high || 0) / (stats?.summary?.total_potholes || 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                          <span className="text-amber-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Severity
                          </span>
                          <span className="text-slate-800 font-mono">
                            {stats?.severity_distribution?.medium || 0} Spots
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, ((stats?.severity_distribution?.medium || 0) / (stats?.summary?.total_potholes || 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                          <span className="text-sky-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500"></span> Low / Surface Cracks
                          </span>
                          <span className="text-slate-800 font-mono">
                            {stats?.severity_distribution?.low || 0} Spots
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, ((stats?.severity_distribution?.low || 0) / (stats?.summary?.total_potholes || 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-sky-50/80 border border-indigo-100 text-xs text-indigo-900 mt-6 font-medium">
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Field Synchronization</span>
                    </div>
                    Field camera images are automatically validated and marked with bounding boxes.
                  </div>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="light-glass-card rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Recent Field Reports</h3>
                    <p className="text-xs text-slate-500">Live potholes logged into database</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('potholes')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition"
                  >
                    View All Potholes ({potholes.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-y border-slate-100 font-bold">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Road Name</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Detection Confidence</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {potholes.slice(0, 5).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-600">#{p.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.road_name || 'Highway Point'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                              p.severity === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              p.severity === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-sky-100 text-sky-700 border border-sky-200'
                            }`}>
                              {p.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              p.status === 'repaired' ? 'bg-emerald-100 text-emerald-700' :
                              p.status === 'verified' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">{(p.confidence * 100).toFixed(0)}%</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPothole(p);
                                setActiveTab('potholes');
                              }}
                              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-700 font-bold rounded-xl transition duration-150"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POTHOLE MANAGEMENT */}
          {activeTab === 'potholes' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Search & Filters Toolbar */}
              <div className="light-glass-card p-4 rounded-3xl border border-slate-200/80 bg-white flex flex-wrap gap-4 items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search road name, reporter, or description..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="repaired">Repaired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Table + Detail Drawer */}
              <div className="grid grid-cols-1 gap-6 items-start">
                <div className="light-glass-card rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                        <tr>
                          <th className="py-3 px-4">Road View</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Severity</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Reporter</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredPotholes.map(p => (
                          <tr
                            key={p.id}
                            onClick={() => { setSelectedPothole(p); setActionNotes(''); setPotholeActionMessage(''); setPotholeActionError(''); }}
                            className={`cursor-pointer transition-colors ${
                              selectedPothole?.id === p.id ? 'bg-sky-50/70 border-l-4 border-sky-500' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4">
                              {isVideoPath(p.image_path) ? (
                                <div className="flex h-13 w-13 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sky-600" title="Video report"><Camera className="h-5 w-5" /></div>
                              ) : (
                                <img
                                  src={getImageUrl(p.image_path)}
                                  alt="Uploaded pothole"
                                  className="w-13 h-13 object-cover rounded-xl border border-slate-200 shadow-xs bg-slate-100"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/pothole-placeholder.svg';
                                  }}
                                />
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{p.road_name || 'Highway Section'}</div>
                              <div className="text-xs text-slate-400 font-mono">
                                {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                                p.severity === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                p.severity === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-sky-100 text-sky-700 border border-sky-200'
                              }`}>
                                {p.severity}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                p.status === 'repaired' ? 'bg-emerald-100 text-emerald-700' :
                                p.status === 'verified' ? 'bg-indigo-100 text-indigo-700' :
                                p.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-500">{p.reported_by}</td>
                            <td className="py-3 px-4 text-right">
                              <button type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPothole(p);
                                  setActionNotes('');
                                  setPotholeActionMessage('');
                                  setPotholeActionError('');
                                }}
                                className="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white font-bold rounded-xl transition duration-150"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inspection Drawer */}
                {selectedPothole && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" onClick={() => setSelectedPothole(null)}>
                  <section role="dialog" aria-modal="true" aria-labelledby="pothole-audit-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h4 id="pothole-audit-title" className="font-extrabold text-slate-900 text-lg">Pothole Audit #{selectedPothole.id}</h4>
                        <p className="text-xs text-slate-500 font-medium">{selectedPothole.road_name}</p>
                      </div>
                      <button type="button" aria-label="Close review"
                        onClick={() => setSelectedPothole(null)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Image Viewer */}
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-64 max-h-[58vh] relative shadow-inner">
                        {isVideoPath(selectedPothole.image_path) ? (
                          <video
                            key={selectedPothole.id}
                            src={getImageUrl(selectedPothole.image_path)}
                            aria-label="Uploaded pothole detection video"
                            controls
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 h-full w-full object-contain"
                          >
                            Your browser cannot play this video.
                          </video>
                        ) : (
                          <img
                            src={getImageUrl(selectedPothole.image_path)}
                            alt="User uploaded pothole detection"
                            className="w-full h-full min-h-64 max-h-[58vh] object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/pothole-placeholder.svg';
                            }}
                          />
                        )}
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-xs font-mono font-bold text-sky-700 shadow-sm">
                          Confidence: {(selectedPothole.confidence * 100).toFixed(0)}%
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-4">
                      <div className="text-xs space-y-2.5 text-slate-700">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">GPS Coordinates:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {selectedPothole.latitude?.toFixed(5)}, {selectedPothole.longitude?.toFixed(5)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Current Status:</span>
                          <span className="capitalize font-bold text-sky-600">{selectedPothole.status}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Severity:</span>
                          <span className="capitalize font-bold text-amber-600">{selectedPothole.severity}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Detection Method:</span>
                          <span className="uppercase font-mono font-bold">{selectedPothole.detection_method || 'AI YOLO'}</span>
                        </div>
                      </div>

                      {/* Resolution note */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Admin Resolution Note:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Maintenance crew dispatched to fix this segment..."
                          value={actionNotes}
                          onChange={e => setActionNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <button type="button"
                          onClick={() => handleUpdateStatus(selectedPothole.id, 'verified')}
                          disabled={updatingId === selectedPothole.id}
                          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>

                        <button type="button"
                          onClick={() => handleUpdateStatus(selectedPothole.id, 'repaired')}
                          disabled={updatingId === selectedPothole.id}
                          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Mark Repaired</span>
                        </button>

                        <button type="button"
                          onClick={() => handleUpdateStatus(selectedPothole.id, 'pending')}
                          disabled={updatingId === selectedPothole.id}
                          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-200 text-xs font-bold transition shadow-xs"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Reset Pending</span>
                        </button>

                        <button type="button"
                          onClick={() => handleUpdateStatus(selectedPothole.id, 'rejected')}
                          disabled={updatingId === selectedPothole.id}
                          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject / False</span>
                        </button>
                      </div>
                      {potholeActionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{potholeActionError}</p>}
                      {potholeActionMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{potholeActionMessage}</p>}
                      </div>
                    </div>
                  </section>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FULL MAP */}
          {activeTab === 'map' && (
            <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">India Road Reports</h3>
                  <p className="text-xs text-slate-500">{indiaMappedPotholes.length} mapped reports from {indiaContributors} contributors across India</p>
                </div>
                <div className="flex items-center space-x-4 text-xs font-bold bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>High Risk</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Medium Risk</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                    <span>Low Risk</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Repaired</span>
                  </div>
                </div>
              </div>

              <div
                ref={mapContainerRef}
                className="w-full h-[min(72vh,850px)] min-h-[580px] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative z-0"
              />
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="light-glass-card rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
                <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Registered System Users & Municipal Staff</h3>
                    <p className="text-xs text-slate-500">Manage administrative privileges and user reports history</p>
                  </div>
                  <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full font-bold">
                    Total: {users.length} Users
                  </span>
                </div>
                {userActionError && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{userActionError}</div>}

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Submissions Logged</th>
                        <th className="py-3 px-4 text-right">User Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.full_name || u.username}</div>
                            <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                              u.role === 'admin'
                                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{u.reports_submitted || 0}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => setSelectedUser(u)} className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold">View details</button>
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition duration-200 ${
                                u.role === 'admin'
                                  ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200'
                                  : 'bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 border border-sky-200'
                              }`}
                            >
                              {u.role === 'admin' ? 'Revoke Admin' : 'Make Administrator'}
                            </button>
                            <button type="button" onClick={() => handleDeleteUser(u)} className="text-xs px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setSelectedUser(null)}>
                  <section role="dialog" aria-modal="true" aria-labelledby="user-details-title" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-start justify-between gap-4">
                      <div><h3 id="user-details-title" className="text-lg font-extrabold text-slate-900">User details</h3><p className="mt-1 text-sm text-slate-500">Account information and submissions</p></div>
                      <button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" aria-label="Close details">Close</button>
                    </div>
                    <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      {[['Full name', selectedUser.full_name || 'Not provided'], ['Username', `@${selectedUser.username}`], ['Email', selectedUser.email], ['Role', selectedUser.role], ['Account status', selectedUser.is_active ? 'Active' : 'Disabled'], ['Pothole submissions', selectedUser.reports_submitted || 0], ['Joined', selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'Unknown']].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd></div>)}
                    </dl>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
