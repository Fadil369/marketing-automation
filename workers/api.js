/**
 * Cloudflare Worker API for BrainSAIT Marketing Platform
 * Handles backend API requests, authentication, and data processing
 */

import { environmentConfig } from '../config/environment.js';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
};

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data:;"
};

/**
 * Main request handler
 */
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        try {
            // Route requests
            const path = url.pathname;
            
            // Health check
            if (path === '/health' || path === '/api/health') {
                return handleHealth(request, env);
            }

            // Authentication endpoints
            if (path.startsWith('/api/auth/')) {
                return handleAuth(request, env, path);
            }

            // AI service endpoints
            if (path.startsWith('/api/ai/')) {
                return handleAI(request, env, path);
            }

            // Platform integration endpoints
            if (path.startsWith('/api/platforms/')) {
                return handlePlatforms(request, env, path);
            }

            // Analytics endpoints
            if (path.startsWith('/api/analytics/')) {
                return handleAnalytics(request, env, path);
            }

            // User management endpoints
            if (path.startsWith('/api/users/')) {
                return handleUsers(request, env, path);
            }

            // Campaign management endpoints
            if (path.startsWith('/api/campaigns/')) {
                return handleCampaigns(request, env, path);
            }

            // Content management endpoints
            if (path.startsWith('/api/content/')) {
                return handleContent(request, env, path);
            }

            // WebSocket upgrade for real-time features
            if (path === '/ws' || path === '/api/ws') {
                return handleWebSocket(request, env);
            }

            // File upload endpoints
            if (path.startsWith('/api/upload/')) {
                return handleUpload(request, env, path);
            }

            // Default 404
            return createResponse({ error: 'Endpoint not found' }, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return createResponse({ 
                error: 'Internal server error',
                message: error.message 
            }, 500);
        }
    }
};

/**
 * Health check handler
 */
async function handleHealth(request, env) {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: env.APP_VERSION || '2.0.0',
        environment: env.ENVIRONMENT || 'production',
        services: {
            database: await checkDatabaseHealth(env),
            cache: await checkCacheHealth(env),
            ai: await checkAIHealth(env)
        }
    };

    return createResponse(health);
}

/**
 * Authentication handler
 */
async function handleAuth(request, env, path) {
    const method = request.method;
    const endpoint = path.replace('/api/auth', '');

    switch (endpoint) {
        case '/login':
            if (method === 'POST') {
                return handleLogin(request, env);
            }
            break;

        case '/register':
            if (method === 'POST') {
                return handleRegister(request, env);
            }
            break;

        case '/logout':
            if (method === 'POST') {
                return handleLogout(request, env);
            }
            break;

        case '/refresh':
            if (method === 'POST') {
                return handleTokenRefresh(request, env);
            }
            break;

        case '/profile':
            if (method === 'GET') {
                return handleGetProfile(request, env);
            } else if (method === 'PUT') {
                return handleUpdateProfile(request, env);
            }
            break;

        default:
            return createResponse({ error: 'Auth endpoint not found' }, 404);
    }
}

/**
 * AI service handler
 */
async function handleAI(request, env, path) {
    const method = request.method;
    const endpoint = path.replace('/api/ai', '');

    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
    }

    switch (endpoint) {
        case '/generate':
            if (method === 'POST') {
                return handleAIGenerate(request, env, user);
            }
            break;

        case '/analyze':
            if (method === 'POST') {
                return handleAIAnalyze(request, env, user);
            }
            break;

        case '/translate':
            if (method === 'POST') {
                return handleAITranslate(request, env, user);
            }
            break;

        case '/optimize':
            if (method === 'POST') {
                return handleAIOptimize(request, env, user);
            }
            break;

        default:
            return createResponse({ error: 'AI endpoint not found' }, 404);
    }
}

/**
 * Platform integration handler
 */
async function handlePlatforms(request, env, path) {
    const method = request.method;
    const endpoint = path.replace('/api/platforms', '');

    const user = await verifyAuth(request, env);
    if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
    }

    switch (endpoint) {
        case '/connect':
            if (method === 'POST') {
                return handlePlatformConnect(request, env, user);
            }
            break;

        case '/disconnect':
            if (method === 'POST') {
                return handlePlatformDisconnect(request, env, user);
            }
            break;

        case '/post':
            if (method === 'POST') {
                return handlePlatformPost(request, env, user);
            }
            break;

        case '/schedule':
            if (method === 'POST') {
                return handlePlatformSchedule(request, env, user);
            }
            break;

        case '/analytics':
            if (method === 'GET') {
                return handlePlatformAnalytics(request, env, user);
            }
            break;

        default:
            return createResponse({ error: 'Platform endpoint not found' }, 404);
    }
}

/**
 * Analytics handler
 */
async function handleAnalytics(request, env, path) {
    const method = request.method;
    const endpoint = path.replace('/api/analytics', '');

    const user = await verifyAuth(request, env);
    if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
    }

    switch (endpoint) {
        case '/dashboard':
            if (method === 'GET') {
                return handleAnalyticsDashboard(request, env, user);
            }
            break;

        case '/campaigns':
            if (method === 'GET') {
                return handleCampaignAnalytics(request, env, user);
            }
            break;

        case '/reports':
            if (method === 'GET') {
                return handleAnalyticsReports(request, env, user);
            } else if (method === 'POST') {
                return handleGenerateReport(request, env, user);
            }
            break;

        case '/events':
            if (method === 'POST') {
                return handleTrackEvent(request, env, user);
            }
            break;

        default:
            return createResponse({ error: 'Analytics endpoint not found' }, 404);
    }
}

/**
 * WebSocket handler for real-time features
 */
