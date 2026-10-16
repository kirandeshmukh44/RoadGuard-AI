import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  MapPin,
  BarChart3,
  Bell,
  Smartphone,
  Shield,
  Target,
  Zap,
  Road,
  Radio,
  Camera,
  Brain,
  Map as MapIcon,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const Home = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Bot,
      title: 'AI Detection',
      description: 'Advanced YOLO neural network detects potholes with 95%+ accuracy',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: MapPin,
      title: 'GPS Mapping',
      description: 'Real-time location tracking with interactive OpenStreetMap',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive statistics and road condition analytics',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Instant notifications for high-severity road damage',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Fully responsive design for mobile, tablet, and desktop',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      icon: Shield,
      title: 'Secure System',
      description: 'Role-based authentication and data protection',
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600'
    }
  ];

  const stats = [
    { number: '95%', label: 'Detection Accuracy', icon: Target },
    { number: '2s', label: 'Analysis Time', icon: Zap },
    { number: '500+', label: 'Roads Monitored', icon: Road },
    { number: '24/7', label: 'Real-time Updates', icon: Radio }
  ];

  const steps = [
    {
      step: '01',
      icon: Camera,
      title: 'Upload Image',
      description: 'Capture or upload road damage photos',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      step: '02',
      icon: Brain,
      title: 'AI Analysis',
      description: 'YOLO model analyzes and detects potholes',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      step: '03',
      icon: MapIcon,
      title: 'GPS Tagging',
      description: 'Automatic location mapping and categorization',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      step: '04',
      icon: FileText,
      title: 'Report & Track',
      description: 'Generate reports and monitor repair status',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 text-sm font-medium">AI-Powered Road Monitoring</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                Smart Road
              </span>
              <br />
              <span className="text-gray-900">Infrastructure</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Monitoring System
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-10"
            >
              Empowering cities with AI-driven pothole detection, real-time GPS mapping,
              and automated road condition analytics for safer infrastructure.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all"
              >
                How It Works
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <stat.icon className="w-8 h-8 text-blue-500 mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for intelligent road infrastructure monitoring
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all hover:border-blue-300 hover:-translate-y-1"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple 4-step process to detect and report road damage
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 h-full shadow-sm hover:shadow-md transition-all">
                  <div className={`w-14 h-14 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6`}>
                    <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                  </div>
                  <div className="text-blue-600 font-bold text-sm mb-2">{step.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Detection Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                AI-Powered Detection
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our advanced YOLO neural network analyzes road images in real-time,
                detecting potholes with 95%+ accuracy and classifying severity levels.
              </p>
              <ul className="space-y-4">
                {[
                  'Real-time image analysis',
                  'Automatic severity classification',
                  'GPS coordinate tagging',
                  'Duplicate detection system',
                  'Instant report generation'
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-purple-100 border border-gray-200 rounded-3xl p-8 shadow-lg">
                <div className="aspect-video bg-white rounded-2xl flex items-center justify-center mb-6 overflow-hidden shadow-sm">
                  <div className="text-center">
                    <Bot className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                    <div className="text-gray-500 font-medium">AI Detection Preview</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-gray-500 text-sm">Accuracy</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">2s</div>
                    <div className="text-gray-500 text-sm">Analysis</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">3</div>
                    <div className="text-gray-500 text-sm">Severity</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-blue-100 via-cyan-100 to-purple-100 border border-gray-200 rounded-3xl p-12 shadow-lg">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ready to Monitor Your Roads?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of municipalities using AI for smart infrastructure management
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-800 font-bold text-xl">RoadGuard AI</span>
          </div>
          <p className="text-gray-500">
            © 2024 RoadGuard AI. Smart Infrastructure Monitoring System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
