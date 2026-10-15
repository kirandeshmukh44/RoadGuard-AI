import { useState, useEffect } from 'react';
import { potholeAPI } from '../api';
import { motion } from 'framer-motion';

const History = () => {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPotholes();
  }, []);

  const fetchPotholes = async () => {
    try {
      const response = await potholeAPI.getMyPotholes();
      setPotholes(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPotholes = potholes.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-cyan-400"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-gradient">Detection History</h1>
        <p className="text-gray-400">View all your pothole detections and reports</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center"
      >
        <span className="text-gray-400">Filter by status:</span>
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
        <div className="ml-auto text-gray-400">
          Showing {filteredPotholes.length} of {potholes.length} records
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        {filteredPotholes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg">No detection history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-cyan-400">
                  <th>ID</th>
                  <th>Road</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPotholes.map((pothole) => (
                  <tr key={pothole.id} className="hover:bg-white/5">
                    <td>#{pothole.id}</td>
                    <td>{pothole.road_name || 'Unknown'}</td>
                    <td className="text-sm">
                      {pothole.latitude.toFixed(4)}, {pothole.longitude.toFixed(4)}
                    </td>
                    <td>
                      <span className={`badge ${
                        pothole.severity === 'high' ? 'badge-error' :
                        pothole.severity === 'medium' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {pothole.severity}
                      </span>
                    </td>
                    <td>{(pothole.confidence * 100).toFixed(1)}%</td>
                    <td>
                      <span className={`badge badge-outline ${
                        pothole.status === 'repaired' ? 'text-success' :
                        pothole.status === 'verified' ? 'text-info' : ''
                      }`}>
                        {pothole.status}
                      </span>
                    </td>
                    <td>{new Date(pothole.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default History;
