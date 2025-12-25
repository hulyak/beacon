/**
 * Memory Service for Beacon
 * Provides localStorage-based persistence for conversations, supply chain state, and learning
 */

// Types
export interface ConversationMemory {
  id: string;
  timestamp: Date;
  messages: Array<{
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
  }>;
  intent?: string;
  region?: string;
  outcome?: string;
}

export interface SupplyChainSnapshot {
  id: string;
  timestamp: Date;
  nodes: SupplyChainNodeData[];
  edges: SupplyChainEdgeData[];
  version: number;
}

export interface SupplyChainNodeData {
  id: string;
  type: 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer';
  position: { x: number; y: number };
  data: {
    name: string;
    location: string;
    region: string;
    status: 'healthy' | 'warning' | 'critical';
    capacity?: number;
    utilization?: number;
    riskLevel?: number;
  };
}

export interface SupplyChainEdgeData {
  id: string;
  source: string;
  target: string;
  data: {
    status: 'active' | 'delayed' | 'disrupted';
    flowVolume?: number;
    leadTime?: number;
  };
}

export interface ScenarioOutcome {
  id: string;
  timestamp: Date;
  scenarioType: string;
  region: string;
  severity: string;
  predictedImpact: {
    financialImpact: number;
    recoveryTime: string;
    affectedNodes: string[];
  };
  actualOutcome?: {
    financialImpact: number;
    recoveryTime: string;
    notes: string;
  };
  accuracy?: number;
}

export interface UserPreferences {
  defaultRegion?: string;
  alertPriority?: string;
  voiceEnabled: boolean;
  autoSaveEnabled: boolean;
}

export interface MemoryStore {
  conversations: ConversationMemory[];
  supplyChainSnapshots: SupplyChainSnapshot[];
  scenarioHistory: ScenarioOutcome[];
  userPreferences: UserPreferences;
  lastUpdated: Date;
}

// Storage keys
const STORAGE_KEYS = {
  MEMORY_STORE: 'beacon_memory_store',
  CURRENT_SNAPSHOT: 'beacon_current_snapshot',
  PREFERENCES: 'beacon_preferences',
} as const;

// Default values
const DEFAULT_PREFERENCES: UserPreferences = {
  voiceEnabled: true,
  autoSaveEnabled: true,
};

const DEFAULT_MEMORY_STORE: MemoryStore = {
  conversations: [],
  supplyChainSnapshots: [],
  scenarioHistory: [],
  userPreferences: DEFAULT_PREFERENCES,
  lastUpdated: new Date(),
};

// Memory limits
const MAX_CONVERSATIONS = 50;
const MAX_SNAPSHOTS = 20;
const MAX_SCENARIOS = 100;

/**
 * Memory Service class
 * Singleton pattern for consistent access
 */
class MemoryService {
  private store: MemoryStore;
  private listeners: Set<(store: MemoryStore) => void> = new Set();

  constructor() {
    this.store = this.loadFromStorage();
  }

