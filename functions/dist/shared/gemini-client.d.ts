import { ResponseValidationSchema } from './utils';
export interface GeminiClientConfig {
    projectId: string;
    location: string;
    model: string;
}
export interface GenerateContentOptions {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
}
export declare class GeminiClient {
    private vertexAI;
    private model;
    private cache;
    private readonly CACHE_TTL;
    private circuitBreaker;
    constructor(config: GeminiClientConfig);
    /**
     * Generate content using Vertex AI Gemini with circuit breaker and validation
     */
    generateContent(prompt: string, systemContext?: string, options?: GenerateContentOptions): Promise<string>;
    /**
     * Generate structured content with JSON schema validation
     */
    generateStructuredContent<T>(prompt: string, schema: ResponseValidationSchema, systemContext?: string, options?: GenerateContentOptions): Promise<T>;
    /**
     * Generate supply chain analysis with domain-specific context and validation
     */
    generateSupplyChainAnalysis(prompt: string, context?: string): Promise<string>;
    /**
     * Extract region from prompt text
     */
    private extractRegionFromPrompt;
    /**
     * Retry mechanism with exponential backoff
     */
    private retryWithBackoff;
    /**
     * Check if an error is retryable
     */
    private isRetryableError;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
    /**
     * Generate cache key for responses using a proper hash function
     * Uses FNV-1a hash which has better distribution than simple additive hash
     */
    private getCacheKey;
    /**
     * Get cached response if valid
     */
    private getCachedResponse;
    /**
     * Cache a response
     */
    private setCachedResponse;
    /**
     * Get fallback response for common queries with enhanced templates
     */
    private getFallbackResponse;
    /**
     * Clear cache (useful for testing)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
/**
 * Factory function to create GeminiClient with environment variables
 */
export declare function createGeminiClient(): GeminiClient;
export declare function getGeminiClient(): GeminiClient;
//# sourceMappingURL=gemini-client.d.ts.map