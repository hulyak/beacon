/**
 * Voice service fallback mechanisms
 */

import { createElevenLabsError, ELEVENLABS_ERRORS, type ElevenLabsError } from './elevenlabs';
import { getBeaconApiClient } from './api-client';
import type { Message } from '@/app/components/VoiceAgent';

export interface VoiceFallbackOptions {
  enableTextFallback?: boolean;
  enableCachedResponses?: boolean;
  maxRetryAttempts?: number;
  retryDelay?: number;
}

export interface VoiceServiceStatus {
  isAvailable: boolean;
  lastChecked: Date;
  error?: ElevenLabsError;
  fallbackMode: 'none' | 'text' | 'cached';
}

export class VoiceFallbackManager {
  private status: VoiceServiceStatus = {
    isAvailable: true,
    lastChecked: new Date(),
    fallbackMode: 'none',
  };
  
  private options: Required<VoiceFallbackOptions>;
  private listeners: Set<(status: VoiceServiceStatus) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private apiClient = getBeaconApiClient();
  private conversationCache: Map<string, string> = new Map();

  constructor(options: VoiceFallbackOptions = {}) {
    this.options = {
      enableTextFallback: options.enableTextFallback ?? true,
      enableCachedResponses: options.enableCachedResponses ?? true,
      maxRetryAttempts: options.maxRetryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 5000,
    };

    this.startHealthCheck();
  }

  /**
   * Check if ElevenLabs service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      // Try to make a simple request to ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'HEAD',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
        },
      });

      const isAvailable = response.ok;
      this.updateStatus({
        isAvailable,
        lastChecked: new Date(),
        error: isAvailable ? undefined : createElevenLabsError(
          ELEVENLABS_ERRORS.CONNECTION_FAILED,
          `ElevenLabs API returned ${response.status}`,
          true
        ),
        fallbackMode: isAvailable ? 'none' : this.determineFallbackMode(),
      });

      return isAvailable;
    } catch (error) {
      console.error('ElevenLabs health check failed:', error);
      
      this.updateStatus({
        isAvailable: false,
        lastChecked: new Date(),
        error: createElevenLabsError(
          ELEVENLABS_ERRORS.CONNECTION_FAILED,
          error instanceof Error ? error.message : 'Service unavailable',
          true
        ),
        fallbackMode: this.determineFallbackMode(),
      });

      return false;
    }
  }

  /**
   * Handle voice service error and determine fallback
   */
  handleVoiceError(error: Error): {
    shouldFallback: boolean;
    fallbackMode: 'text' | 'cached' | 'none';
    message: string;
  } {
    console.error('Voice service error:', error);

    const voiceError = createElevenLabsError(
      ELEVENLABS_ERRORS.CONNECTION_FAILED,
      error.message,
      true
    );

    this.updateStatus({
      isAvailable: false,
      lastChecked: new Date(),
      error: voiceError,
      fallbackMode: this.determineFallbackMode(),
    });

    const fallbackMode = this.determineFallbackMode();
    
    return {
      shouldFallback: fallbackMode !== 'none',
      fallbackMode,
      message: this.getFallbackMessage(fallbackMode),
    };
  }

  /**
   * Process message through fallback mechanisms
   */
  async processFallbackMessage(message: string): Promise<{
    response: string;
    source: 'api' | 'cache' | 'template';
  }> {
    // Try API first if available
    if (this.apiClient.isOnline()) {
      try {
        const result = await this.processMessageThroughAPI(message);
        if (result) {
          // Cache the successful response
          this.cacheConversation(message, result);
          return { response: result, source: 'api' };
        }
      } catch (error) {
        console.error('API fallback failed:', error);
      }
    }

    // Try cached responses
    if (this.options.enableCachedResponses) {
      const cached = this.getCachedResponse(message);
      if (cached) {
        return { response: cached, source: 'cache' };
      }
    }

    // Use template responses as last resort
    const template = this.getTemplateResponse(message);
    return { response: template, source: 'template' };
  }

  /**
   * Process message through API services
   */
  private async processMessageThroughAPI(message: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase();

    try {
      if (lowerMessage.includes('risk')) {
        const region = this.extractRegion(message) || 'global';
        const response = await this.apiClient.analyzeRisks({ region });
        return this.formatApiResponse(response.data);
      } else if (lowerMessage.includes('scenario')) {
        const scenarioType = this.extractScenarioType(message) || 'supplier_failure';
        const response = await this.apiClient.runScenario({ scenarioType });
        return this.formatApiResponse(response.data);
      } else if (lowerMessage.includes('alert')) {
        const response = await this.apiClient.getAlerts({ priority: 'high' });
        return this.formatApiResponse(response.data);
      }
    } catch (error) {
      console.error('API processing failed:', error);
    }

    return null;
  }

  /**
   * Format API response for voice output
   */
  private formatApiResponse(data: any): string {
    if (data.summary) {
      return data.summary;
    } else if (data.recommendation) {
      return data.recommendation;
    } else if (data.alerts && Array.isArray(data.alerts)) {
      const count = data.alerts.length;
      const critical = data.alerts.filter((a: any) => a.priority === 'critical').length;
      return `Found ${count} alerts, including ${critical} critical issues requiring immediate attention.`;
    } else {
      return 'Analysis completed. Please check the dashboard for detailed results.';
    }
  }

