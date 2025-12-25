'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

// Priority alerts that Beacon will proactively announce
interface ProactiveAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  spokenMessage: string;
  timestamp: Date;
  dismissed: boolean;
}

// Sample proactive alerts for demo
const DEMO_ALERTS: Omit<ProactiveAlert, 'id' | 'timestamp' | 'dismissed'>[] = [
  {
    type: 'critical',
    message: 'Port delay detected at Shanghai',
    spokenMessage: 'Alert! I\'ve detected a 48-hour delay at Shanghai port affecting 12 shipments. Would you like me to analyze the impact or suggest alternative routes?'
  },
  {
    type: 'warning',
    message: 'Risk score increased in Los Angeles',
    spokenMessage: 'Heads up. The risk score for your Los Angeles warehouse has increased to 75%. This may affect delivery timelines. Say "analyze impact" to learn more.'
  },
  {
    type: 'success',
    message: 'Scenario simulation completed',
    spokenMessage: 'Great news! Your Monte Carlo simulation completed with 1,000 iterations. The results show a 92% confidence in the predicted outcomes. Would you like me to summarize the findings?'
  },
  {
    type: 'info',
    message: 'Sustainability goal achieved',
    spokenMessage: 'Congratulations! You\'ve achieved your Q4 carbon reduction target with a 15% reduction in emissions. Say "show sustainability report" for details.'
  }
];

// Voice tour script
export const VOICE_TOUR_SCRIPT = {
  welcome: "Welcome to Beacon, your AI-powered supply chain intelligence platform. I can help you analyze risks, run scenarios, and optimize your supply chain using just your voice. Try saying 'analyze risks in Asia' or 'what's the current health of my supply chain?'",

  dashboard: "This is your main dashboard. Here you can see your global supply chain on the 3D map, real-time KPIs, and active alerts. Ask me to 'show critical alerts' or 'analyze regional risks' to get started.",

  digitalTwin: "The Digital Twin page lets you create a virtual replica of your supply chain. You can drag nodes to reorganize, run simulations, and test scenarios. Try saying 'run a port closure scenario' to see how your network would respond.",

  analytics: "The Analytics page shows detailed performance metrics and trends. Ask me to 'show trend analysis' or 'compare last quarter' to dive into your data.",

  scenarios: "On this page, you can run what-if scenarios to test your supply chain resilience. Try 'simulate a demand surge' or 'test supplier failure' to see potential impacts.",

  capabilities: [
    "I can analyze risks across all your regions - just say 'analyze risks in Asia' or 'what are the risks in Europe?'",
    "I can run scenario simulations - try 'run port closure scenario' or 'simulate supplier failure'",
    "I can explain my reasoning - ask 'why do you recommend this?' or 'explain your analysis'",
    "I can track sustainability - say 'show carbon footprint' or 'find green alternatives'",
    "I can calculate financial impact - try 'what's the financial impact?' or 'calculate delay costs'",
    "I can help you navigate - say 'go to analytics' or 'open digital twin'"
  ]
};

// Quick demo commands for judges to try
export const DEMO_COMMANDS = [
  {
    category: 'Risk Analysis',
    commands: [
      { voice: 'Analyze risks in Asia', description: 'AI-powered regional risk assessment' },
      { voice: 'What suppliers are at risk?', description: 'Identify vulnerable suppliers' },
      { voice: 'Show me the supply chain health', description: 'Overall health dashboard' },
      { voice: 'Scan for anomalies', description: 'Detect unusual patterns' }
    ]
  },
  {
    category: 'Scenario Planning',
    commands: [
      { voice: 'Run port closure scenario', description: 'Simulate Shanghai port closure' },
      { voice: 'What if there\'s a demand surge?', description: 'Test 50% demand increase' },
      { voice: 'Test supplier failure', description: 'Key supplier goes offline' },
      { voice: 'Run Monte Carlo simulation', description: '1000 scenario iterations' }
    ]
  },
  {
    category: 'Sustainability',
    commands: [
      { voice: 'Show my carbon footprint', description: 'Current emissions analysis' },
      { voice: 'Find green alternatives', description: 'Eco-friendly routing options' },
      { voice: 'What\'s my sustainability score?', description: 'ESG compliance rating' },
      { voice: 'Calculate emissions', description: 'CO2 impact calculation' }
    ]
  },
  {
    category: 'Financial Impact',
    commands: [
      { voice: 'Calculate delay costs', description: 'Financial impact of delays' },
      { voice: 'What\'s the ROI on this strategy?', description: 'Return on investment' },
      { voice: 'Compare cost scenarios', description: 'Side-by-side comparison' }
    ]
  },
  {
    category: 'Navigation',
    commands: [
      { voice: 'Go to dashboard', description: 'Main dashboard with KPIs' },
      { voice: 'Open digital twin', description: 'Interactive network view' },
      { voice: 'Show me scenarios', description: 'Monte Carlo simulations' },
      { voice: 'Give me a tour', description: 'Voice-guided walkthrough' }
    ]
  }
];

