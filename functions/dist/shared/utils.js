"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_RESPONSES = exports.rateLimiter = exports.Logger = exports.DEFAULT_CORS_OPTIONS = void 0;
exports.setCorsHeaders = setCorsHeaders;
exports.handleCors = handleCors;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.sendResponse = sendResponse;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.validateRequiredFields = validateRequiredFields;
exports.validateEnum = validateEnum;
exports.validateNumberRange = validateNumberRange;
exports.validateStringLength = validateStringLength;
exports.validateArray = validateArray;
exports.validateObject = validateObject;
exports.sanitizeString = sanitizeString;
exports.sanitizeObject = sanitizeObject;
exports.validateAndSanitizeParams = validateAndSanitizeParams;
exports.generateId = generateId;
exports.formatTimestamp = formatTimestamp;
exports.timeAgo = timeAgo;
exports.createLogger = createLogger;
exports.asyncHandler = asyncHandler;
exports.getClientIP = getClientIP;
exports.checkRateLimit = checkRateLimit;
exports.safeJsonParse = safeJsonParse;
exports.delay = delay;
exports.validateResponse = validateResponse;
exports.parseAndValidateJSON = parseAndValidateJSON;
exports.sanitizeAIResponse = sanitizeAIResponse;
exports.validateAIResponseQuality = validateAIResponseQuality;
exports.generateFallbackResponse = generateFallbackResponse;
exports.parseResponseWithFallback = parseResponseWithFallback;
/**
 * CORS configuration for Beacon functions
 */
exports.DEFAULT_CORS_OPTIONS = {
    origin: [
        'http://localhost:3000',
        'https://voiceops-ai.vercel.app',
        // Add your production domain here
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
};
/**
 * Set CORS headers on response
 * Dynamically returns the requesting origin if it's in the allowed list
 */
function setCorsHeaders(req, res, options = exports.DEFAULT_CORS_OPTIONS) {
    const requestOrigin = req.headers.origin || '';
    const allowedOrigins = Array.isArray(options.origin) ? options.origin : [options.origin];
    // Check if request origin is in allowed list, otherwise use wildcard
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', options.methods.join(','));
    res.set('Access-Control-Allow-Headers', options.allowedHeaders.join(','));
    if (options.credentials && origin !== '*') {
        res.set('Access-Control-Allow-Credentials', 'true');
    }
}
/**
 * Handle CORS preflight requests
 */
function handleCors(req, res, options = exports.DEFAULT_CORS_OPTIONS) {
    setCorsHeaders(req, res, options);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
}
/**
 * Create success response
 */
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Create error response
 */
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
}
/**
 * Send JSON response with proper headers
 */
function sendResponse(res, statusCode, data) {
    res.status(statusCode).json(data);
}
/**
 * Send success response
 */
function sendSuccess(res, data, statusCode = 200) {
    sendResponse(res, statusCode, createSuccessResponse(data));
}
/**
 * Send error response
 */
function sendError(res, statusCode, code, message, details) {
    sendResponse(res, statusCode, createErrorResponse(code, message, details));
}
/**
 * Validate required fields in request body
 */