  /**
   * Load memory store from localStorage
   */
  private loadFromStorage(): MemoryStore {
    if (typeof window === 'undefined') {
      return DEFAULT_MEMORY_STORE;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEMORY_STORE);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Rehydrate dates
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          conversations: parsed.conversations.map((c: ConversationMemory) => ({
            ...c,
            timestamp: new Date(c.timestamp),
            messages: c.messages.map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          })),
          supplyChainSnapshots: parsed.supplyChainSnapshots.map((s: SupplyChainSnapshot) => ({
            ...s,
            timestamp: new Date(s.timestamp),
          })),
          scenarioHistory: parsed.scenarioHistory.map((s: ScenarioOutcome) => ({
            ...s,
            timestamp: new Date(s.timestamp),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load memory from storage:', error);
    }

    return DEFAULT_MEMORY_STORE;
  }

  /**
   * Save memory store to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      this.store.lastUpdated = new Date();
      localStorage.setItem(STORAGE_KEYS.MEMORY_STORE, JSON.stringify(this.store));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save memory to storage:', error);
    }
  }

  /**
   * Notify all listeners of store changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.store));
  }

  /**
   * Subscribe to store changes
   */
  subscribe(listener: (store: MemoryStore) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get entire memory store
   */
  getStore(): MemoryStore {
    return this.store;
  }

  // ==================== Conversation Memory ====================

  /**
   * Save a conversation to memory
   */
  saveConversation(conversation: Omit<ConversationMemory, 'id'>): string {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: ConversationMemory = {
      ...conversation,
      id,
    };

    this.store.conversations.unshift(newConversation);

    // Limit stored conversations
    if (this.store.conversations.length > MAX_CONVERSATIONS) {
      this.store.conversations = this.store.conversations.slice(0, MAX_CONVERSATIONS);
    }

    this.saveToStorage();
    return id;
  }

  /**
   * Get recent conversations
   */
  getRecentConversations(limit: number = 10): ConversationMemory[] {
    return this.store.conversations.slice(0, limit);
  }

  /**
   * Search conversations by content
   */
  searchConversations(query: string): ConversationMemory[] {
    const lowerQuery = query.toLowerCase();
    return this.store.conversations.filter((conv) =>
      conv.messages.some((m) => m.content.toLowerCase().includes(lowerQuery)) ||
      conv.intent?.toLowerCase().includes(lowerQuery) ||
      conv.region?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get conversation by ID
   */
  getConversation(id: string): ConversationMemory | undefined {
    return this.store.conversations.find((c) => c.id === id);
  }

  // ==================== Supply Chain Snapshots ====================

  /**
   * Save supply chain snapshot
   */
  saveSnapshot(nodes: SupplyChainNodeData[], edges: SupplyChainEdgeData[]): string {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const version = this.store.supplyChainSnapshots.length > 0
      ? Math.max(...this.store.supplyChainSnapshots.map((s) => s.version)) + 1
      : 1;

    const snapshot: SupplyChainSnapshot = {
      id,
      timestamp: new Date(),
      nodes,
      edges,
      version,
    };

    this.store.supplyChainSnapshots.unshift(snapshot);

    // Limit stored snapshots
    if (this.store.supplyChainSnapshots.length > MAX_SNAPSHOTS) {
      this.store.supplyChainSnapshots = this.store.supplyChainSnapshots.slice(0, MAX_SNAPSHOTS);
    }

    this.saveToStorage();
    return id;
  }

  /**
   * Get latest supply chain snapshot
   */
  getLatestSnapshot(): SupplyChainSnapshot | null {
    return this.store.supplyChainSnapshots[0] || null;
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(id: string): SupplyChainSnapshot | undefined {
    return this.store.supplyChainSnapshots.find((s) => s.id === id);
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): SupplyChainSnapshot[] {
    return this.store.supplyChainSnapshots;
  }

  // ==================== Scenario History ====================

  /**
   * Save scenario outcome
   */
  saveScenarioOutcome(outcome: Omit<ScenarioOutcome, 'id'>): string {
    const id = `scen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newOutcome: ScenarioOutcome = {
      ...outcome,
      id,
    };

    this.store.scenarioHistory.unshift(newOutcome);

    // Limit stored scenarios
    if (this.store.scenarioHistory.length > MAX_SCENARIOS) {
      this.store.scenarioHistory = this.store.scenarioHistory.slice(0, MAX_SCENARIOS);
    }

    this.saveToStorage();
    return id;
  }

  /**
   * Update scenario with actual outcome
   */
  updateScenarioOutcome(
    id: string,
    actualOutcome: ScenarioOutcome['actualOutcome']
  ): void {
    const scenario = this.store.scenarioHistory.find((s) => s.id === id);
    if (scenario && actualOutcome) {
      scenario.actualOutcome = actualOutcome;

      // Calculate accuracy if we have both predicted and actual
      if (scenario.predictedImpact && actualOutcome) {
        const predictedImpact = scenario.predictedImpact.financialImpact;
        const actualImpact = actualOutcome.financialImpact;
        if (predictedImpact > 0) {
          scenario.accuracy = Math.max(
            0,
            100 - Math.abs((predictedImpact - actualImpact) / predictedImpact) * 100
          );
        }
      }

      this.saveToStorage();
    }
  }

  /**
   * Get scenarios by type
   */
  getScenariosByType(scenarioType: string): ScenarioOutcome[] {
    return this.store.scenarioHistory.filter((s) => s.scenarioType === scenarioType);
  }

  /**
   * Get scenarios by region
   */
  getScenariosByRegion(region: string): ScenarioOutcome[] {
    return this.store.scenarioHistory.filter((s) => s.region === region);
  }

  /**
   * Get recent scenarios
   */
  getRecentScenarios(limit: number = 10): ScenarioOutcome[] {
    return this.store.scenarioHistory.slice(0, limit);
  }

  /**
   * Get average prediction accuracy
   */
  getAverageAccuracy(): number | null {
    const withAccuracy = this.store.scenarioHistory.filter((s) => s.accuracy !== undefined);
    if (withAccuracy.length === 0) return null;
    return withAccuracy.reduce((sum, s) => sum + (s.accuracy || 0), 0) / withAccuracy.length;
  }

  // ==================== User Preferences ====================

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    return this.store.userPreferences;
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.store.userPreferences = {
      ...this.store.userPreferences,
      ...preferences,
    };
    this.saveToStorage();
  }

  // ==================== Context Building ====================

  /**
   * Build context string for AI prompts from memory
   */
  buildContextForPrompt(options: {
    includeRecentConversations?: number;
    includeScenarioHistory?: number;
    includeSupplyChainState?: boolean;
  } = {}): string {
    const {
      includeRecentConversations = 3,
      includeScenarioHistory = 5,
      includeSupplyChainState = true,
    } = options;

    const parts: string[] = [];

    // Add recent conversations context
    if (includeRecentConversations > 0) {
      const recentConvs = this.getRecentConversations(includeRecentConversations);
      if (recentConvs.length > 0) {
        parts.push('Recent conversation history:');
        recentConvs.forEach((conv, i) => {
          const summary = conv.messages.slice(-2).map((m) => `${m.role}: ${m.content}`).join(' | ');
          parts.push(`${i + 1}. [${conv.intent || 'general'}] ${summary}`);
        });
      }
    }

    // Add scenario history context
    if (includeScenarioHistory > 0) {
      const recentScenarios = this.getRecentScenarios(includeScenarioHistory);
      if (recentScenarios.length > 0) {
        parts.push('\nPrevious scenario analyses:');
        recentScenarios.forEach((s, i) => {
          parts.push(
            `${i + 1}. ${s.scenarioType} in ${s.region}: $${s.predictedImpact.financialImpact.toLocaleString()} impact, ${s.predictedImpact.recoveryTime} recovery`
          );
        });
      }
    }

    // Add supply chain state context
    if (includeSupplyChainState) {
      const snapshot = this.getLatestSnapshot();
      if (snapshot) {
        const nodeCount = snapshot.nodes.length;
        const criticalNodes = snapshot.nodes.filter((n) => n.data.status === 'critical').length;
        const warningNodes = snapshot.nodes.filter((n) => n.data.status === 'warning').length;
        parts.push(
          `\nCurrent supply chain: ${nodeCount} nodes (${criticalNodes} critical, ${warningNodes} warning)`
        );
      }
    }

    // Add user preferences context
    const prefs = this.getPreferences();
    if (prefs.defaultRegion) {
      parts.push(`\nUser's default region: ${prefs.defaultRegion}`);
    }

    return parts.join('\n');
  }

  // ==================== Utility Methods ====================

  /**
   * Clear all memory (with confirmation)
   */
  clearAllMemory(): void {
    this.store = DEFAULT_MEMORY_STORE;
    this.saveToStorage();
  }

  /**
   * Clear specific memory type
   */
  clearMemoryType(type: 'conversations' | 'snapshots' | 'scenarios'): void {
    switch (type) {
      case 'conversations':
        this.store.conversations = [];
        break;
      case 'snapshots':
        this.store.supplyChainSnapshots = [];
        break;
      case 'scenarios':
        this.store.scenarioHistory = [];
        break;
    }
    this.saveToStorage();
  }

  /**
   * Export memory as JSON
   */
  exportMemory(): string {
    return JSON.stringify(this.store, null, 2);
  }

  /**
   * Import memory from JSON
   */
  importMemory(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      // Validate structure
      if (
        imported.conversations &&
        imported.supplyChainSnapshots &&
        imported.scenarioHistory &&
        imported.userPreferences
      ) {
        this.store = imported;
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('Failed to import memory:', error);
    }
    return false;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    conversationCount: number;
    snapshotCount: number;
    scenarioCount: number;
    averageAccuracy: number | null;
    lastUpdated: Date;
  } {
    return {
      conversationCount: this.store.conversations.length,
      snapshotCount: this.store.supplyChainSnapshots.length,
      scenarioCount: this.store.scenarioHistory.length,
      averageAccuracy: this.getAverageAccuracy(),
      lastUpdated: this.store.lastUpdated,
    };
  }
}

// Singleton instance
let memoryServiceInstance: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!memoryServiceInstance) {
    memoryServiceInstance = new MemoryService();
  }
  return memoryServiceInstance;
}

export default MemoryService;