interface UseProactiveVoiceOptions {
  enableDemoAlerts?: boolean;
  alertIntervalMs?: number;
  onAlert?: (alert: ProactiveAlert) => void;
  onSpeak?: (message: string) => void;
}

export function useProactiveVoice({
  enableDemoAlerts = false,
  alertIntervalMs = 45000, // 45 seconds between demo alerts
  onAlert,
  onSpeak
}: UseProactiveVoiceOptions = {}) {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [lastSpokenAlert, setLastSpokenAlert] = useState<string | null>(null);
  const alertIndexRef = useRef(0);
  const hasPlayedWelcome = useRef(false);

  // Text-to-speech using browser API (fallback when not connected to ElevenLabs)
  const speakWithBrowser = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play welcome message on first visit
  const playWelcomeMessage = useCallback(() => {
    if (hasPlayedWelcome.current) return;
    hasPlayedWelcome.current = true;

    const welcomeMessage = "Hi! I'm Beacon, your AI supply chain assistant. Click the microphone to start talking with me, or say 'give me a tour' to learn what I can do.";

    if (onSpeak) {
      onSpeak(welcomeMessage);
    } else {
      // Use browser TTS as fallback
      setTimeout(() => speakWithBrowser(welcomeMessage), 1000);
    }
  }, [onSpeak, speakWithBrowser]);

  // Get tour narration for a page
  const getTourForPage = useCallback((page: string): string => {
    switch (page) {
      case '/dashboard':
        return VOICE_TOUR_SCRIPT.dashboard;
      case '/digital-twin':
        return VOICE_TOUR_SCRIPT.digitalTwin;
      case '/analytics':
        return VOICE_TOUR_SCRIPT.analytics;
      case '/scenarios':
        return VOICE_TOUR_SCRIPT.scenarios;
      default:
        return VOICE_TOUR_SCRIPT.welcome;
    }
  }, []);

  // Generate demo alert
  const generateDemoAlert = useCallback(() => {
    const alertTemplate = DEMO_ALERTS[alertIndexRef.current % DEMO_ALERTS.length];
    alertIndexRef.current++;

    const newAlert: ProactiveAlert = {
      id: `alert-${Date.now()}`,
      ...alertTemplate,
      timestamp: new Date(),
      dismissed: false
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep last 10
    onAlert?.(newAlert);

    // Speak the alert if connected
    if (onSpeak) {
      onSpeak(newAlert.spokenMessage);
    }
    setLastSpokenAlert(newAlert.id);

    return newAlert;
  }, [onAlert, onSpeak]);

  // Demo alert interval
  useEffect(() => {
    if (!enableDemoAlerts) return;

    const interval = setInterval(() => {
      generateDemoAlert();
    }, alertIntervalMs);

    return () => clearInterval(interval);
  }, [enableDemoAlerts, alertIntervalMs, generateDemoAlert]);

  // Dismiss an alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a)
    );
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get capabilities list for voice
  const getCapabilities = useCallback(() => {
    return VOICE_TOUR_SCRIPT.capabilities.join(' ');
  }, []);

  return {
    alerts,
    lastSpokenAlert,
    generateDemoAlert,
    dismissAlert,
    clearAlerts,
    playWelcomeMessage,
    getTourForPage,
    getCapabilities,
    speakWithBrowser,
    DEMO_COMMANDS,
    VOICE_TOUR_SCRIPT
  };
}
