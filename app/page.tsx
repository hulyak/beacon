'use client';

import { useRef } from 'react';
import { HeroSection, CommandCenter, AgentCapabilities, InteractiveDemo, HowItWorks, StatsHighlights } from './components/landing';
import { FeatureCards } from './components/landing/FeatureCards';
import { TrustSignals } from './components/landing/TrustSignals';
import { Mic, ExternalLink, Facebook, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const commandCenterRef = useRef<HTMLDivElement>(null);

  const handleTryDemo = () => {
    commandCenterRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection onTryDemo={handleTryDemo} />

      {/* Feature Cards */}
      <FeatureCards />

      {/* How It Works - 4 Step Process */}
      <HowItWorks />

      {/* Command Center */}
      <div ref={commandCenterRef}>
        <CommandCenter />
      </div>

      {/* Stats Highlights */}
      <StatsHighlights />

      {/* Agent Capabilities */}
      <AgentCapabilities />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Trust Signals */}
      <TrustSignals />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience the power of voice-controlled supply chain intelligence. Start speaking to your data today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
            >
              <Mic className="w-5 h-5" />
              Launch Voice Dashboard
            </Link>

            <Link
              href="/scenarios"
              className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm"
            >
              <ExternalLink className="w-5 h-5" />
              Explore Scenarios
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Beacon</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                AI-powered optimization and predictive risk management for resilient supply chains.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Facebook className="w-4 h-4 text-gray-600" />
                </a>
                <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Instagram className="w-4 h-4 text-gray-600" />
                </a>
                <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Linkedin className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            </div>

            {/* Pages */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Pages</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-500 hover:text-cyan-600 text-sm transition-colors">Home</Link></li>
                <li><Link href="/dashboard" className="text-gray-500 hover:text-cyan-600 text-sm transition-colors">Dashboard</Link></li>
                <li><Link href="/scenarios" className="text-gray-500 hover:text-cyan-600 text-sm transition-colors">Scenarios</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-500 text-sm">Digital Twin</span></li>
                <li><span className="text-gray-500 text-sm">Risk Analysis</span></li>
                <li><span className="text-gray-500 text-sm">Voice Control</span></li>
                <li><span className="text-gray-500 text-sm">AI Strategies</span></li>
              </ul>
            </div>

            {/* Built With */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Built With</h4>
              <div className="flex flex-wrap gap-2">
                {['ElevenLabs', 'Google Cloud', 'Gemini AI', 'Next.js'].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              {/* Hackathon Badge */}
              <div className="mt-4 px-3 py-2 bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200 rounded-lg">
                <p className="text-xs text-gray-500">Built for</p>
                <p className="text-sm text-cyan-600 font-medium">AI Partner Catalyst</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Beacon. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                99.9% Uptime
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">24/7 Support</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
