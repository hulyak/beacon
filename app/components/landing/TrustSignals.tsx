'use client';

import { motion } from 'framer-motion';

const stats = [
  {
    value: '10x',
    label: 'Faster Detection',
    description: 'Identify supply chain risks before they impact operations',
    icon: '⚡',
    color: 'cyan',
  },
  {
    value: '50x',
    label: 'Faster Response',
    description: 'Autonomous strategy generation and execution',
    icon: '🚀',
    color: 'emerald',
  },
  {
    value: '99.9%',
    label: 'Uptime',
    description: 'Enterprise-grade reliability for critical operations',
    icon: '🛡️',
    color: 'green',
  },
  {
    value: '24/7',
    label: 'Monitoring',
    description: 'Continuous AI surveillance of your supply chain',
    icon: '👁️',
    color: 'orange',
  },
];

const techPartners = [
  { name: 'ElevenLabs', logo: '🎙️', description: 'Voice AI' },
  { name: 'Google Cloud', logo: '☁️', description: 'Infrastructure' },
  { name: 'Gemini 2.5', logo: '✨', description: 'AI Intelligence' },
  { name: 'Vertex AI', logo: '🧠', description: 'ML Platform' },
];

export function TrustSignals() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Enterprise Leaders
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Built with cutting-edge AI technology to deliver measurable results for your supply chain operations.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center transition-all duration-300 group-hover:border-gray-300 group-hover:shadow-lg">
                {/* Icon */}
                <div className="text-4xl mb-3">{stat.icon}</div>

                {/* Value */}
                <div className={`text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r ${
                  stat.color === 'cyan' ? 'from-cyan-500 to-blue-600' :
                  stat.color === 'emerald' ? 'from-emerald-500 to-teal-600' :
                  stat.color === 'green' ? 'from-green-500 to-emerald-600' :
                  'from-orange-500 to-red-600'
                } bg-clip-text text-transparent`}>
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-gray-900 font-semibold mb-1">{stat.label}</div>

                {/* Description */}
                <p className="text-gray-500 text-sm">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech Partners */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm mb-6 uppercase tracking-wider">Powered By</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {techPartners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm"
              >
                <span className="text-2xl">{partner.logo}</span>
                <div className="text-left">
                  <div className="text-gray-900 font-medium">{partner.name}</div>
                  <div className="text-gray-500 text-xs">{partner.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Hackathon Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full">
            <span className="text-2xl">🏆</span>
            <div className="text-left">
              <div className="text-gray-900 font-medium">AI Partner Catalyst Hackathon</div>
              <div className="text-emerald-600 text-sm">ElevenLabs + Google Cloud Challenge</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