function validateRequiredFields(body, requiredFields) {
    const errors = [];
    // Check if body exists
    if (!body || typeof body !== 'object') {
        errors.push({
            field: 'body',
            message: 'Request body is required and must be a valid JSON object',
            value: body,
        });
        return { isValid: false, errors };
    }
    for (const field of requiredFields) {
        if (!(field in body) || body[field] === undefined || body[field] === null) {
            errors.push({
                field,
                message: `Field '${field}' is required`,
                value: body[field],
            });
        }
        else if (typeof body[field] === 'string' && body[field].trim() === '') {
            errors.push({
                field,
                message: `Field '${field}' cannot be empty`,
                value: body[field],
            });
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Validate enum field
 */
function validateEnum(value, enumValues, fieldName) {
    if (value === undefined || value === null) {
        return null; // Optional field
    }
    if (typeof value !== 'string') {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be a string`,
            value,
        };
    }
    const normalizedValue = value.toLowerCase().trim();
    const normalizedEnumValues = enumValues.map(v => v.toLowerCase());
    if (!normalizedEnumValues.includes(normalizedValue)) {
        return {
            field: fieldName,
            message: `Invalid value for '${fieldName}'. Must be one of: ${enumValues.join(', ')}`,
            value,
        };
    }
    return null;
}
/**
 * Validate number range
 */
function validateNumberRange(value, min, max, fieldName) {
    if (value === undefined || value === null) {
        return null; // Optional field
    }
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be a valid number`,
            value,
        };
    }
    if (value < min || value > max) {
        return {
            field: fieldName,
            message: `Value for '${fieldName}' must be between ${min} and ${max}`,
            value,
        };
    }
    return null;
}
/**
 * Validate string length
 */
function validateStringLength(value, minLength, maxLength, fieldName) {
    if (value === undefined || value === null) {
        return null; // Optional field
    }
    if (typeof value !== 'string') {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be a string`,
            value,
        };
    }
    const trimmedValue = value.trim();
    if (trimmedValue.length < minLength) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be at least ${minLength} characters long`,
            value,
        };
    }
    if (trimmedValue.length > maxLength) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be at most ${maxLength} characters long`,
            value,
        };
    }
    return null;
}
/**
 * Validate array field
 */
function validateArray(value, minLength, maxLength, fieldName) {
    if (value === undefined || value === null) {
        return null; // Optional field
    }
    if (!Array.isArray(value)) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be an array`,
            value,
        };
    }
    if (value.length < minLength) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must contain at least ${minLength} items`,
            value,
        };
    }
    if (value.length > maxLength) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must contain at most ${maxLength} items`,
            value,
        };
    }
    return null;
}
/**
 * Validate object structure
 */
function validateObject(value, requiredKeys, fieldName) {
    if (value === undefined || value === null) {
        return null; // Optional field
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' must be an object`,
            value,
        };
    }
    const missingKeys = requiredKeys.filter(key => !(key in value));
    if (missingKeys.length > 0) {
        return {
            field: fieldName,
            message: `Field '${fieldName}' is missing required keys: ${missingKeys.join(', ')}`,
            value,
        };
    }
    return null;
}
/**
 * Sanitize string input
 */
function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string')
        return '';
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .substring(0, maxLength); // Limit length
}
/**
 * Sanitize object by removing dangerous properties
 */
function sanitizeObject(obj, allowedKeys) {
    const sanitized = {};
    for (const key of allowedKeys) {
        if (key in obj) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            }
            else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            }
            else if (Array.isArray(value)) {
                sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) : item);
            }
            else if (value && typeof value === 'object') {
                // Recursively sanitize nested objects
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}
function validateAndSanitizeParams(body, schema) {
    const errors = [];
    const sanitized = {};
    // Validate each parameter according to schema
    for (const [key, rules] of Object.entries(schema)) {
        if (!rules)
            continue;
        const value = body[key];
        // Check required fields
        if (rules.required && (value === undefined || value === null)) {
            errors.push({
                field: key,
                message: `Field '${key}' is required`,
                value,
            });
            continue;
        }
        // Skip validation for optional undefined fields
        if (value === undefined || value === null) {
            continue;
        }
        // Validate based on rule type
        if (rules.allowedValues) {
            const enumError = validateEnum(value, rules.allowedValues, key);
            if (enumError) {
                errors.push(enumError);
            }
            else {
                sanitized[key] = sanitizeString(value);
            }
        }
        else if (rules.min !== undefined && rules.max !== undefined) {
            const rangeError = validateNumberRange(value, rules.min, rules.max, key);
            if (rangeError) {
                errors.push(rangeError);
            }
            else {
                sanitized[key] = value;
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        sanitized,
    };
}
/**
 * Generate unique ID
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}`;
}
/**
 * Format timestamp for display
 */
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}
/**
 * Calculate time ago string
 */
function timeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 1)
        return 'just now';
    if (diffMinutes < 60)
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}
/**
 * Structured logging utility
 */
