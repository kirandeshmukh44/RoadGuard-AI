import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { potholeAPI } from '../api';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const RoadMap = () => {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  useEffect(() => {
    fetchPotholes();
  }, []);

  const fetchPotholes = async () => {
    try {
      const response = await potholeAPI.getAll({ limit: 1000 });
      setPotholes(response.data);
    } catch (error) {
      console.error('Error fetching potholes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPotholes = potholes.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  }).filter(p => {
    if (selectedSeverity === 'all') return true;
    return p.severity === selectedSeverity;
  });

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
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
    high: potholes.filter(p => p.severity === 'high').length,
    medium: potholes.filter(p => p.severity === 'medium').length,
    low: potholes.filter(p => p.severity === 'low').length,
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
        <h1 className="text-5xl font-bold mb-4 text-gradient">Road Condition Map</h1>
        <p className="text-xl text-gray-300">
          Interactive map showing detected potholes across the region
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
          <div className="stat-value text-cyan-400 text-3xl">{potholes.length}</div>
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
        <div className="ml-auto text-gray-400">
          Showing {filteredPotholes.length} of {potholes.length} potholes
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
        style={{ height: '600px' }}
      >
        <MapContainer
          center={[20.5937, 78.9629]} // Default to India center
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredPotholes.map((pothole) => (
            <CircleMarker
              key={pothole.id}
              center={[pothole.latitude, pothole.longitude]}
              radius={getMarkerRadius(pothole.severity)}
              pathOptions={{
                color: getMarkerColor(pothole.severity),
                fillColor: getMarkerColor(pothole.severity),
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div className="text-navy-900 p-2">
                  <h3 className="font-bold text-lg">Pothole #{pothole.id}</h3>
                  <p className="text-sm"><strong>Road:</strong> {pothole.road_name || 'Unknown'}</p>
                  <p className="text-sm"><strong>Severity:</strong> 
                    <span className={`ml-1 px-2 py-0.5 rounded text-white text-xs ${
                      pothole.severity === 'high' ? 'bg-error' :
                      pothole.severity === 'medium' ? 'bg-warning' : 'bg-success'
                    }`}>
                      {pothole.severity.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm"><strong>Confidence:</strong> {(pothole.confidence * 100).toFixed(1)}%</p>
                  <p className="text-sm"><strong>Status:</strong> {pothole.status.toUpperCase()}</p>
                  <p className="text-sm"><strong>Detected:</strong> {new Date(pothole.created_at).toLocaleDateString()}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </motion.div>

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
            <div className="w-4 h-4 rounded-full bg-error"></div>
            <span className="text-gray-300">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning"></div>
            <span className="text-gray-300">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success"></div>
            <span className="text-gray-300">Low Severity</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadMap;
