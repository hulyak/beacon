'use client';

// Command parser for voice-to-dashboard integration
// Parses voice transcripts to identify actionable commands

export type CommandIntent =
  | 'analyze_risks'
  | 'run_scenario'
  | 'get_alerts'
  | 'show_metrics'
  | 'show_dashboard'
  | 'unknown';

export type Region = 'asia' | 'europe' | 'north_america' | 'south_america' | 'global';

export type ScenarioType =
  | 'supplier_failure'
  | 'port_closure'
  | 'demand_surge'
  | 'natural_disaster'
  | 'transportation_disruption';

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'all';

export interface ParsedCommand {
  intent: CommandIntent;
  region?: Region;
  scenarioType?: ScenarioType;
  priority?: Priority;
  confidence: number;
  rawText: string;
}

// Keyword mappings for intent detection
const INTENT_KEYWORDS: Record<CommandIntent, string[]> = {
  analyze_risks: ['risk', 'risks', 'analyze', 'analysis', 'threat', 'threats', 'vulnerability', 'vulnerabilities', 'danger', 'dangers'],
  run_scenario: ['scenario', 'simulate', 'simulation', 'what if', 'what-if', 'run', 'test', 'hypothetical'],
  get_alerts: ['alert', 'alerts', 'notification', 'notifications', 'warning', 'warnings', 'urgent'],
  show_metrics: ['metric', 'metrics', 'status', 'overview', 'summary', 'health', 'integrity', 'level'],
  show_dashboard: ['dashboard', 'home', 'main', 'view'],
  unknown: [],
};

// Region keyword mappings
const REGION_KEYWORDS: Record<Region, string[]> = {
  asia: ['asia', 'asian', 'china', 'japan', 'korea', 'india', 'shanghai', 'beijing', 'tokyo', 'singapore'],
  europe: ['europe', 'european', 'germany', 'france', 'uk', 'rotterdam', 'hamburg', 'london', 'paris'],
  north_america: ['north america', 'us', 'usa', 'united states', 'america', 'american', 'canada', 'mexico', 'los angeles', 'new york'],
  south_america: ['south america', 'brazil', 'argentina', 'chile', 'latin america', 'sao paulo'],
  global: ['global', 'worldwide', 'everywhere', 'all regions', 'overall'],
};

// Scenario type keyword mappings
const SCENARIO_KEYWORDS: Record<ScenarioType, string[]> = {
  supplier_failure: ['supplier', 'supplier failure', 'vendor', 'vendor failure', 'supplier issue'],
  port_closure: ['port', 'port closure', 'shipping', 'harbor', 'dock'],
  demand_surge: ['demand', 'demand surge', 'spike', 'increase', 'surge'],
  natural_disaster: ['disaster', 'natural disaster', 'earthquake', 'tsunami', 'hurricane', 'flood', 'typhoon'],
  transportation_disruption: ['transport', 'transportation', 'logistics', 'delivery', 'trucking', 'freight'],
};

// Priority keyword mappings
const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  critical: ['critical', 'urgent', 'emergency', 'severe'],
  high: ['high', 'important', 'priority'],
  medium: ['medium', 'moderate'],
  low: ['low', 'minor'],
  all: ['all', 'every', 'any'],
};

/**
 * Parse a voice transcript to extract actionable command information
 */
export function parseVoiceCommand(transcript: string): ParsedCommand {
  const text = transcript.toLowerCase().trim();

  // Detect intent
  const { intent, confidence } = detectIntent(text);

  // Extract region
  const region = detectRegion(text);

  // Extract scenario type
  const scenarioType = detectScenarioType(text);

  // Extract priority
  const priority = detectPriority(text);

  return {
    intent,
    region,
    scenarioType,
    priority,
    confidence,
    rawText: transcript,
  };
}

function detectIntent(text: string): { intent: CommandIntent; confidence: number } {
  let bestIntent: CommandIntent = 'unknown';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [CommandIntent, string[]][]) {
    if (intent === 'unknown') continue;

    const score = keywords.reduce((acc, keyword) => {
      if (text.includes(keyword)) {
        // Longer keywords get higher scores
        return acc + keyword.length;
      }
      return acc;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Calculate confidence (0-1)
  const confidence = Math.min(bestScore / 10, 1);

  return { intent: bestIntent, confidence };
}

function detectRegion(text: string): Region | undefined {
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS) as [Region, string[]][]) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return region;
      }
    }
  }
  return undefined;
}

function detectScenarioType(text: string): ScenarioType | undefined {
  for (const [scenario, keywords] of Object.entries(SCENARIO_KEYWORDS) as [ScenarioType, string[]][]) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return scenario;
      }
    }
  }
  return undefined;
}

function detectPriority(text: string): Priority | undefined {
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS) as [Priority, string[]][]) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return priority;
      }
    }
  }
  return undefined;
}

/**
 * Check if a command is actionable (has high enough confidence)
 */
export function isActionableCommand(command: ParsedCommand): boolean {
  return command.intent !== 'unknown' && command.confidence >= 0.3;
}

/**
 * Get a human-readable description of the parsed command
 */
export function describeCommand(command: ParsedCommand): string {
  if (command.intent === 'unknown') {
    return 'Unknown command';
  }

  const parts: string[] = [];

  switch (command.intent) {
    case 'analyze_risks':
      parts.push('Analyzing risks');
      break;
    case 'run_scenario':
      parts.push('Running scenario');
      break;
    case 'get_alerts':
      parts.push('Getting alerts');
      break;
    case 'show_metrics':
      parts.push('Showing metrics');
      break;
    case 'show_dashboard':
      parts.push('Showing dashboard');
      break;
  }

  if (command.region) {
    parts.push(`for ${command.region.replace('_', ' ')}`);
  }

  if (command.scenarioType) {
    parts.push(`(${command.scenarioType.replace(/_/g, ' ')})`);
  }

  if (command.priority) {
    parts.push(`[${command.priority} priority]`);
  }

  return parts.join(' ');
}
