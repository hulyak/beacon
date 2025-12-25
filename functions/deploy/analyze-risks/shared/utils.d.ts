import { Request, Response } from '@google-cloud/functions-framework';
import { ApiResponse, ErrorResponse, ValidationError, ValidationResult, CorsOptions, LogContext } from './types';
/**
 * CORS configuration for VoiceOps functions
 */
export declare const DEFAULT_CORS_OPTIONS: CorsOptions;
/**
 * Set CORS headers on response
 * Dynamically returns the requesting origin if it's in the allowed list
 */
export declare function setCorsHeaders(req: Request, res: Response, options?: CorsOptions): void;
/**
 * Handle CORS preflight requests
 */
export declare function handleCors(req: Request, res: Response, options?: CorsOptions): boolean;
/**
 * Create success response
 */
export declare function createSuccessResponse<T>(data: T): ApiResponse<T>;
/**
 * Create error response
 */
export declare function createErrorResponse(code: string, message: string, details?: any): ErrorResponse;
/**
 * Send JSON response with proper headers
 */
export declare function sendResponse<T>(res: Response, statusCode: number, data: ApiResponse<T> | ErrorResponse): void;
/**
 * Send success response
 */
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number): void;
/**
 * Send error response
 */
export declare function sendError(res: Response, statusCode: number, code: string, message: string, details?: any): void;
/**
 * Validate required fields in request body
 */
export declare function validateRequiredFields(body: any, requiredFields: string[]): ValidationResult;
/**
 * Validate enum field
 */
export declare function validateEnum(value: any, enumValues: string[], fieldName: string): ValidationError | null;
/**
 * Validate number range
 */
export declare function validateNumberRange(value: any, min: number, max: number, fieldName: string): ValidationError | null;
/**
 * Validate string length
 */
export declare function validateStringLength(value: any, minLength: number, maxLength: number, fieldName: string): ValidationError | null;
/**
 * Validate array field
 */
export declare function validateArray(value: any, minLength: number, maxLength: number, fieldName: string): ValidationError | null;
/**
 * Validate object structure
 */
export declare function validateObject(value: any, requiredKeys: string[], fieldName: string): ValidationError | null;
/**
 * Sanitize string input
 */
export declare function sanitizeString(input: string, maxLength?: number): string;
/**
 * Sanitize object by removing dangerous properties
 */
export declare function sanitizeObject<T extends Record<string, any>>(obj: T, allowedKeys: string[]): Partial<T>;
/**
 * Validate and sanitize request parameters
 */
export interface ParameterValidation {
    region?: {
        required: boolean;
        allowedValues: string[];
    };
    category?: {
        required: boolean;
        allowedValues: string[];
    };
    scenarioType?: {
        required: boolean;
        allowedValues: string[];
    };
    severity?: {
        required: boolean;
        allowedValues: string[];
    };
    priority?: {
        required: boolean;
        allowedValues: string[];
    };
    limit?: {
        required: boolean;
        min: number;
        max: number;
    };
}
export declare function validateAndSanitizeParams(body: any, schema: ParameterValidation): {
    isValid: boolean;
    errors: ValidationError[];
    sanitized: any;
};
/**
 * Generate unique ID
 */
export declare function generateId(prefix?: string): string;
/**
 * Format timestamp for display
 */
export declare function formatTimestamp(date?: Date): string;
/**
 * Calculate time ago string
 */
export declare function timeAgo(timestamp: string): string;
/**
 * Structured logging utility
 */
export declare class Logger {
    private context;
    constructor(context?: LogContext);
    private log;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error | any): void;
    debug(message: string, data?: any): void;
    setContext(context: LogContext): void;
}
/**
 * Create logger with request context
 */
export declare function createLogger(req: Request): Logger;
/**
 * Async error handler wrapper with timeout support
 */
export declare function asyncHandler(fn: (req: Request, res: Response) => Promise<void>, timeoutMs?: number): (req: Request, res: Response) => Promise<void>;
/**
 * Rate limiting utility (simple in-memory implementation)
 */
declare class RateLimiter {
    private requests;
    private readonly windowMs;
    private readonly maxRequests;
    constructor(windowMs?: number, maxRequests?: number);
    isAllowed(identifier: string): boolean;
    reset(identifier: string): void;
}
export declare const rateLimiter: RateLimiter;
/**
 * Extract client IP from request
 */
export declare function getClientIP(req: Request): string;
/**
 * Middleware to check rate limits
 */
export declare function checkRateLimit(req: Request, res: Response): boolean;
/**
 * Parse JSON safely
 */
export declare function safeJsonParse<T>(json: string, defaultValue: T): T;
/**
 * Delay utility for testing and rate limiting
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Response validation and parsing utilities
 */
export interface ResponseValidationSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    required?: string[];
    properties?: Record<string, ResponseValidationSchema>;
    items?: ResponseValidationSchema;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
}
export interface UtilsValidationResult {
    isValid: boolean;
    errors: string[];
    sanitized?: any;
}
/**
 * Validate response against schema
 */
export declare function validateResponse(data: any, schema: ResponseValidationSchema): UtilsValidationResult;
/**
 * Parse and validate JSON response
 */
export declare function parseAndValidateJSON<T>(jsonString: string, schema?: ResponseValidationSchema): {
    success: boolean;
    data?: T;
    errors: string[];
};
/**
 * Sanitize AI response text
 */
export declare function sanitizeAIResponse(response: string): string;
/**
 * Validate AI response content quality
 */
export declare function validateAIResponseQuality(response: string): UtilsValidationResult;
/**
 * Create fallback response templates
 */
export declare const FALLBACK_RESPONSES: {
    risk_analysis: {
        template: string;
        variables: string[];
    };
    scenario_simulation: {
        template: string;
        variables: string[];
    };
    alert_summary: {
        template: string;
        variables: string[];
    };
};
/**
 * Generate fallback response using template
 */
export declare function generateFallbackResponse(type: keyof typeof FALLBACK_RESPONSES, variables?: Record<string, string>): string;
/**
 * Response parsing with retry and fallback
 */
export declare function parseResponseWithFallback<T>(responsePromise: Promise<string>, schema?: ResponseValidationSchema, fallbackType?: keyof typeof FALLBACK_RESPONSES, fallbackVariables?: Record<string, string>, maxRetries?: number): Promise<{
    data: T | string;
    source: 'ai' | 'fallback' | 'template';
    errors: string[];
}>;
export {};
//# sourceMappingURL=utils.d.ts.map