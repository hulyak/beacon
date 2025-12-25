/**
 * Tavily Web Research Client for Beacon
 * Provides real-time web intelligence for supply chain risks and news
 */

import { monitoring } from './monitoring';
import { Region } from './types';

// Types for Tavily API
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  query: string;
  responseTime: number;
  answer?: string;
}

export interface WebRisk {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  region: string;
  category: 'logistics' | 'supplier' | 'geopolitical' | 'weather' | 'demand';
  severity: 'low' | 'medium' | 'high' | 'critical';
  publishedDate?: string;
  confidence: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedDate?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
}

export interface GeopoliticalAlert {
  id: string;
  title: string;
  summary: string;
  regions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  url: string;
  publishedDate?: string;
}

export interface TavilyClientConfig {
  apiKey: string;
  baseUrl?: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
}

/**
 * Circuit Breaker for Tavily API resilience
 */
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private options: {
      failureThreshold: number;
      resetTimeout: number;
    }
  ) {}

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    monitoring.recordEvent('tavily-client', 'circuit_breaker_success', 'info', {
      state: this.state,
    });
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      const previousState = this.state;
      this.state = 'OPEN';
      if (previousState !== 'OPEN') {
        monitoring.recordEvent('tavily-client', 'circuit_breaker_opened', 'critical', {
          failureCount: this.failureCount,
        });
      }
    }
  }

  isOpen(): boolean {
    if (this.state === 'CLOSED') {
      return false;
    }

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        monitoring.recordEvent('tavily-client', 'circuit_breaker_half_open', 'info');
        return false;
      }
      return true;
    }

    return false;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Tavily Client for web research and intelligence
 */
export class TavilyClient {
  private apiKey: string;
  private baseUrl: string;
  private searchDepth: 'basic' | 'advanced';
  private maxResults: number;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private circuitBreaker: CircuitBreaker;

