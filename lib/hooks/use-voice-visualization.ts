'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// Visualization command types
type VisualizationAction =
  | 'zoom_in'
  | 'zoom_out'
  | 'rotate_left'
  | 'rotate_right'
  | 'focus_region'
  | 'highlight_risk'
  | 'show_connections'
  | 'hide_connections'
  | 'filter_status'
  | 'reset_view'
  | 'navigate';

interface VisualizationCommand {
  action: VisualizationAction;
  target?: string;
  value?: string | number;
}

// Parse voice commands for visualization control
const VISUALIZATION_PATTERNS: { pattern: RegExp; action: VisualizationAction; extractTarget?: (match: RegExpMatchArray) => string }[] = [
  // Navigation commands
  { pattern: /go to (dashboard|analytics|digital.?twin|scenarios|sustainability|impact|features)/i, action: 'navigate', extractTarget: (m) => m[1] },
  { pattern: /open (dashboard|analytics|digital.?twin|scenarios|sustainability|impact|features)/i, action: 'navigate', extractTarget: (m) => m[1] },
  { pattern: /show me (the )?(dashboard|analytics|digital.?twin|scenarios|sustainability|impact|features)/i, action: 'navigate', extractTarget: (m) => m[2] },
  { pattern: /navigate to (dashboard|analytics|digital.?twin|scenarios|sustainability|impact|features)/i, action: 'navigate', extractTarget: (m) => m[1] },

  // Zoom commands
  { pattern: /zoom in/i, action: 'zoom_in' },
  { pattern: /zoom out/i, action: 'zoom_out' },
  { pattern: /closer/i, action: 'zoom_in' },
  { pattern: /further|farther/i, action: 'zoom_out' },

  // Rotation commands
  { pattern: /rotate left|turn left|spin left/i, action: 'rotate_left' },
  { pattern: /rotate right|turn right|spin right/i, action: 'rotate_right' },

  // Focus commands
  { pattern: /focus on (asia|europe|america|africa|oceania|north america|south america|middle east)/i, action: 'focus_region', extractTarget: (m) => m[1] },
  { pattern: /zoom into (asia|europe|america|africa|oceania|north america|south america|middle east)/i, action: 'focus_region', extractTarget: (m) => m[1] },
  { pattern: /show (asia|europe|america|africa|oceania|north america|south america|middle east)/i, action: 'focus_region', extractTarget: (m) => m[1] },

  // Highlight commands
  { pattern: /highlight (high|critical|warning|healthy) risk/i, action: 'highlight_risk', extractTarget: (m) => m[1] },
  { pattern: /show (high|critical|warning|healthy) risk (nodes|suppliers|locations)/i, action: 'highlight_risk', extractTarget: (m) => m[1] },
  { pattern: /highlight (suppliers|warehouses|manufacturers|distributors)/i, action: 'filter_status', extractTarget: (m) => m[1] },

  // Connection commands
  { pattern: /show (all )?connections|show routes/i, action: 'show_connections' },
  { pattern: /hide connections|hide routes|clear routes/i, action: 'hide_connections' },
  { pattern: /show (active|delayed|disrupted) routes/i, action: 'filter_status', extractTarget: (m) => m[1] },

  // Reset
  { pattern: /reset view|reset map|default view|start over/i, action: 'reset_view' }
];

// Region coordinates for the 3D globe
const REGION_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'asia': { lat: 35, lng: 105, zoom: 4 },
  'europe': { lat: 50, lng: 10, zoom: 4 },
  'north america': { lat: 40, lng: -100, zoom: 4 },
  'america': { lat: 10, lng: -80, zoom: 3 },
  'south america': { lat: -15, lng: -60, zoom: 4 },
  'africa': { lat: 0, lng: 20, zoom: 4 },
  'oceania': { lat: -25, lng: 135, zoom: 4 },
  'middle east': { lat: 25, lng: 45, zoom: 4 }
};

// Page routes mapping
const PAGE_ROUTES: Record<string, string> = {
  'dashboard': '/dashboard',
  'analytics': '/analytics',
  'digital-twin': '/digital-twin',
  'digitaltwin': '/digital-twin',
  'digital twin': '/digital-twin',
  'scenarios': '/scenarios',
  'sustainability': '/sustainability',
  'impact': '/impact',
  'features': '/features'
};

