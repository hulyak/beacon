'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  getMemoryService,
  MemoryStore,
  ConversationMemory,
  SupplyChainSnapshot,
  ScenarioOutcome,
  UserPreferences,
  SupplyChainNodeData,
  SupplyChainEdgeData,
} from './memory-service';

// Re-export types for convenience
export type {
  MemoryStore,
  ConversationMemory,
  SupplyChainSnapshot,
  ScenarioOutcome,
  UserPreferences,
  SupplyChainNodeData,
  SupplyChainEdgeData,
} from './memory-service';

// Context state interface
interface MemoryContextState {
  // Store data
  store: MemoryStore | null;
  isLoading: boolean;

  // Conversation methods
  saveConversation: (
    conversation: Omit<ConversationMemory, 'id'>
  ) => string | null;
  getRecentConversations: (limit?: number) => ConversationMemory[];
  searchConversations: (query: string) => ConversationMemory[];
  getConversation: (id: string) => ConversationMemory | undefined;

  // Supply chain snapshot methods
  saveSnapshot: (
    nodes: SupplyChainNodeData[],
    edges: SupplyChainEdgeData[]
  ) => string | null;
  getLatestSnapshot: () => SupplyChainSnapshot | null;
  getSnapshot: (id: string) => SupplyChainSnapshot | undefined;
  getAllSnapshots: () => SupplyChainSnapshot[];

  // Scenario methods
  saveScenarioOutcome: (outcome: Omit<ScenarioOutcome, 'id'>) => string | null;
  updateScenarioOutcome: (
    id: string,
    actualOutcome: ScenarioOutcome['actualOutcome']
  ) => void;
  getScenariosByType: (type: string) => ScenarioOutcome[];
  getScenariosByRegion: (region: string) => ScenarioOutcome[];
  getRecentScenarios: (limit?: number) => ScenarioOutcome[];
  getAverageAccuracy: () => number | null;

  // Preferences methods
  getPreferences: () => UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Context building
  buildContextForPrompt: (options?: {
    includeRecentConversations?: number;
    includeScenarioHistory?: number;
    includeSupplyChainState?: boolean;
  }) => string;

  // Utility methods
  clearAllMemory: () => void;
  clearMemoryType: (type: 'conversations' | 'snapshots' | 'scenarios') => void;
  exportMemory: () => string;
  importMemory: (json: string) => boolean;
  getStats: () => {
    conversationCount: number;
    snapshotCount: number;
    scenarioCount: number;
    averageAccuracy: number | null;
    lastUpdated: Date;
  };
}

// Create context
const MemoryContext = createContext<MemoryContextState | null>(null);

