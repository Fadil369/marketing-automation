/**
 * Cloudflare Workers Middleware - Global request/response handling
 * Features: Authentication, rate limiting, CORS, error handling
 * 
 * @author BrainSAIT Team
 */

import { environment } from '../src/config/environment.js';

class APIMiddleware {
    constructor() {
        this.rateLimitStore = new Map();
        this.corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Client-Version',
            'Access-Control-Max-Age': '86400'
        };
    }

    /**
     * Main middleware handler
     */
    async handle(request, env, ctx) {
        try {
            // Add request metadata
            request.startTime = Date.now();
            request.requestId = this.generateRequestId();
            
            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return this.handleCORS(request);
            }

            // Apply security headers
            const response = await this.applySecurityMiddleware(request, env, ctx);
            if (response) return response;

            // Rate limiting
            const rateLimitResponse = await this.applyRateLimit(request, env);
            if (rateLimitResponse) return rateLimitResponse;

            // Authentication
            const authResponse = await this.applyAuthentication(request, env);
            if (authResponse) return authResponse;

            // Request validation
            const validationResponse = await this.applyRequestValidation(request);
            if (validationResponse) return validationResponse;

            // Continue to actual handler
            return null; // Allow request to continue
            
        } catch (error) {
            return this.handleError(error, request);
        }
    }

    /**
     * Apply security middleware
     */
    async applySecurityMiddleware(request, env, ctx) {
        const url = new URL(request.url);
        const userAgent = request.headers.get('User-Agent') || '';
        
        // Block suspicious requests
        if (this.isSuspiciousRequest(request, userAgent)) {
            return this.createErrorResponse(403, 'Forbidden', request.requestId);
        }

        // Validate Content-Type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            const contentType = request.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                return this.createErrorResponse(400, 'Invalid Content-Type. Expected application/json', request.requestId);
            }
        }

        // Check for required headers
        const clientVersion = request.headers.get('X-Client-Version');
        if (!clientVersion && environment.env === 'production') {
            console.warn('Request missing X-Client-Version header');
        }

        return null; // Continue processing
    }

    /**
     * Apply rate limiting
     */
    async applyRateLimit(request, env) {
        const clientId = this.getClientId(request);
        const endpoint = this.getEndpoint(request);
        const rateLimitKey = `${clientId}:${endpoint}`;
        
        // Get rate limit configuration for endpoint
        const rateLimit = this.getRateLimitConfig(endpoint);
        if (!rateLimit) return null; // No rate limit configured
        
        // Check current usage
        const currentUsage = this.rateLimitStore.get(rateLimitKey) || {
            count: 0,
            resetTime: Date.now() + rateLimit.windowMs
        };

        // Reset window if expired
        if (Date.now() > currentUsage.resetTime) {
            currentUsage.count = 0;
            currentUsage.resetTime = Date.now() + rateLimit.windowMs;
        }

        // Check if limit exceeded
        if (currentUsage.count >= rateLimit.limit) {
            const remainingTime = Math.ceil((currentUsage.resetTime - Date.now()) / 1000);
            
            return new Response(JSON.stringify({
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${remainingTime} seconds.`,
                requestId: request.requestId,
                retryAfter: remainingTime
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Rate-Limit-Limit': rateLimit.limit.toString(),
                    'X-Rate-Limit-Remaining': '0',
                    'X-Rate-Limit-Reset': Math.ceil(currentUsage.resetTime / 1000).toString(),
                    'Retry-After': remainingTime.toString(),
                    ...this.corsHeaders
                }
            });
        }

        // Increment counter
        currentUsage.count++;
        this.rateLimitStore.set(rateLimitKey, currentUsage);

        // Add rate limit headers to request for later use
        request.rateLimitHeaders = {
            'X-Rate-Limit-Limit': rateLimit.limit.toString(),
            'X-Rate-Limit-Remaining': (rateLimit.limit - currentUsage.count).toString(),
            'X-Rate-Limit-Reset': Math.ceil(currentUsage.resetTime / 1000).toString()
        };

        return null; // Continue processing
    }

    /**
     * Apply authentication middleware
     */
    async applyAuthentication(request, env) {
        const url = new URL(request.url);
        const endpoint = url.pathname;
        
        // Public endpoints that don't require authentication
        const publicEndpoints = [
            '/api/health',
            '/api/version',
            '/api/auth/login',
            '/api/auth/register',
            '/api/webhooks/'
        ];

        if (publicEndpoints.some(public => endpoint.startsWith(public))) {
            return null; // Skip authentication
        }

        // Get authentication token
        const authHeader = request.headers.get('Authorization');
        const apiKey = request.headers.get('X-API-Key');
        
        if (!authHeader && !apiKey) {
            return this.createErrorResponse(401, 'Authentication required', request.requestId);
        }

        try {
            let user = null;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                user = await this.validateBearerToken(token, env);
            } else if (apiKey) {
                user = await this.validateApiKey(apiKey, env);
            }

            if (!user) {
                return this.createErrorResponse(401, 'Invalid authentication credentials', request.requestId);
            }

            // Add user to request context
            request.user = user;
            request.authMethod = authHeader ? 'bearer' : 'apikey';
            
            return null; // Continue processing
            
        } catch (error) {
            console.error('Authentication error:', error);
            return this.createErrorResponse(401, 'Authentication failed', request.requestId);
        }
    }

    /**
     * Apply request validation
     */
    async applyRequestValidation(request) {
        const url = new URL(request.url);
        
        // Validate JSON payload for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            try {
                const contentLength = request.headers.get('Content-Length');
                const maxSize = 10 * 1024 * 1024; // 10MB
                
                if (contentLength && parseInt(contentLength) > maxSize) {
                    return this.createErrorResponse(413, 'Request entity too large', request.requestId);
                }

                // Clone request to read body without consuming it
                const clonedRequest = request.clone();
                const body = await clonedRequest.text();
                
                if (body) {
                    JSON.parse(body); // Validate JSON format
                }
                
            } catch (error) {
                return this.createErrorResponse(400, 'Invalid JSON in request body', request.requestId);
            }
        }

        // Validate URL parameters
        const validationError = this.validateUrlParameters(url);
        if (validationError) {
            return this.createErrorResponse(400, validationError, request.requestId);
        }

        return null; // Continue processing
    }

    /**
     * Handle CORS preflight requests
     */
    handleCORS(request) {
        return new Response(null, {
            status: 204,
            headers: this.corsHeaders
        });
    }

    /**
     * Validate Bearer token
     */
    async validateBearerToken(token, env) {
        try {
            // In production, this would validate JWT token
            // For now, return mock user for valid-looking tokens
            if (token.length > 20) {
                return {
                    id: 'user_123',
                    email: 'user@brainsait.io',
                    role: 'user',
                    plan: 'pro',
                    permissions: ['read', 'write']
                };
            }
            return null;
        } catch (error) {
            console.error('Token validation error:', error);
            return null;
        }
    }

    /**
     * Validate API key
     */
    async validateApiKey(apiKey, env) {
        try {
            // In production, this would check against database
            if (apiKey.startsWith('bsait_') && apiKey.length === 32) {
                return {
                    id: 'api_user_123',
                    email: 'api@brainsait.io',
                    role: 'api',
                    plan: 'enterprise',
                    permissions: ['read', 'write', 'admin']
                };
            }
            return null;
        } catch (error) {
            console.error('API key validation error:', error);
            return null;
        }
    }

    /**
     * Get client ID for rate limiting
     */
    getClientId(request) {
        // Try multiple sources for client identification
        const apiKey = request.headers.get('X-API-Key');
        if (apiKey) return `api:${apiKey.substring(0, 8)}`;

        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            return `bearer:${token.substring(0, 8)}`;
        }

        // Fall back to IP address
        const cf = request.cf;
        return `ip:${cf?.colo || 'unknown'}:${this.hashString(request.headers.get('CF-Connecting-IP') || '0.0.0.0')}`;
    }

    /**
     * Get endpoint for rate limiting
     */
    getEndpoint(request) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        // Normalize endpoints with parameters
        return pathname
            .replace(/\/\d+/g, '/:id') // Replace numeric IDs
            .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
            .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token'); // Replace tokens
    }

    /**
     * Get rate limit configuration for endpoint
     */
    getRateLimitConfig(endpoint) {
        const rateLimits = {
            '/api/auth/login': { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
            '/api/auth/register': { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
            '/api/campaigns': { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
            '/api/analytics': { limit: 200, windowMs: 60 * 1000 }, // 200 per minute
            '/api/ai/generate': { limit: 20, windowMs: 60 * 1000 }, // 20 per minute
            '/api/platforms/post': { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
            'default': { limit: 1000, windowMs: 60 * 1000 } // 1000 per minute default
        };

        return rateLimits[endpoint] || rateLimits['default'];
    }

    /**
     * Check if request is suspicious
     */
    isSuspiciousRequest(request, userAgent) {
        // Block empty or suspicious user agents
        const suspiciousAgents = [
            'curl', 'wget', 'python-requests', 'postman',
            'bot', 'crawler', 'spider', 'scraper'
        ];
        
        const lowerUA = userAgent.toLowerCase();
        if (suspiciousAgents.some(agent => lowerUA.includes(agent)) && 
            environment.env === 'production') {
            return true;
        }

        // Block requests with suspicious patterns
        const url = new URL(request.url);
        const suspiciousPatterns = [
            '.env', 'wp-admin', 'phpmyadmin', 'admin.php',
            'shell.php', 'backdoor', 'exploit'
        ];
        
        if (suspiciousPatterns.some(pattern => url.pathname.includes(pattern))) {
            return true;
        }

        return false;
    }

    /**
     * Validate URL parameters
     */
    validateUrlParameters(url) {
        const params = url.searchParams;
        
        // Check for XSS attempts
        for (const [key, value] of params) {
            if (this.containsXSS(value)) {
                return `Potentially malicious content detected in parameter: ${key}`;
            }
            
            // Check parameter length
            if (value.length > 1000) {
                return `Parameter ${key} exceeds maximum length`;
            }
        }

        return null;
    }

    /**
     * Check for XSS patterns
     */
    containsXSS(value) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe\b/i,
            /<object\b/i,
            /<embed\b/i
        ];
        
        return xssPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Hash string for anonymization
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Create standardized error response
     */
    createErrorResponse(status, message, requestId, details = null) {
        const error = {
            error: true,
            status,
            message,
            requestId,
            timestamp: new Date().toISOString()
        };

        if (details) {
            error.details = details;
        }

        return new Response(JSON.stringify(error), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders
            }
        });
    }

    /**
     * Handle unexpected errors
     */
    handleError(error, request) {
        console.error('Middleware error:', error, {
            url: request.url,
            method: request.method,
            requestId: request.requestId
        });

        return this.createErrorResponse(
            500,
            'Internal server error',
            request.requestId,
            environment.env === 'development' ? error.message : undefined
        );
    }

    /**
     * Add response headers after request processing
     */
    addResponseHeaders(response, request) {
        const headers = new Headers(response.headers);
        
        // Add CORS headers
        Object.entries(this.corsHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });

        // Add security headers
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');
        headers.set('X-XSS-Protection', '1; mode=block');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Add rate limit headers if available
        if (request.rateLimitHeaders) {
            Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
                headers.set(key, value);
            });
        }

        // Add processing time
        if (request.startTime) {
            const processingTime = Date.now() - request.startTime;
            headers.set('X-Response-Time', `${processingTime}ms`);
        }

        // Add request ID
        if (request.requestId) {
            headers.set('X-Request-ID', request.requestId);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }
}

// Export middleware instance
const middleware = new APIMiddleware();

export default {
    async fetch(request, env, ctx) {
        const middlewareResponse = await middleware.handle(request, env, ctx);
        
        if (middlewareResponse) {
            // Middleware handled the request (error, rate limit, etc.)
            return middlewareResponse;
        }

        // Continue to route handler
        // This would be called by the actual route handler
        return null;
    }
};

export { APIMiddleware, middleware };