import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import { potholeAPI } from '../api';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const isIndiaGps = (p) => Number(p.latitude) >= 6 && Number(p.latitude) <= 38
  && Number(p.longitude) >= 68 && Number(p.longitude) <= 98;

const distanceKm = (first, second) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDifference = radians(second.latitude - first.latitude);
  const lonDifference = radians(second.longitude - first.longitude);
  const value = Math.sin(latDifference / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(lonDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const FitPotholeBounds = ({ potholes, userLocation }) => {
  const map = useMap();
  const bounds = useMemo(() => potholes
    .filter(isIndiaGps)
    .map((p) => [Number(p.latitude), Number(p.longitude)])
    .concat(userLocation ? [[userLocation.latitude, userLocation.longitude]] : []), [potholes, userLocation]);

  useEffect(() => {
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    else if (userLocation) map.setView([userLocation.latitude, userLocation.longitude], 12);
    else if (bounds.length === 1) map.setView(bounds[0], 12);
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map, bounds]);
  return null;
};

const RoadMap = () => {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchPotholes();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchPotholes({ quiet: true });
    }, 120_000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchPotholes = async ({ quiet = false } = {}) => {
    try {
      const response = await potholeAPI.getAll({ limit: 1000 });
      setPotholes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching potholes:', error);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const indiaPotholes = useMemo(() => potholes.filter(isIndiaGps), [potholes]);
  const filteredPotholes = useMemo(() => indiaPotholes.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (selectedSeverity !== 'all' && p.severity !== selectedSeverity) return false;
    if (nearMeEnabled && userLocation && distanceKm(userLocation, { latitude: Number(p.latitude), longitude: Number(p.longitude) }) > 25) return false;
    return true;
  }), [indiaPotholes, filter, selectedSeverity, nearMeEnabled, userLocation]);

  const showNearbyPotholes = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setNearMeEnabled(true);
      },
      () => setLocationError('Could not get your location. Allow location access and try again.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  };

  const getMarkerColor = (pothole) => {
    if (pothole.status === 'repaired') return '#10b981';
    if (pothole.severity === 'high') return '#ef4444';
    if (pothole.severity === 'medium') return '#f59e0b';
    return '#2563eb';
  };

  const getMarkerRadius = (severity) => {
    switch (severity) {
      case 'high': return 15;
      case 'medium': return 12;
      case 'low': return 10;
      default: return 8;
    }
  };

  const severityCounts = {
    high: indiaPotholes.filter(p => p.severity === 'high').length,
    medium: indiaPotholes.filter(p => p.severity === 'medium').length,
    low: indiaPotholes.filter(p => p.severity === 'low').length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-cyan-400"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
          <h1 className="text-5xl font-bold mb-4 text-gradient">{nearMeEnabled ? 'Potholes Near You' : 'India Road Condition Map'}</h1>
        <p className="text-xl text-gray-300">
          Shared GPS reports from users across India. Choose “Near me” to check roads within 25 km.
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="stat glass-card rounded-xl p-4">
          <div className="stat-title text-gray-400">Total</div>
          <div className="stat-value text-cyan-400 text-3xl">{indiaPotholes.length}</div>
        </div>
        <div className="stat glass-card rounded-xl p-4">
          <div className="stat-title text-gray-400">High Severity</div>
          <div className="stat-value text-error text-3xl">{severityCounts.high}</div>
        </div>
        <div className="stat glass-card rounded-xl p-4">
          <div className="stat-title text-gray-400">Medium</div>
          <div className="stat-value text-warning text-3xl">{severityCounts.medium}</div>
        </div>
        <div className="stat glass-card rounded-xl p-4">
          <div className="stat-title text-gray-400">Low</div>
          <div className="stat-value text-success text-3xl">{severityCounts.low}</div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Status:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select select-bordered bg-navy-800 border-cyan-400/30 text-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="repaired">Repaired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="select select-bordered bg-navy-800 border-cyan-400/30 text-white"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-gray-400">
          <span>Showing {filteredPotholes.length} of {indiaPotholes.length} India reports{nearMeEnabled ? ' within 25 km' : ''}</span>
          {!nearMeEnabled ? <button type="button" onClick={showNearbyPotholes} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700">Near me</button>
            : <button type="button" onClick={() => { setNearMeEnabled(false); setUserLocation(null); setLocationError(''); }} className="rounded-lg border border-cyan-400/30 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-white/5">Show all India</button>}
          <button type="button" onClick={() => fetchPotholes()} className="rounded-lg border border-cyan-400/30 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-white/5">Refresh map</button>
        </div>
      </motion.div>
      {locationError && <p role="alert" className="-mt-4 text-sm text-amber-300">{locationError}</p>}

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
        style={{ height: '600px' }}
      >
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitPotholeBounds potholes={filteredPotholes} userLocation={userLocation} />
          {userLocation && <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={10} pathOptions={{ color: '#ffffff', fillColor: '#7c3aed', fillOpacity: 1, weight: 3 }}><Popup>Your current location</Popup></CircleMarker>}
          {filteredPotholes.map((pothole) => (
            <CircleMarker
              key={pothole.id}
              center={[pothole.latitude, pothole.longitude]}
              radius={getMarkerRadius(pothole.severity)}
              pathOptions={{
                color: '#ffffff',
                fillColor: getMarkerColor(pothole),
                fillOpacity: 0.9,
                weight: 2.5
              }}
            >
              <Popup>
                <div className="text-navy-900 p-2">
                  <h3 className="font-bold text-lg">Pothole #{pothole.id}</h3>
                  <p className="text-sm"><strong>Road:</strong> {pothole.road_name || 'Unknown'}</p>
                  <p className="text-sm"><strong>Severity:</strong> 
                    <span className="ml-1 rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: getMarkerColor(pothole) }}>
                      {pothole.severity.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm"><strong>Confidence:</strong> {(pothole.confidence * 100).toFixed(1)}%</p>
                  <p className="text-sm"><strong>Status:</strong> {pothole.status.toUpperCase()}</p>
                  <p className="text-sm"><strong>Reported by:</strong> {pothole.reported_by || `User #${pothole.user_id || 'unknown'}`}</p>
                  <p className="text-sm"><strong>Detected:</strong> {new Date(pothole.created_at).toLocaleDateString()}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </motion.div>
      {filteredPotholes.length === 0 && <div className="-mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-center text-sm text-gray-300">No potholes with GPS coordinates match these filters yet.</div>}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-4"
      >
        <h3 className="font-bold text-cyan-400 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-300">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-gray-300">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span className="text-gray-300">Low Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span className="text-gray-300">Repaired</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadMap;
