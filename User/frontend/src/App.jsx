import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { PWAComponents } from './components/PWAComponents';
import { motion, AnimatePresence } from 'framer-motion';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const RoadMap = lazy(() => import('./pages/RoadMap'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Detect = lazy(() => import('./pages/Detect'));
const Report = lazy(() => import('./pages/Report'));
const MyReports = lazy(() => import('./pages/MyReports'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));

const PageLoading = () => (
  <div className="flex min-h-[55vh] items-center justify-center" role="status" aria-label="Loading page">
    <span className="loading loading-spinner loading-lg text-primary" />
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-cyan-400"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  return (
    <div className="app-shell">
      <Navbar />
      <PWAComponents />
      <main className="page-container page-content py-8 sm:py-10">
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />
            <Route path="/map" element={<PageTransition><RoadMap /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition><Dashboard /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/detect"
              element={
                <ProtectedRoute>
                  <PageTransition><Detect /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <PageTransition><Report /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute>
                  <PageTransition><MyReports /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <PageTransition><History /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition><Profile /></PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      <footer className="app-footer mt-16">
        <div className="page-container flex flex-col gap-6 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold tracking-tight">RoadGuard AI</p><p className="mt-1 text-sm text-white/65">AI-assisted road condition monitoring</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            <Link to="/about" className="hover:text-white">About</Link><Link to="/how-it-works" className="hover:text-white">How it works</Link><Link to="/map" className="hover:text-white">Road map</Link>
          </nav>
          <p className="text-xs text-white/50">Built for safer streets</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