  constructor(config: TavilyClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.tavily.com';
    this.searchDepth = config.searchDepth || 'basic';
    this.maxResults = config.maxResults || 10;
    this.cache = new Map();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
    });
  }

  /**
   * Search for supply chain risks in a specific region
   */
  async searchRisks(
    region: Region,
    category?: string
  ): Promise<WebRisk[]> {
    const cacheKey = this.getCacheKey('risks', region, category || 'all');
    const cached = this.getCachedResponse<WebRisk[]>(cacheKey);
    if (cached) {
      console.log('Returning cached risk search results');
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      console.log('Circuit breaker open, returning fallback risks');
      monitoring.recordFallbackUsage('tavily-client', 'circuit_breaker', 'Circuit breaker open');
      return this.getFallbackRisks(region);
    }

    const regionName = this.getRegionDisplayName(region);
    const categoryTerm = category && category !== 'all' ? ` ${category}` : '';
    const query = `supply chain${categoryTerm} risks disruptions ${regionName} 2024 2025`;

    try {
      const response = await this.search(query, {
        searchDepth: 'advanced',
        includeAnswer: true,
        topic: 'news',
      });

      const risks = this.parseRisksFromResults(response.results, region);
      this.setCachedResponse(cacheKey, risks);
      this.circuitBreaker.recordSuccess();

      return risks;
    } catch (error) {
      console.error('Failed to search risks:', error);
      this.circuitBreaker.recordFailure();
      monitoring.recordAIResponseFailure(
        'tavily-client',
        query,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return this.getFallbackRisks(region);
    }
  }

  /**
   * Get news about a specific supplier
   */
  async getSupplierNews(supplierName: string): Promise<NewsItem[]> {
    const cacheKey = this.getCacheKey('supplier', supplierName);
    const cached = this.getCachedResponse<NewsItem[]>(cacheKey);
    if (cached) {
      console.log('Returning cached supplier news');
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      console.log('Circuit breaker open, returning empty supplier news');
      monitoring.recordFallbackUsage('tavily-client', 'circuit_breaker', 'Circuit breaker open');
      return [];
    }

    const query = `"${supplierName}" supply chain manufacturing news 2024 2025`;

    try {
      const response = await this.search(query, {
        searchDepth: 'basic',
        topic: 'news',
      });

      const news = this.parseNewsFromResults(response.results, supplierName);
      this.setCachedResponse(cacheKey, news);
      this.circuitBreaker.recordSuccess();

      return news;
    } catch (error) {
      console.error('Failed to get supplier news:', error);
      this.circuitBreaker.recordFailure();
      monitoring.recordAIResponseFailure(
        'tavily-client',
        query,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return [];
    }
  }

  /**
   * Scan for geopolitical risks affecting supply chains
   */
  async scanGeopolitical(regions: Region[]): Promise<GeopoliticalAlert[]> {
    const cacheKey = this.getCacheKey('geopolitical', ...regions);
    const cached = this.getCachedResponse<GeopoliticalAlert[]>(cacheKey);
    if (cached) {
      console.log('Returning cached geopolitical alerts');
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      console.log('Circuit breaker open, returning fallback geopolitical alerts');
      monitoring.recordFallbackUsage('tavily-client', 'circuit_breaker', 'Circuit breaker open');
      return this.getFallbackGeopoliticalAlerts(regions);
    }

    const regionNames = regions.map((r) => this.getRegionDisplayName(r)).join(' OR ');
    const query = `geopolitical trade sanctions tariffs supply chain impact (${regionNames}) 2024 2025`;

    try {
      const response = await this.search(query, {
        searchDepth: 'advanced',
        includeAnswer: true,
        topic: 'news',
      });

      const alerts = this.parseGeopoliticalFromResults(response.results, regions);
      this.setCachedResponse(cacheKey, alerts);
      this.circuitBreaker.recordSuccess();

      return alerts;
    } catch (error) {
      console.error('Failed to scan geopolitical risks:', error);
      this.circuitBreaker.recordFailure();
      monitoring.recordAIResponseFailure(
        'tavily-client',
        query,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return this.getFallbackGeopoliticalAlerts(regions);
    }
  }

  /**
   * Search for port and logistics disruptions
   */
  async searchPortDisruptions(region: Region): Promise<WebRisk[]> {
    const cacheKey = this.getCacheKey('ports', region);
    const cached = this.getCachedResponse<WebRisk[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      monitoring.recordFallbackUsage('tavily-client', 'circuit_breaker', 'Circuit breaker open');
      return [];
    }

    const regionName = this.getRegionDisplayName(region);
    const query = `port congestion shipping delays logistics disruption ${regionName} 2024 2025`;

    try {
      const response = await this.search(query, {
        searchDepth: 'basic',
        topic: 'news',
      });

      const risks = this.parseRisksFromResults(response.results, region).map((r) => ({
        ...r,
        category: 'logistics' as const,
      }));

      this.setCachedResponse(cacheKey, risks);
      this.circuitBreaker.recordSuccess();

      return risks;
    } catch (error) {
      console.error('Failed to search port disruptions:', error);
      this.circuitBreaker.recordFailure();
      return [];
    }
  }

  /**
   * Search for weather-related supply chain risks
   */
  async searchWeatherRisks(region: Region): Promise<WebRisk[]> {
    const cacheKey = this.getCacheKey('weather', region);
    const cached = this.getCachedResponse<WebRisk[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      monitoring.recordFallbackUsage('tavily-client', 'circuit_breaker', 'Circuit breaker open');
      return [];
    }

    const regionName = this.getRegionDisplayName(region);
    const query = `severe weather hurricane typhoon flooding supply chain disruption ${regionName} 2024 2025`;

    try {
      const response = await this.search(query, {
        searchDepth: 'basic',
        topic: 'news',
      });

      const risks = this.parseRisksFromResults(response.results, region).map((r) => ({
        ...r,
        category: 'weather' as const,
      }));

      this.setCachedResponse(cacheKey, risks);
      this.circuitBreaker.recordSuccess();

      return risks;
    } catch (error) {
      console.error('Failed to search weather risks:', error);
      this.circuitBreaker.recordFailure();
      return [];
    }
  }

  /**
   * Core search method calling Tavily API
   */
  private async search(
    query: string,
    options: {
      searchDepth?: 'basic' | 'advanced';
      includeAnswer?: boolean;
      topic?: 'general' | 'news';
      maxResults?: number;
    } = {}
  ): Promise<TavilySearchResponse> {
    const startTime = Date.now();

    const requestBody = {
      api_key: this.apiKey,
      query,
      search_depth: options.searchDepth || this.searchDepth,
      include_answer: options.includeAnswer || false,
      topic: options.topic || 'general',
      max_results: options.maxResults || this.maxResults,
      include_raw_content: false,
    };

    const response = await this.retryWithBackoff<{ results?: TavilySearchResult[]; answer?: string }>(async () => {
      const res = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Tavily API error: ${res.status} - ${errorText}`);
      }

      return res.json() as Promise<{ results?: TavilySearchResult[]; answer?: string }>;
    });

    const responseTime = Date.now() - startTime;

    monitoring.recordEvent('tavily-client', 'search_completed', 'info', {
      query: query.substring(0, 50),
      resultCount: response.results?.length || 0,
      responseTime,
    });

    return {
      results: response.results || [],
      query,
      responseTime,
      answer: response.answer,
    };
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries) {
          break;
        }

        if (!this.isRetryableError(lastError)) {
          throw lastError;
        }

        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delayMs}ms delay`);
        await this.sleep(delayMs);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'rate limit',
      'quota exceeded',
      'service unavailable',
      'timeout',
      'network error',
      'connection error',
      '429',
      '503',
      '504',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse search results into WebRisk objects
   */
  private parseRisksFromResults(
    results: TavilySearchResult[],
    region: Region
  ): WebRisk[] {
    return results.slice(0, 5).map((result, index) => ({
      id: `risk_${Date.now()}_${index}`,
      title: result.title,
      summary: this.truncate(result.content, 200),
      source: this.extractDomain(result.url),
      url: result.url,
      region: this.getRegionDisplayName(region),
      category: this.categorizeRisk(result.content),
      severity: this.assessSeverity(result.content, result.score),
      publishedDate: result.publishedDate,
      confidence: Math.min(result.score * 100, 100),
    }));
  }

  /**
   * Parse search results into NewsItem objects
   */
  private parseNewsFromResults(
    results: TavilySearchResult[],
    context: string
  ): NewsItem[] {
    return results.slice(0, 5).map((result, index) => ({
      id: `news_${Date.now()}_${index}`,
      title: result.title,
      summary: this.truncate(result.content, 200),
      source: this.extractDomain(result.url),
      url: result.url,
      publishedDate: result.publishedDate,
      sentiment: this.analyzeSentiment(result.content),
      relevanceScore: result.score,
    }));
  }

  /**
   * Parse search results into GeopoliticalAlert objects
   */
  private parseGeopoliticalFromResults(
    results: TavilySearchResult[],
    regions: Region[]
  ): GeopoliticalAlert[] {
    return results.slice(0, 5).map((result, index) => ({
      id: `geo_${Date.now()}_${index}`,
      title: result.title,
      summary: this.truncate(result.content, 200),
      regions: regions.map((r) => this.getRegionDisplayName(r)),
      severity: this.assessSeverity(result.content, result.score),
      source: this.extractDomain(result.url),
      url: result.url,
      publishedDate: result.publishedDate,
    }));
  }

  /**
   * Categorize risk based on content
   */
  private categorizeRisk(
    content: string
  ): 'logistics' | 'supplier' | 'geopolitical' | 'weather' | 'demand' {
    const lower = content.toLowerCase();

    if (
      lower.includes('port') ||
      lower.includes('shipping') ||
      lower.includes('logistics') ||
      lower.includes('freight')
    ) {
      return 'logistics';
    }
    if (
      lower.includes('supplier') ||
      lower.includes('manufacturer') ||
      lower.includes('factory')
    ) {
      return 'supplier';
    }
    if (
      lower.includes('tariff') ||
      lower.includes('sanction') ||
      lower.includes('trade war') ||
      lower.includes('geopolitic')
    ) {
      return 'geopolitical';
    }
    if (
      lower.includes('weather') ||
      lower.includes('hurricane') ||
      lower.includes('typhoon') ||
      lower.includes('flood')
    ) {
      return 'weather';
    }
    if (
      lower.includes('demand') ||
      lower.includes('shortage') ||
      lower.includes('surge')
    ) {
      return 'demand';
    }

    return 'logistics'; // default
  }

  /**
   * Assess severity based on content and score
   */
  private assessSeverity(
    content: string,
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lower = content.toLowerCase();

    // Critical keywords
    if (
      lower.includes('critical') ||
      lower.includes('severe') ||
      lower.includes('major disruption') ||
      lower.includes('crisis')
    ) {
      return 'critical';
    }

    // High severity keywords
    if (
      lower.includes('significant') ||
      lower.includes('widespread') ||
      lower.includes('serious')
    ) {
      return 'high';
    }

    // Use score for medium/low
    if (score > 0.7) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const lower = content.toLowerCase();

    const negativeWords = [
      'disruption',
      'delay',
      'shortage',
      'crisis',
      'risk',
      'decline',
      'failure',
      'problem',
    ];
    const positiveWords = [
      'growth',
      'improvement',
      'recovery',
      'success',
      'expansion',
      'profit',
    ];

    let negativeCount = 0;
    let positiveCount = 0;

    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++;
    }
    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++;
    }

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Truncate text to max length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get display name for region
   */
  private getRegionDisplayName(region: Region): string {
    const names: Record<Region, string> = {
      asia: 'Asia',
      europe: 'Europe',
      north_america: 'North America',
      south_america: 'South America',
      global: 'Global',
    };
    return names[region] || region;
  }

  /**
   * Generate cache key using FNV-1a hash
   */
  private getCacheKey(...parts: string[]): string {
    const key = parts.join(':');
    const FNV_OFFSET_BASIS = 2166136261;
    const FNV_PRIME = 16777619;

    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }

    return (hash >>> 0).toString(16);
  }

  /**
   * Get cached response
   */
  private getCachedResponse<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached response
   */
  private setCachedResponse(key: string, data: unknown): void {
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
    });
  }

  /**
   * Fallback risks when API is unavailable
   */
  private getFallbackRisks(region: Region): WebRisk[] {
    const regionName = this.getRegionDisplayName(region);
    return [
      {
        id: 'fallback_risk_1',
        title: `Supply chain monitoring active for ${regionName}`,
        summary:
          'Real-time web intelligence temporarily unavailable. Using cached data and internal analytics.',
        source: 'beacon-internal',
        url: '',
        region: regionName,
        category: 'logistics',
        severity: 'low',
        confidence: 50,
      },
    ];
  }

  /**
   * Fallback geopolitical alerts
   */
  private getFallbackGeopoliticalAlerts(regions: Region[]): GeopoliticalAlert[] {
    return [
      {
        id: 'fallback_geo_1',
        title: 'Geopolitical monitoring active',
        summary:
          'Real-time geopolitical scanning temporarily unavailable. Standard monitoring continues.',
        regions: regions.map((r) => this.getRegionDisplayName(r)),
        severity: 'low',
        source: 'beacon-internal',
        url: '',
      },
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get client statistics
   */
  getStats(): {
    cacheSize: number;
    circuitBreakerState: string;
    circuitBreakerFailures: number;
  } {
    return {
      cacheSize: this.cache.size,
      circuitBreakerState: this.circuitBreaker.getState(),
      circuitBreakerFailures: this.circuitBreaker.getFailureCount(),
    };
  }
}

/**
 * Factory function to create TavilyClient with environment variables
 */
export function createTavilyClient(): TavilyClient {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY environment variable is required');
  }

  return new TavilyClient({
    apiKey,
    searchDepth: 'basic',
    maxResults: 10,
  });
}

/**
 * Singleton instance
 */
let tavilyClientInstance: TavilyClient | null = null;

export function getTavilyClient(): TavilyClient {
  if (!tavilyClientInstance) {
    tavilyClientInstance = createTavilyClient();
  }
  return tavilyClientInstance;
}

/**
 * Check if Tavily is configured
 */
export function isTavilyConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY;
}
