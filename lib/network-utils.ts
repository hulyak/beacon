/**
 * Network utilities for handling errors and retries
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface NetworkError extends Error {
  status?: number;
  isNetworkError: boolean;
  isRetryable: boolean;
  originalError?: Error;
}

/**
 * Create a network error with additional metadata
 */
export function createNetworkError(
  message: string,
  status?: number,
  originalError?: Error
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.name = 'NetworkError';
  error.status = status;
  error.isNetworkError = true;
  error.isRetryable = isRetryableError(status, originalError);
  error.originalError = originalError;
  return error;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(status?: number, error?: Error): boolean {
  // Network errors (no status code)
  if (!status && error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound')
    );
  }

  // HTTP status codes that are retryable
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return status ? retryableStatuses.includes(status) : false;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  multiplier: number = 2
): number {
  const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const networkError = error as NetworkError;
      const shouldRetry =
        networkError.isRetryable ||
        (networkError.status && retryableStatuses.includes(networkError.status)) ||
        isRetryableError(networkError.status, lastError);

      if (!shouldRetry) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        error: lastError.message,
        status: networkError.status,
      });

      onRetry?.(attempt + 1, lastError);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw createNetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw createNetworkError('Request timeout', 408, error);
        }
        if (error.message.includes('Failed to fetch')) {
          throw createNetworkError('Network connection failed', undefined, error);
        }
      }
      throw error;
    }
  }, retryOptions);
}

/**
 * Connection status monitor
 */
export class ConnectionMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    console.log('Connection restored');
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.notifyListeners(true);
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  };

  private handleOffline = (): void => {
    console.log('Connection lost');
    this.isOnline = false;
    this.notifyListeners(false);
    this.scheduleReconnect();
  };

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const delay = calculateBackoffDelay(this.reconnectAttempts, 2000, 60000);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.checkConnection();
    }, delay);
  }

  private async checkConnection(): Promise<void> {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        this.handleOnline();
      } else {
        this.scheduleReconnect();
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      this.scheduleReconnect();
    }
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline));
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.listeners.clear();
  }
}

/**
 * Response cache for offline scenarios
 */
export class ResponseCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Set cached response
   */
  public set(url: string, data: any, options?: RequestInit, ttl: number = this.DEFAULT_TTL): void {
    const key = this.getCacheKey(url, options);
    
    // Limit cache size
    if (this.cache.size >= 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached response if valid
   */
  public get(url: string, options?: RequestInit): any | null {
    const key = this.getCacheKey(url, options);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log('Returning cached response for:', url);
    return cached.data;
  }

  /**
   * Clear cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Singleton instances
 */
let connectionMonitorInstance: ConnectionMonitor | null = null;
let responseCacheInstance: ResponseCache | null = null;

export function getConnectionMonitor(): ConnectionMonitor {
  if (!connectionMonitorInstance) {
    connectionMonitorInstance = new ConnectionMonitor();
  }
  return connectionMonitorInstance;
}

export function getResponseCache(): ResponseCache {
  if (!responseCacheInstance) {
    responseCacheInstance = new ResponseCache();
  }
  return responseCacheInstance;
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyErrorMessage(error: Error | NetworkError): string {
  const networkError = error as NetworkError;

  if (networkError.isNetworkError) {
    if (!networkError.status) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    switch (networkError.status) {
      case 408:
        return 'The request took too long to complete. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error occurred. Our team has been notified. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again in a few moments.';
      case 504:
        return 'Gateway timeout. The server took too long to respond. Please try again.';
      default:
        return `An error occurred (${networkError.status}). Please try again.`;
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}