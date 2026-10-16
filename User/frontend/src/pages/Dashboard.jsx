import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { potholeAPI } from '../api';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Wrench,
  Search,
  FileText,
  Map,
  FolderOpen,
  TrendingUp,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    repaired: 0
  });
  const [recentPotholes, setRecentPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await potholeAPI.getMyPotholes();
      const potholes = response.data;

      setStats({
        total: potholes.length,
        pending: potholes.filter(p => p.status === 'pending').length,
        verified: potholes.filter(p => p.status === 'verified').length,
        repaired: potholes.filter(p => p.status === 'repaired').length
      });

      setRecentPotholes(potholes.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadError('Could not load your report statistics. You can still use the dashboard and try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const quickActions = [
    {
      icon: Search,
      title: 'Detect Potholes',
      description: 'Upload images for AI-powered detection',
      link: '/detect',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'Report Pothole',
      description: 'Submit manual road damage reports',
      link: '/report',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Map,
      title: 'View Map',
      description: 'Interactive road condition map',
      link: '/map',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: FolderOpen,
      title: 'My Reports',
      description: 'View all your submitted reports',
      link: '/my-reports',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <div role="status" className="mb-4 text-sm text-slate-500">Loading your report statistics…</div>}
        {loadError && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{loadError}</div>}
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Kiran! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your road reports today.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'Total Reports', value: stats.total, icon: BarChart3, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
            { label: 'Verified', value: stats.verified, icon: CheckCircle2, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', iconColor: 'text-green-600' },
            { label: 'Repaired', value: stats.repaired, icon: Wrench, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-blue-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${stat.color} text-white`}>
                  {stat.value}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                variants={fadeInUp}
              >
                <Link
                  to={action.link}
                  className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:border-blue-200 hover:-translate-y-1 group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${action.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-7 h-7 ${action.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Reports</h3>
            <Link to="/my-reports" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {recentPotholes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentPotholes.map((pothole, index) => (
                  <motion.div
                    key={pothole.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{pothole.road_name || 'Unknown Road'}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {new Date(pothole.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500 capitalize">{pothole.severity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pothole.status === 'repaired' ? 'bg-green-100 text-green-700' :
                          pothole.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {pothole.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No reports yet. Start by detecting potholes!</p>
                <Link
                  to="/detect"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  <Search className="w-5 h-5" />
                  Start Detecting
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