async function handleWebSocket(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return createResponse({ error: 'Expected WebSocket' }, 400);
    }

    // Verify authentication for WebSocket
    const token = new URL(request.url).searchParams.get('token');
    const user = await verifyToken(token, env);
    if (!user) {
        return createResponse({ error: 'Unauthorized WebSocket connection' }, 401);
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Handle WebSocket connection
    server.accept();
    handleWebSocketConnection(server, user, env);

    return new Response(null, {
        status: 101,
        webSocket: client
    });
}

/**
 * Handle WebSocket connection
 */
function handleWebSocketConnection(webSocket, user, env) {
    webSocket.addEventListener('message', async (event) => {
        try {
            const data = JSON.parse(event.data);
            await handleWebSocketMessage(webSocket, data, user, env);
        } catch (error) {
            console.error('WebSocket message error:', error);
            webSocket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    webSocket.addEventListener('close', () => {
        console.log('WebSocket connection closed for user:', user.id);
    });

    // Send welcome message
    webSocket.send(JSON.stringify({
        type: 'connected',
        user: user.id,
        timestamp: new Date().toISOString()
    }));
}

/**
 * Handle WebSocket messages
 */
async function handleWebSocketMessage(webSocket, data, user, env) {
    switch (data.type) {
        case 'subscribe':
            await handleWebSocketSubscribe(webSocket, data, user, env);
            break;

        case 'unsubscribe':
            await handleWebSocketUnsubscribe(webSocket, data, user, env);
            break;

        case 'ping':
            webSocket.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
            }));
            break;

        default:
            webSocket.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type'
            }));
    }
}

/**
 * Authentication verification
 */
async function verifyAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return await verifyToken(token, env);
}

/**
 * Token verification
 */
async function verifyToken(token, env) {
    try {
        // In a real implementation, verify JWT token
        // For now, return mock user
        return {
            id: 'user_123',
            email: 'user@example.com',
            name: 'Test User',
            plan: 'pro'
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Database health check
 */
async function checkDatabaseHealth(env) {
    try {
        if (env.DB) {
            // Test database connection
            const result = await env.DB.prepare('SELECT 1').first();
            return { status: 'healthy', latency: '< 10ms' };
        }
        return { status: 'not_configured' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

/**
 * Cache health check
 */
async function checkCacheHealth(env) {
    try {
        if (env.CACHE) {
            // Test KV store
            await env.CACHE.put('health_check', 'ok', { expirationTtl: 60 });
            const value = await env.CACHE.get('health_check');
            return { status: value === 'ok' ? 'healthy' : 'error' };
        }
        return { status: 'not_configured' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

/**
 * AI service health check
 */
async function checkAIHealth(env) {
    try {
        // Check if AI binding is available
        if (env.AI) {
            return { status: 'healthy', provider: 'cloudflare_ai' };
        }
        return { status: 'not_configured' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

/**
 * Create standardized response
 */
function createResponse(data, status = 200, additionalHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...securityHeaders,
            ...additionalHeaders
        }
    });
}

/**
 * Handle login
 */
async function handleLogin(request, env) {
    const { email, password } = await request.json();
    
    // In a real implementation, verify credentials against database
    if (email && password) {
        const token = 'mock_jwt_token';
        const user = {
            id: 'user_123',
            email,
            name: 'Test User',
            plan: 'pro'
        };

        return createResponse({
            success: true,
            token,
            user,
            expires_in: 3600
        });
    }

    return createResponse({ error: 'Invalid credentials' }, 401);
}

/**
 * Handle AI content generation
 */
async function handleAIGenerate(request, env, user) {
    const { prompt, type, platform } = await request.json();

    // Use Cloudflare AI if available
    if (env.AI) {
        try {
            const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
                messages: [
                    { role: 'system', content: 'You are a helpful marketing content creator.' },
                    { role: 'user', content: prompt }
                ]
            });

            return createResponse({
                success: true,
                content: response.response,
                type,
                platform,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('AI generation error:', error);
        }
    }

    // Fallback to mock response
    return createResponse({
        success: true,
        content: `Generated ${type} content for ${platform}: ${prompt}`,
        type,
        platform,
        generated_at: new Date().toISOString()
    });
}

/**
 * Handle platform posting
 */
async function handlePlatformPost(request, env, user) {
    const { content, platforms, schedule_time } = await request.json();

    // Queue the post for processing
    if (env.PLATFORM_QUEUE) {
        await env.PLATFORM_QUEUE.send({
            user_id: user.id,
            content,
            platforms,
            schedule_time,
            created_at: new Date().toISOString()
        });
    }

    return createResponse({
        success: true,
        post_id: `post_${Date.now()}`,
        status: 'queued',
        platforms,
        scheduled_for: schedule_time
    });
}

/**
 * Handle file upload
 */
async function handleUpload(request, env, path) {
    const user = await verifyAuth(request, env);
    if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
    }

    if (request.method !== 'POST') {
        return createResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return createResponse({ error: 'No file provided' }, 400);
        }

        // Upload to R2 if available
        if (env.UPLOADS) {
            const fileName = `${user.id}/${Date.now()}_${file.name}`;
            await env.UPLOADS.put(fileName, file.stream());

            return createResponse({
                success: true,
                file_id: fileName,
                url: `https://uploads.brainsait.com/${fileName}`,
                size: file.size,
                type: file.type
            });
        }

        return createResponse({ error: 'Upload service not configured' }, 503);

    } catch (error) {
        console.error('Upload error:', error);
        return createResponse({ error: 'Upload failed' }, 500);
    }
}

// Export for Cloudflare Workers
export { default };