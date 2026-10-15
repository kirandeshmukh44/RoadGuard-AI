import { motion } from 'framer-motion';

const HowItWorks = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const steps = [
    {
      step: '01',
      icon: '📸',
      title: 'Image Upload',
      description: 'Users upload road images through our mobile-friendly interface',
      details: ['Take photo with camera', 'Upload from gallery', 'Auto GPS capture'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '02',
      icon: '🤖',
      title: 'AI Detection',
      description: 'YOLO deep learning model analyzes images with high accuracy',
      details: ['YOLO v8/v9 model', 'Real-time inference', 'Confidence scoring'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: '03',
      icon: '📊',
      title: 'Severity Classification',
      description: 'Potholes classified as Low, Medium, or High severity',
      details: ['Low: Minor damage', 'Medium: Moderate damage', 'High: Critical damage'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: '04',
      icon: '📍',
      title: 'GPS Location',
      description: 'Captures and maps exact location of detected potholes',
      details: ['Auto GPS from device', 'Manual location entry', 'Road name association'],
      color: 'from-orange-500 to-red-500'
    },
    {
      step: '05',
      icon: '🔄',
      title: 'Duplicate Check',
      description: 'Smart algorithms prevent duplicate reporting',
      details: ['Distance-based matching', 'Image similarity check', 'Reference linking'],
      color: 'from-indigo-500 to-blue-500'
    },
    {
      step: '06',
      icon: '📄',
      title: 'Report Generation',
      description: 'Automatic PDF reports for high-severity potholes',
      details: ['Auto PDF generation', 'Include images & data', 'Downloadable reports'],
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  const architecture = [
    {
      icon: '📱',
      title: 'Frontend',
      tech: 'React + Tailwind',
      description: 'Modern, responsive user interface'
    },
    {
      icon: '⚙️',
      title: 'Backend API',
      tech: 'FastAPI + Python',
      description: 'High-performance REST API'
    },
    {
      icon: '🧠',
      title: 'AI Model',
      tech: 'YOLO + PyTorch',
      description: 'Advanced object detection'
    }
  ];

  const userRoles = [
    {
      icon: '👤',
      title: 'For Citizens',
      features: [
        'Upload road images for AI analysis',
        'View interactive road condition maps',
        'Track report status and repair progress',
        'Download generated reports'
      ]
    },
    {
      icon: '👨‍💼',
      title: 'For Administrators',
      features: [
        'View comprehensive dashboard statistics',
        'Manage and verify pothole reports',
        'Update repair status and priorities',
        'Access analytics and trend reports'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto text-center mb-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-full mb-6"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-blue-600 text-sm font-medium">Workflow Overview</span>
        </motion.div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
            How It Works
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Understanding our AI-powered pothole detection system from image upload to report generation
        </p>
      </motion.div>

      {/* Steps Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-20"
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              variants={fadeInUp}
              className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all hover:border-blue-300 hover:transform hover:scale-105 relative"
            >
              <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {step.step}
              </div>

              <div className="text-5xl mb-6 mt-4">{step.icon}</div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 mb-6">{step.description}</p>

              <ul className="space-y-2">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Architecture Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">System Architecture</h2>

        <div className="bg-gradient-to-r from-blue-100 via-cyan-100 to-purple-100 border border-gray-200 rounded-3xl p-12 shadow-lg">
          <div className="grid md:grid-cols-3 gap-8">
            {architecture.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-4 hover:shadow-md transition-all">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{item.tech}</p>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {index < architecture.length - 1 && (
                  <div className="hidden md:block text-center text-3xl text-blue-500">↓</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* User Roles Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">User Roles</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {userRoles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all"
            >
              <div className="text-5xl mb-6">{role.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{role.title}</h3>
              <ul className="space-y-4">
                {role.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default HowItWorks;
