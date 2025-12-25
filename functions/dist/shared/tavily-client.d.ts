/**
 * Tavily Web Research Client for Beacon
 * Provides real-time web intelligence for supply chain risks and news
 */
import { Region } from './types';
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
 * Tavily Client for web research and intelligence
 */
export declare class TavilyClient {
    private apiKey;
    private baseUrl;
    private searchDepth;
    private maxResults;
    private cache;
    private readonly CACHE_TTL;
    private circuitBreaker;
    constructor(config: TavilyClientConfig);
    /**
     * Search for supply chain risks in a specific region
     */
    searchRisks(region: Region, category?: string): Promise<WebRisk[]>;
    /**
     * Get news about a specific supplier
     */
    getSupplierNews(supplierName: string): Promise<NewsItem[]>;
    /**
     * Scan for geopolitical risks affecting supply chains
     */
    scanGeopolitical(regions: Region[]): Promise<GeopoliticalAlert[]>;
    /**
     * Search for port and logistics disruptions
     */
    searchPortDisruptions(region: Region): Promise<WebRisk[]>;
    /**
     * Search for weather-related supply chain risks
     */
    searchWeatherRisks(region: Region): Promise<WebRisk[]>;
    /**
     * Core search method calling Tavily API
     */
    private search;
    /**
     * Retry mechanism with exponential backoff
     */
    private retryWithBackoff;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Parse search results into WebRisk objects
     */
    private parseRisksFromResults;
    /**
     * Parse search results into NewsItem objects
     */
    private parseNewsFromResults;
    /**
     * Parse search results into GeopoliticalAlert objects
     */
    private parseGeopoliticalFromResults;
    /**
     * Categorize risk based on content
     */
    private categorizeRisk;
    /**
     * Assess severity based on content and score
     */
    private assessSeverity;
    /**
     * Simple sentiment analysis
     */
    private analyzeSentiment;
    /**
     * Extract domain from URL
     */
    private extractDomain;
    /**
     * Truncate text to max length
     */
    private truncate;
    /**
     * Get display name for region
     */
    private getRegionDisplayName;
    /**
     * Generate cache key using FNV-1a hash
     */
    private getCacheKey;
    /**
     * Get cached response
     */
    private getCachedResponse;
    /**
     * Set cached response
     */
    private setCachedResponse;
    /**
     * Fallback risks when API is unavailable
     */
    private getFallbackRisks;
    /**
     * Fallback geopolitical alerts
     */
    private getFallbackGeopoliticalAlerts;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get client statistics
     */
    getStats(): {
        cacheSize: number;
        circuitBreakerState: string;
        circuitBreakerFailures: number;
    };
}
/**
 * Factory function to create TavilyClient with environment variables
 */
export declare function createTavilyClient(): TavilyClient;
export declare function getTavilyClient(): TavilyClient;
/**
 * Check if Tavily is configured
 */
export declare function isTavilyConfigured(): boolean;
//# sourceMappingURL=tavily-client.d.ts.map