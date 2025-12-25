/**
 * Network-aware API client with retry logic and caching
 */

import {
  fetchWithRetry,
  getConnectionMonitor,
  getResponseCache,
  getUserFriendlyErrorMessage,
  createNetworkError,
  type RetryOptions,
  type NetworkError,
} from './network-utils';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retryOptions?: RetryOptions;
  enableCache?: boolean;
  defaultHeaders?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  fromCache: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryOptions: RetryOptions;
  private enableCache: boolean;
  private defaultHeaders: Record<string, string>;
  private connectionMonitor = getConnectionMonitor();
  private responseCache = getResponseCache();

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || 30000;
    this.retryOptions = options.retryOptions || {};
    this.enableCache = options.enableCache ?? true;
    this.defaultHeaders = options.defaultHeaders || {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; useCache?: boolean }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions('GET', options);

    // Check cache first if enabled
    if (this.enableCache && cacheOptions?.useCache !== false) {
      const cached = this.responseCache.get(url, requestOptions);
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          fromCache: true,
        };
      }
    }

    try {
      const response = await this.makeRequest(url, requestOptions);
      const data = await this.parseResponse<T>(response);

      // Cache successful responses
      if (this.enableCache && response.ok) {
        this.responseCache.set(url, data, requestOptions, cacheOptions?.ttl);
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        fromCache: false,
      };
    } catch (error) {
      // Try to return cached response on error if available
      if (this.enableCache) {
        const cached = this.responseCache.get(url, requestOptions);
        if (cached) {
          console.log('Returning cached response due to error:', error);
          return {
            data: cached,
            status: 200,
            headers: new Headers(),
            fromCache: true,
          };
        }
      }

      throw this.handleError(error, endpoint);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions('POST', {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      const responseData = await this.parseResponse<T>(response);

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        fromCache: false,
      };
    } catch (error) {
      throw this.handleError(error, endpoint);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions('PUT', {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      const responseData = await this.parseResponse<T>(response);

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        fromCache: false,
      };
    } catch (error) {
      throw this.handleError(error, endpoint);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions('DELETE', options);

    try {
      const response = await this.makeRequest(url, requestOptions);
      const responseData = await this.parseResponse<T>(response);

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        fromCache: false,
      };
    } catch (error) {
      throw this.handleError(error, endpoint);
    }
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  /**
   * Build request options
   */
  private buildRequestOptions(method: string, options: RequestInit): RequestInit {
    return {
      ...options,
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };
  }

  /**
   * Make the actual request with retry logic
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    // Check connection status
    if (!this.connectionMonitor.getStatus()) {
      throw createNetworkError('No internet connection available');
    }

    return fetchWithRetry(url, options, {
      ...this.retryOptions,
      onRetry: (attempt, error) => {
        console.log(`API retry attempt ${attempt} for ${url}:`, error.message);
        this.retryOptions.onRetry?.(attempt, error);
      },
    });
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    } else {
      return response.blob() as unknown as T;
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, endpoint: string): NetworkError {
    if (error instanceof Error) {
      const networkError = error as NetworkError;
      
      if (networkError.isNetworkError) {
        return networkError;
      }

      return createNetworkError(
        `API request failed for ${endpoint}: ${error.message}`,
        undefined,
        error
      );
    }

    return createNetworkError(`Unknown error occurred for ${endpoint}`);
  }

  /**
   * Get connection status
   */
  public isOnline(): boolean {
    return this.connectionMonitor.getStatus();
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    return this.connectionMonitor.subscribe(callback);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return this.responseCache.getStats();
  }
}

/**
 * Beacon-specific API client
 */
export class BeaconApiClient extends ApiClient {
  constructor() {
    super({
      baseUrl: process.env.NODE_ENV === 'production'
        ? 'https://your-cloud-functions-url'
        : 'http://localhost:8080',
      timeout: 15000, // 15 seconds for voice operations
      retryOptions: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000,
      },
      enableCache: true,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'X-Client': 'Beacon-Web',
      },
    });
  }

  /**
   * Analyze supply chain risks
   */
  async analyzeRisks(params: {
    region: string;
    category?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/analyze-risks', params, {
      // Cache risk analysis for 2 minutes
    });
  }

  /**
   * Run scenario simulation
   */
  async runScenario(params: {
    scenarioType: string;
    region?: string;
    severity?: string;
    parameters?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.post('/run-scenario', params);
  }

  /**
   * Get active alerts
   */
  async getAlerts(params: {
    priority?: string;
    limit?: number;
    region?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/get-alerts', params, {
      // Cache alerts for 30 seconds
    });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health', {}, { ttl: 10000, useCache: false });
  }
}

/**
 * Singleton instance
 */
let beaconApiClientInstance: BeaconApiClient | null = null;

export function getBeaconApiClient(): BeaconApiClient {
  if (!beaconApiClientInstance) {
    beaconApiClientInstance = new BeaconApiClient();
  }
  return beaconApiClientInstance;
}

/**
 * Hook for using API client in React components
 */
export function useApiClient() {
  const client = getBeaconApiClient();

  return {
    client,
    isOnline: client.isOnline(),
    analyzeRisks: client.analyzeRisks.bind(client),
    runScenario: client.runScenario.bind(client),
    getAlerts: client.getAlerts.bind(client),
    healthCheck: client.healthCheck.bind(client),
    clearCache: client.clearCache.bind(client),
    getCacheStats: client.getCacheStats.bind(client),
  };
}

/**
 * Error boundary helper for API errors
 */
export function handleApiError(error: unknown): {
  message: string;
  isRetryable: boolean;
  shouldShowFallback: boolean;
} {
  const networkError = error as NetworkError;

  if (networkError?.isNetworkError) {
    return {
      message: getUserFriendlyErrorMessage(networkError),
      isRetryable: networkError.isRetryable,
      shouldShowFallback: !networkError.isRetryable || networkError.status === 503,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    shouldShowFallback: false,
  };
}