class Logger {
    constructor(context = {}) {
        this.context = context;
    }
    log(level, message, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.context,
            data,
        };
        console.log(JSON.stringify(logEntry));
    }
    info(message, data) {
        this.log('INFO', message, data);
    }
    warn(message, data) {
        this.log('WARN', message, data);
    }
    error(message, error) {
        const errorData = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error;
        this.log('ERROR', message, errorData);
    }
    debug(message, data) {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message, data);
        }
    }
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
}
exports.Logger = Logger;
/**
 * Create logger with request context
 */
function createLogger(req) {
    return new Logger({
        requestId: req.get('x-request-id') || generateId('req'),
        method: req.method,
        path: req.path,
        userAgent: req.get('user-agent'),
    });
}
/**
 * Async error handler wrapper with timeout support
 */
function asyncHandler(fn, timeoutMs = 30000) {
    return async (req, res) => {
        const logger = createLogger(req);
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });
        try {
            // Race between handler and timeout
            await Promise.race([
                fn(req, res),
                timeoutPromise,
            ]);
        }
        catch (error) {
            logger.error('Handler error', error);
            if (res.headersSent) {
                // Response already sent, can't send error
                return;
            }
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    sendError(res, 408, 'REQUEST_TIMEOUT', 'Request timed out');
                }
                else if (error.message.includes('rate limit')) {
                    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
                }
                else if (error.message.includes('Circuit breaker')) {
                    sendError(res, 503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable');
                }
                else if (error.message.includes('quota') || error.message.includes('limit')) {
                    sendError(res, 503, 'QUOTA_EXCEEDED', 'Service quota exceeded, please try again later');
                }
                else {
                    sendError(res, 500, 'INTERNAL_ERROR', 'An internal error occurred', process.env.NODE_ENV === 'development' ? error : undefined);
                }
            }
            else {
                sendError(res, 500, 'INTERNAL_ERROR', 'An unknown error occurred');
            }
        }
    };
}
/**
 * Rate limiting utility (simple in-memory implementation)
 */
class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 100, maxEntries = 10000) {
        this.requests = new Map();
        this.cleanupInterval = null;
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.maxEntries = maxEntries;
        // Start periodic cleanup to prevent memory leaks
        this.startCleanup();
    }
    startCleanup() {
        // Clean up every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        // Remove expired entries
        for (const [identifier, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(time => time > windowStart);
            if (recentRequests.length === 0) {
                this.requests.delete(identifier);
            }
            else {
                this.requests.set(identifier, recentRequests);
            }
        }
        // If still over max entries, remove oldest entries
        if (this.requests.size > this.maxEntries) {
            const entries = Array.from(this.requests.entries());
            // Sort by oldest request time
            entries.sort((a, b) => {
                const aOldest = Math.min(...a[1]);
                const bOldest = Math.min(...b[1]);
                return aOldest - bOldest;
            });
            // Remove oldest entries until under limit
            const toRemove = this.requests.size - this.maxEntries;
            for (let i = 0; i < toRemove; i++) {
                this.requests.delete(entries[i][0]);
            }
        }
    }
    isAllowed(identifier) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        // Get existing requests for this identifier
        const requests = this.requests.get(identifier) || [];
        // Filter out old requests
        const recentRequests = requests.filter(time => time > windowStart);
        // Check if under limit
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        // Add current request
        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);
        return true;
    }
    reset(identifier) {
        this.requests.delete(identifier);
    }
    /**
     * Stop the cleanup interval (useful for testing/shutdown)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    /**
     * Get current stats for monitoring
     */
    getStats() {
        return {
            entries: this.requests.size,
            maxEntries: this.maxEntries,
        };
    }
}
exports.rateLimiter = new RateLimiter();
/**
 * Extract client IP from request
 */
function getClientIP(req) {
    return req.get('x-forwarded-for') ||
        req.get('x-real-ip') ||
        req.socket?.remoteAddress ||
        'unknown';
}
/**
 * Middleware to check rate limits
 */
