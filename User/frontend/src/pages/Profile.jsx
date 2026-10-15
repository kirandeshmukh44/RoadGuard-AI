import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // In a real app, this would call an API to update user info
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || ''
    });
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-gradient">Profile</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-cyan-400 text-navy-900 font-bold text-4xl flex items-center justify-center">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.full_name || user?.username}</h2>
              <p className="text-cyan-400">@{user?.username}</p>
              <span className={`badge badge-sm mt-2 ${
                user?.role === 'admin' ? 'badge-warning' : 'badge-info'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">Username</span>
              <span className="text-white font-semibold">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">Email</span>
              <span className="text-white font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">Role</span>
              <span className="text-white font-semibold capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">Account Status</span>
              <span className="text-success font-semibold">Active</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white font-semibold">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 text-cyan-400">Account Actions</h3>
            <div className="space-y-3">
              <button className="btn btn-outline text-cyan-400 hover:bg-cyan-400 hover:text-navy-900 border-cyan-400 w-full">
                Change Password
              </button>
              <button className="btn btn-outline text-cyan-400 hover:bg-cyan-400 hover:text-navy-900 border-cyan-400 w-full">
                Update Email
              </button>
              <button
                onClick={logout}
                className="btn btn-error w-full"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 text-cyan-400">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat glass-card rounded-xl p-4">
                <div className="stat-title text-gray-400 text-sm">Reports</div>
                <div className="stat-value text-cyan-400 text-2xl">-</div>
              </div>
              <div className="stat glass-card rounded-xl p-4">
                <div className="stat-title text-gray-400 text-sm">Detections</div>
                <div className="stat-value text-cyan-400 text-2xl">-</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
