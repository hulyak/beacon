"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
exports.createGeminiClient = createGeminiClient;
exports.getGeminiClient = getGeminiClient;
const vertexai_1 = require("@google-cloud/vertexai");
const utils_1 = require("./utils");
const monitoring_1 = require("./monitoring");
class GeminiClient {
    constructor(config) {
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.vertexAI = new vertexai_1.VertexAI({
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
    async generateContent(prompt, systemContext, options = {}) {
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
                const validation = (0, utils_1.validateAIResponseQuality)(text);
                if (!validation.isValid) {
                    console.warn('AI response quality issues:', validation.errors);
                    monitoring_1.monitoring.recordValidationFailure('gemini-client', 'quality', validation.errors);
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
        }
        catch (error) {
            console.error('Gemini API error:', error);
            // Record failure in monitoring
            monitoring_1.monitoring.recordAIResponseFailure('gemini-client', prompt.substring(0, 100), error instanceof Error ? error.message : 'Unknown error');
            // Record failure in circuit breaker
            this.circuitBreaker.recordFailure();
            // Try to return cached response as fallback
            const fallbackCached = this.getCachedResponse(cacheKey, true); // Allow expired cache
            if (fallbackCached) {
                console.log('Returning expired cached response as fallback');
                monitoring_1.monitoring.recordFallbackUsage('gemini-client', 'cache', 'AI service failure');
                return fallbackCached;
            }
            // Return generic fallback response
            const fallback = this.getFallbackResponse(prompt);
            if (fallback) {
                console.log('Returning fallback response');
                monitoring_1.monitoring.recordFallbackUsage('gemini-client', 'template', 'AI service failure');
                return fallback;
            }
            throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate structured content with JSON schema validation
     */
    async generateStructuredContent(prompt, schema, systemContext, options = {}) {
        const structuredPrompt = `${prompt}

Please respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Ensure your response is valid JSON and follows the schema exactly.`;
        try {
            const responsePromise = this.generateContent(structuredPrompt, systemContext, options);
            const result = await (0, utils_1.parseResponseWithFallback)(responsePromise, schema, undefined, // No fallback template for structured content
            undefined, 2 // Max retries
            );
            if (result.source === 'ai' && result.data) {
                return result.data;
            }
            else {
                monitoring_1.monitoring.recordParsingFailure('gemini-client', structuredPrompt.substring(0, 100), result.errors.join(', '));
                throw new Error(`Failed to generate valid structured content: ${result.errors.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Failed to generate structured response:', error);
            monitoring_1.monitoring.recordAIResponseFailure('gemini-client', structuredPrompt.substring(0, 100), error instanceof Error ? error.message : 'Unknown error');
            throw new Error(`Failed to generate structured response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate supply chain analysis with domain-specific context and validation
     */
    async generateSupplyChainAnalysis(prompt, context) {
        const systemContext = `You are VoiceOps, an AI-powered supply chain intelligence assistant. You help supply chain managers monitor risks, run simulations, and make data-driven decisions.

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
            let fallbackType;
            let fallbackVariables = {};
            if (prompt.toLowerCase().includes('risk')) {
                fallbackType = 'risk_analysis';
                fallbackVariables = {
                    region: this.extractRegionFromPrompt(prompt) || 'the region',
                    risk_level: 'moderate',
                };
            }
            else if (prompt.toLowerCase().includes('scenario')) {
                fallbackType = 'scenario_simulation';
                fallbackVariables = {
                    impact_level: 'moderate',
                    recovery_time: '2-3 weeks',
                };
            }
            else if (prompt.toLowerCase().includes('alert')) {
                fallbackType = 'alert_summary';
                fallbackVariables = {
                    alert_count: 'multiple',
                };
            }
            const responsePromise = this.generateContent(prompt, systemContext, {
                temperature: 0.3, // Lower temperature for more consistent analysis
                maxOutputTokens: 1024,
            });
            const result = await (0, utils_1.parseResponseWithFallback)(responsePromise, undefined, // No schema for text responses
            fallbackType, fallbackVariables, 2 // Max retries
            );
            return result.data;
        }
        catch (error) {
            console.error('Supply chain analysis failed:', error);
            monitoring_1.monitoring.recordAIResponseFailure('gemini-client', prompt.substring(0, 100), error instanceof Error ? error.message : 'Unknown error');
            // Final fallback
            const finalFallback = 'Supply chain analysis temporarily unavailable. Please monitor key metrics and maintain safety stock levels. Contact support if issues persist.';
            monitoring_1.monitoring.recordFallbackUsage('gemini-client', 'template', 'All analysis methods failed');
            return finalFallback;
        }
    }
    /**
     * Extract region from prompt text
     */
    extractRegionFromPrompt(prompt) {
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
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
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
        throw lastError;
    }
    /**
     * Check if an error is retryable
     */
    isRetryableError(error) {
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
    sleep(ms) {
        return (0, utils_1.delay)(ms);
    }
    /**
     * Generate cache key for responses
     */
    getCacheKey(prompt, systemContext, options = {}) {
        const key = JSON.stringify({
            prompt: prompt.substring(0, 100), // Truncate for key size
            systemContext: systemContext?.substring(0, 50),
            options,
        });
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    /**
     * Get cached response if valid
     */
    getCachedResponse(key, allowExpired = false) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
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
    setCachedResponse(key, content) {
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
    getFallbackResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('risk') && lowerPrompt.includes('asia')) {
            return (0, utils_1.generateFallbackResponse)('risk_analysis', { region: 'Asia', risk_level: 'high' });
        }
        else if (lowerPrompt.includes('risk') && lowerPrompt.includes('europe')) {
            return (0, utils_1.generateFallbackResponse)('risk_analysis', { region: 'Europe', risk_level: 'moderate' });
        }
        else if (lowerPrompt.includes('scenario') && lowerPrompt.includes('supplier')) {
            return (0, utils_1.generateFallbackResponse)('scenario_simulation', { impact_level: 'moderate', recovery_time: '2-3 weeks' });
        }
        else if (lowerPrompt.includes('alert')) {
            return (0, utils_1.generateFallbackResponse)('alert_summary', { alert_count: '3' });
        }
        else if (lowerPrompt.includes('scenario') && lowerPrompt.includes('port')) {
            return (0, utils_1.generateFallbackResponse)('scenario_simulation', { impact_level: 'high', recovery_time: '1-2 weeks' });
        }
        return null;
    }
    /**
     * Clear cache (useful for testing)
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}
exports.GeminiClient = GeminiClient;
/**
 * Factory function to create GeminiClient with environment variables
 */
function createGeminiClient() {
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
let geminiClientInstance = null;
function getGeminiClient() {
    if (!geminiClientInstance) {
        geminiClientInstance = createGeminiClient();
    }
    return geminiClientInstance;
}
/**
 * Circuit breaker pattern implementation
 */
class CircuitBreaker {
    constructor(options) {
        this.options = options;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED';
    }
    async execute(operation) {
        if (this.isOpen()) {
            throw new Error('Circuit breaker is open');
        }
        try {
            const result = await operation();
            this.recordSuccess();
            return result;
        }
        catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    recordSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.options.failureThreshold) {
            this.state = 'OPEN';
        }
    }
    isOpen() {
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
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
}
//# sourceMappingURL=gemini-client.js.map