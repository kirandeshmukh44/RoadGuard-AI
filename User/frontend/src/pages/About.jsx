import { motion } from 'framer-motion';

const About = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const techStack = [
    {
      icon: '🤖',
      name: 'YOLO AI',
      description: 'Advanced object detection for pothole identification',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🗺️',
      name: 'OpenStreetMap',
      description: 'Interactive GPS mapping and visualization',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '⚡',
      name: 'FastAPI',
      description: 'High-performance Python backend',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '⚛️',
      name: 'React',
      description: 'Modern frontend with real-time updates',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🎨',
      name: 'Tailwind CSS',
      description: 'Beautiful responsive design system',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: '🔒',
      name: 'JWT Auth',
      description: 'Secure authentication and authorization',
      color: 'from-slate-500 to-gray-500'
    }
  ];

  const benefits = [
    {
      icon: '⏱️',
      title: '80% Time Savings',
      description: 'Automated detection reduces manual inspection time'
    },
    {
      icon: '💰',
      title: 'Cost Effective',
      description: 'Early detection prevents expensive road damage'
    },
    {
      icon: '📊',
      title: 'Data Driven',
      description: 'Comprehensive analytics for informed decisions'
    },
    {
      icon: '🛡️',
      title: 'Public Safety',
      description: 'Faster repairs mean safer roads for everyone'
    },
    {
      icon: '🌐',
      title: 'Scalable',
      description: 'Deploy across entire cities and regions'
    },
    {
      icon: '👥',
      title: 'User Friendly',
      description: 'Intuitive interface for all users'
    }
  ];

  const stats = [
    { number: '95%', label: 'Detection Accuracy', icon: '🎯' },
    { number: '<2s', label: 'Processing Time', icon: '⚡' },
    { number: '24/7', label: 'Availability', icon: '📡' },
    { number: '100%', label: 'Free to Use', icon: '🆓' }
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
          <span className="text-blue-600 text-sm font-medium">About RoadGuard AI</span>
        </motion.div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
            Smart Infrastructure
          </span>
          <br />
          <span className="text-gray-900">Monitoring System</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          An AI-powered solution revolutionizing road maintenance through cutting-edge
          computer vision and real-time data processing.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-20"
      >
        <div className="bg-gradient-to-r from-blue-100 via-cyan-100 to-purple-100 border border-gray-200 rounded-3xl p-12 shadow-lg">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                To revolutionize road maintenance through cutting-edge artificial intelligence
                and computer vision technology. Our system automatically detects and classifies
                potholes, enabling timely repairs and safer roads for communities.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                By leveraging deep learning models and real-time data processing, we provide
                municipalities and road authorities with actionable insights to prioritize
                maintenance efforts and allocate resources efficiently.
              </p>
            </div>
            <div className="text-center">
              <div className="text-9xl mb-4">🎯</div>
              <div className="text-2xl font-bold text-gray-900">Making Roads Safer</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technology Stack */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Technology Stack</h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {techStack.map((tech, index) => (
            <motion.div
              key={tech.name}
              variants={fadeInUp}
              className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all hover:border-blue-300 hover:transform hover:scale-105"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                {tech.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{tech.name}</h3>
              <p className="text-gray-600">{tech.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Key Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Key Benefits</h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              variants={fadeInUp}
              className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all hover:border-blue-300"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-gradient-to-r from-blue-100 via-cyan-100 to-purple-100 border border-gray-200 rounded-3xl p-12 shadow-lg">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Impact & Statistics</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl mb-4">{stat.icon}</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