function checkRateLimit(req, res) {
    const clientIP = getClientIP(req);
    if (!exports.rateLimiter.isAllowed(clientIP)) {
        sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
        return false;
    }
    return true;
}
/**
 * Parse JSON safely
 */
function safeJsonParse(json, defaultValue) {
    try {
        return JSON.parse(json);
    }
    catch {
        return defaultValue;
    }
}
/**
 * Delay utility for testing and rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Validate response against schema
 */
function validateResponse(data, schema) {
    const errors = [];
    function validateValue(value, schema, path = '') {
        // Type validation
        if (schema.type === 'object') {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                errors.push(`${path}: Expected object, got ${typeof value}`);
                return;
            }
            // Required properties
            if (schema.required) {
                for (const prop of schema.required) {
                    if (!(prop in value)) {
                        errors.push(`${path}.${prop}: Required property missing`);
                    }
                }
            }
            // Validate properties
            if (schema.properties) {
                for (const [prop, propSchema] of Object.entries(schema.properties)) {
                    if (prop in value) {
                        validateValue(value[prop], propSchema, `${path}.${prop}`);
                    }
                }
            }
        }
        else if (schema.type === 'array') {
            if (!Array.isArray(value)) {
                errors.push(`${path}: Expected array, got ${typeof value}`);
                return;
            }
            if (schema.minLength !== undefined && value.length < schema.minLength) {
                errors.push(`${path}: Array too short (${value.length} < ${schema.minLength})`);
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                errors.push(`${path}: Array too long (${value.length} > ${schema.maxLength})`);
            }
            // Validate items
            if (schema.items) {
                value.forEach((item, index) => {
                    validateValue(item, schema.items, `${path}[${index}]`);
                });
            }
        }
        else if (schema.type === 'string') {
            if (typeof value !== 'string') {
                errors.push(`${path}: Expected string, got ${typeof value}`);
                return;
            }
            if (schema.minLength !== undefined && value.length < schema.minLength) {
                errors.push(`${path}: String too short (${value.length} < ${schema.minLength})`);
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                errors.push(`${path}: String too long (${value.length} > ${schema.maxLength})`);
            }
            if (schema.pattern && !schema.pattern.test(value)) {
                errors.push(`${path}: String does not match pattern`);
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(`${path}: Value not in allowed enum: ${schema.enum.join(', ')}`);
            }
        }
        else if (schema.type === 'number') {
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push(`${path}: Expected number, got ${typeof value}`);
                return;
            }
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${path}: Number too small (${value} < ${schema.min})`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${path}: Number too large (${value} > ${schema.max})`);
            }
        }
        else if (schema.type === 'boolean') {
            if (typeof value !== 'boolean') {
                errors.push(`${path}: Expected boolean, got ${typeof value}`);
            }
        }
    }
    try {
        validateValue(data, schema);
    }
    catch (error) {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: errors.length === 0 ? data : undefined,
    };
}
/**
 * Parse and validate JSON response
 */
function parseAndValidateJSON(jsonString, schema) {
    const errors = [];
    // Parse JSON
    let parsed;
    try {
        // Clean the JSON string (remove potential markdown formatting)
        const cleanJson = jsonString
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
        parsed = JSON.parse(cleanJson);
    }
    catch (parseError) {
        errors.push(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
        // Try to extract JSON from text
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
                errors.pop(); // Remove the parsing error since we recovered
            }
            catch {
                return { success: false, errors };
            }
        }
        else {
            return { success: false, errors };
        }
    }
    // Validate against schema if provided
    if (schema) {
        const validation = validateResponse(parsed, schema);
        if (!validation.isValid) {
            errors.push(...validation.errors);
            return { success: false, errors };
        }
    }
    return { success: true, data: parsed, errors: [] };
}
/**
 * Sanitize AI response text
 */
function sanitizeAIResponse(response) {
    if (typeof response !== 'string') {
        return '';
    }
    return response
        .trim()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n and \r
        .replace(/\s+/g, ' ') // Normalize whitespace
        .substring(0, 5000); // Limit length
}
/**
 * Validate AI response content quality
 */