// Provider component
export function MemoryProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<MemoryStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize memory service and subscribe to changes
  useEffect(() => {
    const memoryService = getMemoryService();

    // Set initial store
    setStore(memoryService.getStore());
    setIsLoading(false);

    // Subscribe to changes
    const unsubscribe = memoryService.subscribe((newStore) => {
      setStore({ ...newStore });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Conversation methods
  const saveConversation = useCallback(
    (conversation: Omit<ConversationMemory, 'id'>): string | null => {
      try {
        return getMemoryService().saveConversation(conversation);
      } catch (error) {
        console.error('Failed to save conversation:', error);
        return null;
      }
    },
    []
  );

  const getRecentConversations = useCallback(
    (limit?: number): ConversationMemory[] => {
      return getMemoryService().getRecentConversations(limit);
    },
    []
  );

  const searchConversations = useCallback(
    (query: string): ConversationMemory[] => {
      return getMemoryService().searchConversations(query);
    },
    []
  );

  const getConversation = useCallback(
    (id: string): ConversationMemory | undefined => {
      return getMemoryService().getConversation(id);
    },
    []
  );

  // Supply chain snapshot methods
  const saveSnapshot = useCallback(
    (
      nodes: SupplyChainNodeData[],
      edges: SupplyChainEdgeData[]
    ): string | null => {
      try {
        return getMemoryService().saveSnapshot(nodes, edges);
      } catch (error) {
        console.error('Failed to save snapshot:', error);
        return null;
      }
    },
    []
  );

  const getLatestSnapshot = useCallback((): SupplyChainSnapshot | null => {
    return getMemoryService().getLatestSnapshot();
  }, []);

  const getSnapshot = useCallback(
    (id: string): SupplyChainSnapshot | undefined => {
      return getMemoryService().getSnapshot(id);
    },
    []
  );

  const getAllSnapshots = useCallback((): SupplyChainSnapshot[] => {
    return getMemoryService().getAllSnapshots();
  }, []);

  // Scenario methods
  const saveScenarioOutcome = useCallback(
    (outcome: Omit<ScenarioOutcome, 'id'>): string | null => {
      try {
        return getMemoryService().saveScenarioOutcome(outcome);
      } catch (error) {
        console.error('Failed to save scenario outcome:', error);
        return null;
      }
    },
    []
  );

  const updateScenarioOutcome = useCallback(
    (id: string, actualOutcome: ScenarioOutcome['actualOutcome']): void => {
      getMemoryService().updateScenarioOutcome(id, actualOutcome);
    },
    []
  );

  const getScenariosByType = useCallback((type: string): ScenarioOutcome[] => {
    return getMemoryService().getScenariosByType(type);
  }, []);

  const getScenariosByRegion = useCallback(
    (region: string): ScenarioOutcome[] => {
      return getMemoryService().getScenariosByRegion(region);
    },
    []
  );

  const getRecentScenarios = useCallback(
    (limit?: number): ScenarioOutcome[] => {
      return getMemoryService().getRecentScenarios(limit);
    },
    []
  );

  const getAverageAccuracy = useCallback((): number | null => {
    return getMemoryService().getAverageAccuracy();
  }, []);

  // Preferences methods
  const getPreferences = useCallback((): UserPreferences => {
    return getMemoryService().getPreferences();
  }, []);

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>): void => {
      getMemoryService().updatePreferences(preferences);
    },
    []
  );

  // Context building
  const buildContextForPrompt = useCallback(
    (options?: {
      includeRecentConversations?: number;
      includeScenarioHistory?: number;
      includeSupplyChainState?: boolean;
    }): string => {
      return getMemoryService().buildContextForPrompt(options);
    },
    []
  );

  // Utility methods
  const clearAllMemory = useCallback((): void => {
    getMemoryService().clearAllMemory();
  }, []);

  const clearMemoryType = useCallback(
    (type: 'conversations' | 'snapshots' | 'scenarios'): void => {
      getMemoryService().clearMemoryType(type);
    },
    []
  );

  const exportMemory = useCallback((): string => {
    return getMemoryService().exportMemory();
  }, []);

  const importMemory = useCallback((json: string): boolean => {
    return getMemoryService().importMemory(json);
  }, []);

  const getStats = useCallback(() => {
    return getMemoryService().getStats();
  }, []);

  const value: MemoryContextState = {
    store,
    isLoading,
    saveConversation,
    getRecentConversations,
    searchConversations,
    getConversation,
    saveSnapshot,
    getLatestSnapshot,
    getSnapshot,
    getAllSnapshots,
    saveScenarioOutcome,
    updateScenarioOutcome,
    getScenariosByType,
    getScenariosByRegion,
    getRecentScenarios,
    getAverageAccuracy,
    getPreferences,
    updatePreferences,
    buildContextForPrompt,
    clearAllMemory,
    clearMemoryType,
    exportMemory,
    importMemory,
    getStats,
  };

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

// Main hook to use the context
export function useMemory() {
  const context = useContext(MemoryContext);

  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }

  return context;
}

// Convenience hooks for specific features

/**
 * Hook for conversation-related memory operations
 */
export function useConversationMemory() {
  const {
    saveConversation,
    getRecentConversations,
    searchConversations,
    getConversation,
  } = useMemory();

  return {
    saveConversation,
    getRecentConversations,
    searchConversations,
    getConversation,
  };
}

/**
 * Hook for supply chain snapshot operations
 */
export function useSupplyChainSnapshots() {
  const { saveSnapshot, getLatestSnapshot, getSnapshot, getAllSnapshots } =
    useMemory();

  return {
    saveSnapshot,
    getLatestSnapshot,
    getSnapshot,
    getAllSnapshots,
  };
}

/**
 * Hook for scenario history operations
 */
export function useScenarioHistory() {
  const {
    saveScenarioOutcome,
    updateScenarioOutcome,
    getScenariosByType,
    getScenariosByRegion,
    getRecentScenarios,
    getAverageAccuracy,
  } = useMemory();

  return {
    saveScenarioOutcome,
    updateScenarioOutcome,
    getScenariosByType,
    getScenariosByRegion,
    getRecentScenarios,
    getAverageAccuracy,
  };
}

/**
 * Hook for user preferences
 */
export function useUserPreferences() {
  const { getPreferences, updatePreferences } = useMemory();

  return {
    getPreferences,
    updatePreferences,
  };
}

/**
 * Hook to get memory statistics
 */
export function useMemoryStats() {
  const { store, getStats, isLoading } = useMemory();

  // Re-compute stats when store changes
  const stats = store ? getStats() : null;

  return {
    stats,
    isLoading,
  };
}

/**
 * Hook to auto-save supply chain state
 * Usage: useAutoSaveSupplyChain(nodes, edges)
 */
export function useAutoSaveSupplyChain(
  nodes: SupplyChainNodeData[],
  edges: SupplyChainEdgeData[],
  debounceMs: number = 2000
) {
  const { saveSnapshot, getPreferences } = useMemory();

  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.autoSaveEnabled) return;
    if (nodes.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveSnapshot(nodes, edges);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, debounceMs, saveSnapshot, getPreferences]);
}

/**
 * Hook to load the latest supply chain snapshot on mount
 */
export function useLoadSavedSupplyChain(): {
  snapshot: SupplyChainSnapshot | null;
  isLoading: boolean;
} {
  const { getLatestSnapshot, isLoading } = useMemory();
  const [snapshot, setSnapshot] = useState<SupplyChainSnapshot | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const saved = getLatestSnapshot();
      setSnapshot(saved);
    }
  }, [isLoading, getLatestSnapshot]);

  return { snapshot, isLoading };
}