  /**
   * Extract region from message
   */
  private extractRegion(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('asia')) return 'asia';
    if (lowerMessage.includes('europe')) return 'europe';
    if (lowerMessage.includes('north america') || lowerMessage.includes('america')) return 'north_america';
    if (lowerMessage.includes('south america')) return 'south_america';
    
    return null;
  }

  /**
   * Extract scenario type from message
   */
  private extractScenarioType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('supplier')) return 'supplier_failure';
    if (lowerMessage.includes('port')) return 'port_closure';
    if (lowerMessage.includes('demand')) return 'demand_surge';
    if (lowerMessage.includes('disaster') || lowerMessage.includes('weather')) return 'natural_disaster';
    
    return null;
  }

  /**
   * Get cached conversation response
   */
  private getCachedResponse(message: string): string | null {
    const key = this.normalizeMessage(message);
    return this.conversationCache.get(key) || null;
  }

  /**
   * Cache conversation pair
   */
  private cacheConversation(message: string, response: string): void {
    const key = this.normalizeMessage(message);
    
    // Limit cache size
    if (this.conversationCache.size >= 50) {
      const firstKey = this.conversationCache.keys().next().value;
      if (firstKey) {
        this.conversationCache.delete(firstKey);
      }
    }
    
    this.conversationCache.set(key, response);
  }

  /**
   * Normalize message for caching
   */
  private normalizeMessage(message: string): string {
    return message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100); // Limit key length
  }

  /**
   * Get template response for common queries
   */
  private getTemplateResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('risk') && lowerMessage.includes('asia')) {
      return 'Asia region currently shows elevated supply chain risks due to port congestion and transportation delays. Recommend increasing inventory buffers and diversifying supplier base.';
    } else if (lowerMessage.includes('risk') && lowerMessage.includes('europe')) {
      return 'Europe region has moderate risk levels with some transportation challenges. Monitor key suppliers and maintain adequate safety stock.';
    } else if (lowerMessage.includes('scenario') && lowerMessage.includes('supplier')) {
      return 'Supplier failure scenario would impact approximately 25-30% of operations. Recovery time estimated at 2-3 weeks. Activate backup suppliers immediately.';
    } else if (lowerMessage.includes('scenario') && lowerMessage.includes('port')) {
      return 'Port closure scenario would reduce capacity by 40-50%. Alternative routes available with 5-7 day delays. Financial impact estimated at 2-3 million per week.';
    } else if (lowerMessage.includes('alert')) {
      return 'Current system shows multiple active alerts. Check dashboard for detailed information on high-priority issues requiring attention.';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m Beacon, your supply chain assistant. I can help analyze risks, run scenarios, and check alerts. What would you like to know?';
    } else if (lowerMessage.includes('help')) {
      return 'I can help with risk analysis, scenario simulations, and alert monitoring. Try asking about risks in a specific region or running a supplier failure scenario.';
    } else {
      return 'I understand you\'re asking about supply chain operations. While voice services are temporarily unavailable, I can still help through text. Please rephrase your question or check the dashboard for detailed information.';
    }
  }

  /**
   * Determine appropriate fallback mode
   */
  private determineFallbackMode(): 'text' | 'cached' | 'none' {
    if (this.options.enableTextFallback) {
      return 'text';
    } else if (this.options.enableCachedResponses) {
      return 'cached';
    } else {
      return 'none';
    }
  }

  /**
   * Get fallback message for user
   */
  private getFallbackMessage(mode: 'text' | 'cached' | 'none'): string {
    switch (mode) {
      case 'text':
        return 'Voice services are temporarily unavailable. Switching to text mode to continue helping you.';
      case 'cached':
        return 'Voice services are unavailable. Using cached responses for common queries.';
      case 'none':
        return 'Voice services are currently unavailable. Please try again later.';
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkServiceHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(newStatus: VoiceServiceStatus): void {
    this.status = newStatus;
    this.listeners.forEach(listener => listener(newStatus));
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: (status: VoiceServiceStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current status
   */
  getStatus(): VoiceServiceStatus {
    return { ...this.status };
  }

  /**
   * Force retry voice service
   */
  async retryVoiceService(): Promise<boolean> {
    console.log('Retrying voice service...');
    return this.checkServiceHealth();
  }

  /**
   * Clear conversation cache
   */
  clearCache(): void {
    this.conversationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.conversationCache.size,
      keys: Array.from(this.conversationCache.keys()),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners.clear();
    this.conversationCache.clear();
  }
}

/**
 * Singleton instance
 */
let voiceFallbackManagerInstance: VoiceFallbackManager | null = null;

export function getVoiceFallbackManager(): VoiceFallbackManager {
  if (!voiceFallbackManagerInstance) {
    voiceFallbackManagerInstance = new VoiceFallbackManager();
  }
  return voiceFallbackManagerInstance;
}

/**
 * Hook for using voice fallback in React components
 */
export function useVoiceFallback() {
  const manager = getVoiceFallbackManager();
  
  return {
    manager,
    checkHealth: manager.checkServiceHealth.bind(manager),
    handleError: manager.handleVoiceError.bind(manager),
    processFallback: manager.processFallbackMessage.bind(manager),
    retry: manager.retryVoiceService.bind(manager),
    getStatus: manager.getStatus.bind(manager),
    subscribe: manager.subscribe.bind(manager),
  };
}