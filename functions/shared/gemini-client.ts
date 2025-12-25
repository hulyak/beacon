import { VertexAI } from '@google-cloud/vertexai';
import {
  validateResponse,
  parseAndValidateJSON,
  sanitizeAIResponse,
  validateAIResponseQuality,
  parseResponseWithFallback,
  generateFallbackResponse,
  ResponseValidationSchema,
  delay,
} from './utils';
import { monitoring } from './monitoring';

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

export class GeminiClient {
  private vertexAI: VertexAI;
  private model: string;
  private cache: Map<string, { content: string; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private circuitBreaker: CircuitBreaker;

  constructor(config: GeminiClientConfig) {
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location,
    });
    this.model = config.model;
    this.cache = new Map();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
    });
  }

  /**
   * Generate content using Vertex AI Gemini with circuit breaker and validation
   */
  async generateContent(
    prompt: string,
    systemContext?: string,
    options: GenerateContentOptions = {}
  ): Promise<string> {
    const cacheKey = this.getCacheKey(prompt, systemContext, options);
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      console.log('Returning cached Gemini response');
      return cached;
    }

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      console.log('Circuit breaker is open, returning fallback response');
      const fallback = this.getFallbackResponse(prompt);
      return fallback || 'Service temporarily unavailable. Please try again later.';
    }

    try {
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
          topP: options.topP ?? 0.8,
          topK: options.topK ?? 40,
        },
      });

      // Construct the full prompt with system context
      const fullPrompt = systemContext 
        ? `${systemContext}\n\nUser Query: ${prompt}`
        : prompt;

      console.log('Calling Vertex AI Gemini with prompt length:', fullPrompt.length);
      
      const result = await this.retryWithBackoff(async () => {
        const response = await generativeModel.generateContent(fullPrompt);
        const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!text) {
          throw new Error('No content generated from Gemini');
        }

        // Validate response quality
        const validation = validateAIResponseQuality(text);
        if (!validation.isValid) {
          console.warn('AI response quality issues:', validation.errors);
          monitoring.recordValidationFailure('gemini-client', 'quality', validation.errors);
          // Continue anyway but log the issues
        }

        return text;
      });

      // Cache the response
      this.setCachedResponse(cacheKey, result);
      
      // Record success in circuit breaker
      this.circuitBreaker.recordSuccess();

      console.log('Generated content length:', result.length);
      return result;

    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Record failure in monitoring
      monitoring.recordAIResponseFailure(
        'gemini-client',
        prompt.substring(0, 100),
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Record failure in circuit breaker
      this.circuitBreaker.recordFailure();
      
      // Try to return cached response as fallback
      const fallbackCached = this.getCachedResponse(cacheKey, true); // Allow expired cache
      if (fallbackCached) {
        console.log('Returning expired cached response as fallback');
        monitoring.recordFallbackUsage('gemini-client', 'cache', 'AI service failure');
        return fallbackCached;
      }
      
      // Return generic fallback response
      const fallback = this.getFallbackResponse(prompt);
      if (fallback) {
        console.log('Returning fallback response');
        monitoring.recordFallbackUsage('gemini-client', 'template', 'AI service failure');
        return fallback;
      }
      
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate structured content with JSON schema validation
   */
  async generateStructuredContent<T>(
    prompt: string,
    schema: ResponseValidationSchema,
    systemContext?: string,
    options: GenerateContentOptions = {}
  ): Promise<T> {
    const structuredPrompt = `${prompt}

Please respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Ensure your response is valid JSON and follows the schema exactly.`;

    try {
      const responsePromise = this.generateContent(structuredPrompt, systemContext, options);
      
      const result = await parseResponseWithFallback<T>(
        responsePromise,
        schema,
        undefined, // No fallback template for structured content
        undefined,
        2 // Max retries
      );

      if (result.source === 'ai' && result.data) {
        return result.data as T;
      } else {
        monitoring.recordParsingFailure(
          'gemini-client',
          structuredPrompt.substring(0, 100),
          result.errors.join(', ')
        );
        throw new Error(`Failed to generate valid structured content: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to generate structured response:', error);
      monitoring.recordAIResponseFailure(
        'gemini-client',
        structuredPrompt.substring(0, 100),
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error(`Failed to generate structured response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate supply chain analysis with domain-specific context and validation
   */
  async generateSupplyChainAnalysis(
    prompt: string,
    context?: string
  ): Promise<string> {
    const systemContext = `You are Beacon, an AI-powered supply chain intelligence assistant. You help supply chain managers monitor risks, run simulations, and make data-driven decisions.

Your expertise includes:
- Supply chain risk analysis across global regions
- Scenario simulation and contingency planning
- Real-time alert prioritization and response
- Financial impact assessment
- Mitigation strategy recommendations

Guidelines for responses:
- Be concise and actionable (under 3 sentences when possible)
- Include specific data points, percentages, and timeframes
- Focus on practical recommendations
- Use professional but approachable tone
- Prioritize critical information first

${context ? `Additional Context: ${context}` : ''}`;

    try {
      // Determine fallback type based on prompt content
      let fallbackType: 'risk_analysis' | 'scenario_simulation' | 'alert_summary' | undefined;
      let fallbackVariables: Record<string, string> = {};

      if (prompt.toLowerCase().includes('risk')) {
        fallbackType = 'risk_analysis';
        fallbackVariables = {
          region: this.extractRegionFromPrompt(prompt) || 'the region',
          risk_level: 'moderate',
        };
      } else if (prompt.toLowerCase().includes('scenario')) {
        fallbackType = 'scenario_simulation';
        fallbackVariables = {
          impact_level: 'moderate',
          recovery_time: '2-3 weeks',
        };
      } else if (prompt.toLowerCase().includes('alert')) {
        fallbackType = 'alert_summary';
        fallbackVariables = {
          alert_count: 'multiple',
        };
      }

      const responsePromise = this.generateContent(prompt, systemContext, {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxOutputTokens: 1024,
      });

      const result = await parseResponseWithFallback<string>(
        responsePromise,
        undefined, // No schema for text responses
        fallbackType,
        fallbackVariables,
        2 // Max retries
      );

      return result.data;
    } catch (error) {
      console.error('Supply chain analysis failed:', error);
      monitoring.recordAIResponseFailure(
        'gemini-client',
        prompt.substring(0, 100),
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Final fallback
      const finalFallback = 'Supply chain analysis temporarily unavailable. Please monitor key metrics and maintain safety stock levels. Contact support if issues persist.';
      monitoring.recordFallbackUsage('gemini-client', 'template', 'All analysis methods failed');
      return finalFallback;
    }
  }

  /**
   * Extract region from prompt text
   */
  private extractRegionFromPrompt(prompt: string): string | null {
    const regions = ['asia', 'europe', 'north america', 'south america', 'global'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const region of regions) {
      if (lowerPrompt.includes(region)) {
        return region;
      }
    }
    
    return null;
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

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms delay`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'rate limit',
      'quota exceeded',
      'service unavailable',
      'timeout',
      'network error',
      'connection error',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return delay(ms);
  }

  /**
   * Generate cache key for responses using a proper hash function
   * Uses FNV-1a hash which has better distribution than simple additive hash
   */
  private getCacheKey(
    prompt: string,
    systemContext?: string,
    options: GenerateContentOptions = {}
  ): string {
    const key = JSON.stringify({
      prompt: prompt.substring(0, 200), // Include more of the prompt for uniqueness
      systemContext: systemContext?.substring(0, 100),
      options,
    });

    // FNV-1a hash implementation - better distribution, fewer collisions
    const FNV_OFFSET_BASIS = 2166136261;
    const FNV_PRIME = 16777619;

    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }

    // Convert to unsigned 32-bit integer and return as hex string for readability
    const unsignedHash = hash >>> 0;
    return unsignedHash.toString(16);
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse(key: string, allowExpired: boolean = false): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (!allowExpired && now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Cache a response
   */
  private setCachedResponse(key: string, content: string): void {
    // Limit cache size
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Get fallback response for common queries with enhanced templates
   */
  private getFallbackResponse(prompt: string): string | null {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('risk') && lowerPrompt.includes('asia')) {
      return generateFallbackResponse('risk_analysis', { region: 'Asia', risk_level: 'high' });
    } else if (lowerPrompt.includes('risk') && lowerPrompt.includes('europe')) {
      return generateFallbackResponse('risk_analysis', { region: 'Europe', risk_level: 'moderate' });
    } else if (lowerPrompt.includes('scenario') && lowerPrompt.includes('supplier')) {
      return generateFallbackResponse('scenario_simulation', { impact_level: 'moderate', recovery_time: '2-3 weeks' });
    } else if (lowerPrompt.includes('alert')) {
      return generateFallbackResponse('alert_summary', { alert_count: '3' });
    } else if (lowerPrompt.includes('scenario') && lowerPrompt.includes('port')) {
      return generateFallbackResponse('scenario_simulation', { impact_level: 'high', recovery_time: '1-2 weeks' });
    }
    
    return null;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Factory function to create GeminiClient with environment variables
 */
export function createGeminiClient(): GeminiClient {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
  }

  return new GeminiClient({
    projectId,
    location,
    model,
  });
}

/**
 * Singleton instance for reuse across functions
 */
let geminiClientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = createGeminiClient();
  }
  return geminiClientInstance;
}

/**
 * Circuit breaker pattern implementation
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

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
    if (this.state === 'CLOSED') {
      return false;
    }

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    // HALF_OPEN state
    return false;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}