interface UseVoiceVisualizationOptions {
  onCommand?: (command: VisualizationCommand) => void;
  onNavigate?: (path: string) => void;
  onSpeak?: (message: string) => void;
}

export function useVoiceVisualization({
  onCommand,
  onNavigate,
  onSpeak
}: UseVoiceVisualizationOptions = {}) {
  const router = useRouter();
  const [currentZoom, setCurrentZoom] = useState(1);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [highlightedRisk, setHighlightedRisk] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);

  // Parse voice command and execute action
  const processVoiceCommand = useCallback((transcript: string): VisualizationCommand | null => {
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const { pattern, action, extractTarget } of VISUALIZATION_PATTERNS) {
      const match = normalizedTranscript.match(pattern);
      if (match) {
        const target = extractTarget ? extractTarget(match) : undefined;
        const command: VisualizationCommand = { action, target };

        // Execute the command
        switch (action) {
          case 'navigate':
            const path = PAGE_ROUTES[target?.toLowerCase().replace(/\s+/g, '') || ''];
            if (path) {
              if (onNavigate) {
                onNavigate(path);
              } else {
                router.push(path);
              }
              onSpeak?.(`Navigating to ${target}`);
            }
            break;

          case 'zoom_in':
            setCurrentZoom(z => Math.min(z + 0.5, 3));
            onSpeak?.('Zooming in');
            break;

          case 'zoom_out':
            setCurrentZoom(z => Math.max(z - 0.5, 0.5));
            onSpeak?.('Zooming out');
            break;

          case 'rotate_left':
            setCurrentRotation(r => r - 45);
            onSpeak?.('Rotating left');
            break;

          case 'rotate_right':
            setCurrentRotation(r => r + 45);
            onSpeak?.('Rotating right');
            break;

          case 'focus_region':
            if (target) {
              const coords = REGION_COORDINATES[target.toLowerCase()];
              if (coords) {
                setFocusedRegion(target);
                onSpeak?.(`Focusing on ${target}. I can see ${getRegionInfo(target)}`);
              }
            }
            break;

          case 'highlight_risk':
            setHighlightedRisk(target || null);
            onSpeak?.(`Highlighting ${target || 'all'} risk nodes`);
            break;

          case 'show_connections':
            setShowConnections(true);
            onSpeak?.('Showing all supply chain connections');
            break;

          case 'hide_connections':
            setShowConnections(false);
            onSpeak?.('Hiding connections');
            break;

          case 'reset_view':
            setCurrentZoom(1);
            setCurrentRotation(0);
            setFocusedRegion(null);
            setHighlightedRisk(null);
            setShowConnections(true);
            onSpeak?.('View reset to default');
            break;
        }

        onCommand?.(command);
        return command;
      }
    }

    return null;
  }, [router, onCommand, onNavigate, onSpeak]);

  // Get region-specific information for voice feedback
  const getRegionInfo = (region: string): string => {
    const regionInfo: Record<string, string> = {
      'asia': '3 suppliers, 2 manufacturers, and elevated risk in the Shanghai area',
      'europe': '2 distribution centers and healthy operations in Rotterdam',
      'north america': 'critical risk at the Los Angeles warehouse and 2 retail locations',
      'south america': '1 supplier with moderate risk levels',
      'middle east': 'Dubai warehouse operating normally',
      'africa': 'no active supply chain nodes',
      'oceania': 'limited supply chain presence'
    };
    return regionInfo[region.toLowerCase()] || 'various supply chain nodes';
  };

  // Get current visualization state
  const getVisualizationState = useCallback(() => {
    return {
      zoom: currentZoom,
      rotation: currentRotation,
      focusedRegion,
      highlightedRisk,
      showConnections
    };
  }, [currentZoom, currentRotation, focusedRegion, highlightedRisk, showConnections]);

  return {
    processVoiceCommand,
    getVisualizationState,
    currentZoom,
    currentRotation,
    focusedRegion,
    highlightedRisk,
    showConnections,
    setFocusedRegion,
    setHighlightedRisk,
    setShowConnections,
    REGION_COORDINATES
  };
}