function validateAIResponseQuality(response) {
    const errors = [];
    const sanitized = sanitizeAIResponse(response);
    // Check minimum length
    if (sanitized.length < 10) {
        errors.push('Response too short (minimum 10 characters)');
    }
    // Check maximum length
    if (sanitized.length > 5000) {
        errors.push('Response too long (maximum 5000 characters)');
    }
    // Check for placeholder text
    const placeholders = ['[placeholder]', 'TODO', 'TBD', 'lorem ipsum'];
    for (const placeholder of placeholders) {
        if (sanitized.toLowerCase().includes(placeholder.toLowerCase())) {
            errors.push(`Response contains placeholder text: ${placeholder}`);
        }
    }
    // Check for repetitive content
    const words = sanitized.toLowerCase().split(/\s+/);
    const wordCounts = new Map();
    for (const word of words) {
        if (word.length > 3) { // Only check longer words
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
    }
    for (const [word, count] of wordCounts) {
        if (count > Math.max(3, words.length * 0.1)) { // Word appears too frequently
            errors.push(`Response contains repetitive content: "${word}" appears ${count} times`);
        }
    }
    // Check for coherence (basic checks)
    const sentences = sanitized.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
        errors.push('Response contains no complete sentences');
    }
    return {
        isValid: errors.length === 0,
        errors,
        sanitized,
    };
}
/**
 * Create fallback response templates
 */
exports.FALLBACK_RESPONSES = {
    risk_analysis: {
        template: 'Supply chain analysis for {region} shows {risk_level} risk levels. Key concerns include logistics delays and supplier capacity constraints. Recommend monitoring closely and maintaining safety stock.',
        variables: ['region', 'risk_level'],
    },
    scenario_simulation: {
        template: 'Scenario simulation indicates {impact_level} impact on operations. Estimated recovery time: {recovery_time}. Recommend activating contingency plans and alternative suppliers.',
        variables: ['impact_level', 'recovery_time'],
    },
    alert_summary: {
        template: 'Current alerts show {alert_count} active issues requiring attention. Priority levels range from medium to critical. Recommend immediate review of high-priority items.',
        variables: ['alert_count'],
    },
};
/**
 * Generate fallback response using template
 */
function generateFallbackResponse(type, variables = {}) {
    const template = exports.FALLBACK_RESPONSES[type];
    if (!template) {
        return 'Service temporarily unavailable. Please try again later.';
    }
    let response = template.template;
    for (const variable of template.variables) {
        const value = variables[variable] || 'unknown';
        response = response.replace(`{${variable}}`, value);
    }
    return response;
}
/**
 * Response parsing with retry and fallback
 */
async function parseResponseWithFallback(responsePromise, schema, fallbackType, fallbackVariables, maxRetries = 2) {
    let lastError = [];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await responsePromise;
            // Validate response quality
            const qualityValidation = validateAIResponseQuality(response);
            if (!qualityValidation.isValid) {
                lastError = qualityValidation.errors;
                if (attempt < maxRetries) {
                    continue; // Retry
                }
            }
            // If schema provided, parse as JSON
            if (schema) {
                const parseResult = parseAndValidateJSON(response, schema);
                if (parseResult.success && parseResult.data) {
                    return { data: parseResult.data, source: 'ai', errors: [] };
                }
                lastError = parseResult.errors;
            }
            else {
                // Return as string if no schema
                return { data: qualityValidation.sanitized, source: 'ai', errors: [] };
            }
        }
        catch (error) {
            lastError = [`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
        }
        // Wait before retry
        if (attempt < maxRetries) {
            await delay(1000 * (attempt + 1)); // Exponential backoff
        }
    }
    // All retries failed, use fallback
    if (fallbackType) {
        const fallbackResponse = generateFallbackResponse(fallbackType, fallbackVariables);
        return { data: fallbackResponse, source: 'template', errors: lastError };
    }
    // No fallback available
    throw new Error(`Response parsing failed after ${maxRetries + 1} attempts: ${lastError.join(', ')}`);
}
//# sourceMappingURL=utils.js.map