'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { parseVoiceCommand, ParsedCommand, Region, ScenarioType, Priority, isActionableCommand } from './command-parser';

// Re-export types from command-parser for convenience
export type { Region, ScenarioType, Priority } from './command-parser';

// Types for dashboard data
export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  category: string;
  probability: number;
  impact: number;
  recommendations: string[];
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp: string;
  region: string;
  isRead: boolean;
  actionRequired: boolean;
}

export interface ScenarioResult {
  scenario: {
    id: string;
    type: string;
    name: string;
    description: string;
    duration: string;
    affectedRegions: string[];
  };
  outcomes: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    change: number;
    impact: 'positive' | 'negative' | 'neutral';
    unit?: string;
  }[];
  recommendation: string;
  financialImpact: {
    estimatedCost: number;
    currency: string;
    timeframe: string;
  };
}

export interface DashboardMetrics {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  activeAlerts: number;
  criticalAlerts: number;
  chainIntegrity: number;
  responseTime: number;
}

// Highlight state for visual feedback
export interface HighlightState {
  region: Region | null;
  metrics: boolean;
  alerts: boolean;
  scenario: boolean;
  timestamp: number;
}

// Context state
interface VoiceDashboardState {
  // Voice state
  lastCommand: ParsedCommand | null;
  isProcessing: boolean;

  // Dashboard data
  activeRegion: Region | null;
  risks: Risk[];
  alerts: Alert[];
  scenarioResult: ScenarioResult | null;
  metrics: DashboardMetrics;

  // Visual highlights
  highlights: HighlightState;

  // Actions
  processVoiceMessage: (message: string, role: 'user' | 'agent') => void;
  setActiveRegion: (region: Region | null) => void;
  setRisks: (risks: Risk[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setScenarioResult: (result: ScenarioResult | null) => void;
  setMetrics: (metrics: Partial<DashboardMetrics>) => void;
  clearHighlights: () => void;
  highlightRegion: (region: Region) => void;
  highlightAlerts: () => void;
  highlightMetrics: () => void;
  highlightScenario: () => void;
}

// Default metrics
const DEFAULT_METRICS: DashboardMetrics = {
  overallRiskLevel: 'medium',
  riskScore: 65,
  activeAlerts: 12,
  criticalAlerts: 2,
  chainIntegrity: 94.5,
  responseTime: 47,
};

// Default highlight state
const DEFAULT_HIGHLIGHTS: HighlightState = {
  region: null,
  metrics: false,
  alerts: false,
  scenario: false,
  timestamp: 0,
};

// Create context
const VoiceDashboardContext = createContext<VoiceDashboardState | null>(null);

// Provider component
export function VoiceDashboardProvider({ children }: { children: ReactNode }) {
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [metrics, setMetricsState] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [highlights, setHighlights] = useState<HighlightState>(DEFAULT_HIGHLIGHTS);

  // Clear highlights after a delay
  const clearHighlights = useCallback(() => {
    setHighlights(DEFAULT_HIGHLIGHTS);
  }, []);

  // Highlight specific regions
  const highlightRegion = useCallback((region: Region) => {
    setHighlights(prev => ({
      ...prev,
      region,
      timestamp: Date.now(),
    }));

    // Auto-clear after 3 seconds
    setTimeout(clearHighlights, 3000);
  }, [clearHighlights]);

  const highlightAlerts = useCallback(() => {
    setHighlights(prev => ({
      ...prev,
      alerts: true,
      timestamp: Date.now(),
    }));

    setTimeout(clearHighlights, 3000);
  }, [clearHighlights]);

  const highlightMetrics = useCallback(() => {
    setHighlights(prev => ({
      ...prev,
      metrics: true,
      timestamp: Date.now(),
    }));

    setTimeout(clearHighlights, 3000);
  }, [clearHighlights]);

  const highlightScenario = useCallback(() => {
    setHighlights(prev => ({
      ...prev,
      scenario: true,
      timestamp: Date.now(),
    }));

    setTimeout(clearHighlights, 3000);
  }, [clearHighlights]);

  // Process voice messages and update dashboard
  const processVoiceMessage = useCallback((message: string, role: 'user' | 'agent') => {
    const command = parseVoiceCommand(message);
    setLastCommand(command);

    if (!isActionableCommand(command)) {
      return;
    }

    // Handle user commands
    if (role === 'user') {
      setIsProcessing(true);

      // Trigger appropriate highlights based on intent
      switch (command.intent) {
        case 'analyze_risks':
          if (command.region) {
            highlightRegion(command.region);
            setActiveRegion(command.region);
          }
          break;
        case 'get_alerts':
          highlightAlerts();
          break;
        case 'show_metrics':
          highlightMetrics();
          break;
        case 'run_scenario':
          highlightScenario();
          break;
      }
    }

    // Handle agent responses (contains data)
    if (role === 'agent') {
      setIsProcessing(false);

      // Parse agent response for data updates
      // This would be enhanced based on actual response format from ElevenLabs/Gemini
      if (command.region) {
        setActiveRegion(command.region);
        highlightRegion(command.region);
      }
    }
  }, [highlightRegion, highlightAlerts, highlightMetrics, highlightScenario]);

  // Update metrics
  const setMetrics = useCallback((newMetrics: Partial<DashboardMetrics>) => {
    setMetricsState(prev => ({ ...prev, ...newMetrics }));
  }, []);

  const value: VoiceDashboardState = {
    lastCommand,
    isProcessing,
    activeRegion,
    risks,
    alerts,
    scenarioResult,
    metrics,
    highlights,
    processVoiceMessage,
    setActiveRegion,
    setRisks,
    setAlerts,
    setScenarioResult,
    setMetrics,
    clearHighlights,
    highlightRegion,
    highlightAlerts,
    highlightMetrics,
    highlightScenario,
  };

  return (
    <VoiceDashboardContext.Provider value={value}>
      {children}
    </VoiceDashboardContext.Provider>
  );
}

// Hook to use the context
export function useVoiceDashboard() {
  const context = useContext(VoiceDashboardContext);

  if (!context) {
    throw new Error('useVoiceDashboard must be used within a VoiceDashboardProvider');
  }

  return context;
}

// Hook to check if a region is highlighted
export function useIsRegionHighlighted(region: Region): boolean {
  const { highlights } = useVoiceDashboard();
  return highlights.region === region;
}

// Hook to check if alerts are highlighted
export function useIsAlertsHighlighted(): boolean {
  const { highlights } = useVoiceDashboard();
  return highlights.alerts;
}

// Hook to check if metrics are highlighted
export function useIsMetricsHighlighted(): boolean {
  const { highlights } = useVoiceDashboard();
  return highlights.metrics;
}

// Hook to check if scenario is highlighted
export function useIsScenarioHighlighted(): boolean {
  const { highlights } = useVoiceDashboard();
  return highlights.scenario;
}
