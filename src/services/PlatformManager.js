/**
 * Platform Manager - Unified social media platform integration
 * Handles TikTok, Instagram, Snapchat, YouTube API integrations with real-time WebSocket updates
 */

export class PlatformManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.platforms = new Map();
        this.activeSessions = new Map();
        this.websockets = new Map();
        this.isInitialized = false;
        
        // Platform configurations
        this.platformConfigs = {
            tiktok: {
                name: 'TikTok',
                apiVersion: 'v1',
                endpoints: {
                    posts: '/api/v1/posts',
                    analytics: '/api/v1/analytics',
                    upload: '/api/v1/upload'
                },
                rateLimit: { requests: 100, window: 3600000 }, // 100 req/hour
                features: ['video', 'image', 'story', 'live']
            },
            instagram: {
                name: 'Instagram',
                apiVersion: 'v17.0',
                endpoints: {
                    posts: '/v17.0/me/media',
                    analytics: '/v17.0/me/insights',
                    upload: '/v17.0/me/media'
                },
                rateLimit: { requests: 200, window: 3600000 }, // 200 req/hour
                features: ['image', 'video', 'story', 'reel', 'igtv']
            },
            snapchat: {
                name: 'Snapchat',
                apiVersion: 'v1',
                endpoints: {
                    posts: '/v1/ads/campaigns',
                    analytics: '/v1/ads/campaigns/stats',
                    upload: '/v1/ads/creative'
                },
                rateLimit: { requests: 1000, window: 3600000 }, // 1000 req/hour
                features: ['image', 'video', 'ar']
            },
            youtube: {
                name: 'YouTube',
                apiVersion: 'v3',
                endpoints: {
                    posts: '/youtube/v3/videos',
                    analytics: '/youtube/v3/analytics',
                    upload: '/upload/youtube/v3/videos'
                },
                rateLimit: { requests: 10000, window: 86400000 }, // 10k req/day
                features: ['video', 'live', 'shorts', 'playlist']
            }
        };
        
        // Metrics tracking
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            platformUsage: {},
            responseTime: 0
        };
    }

    /**
     * Initialize all platform integrations
     */
    async initialize() {
        console.log('📱 Initializing Platform Manager...');
        
        try {
            // Initialize platform connections
            for (const [platformId, config] of Object.entries(this.platformConfigs)) {
                await this._initializePlatform(platformId, config);
            }
            
            // Set up WebSocket connections for real-time updates
            await this._setupWebSocketConnections();
            
            // Initialize metrics tracking
            this._initializeMetrics();
            
            // Set up monitoring
            this._setupMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Platform Manager initialized');
            
            this.eventBus.emit('platforms:initialized', {
                platforms: Array.from(this.platforms.keys()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Platform Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Post content to multiple platforms
     */
    async postContent(content, platforms = [], options = {}) {
        const startTime = performance.now();
        this.metrics.totalRequests++;
        
        try {
            const results = new Map();
            const promises = [];
            
            // Validate platforms
            const validPlatforms = platforms.filter(p => this.platforms.has(p));
            
            // Post to each platform concurrently
            for (const platformId of validPlatforms) {
                promises.push(
                    this._postToPlatform(platformId, content, options)
                        .then(result => results.set(platformId, result))
                        .catch(error => results.set(platformId, { success: false, error: error.message }))
                );
            }
            
            await Promise.allSettled(promises);
            
            // Update metrics
            const responseTime = performance.now() - startTime;
            this._updateMetrics(results, responseTime);
            
            // Emit success event
            this.eventBus.emit('platforms:content-posted', {
                content,
                platforms: validPlatforms,
                results: Object.fromEntries(results),
                responseTime,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                results: Object.fromEntries(results),
                metadata: {
                    platforms: validPlatforms,
                    responseTime,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.metrics.failedRequests++;
            console.error('❌ Multi-platform posting failed:', error);
            
            this.eventBus.emit('platforms:posting-failed', {
                error: error.message,
                content,
                platforms,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    /**
     * Get analytics from specific platform
     */
    async getAnalytics(platformId, options = {}) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error(`Platform not found: ${platformId}`);
        }

        const { dateRange = '7d', metrics = 'all' } = options;
        
        try {
            // Simulate API call with realistic data
            const analytics = await this._fetchPlatformAnalytics(platformId, dateRange, metrics);
            
            this.eventBus.emit('platforms:analytics-fetched', {
                platform: platformId,
                analytics,
                dateRange,
                timestamp: new Date().toISOString()
            });
            
            return analytics;
            
        } catch (error) {
            console.error(`❌ Analytics fetch failed for ${platformId}:`, error);
            throw error;
        }
    }

    /**
     * Get real-time metrics for all platforms
     */
    async getRealTimeMetrics() {
        const metrics = {};
        const promises = [];
        
        for (const platformId of this.platforms.keys()) {
            promises.push(
                this._getRealTimeMetrics(platformId)
                    .then(data => metrics[platformId] = data)
                    .catch(error => metrics[platformId] = { error: error.message })
            );
        }
        
        await Promise.allSettled(promises);
        
        return {
            platforms: metrics,
            timestamp: new Date().toISOString(),
            totalPlatforms: this.platforms.size
        };
    }

    /**
     * Schedule content for future posting
     */
    async scheduleContent(content, platforms, scheduleTime, options = {}) {
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const scheduledPost = {
            id: scheduleId,
            content,
            platforms,
            scheduleTime: new Date(scheduleTime),
            options,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        // Store in state manager
        const scheduledPosts = this.stateManager.getState('scheduledPosts') || [];
        scheduledPosts.push(scheduledPost);
        this.stateManager.setState('scheduledPosts', scheduledPosts);
        
        // Set up timer for posting
        const delay = new Date(scheduleTime).getTime() - Date.now();
        if (delay > 0) {
            setTimeout(async () => {
                try {
                    await this.postContent(content, platforms, options);
                    
                    // Update status
                    const updatedPosts = this.stateManager.getState('scheduledPosts') || [];
                    const postIndex = updatedPosts.findIndex(p => p.id === scheduleId);
                    if (postIndex > -1) {
                        updatedPosts[postIndex].status = 'posted';
                        this.stateManager.setState('scheduledPosts', updatedPosts);
                    }
                    
                } catch (error) {
                    console.error('❌ Scheduled post failed:', error);
                    
                    // Update status to failed
                    const updatedPosts = this.stateManager.getState('scheduledPosts') || [];
                    const postIndex = updatedPosts.findIndex(p => p.id === scheduleId);
                    if (postIndex > -1) {
                        updatedPosts[postIndex].status = 'failed';
                        updatedPosts[postIndex].error = error.message;
                        this.stateManager.setState('scheduledPosts', updatedPosts);
                    }
                }
            }, delay);
        }
        
        this.eventBus.emit('platforms:content-scheduled', {
            scheduleId,
            content,
            platforms,
            scheduleTime,
            timestamp: new Date().toISOString()
        });
        
        return { scheduleId, status: 'scheduled' };
    }

    /**
     * Initialize platform connection
     */
    async _initializePlatform(platformId, config) {
        const platform = {
            id: platformId,
            name: config.name,
            status: 'connecting',
            lastUsed: null,
            rateLimiter: this._createRateLimiter(config.rateLimit),
            config,
            connection: null
        };
        
        try {
            // Simulate platform connection
            await this._connectToPlatform(platformId, config);
            platform.status = 'connected';
            platform.connection = {
                connected: true,
                lastPing: new Date().toISOString()
            };
            
        } catch (error) {
            platform.status = 'error';
            platform.error = error.message;
            console.warn(`⚠️ Failed to connect to ${config.name}:`, error);
        }
        
        this.platforms.set(platformId, platform);
        this.metrics.platformUsage[platformId] = { requests: 0, errors: 0 };
    }

    /**
     * Set up WebSocket connections for real-time updates
     */
    async _setupWebSocketConnections() {
        // Use the main WebSocket service for platform updates
        const webSocketService = this.stateManager.getState('services.websocket');
        
        if (webSocketService) {
            // Subscribe to platform-specific channels
            for (const platformId of this.platforms.keys()) {
                try {
                    const unsubscribe = webSocketService.subscribe(
                        `platform:${platformId}`,
                        (data) => this._handleRealTimeUpdate(platformId, data),
                        { platformId }
                    );
                    
                    this.websockets.set(platformId, { unsubscribe, connected: true });
                    
                } catch (error) {
                    console.warn(`⚠️ Platform WebSocket subscription failed for ${platformId}:`, error);
                }
            }
            
            // Subscribe to general platform updates
            webSocketService.subscribe(
                'platforms:updates',
                (data) => this._handleGeneralPlatformUpdate(data)
            );
            
        } else {
            // Fallback to simulated WebSocket connections
            for (const platformId of this.platforms.keys()) {
                try {
                    const ws = this._createWebSocketConnection(platformId);
                    this.websockets.set(platformId, ws);
                    
                } catch (error) {
                    console.warn(`⚠️ WebSocket connection failed for ${platformId}:`, error);
                }
            }
        }
    }

    /**
     * Create WebSocket connection simulation
     */
    _createWebSocketConnection(platformId) {
        // Simulate WebSocket with EventEmitter-like behavior
        const ws = {
            platform: platformId,
            connected: true,
            lastMessage: null,
            send: (data) => console.log(`📡 Sending to ${platformId}:`, data),
            close: () => console.log(`📡 Closing connection to ${platformId}`)
        };
        
        // Simulate periodic updates
        const updateInterval = setInterval(() => {
            if (ws.connected) {
                const update = this._generateRealTimeUpdate(platformId);
                this.eventBus.emit('platforms:realtime-update', {
                    platform: platformId,
                    data: update,
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000); // Every 30 seconds
        
        ws.interval = updateInterval;
        return ws;
    }

    /**
     * Generate real-time update simulation
     */
    _generateRealTimeUpdate(platformId) {
        return {
            platform: platformId,
            metrics: {
                activeUsers: Math.floor(Math.random() * 10000) + 1000,
                engagement: (Math.random() * 5 + 2).toFixed(2) + '%',
                reach: Math.floor(Math.random() * 50000) + 5000,
                impressions: Math.floor(Math.random() * 100000) + 10000
            },
            notifications: Math.floor(Math.random() * 20),
            lastActivity: new Date().toISOString()
        };
    }

    /**
     * Post content to specific platform
     */
    async _postToPlatform(platformId, content, options) {
        const platform = this.platforms.get(platformId);
        
        // Check rate limits
        if (!platform.rateLimiter.canMakeRequest()) {
            throw new Error(`Rate limit exceeded for ${platformId}`);
        }
        
        platform.rateLimiter.recordRequest();
        platform.lastUsed = new Date().toISOString();
        
        // Simulate platform-specific posting
        return await this._simulatePlatformPost(platformId, content, options);
    }

    /**
     * Simulate platform posting
     */
    async _simulatePlatformPost(platformId, content, options) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // 90% success rate simulation
        if (Math.random() < 0.9) {
            const postId = `${platformId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            return {
                success: true,
                postId,
                platform: platformId,
                url: `https://${platformId}.com/post/${postId}`,
                scheduledFor: options.scheduleTime || new Date().toISOString(),
                metadata: {
                    contentType: content.type || 'text',
                    platform: this.platformConfigs[platformId].name
                }
            };
        } else {
            throw new Error(`API error from ${platformId}`);
        }
    }

    /**
     * Fetch platform analytics simulation
     */
    async _fetchPlatformAnalytics(platformId, dateRange, metrics) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const baseMetrics = {
            views: Math.floor(Math.random() * 100000) + 10000,
            likes: Math.floor(Math.random() * 5000) + 500,
            shares: Math.floor(Math.random() * 1000) + 100,
            comments: Math.floor(Math.random() * 500) + 50,
            engagement_rate: (Math.random() * 8 + 2).toFixed(2) + '%',
            reach: Math.floor(Math.random() * 80000) + 8000,
            impressions: Math.floor(Math.random() * 150000) + 15000
        };
        
        return {
            platform: platformId,
            dateRange,
            metrics: baseMetrics,
            trend: {
                views: (Math.random() - 0.5) * 20,
                engagement: (Math.random() - 0.5) * 10
            },
            topPosts: [
                { id: '1', title: 'Top performing post', views: baseMetrics.views * 0.3 },
                { id: '2', title: 'Second best post', views: baseMetrics.views * 0.2 },
                { id: '3', title: 'Third best post', views: baseMetrics.views * 0.15 }
            ]
        };
    }

    /**
     * Get real-time metrics for platform
     */
    async _getRealTimeMetrics(platformId) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        return {
            platform: platformId,
            activeNow: Math.floor(Math.random() * 1000) + 100,
            todayViews: Math.floor(Math.random() * 10000) + 1000,
            hourlyEngagement: (Math.random() * 5 + 1).toFixed(2) + '%',
            status: 'active',
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Connect to platform API
     */
    async _connectToPlatform(platformId, config) {
        // Simulate platform connection
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // 95% success rate
        if (Math.random() < 0.95) {
            return { connected: true, apiVersion: config.apiVersion };
        } else {
            throw new Error(`Failed to connect to ${config.name} API`);
        }
    }

    /**
     * Create rate limiter for platform
     */
    _createRateLimiter(limits) {
        let requests = [];
        
        return {
            canMakeRequest() {
                const now = Date.now();
                requests = requests.filter(time => now - time < limits.window);
                return requests.length < limits.requests;
            },
            
            recordRequest() {
                requests.push(Date.now());
            }
        };
    }

    /**
     * Initialize metrics tracking
     */
    _initializeMetrics() {
        // Set initial state
        this.stateManager.setState('platformMetrics', this.metrics);
        this.stateManager.setState('scheduledPosts', []);
    }

    /**
     * Update metrics
     */
    _updateMetrics(results, responseTime) {
        let successCount = 0;
        
        for (const [platform, result] of results) {
            if (result.success) {
                successCount++;
            } else {
                this.metrics.platformUsage[platform].errors++;
            }
            this.metrics.platformUsage[platform].requests++;
        }
        
        this.metrics.successfulRequests += successCount;
        this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2;
        
        // Update state
        this.stateManager.setState('platformMetrics', this.metrics);
    }

    /**
     * Set up monitoring
     */
    _setupMonitoring() {
        // Health check every 5 minutes
        setInterval(() => {
            this._performHealthCheck();
        }, 300000);
        
        // Metrics reporting every minute
        setInterval(() => {
            this.eventBus.emit('platforms:metrics', this.getMetrics());
        }, 60000);
    }

    /**
     * Perform health check on all platforms
     */
    async _performHealthCheck() {
        for (const [platformId, platform] of this.platforms) {
            try {
                // Simple ping test
                await this._connectToPlatform(platformId, platform.config);
                platform.status = 'connected';
                
            } catch (error) {
                platform.status = 'error';
                platform.error = error.message;
                console.warn(`Platform ${platformId} health check failed:`, error.message);
            }
        }
        
        this.eventBus.emit('platforms:health-check', {
            platforms: Object.fromEntries(
                Array.from(this.platforms.entries()).map(([id, platform]) => [id, platform.status])
            )
        });
    }

    /**
     * Get platform manager metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            platforms: Object.fromEntries(
                Array.from(this.platforms.entries()).map(([id, platform]) => [
                    id, 
                    { 
                        status: platform.status, 
                        lastUsed: platform.lastUsed,
                        name: platform.name
                    }
                ])
            ),
            websockets: Object.fromEntries(
                Array.from(this.websockets.entries()).map(([id, ws]) => [id, ws.connected])
            ),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get platform configuration
     */
    getPlatformConfig(platformId) {
        return this.platformConfigs[platformId] || null;
    }

    /**
     * Update platform configuration
     */
    updatePlatformConfig(platformId, updates) {
        if (this.platformConfigs[platformId]) {
            this.platformConfigs[platformId] = { ...this.platformConfigs[platformId], ...updates };
            this.eventBus.emit('platforms:config-updated', { platform: platformId, config: updates });
        }
    }

    /**
     * Handle real-time platform update
     */
    _handleRealTimeUpdate(platformId, data) {
        const platform = this.platforms.get(platformId);
        if (!platform) {return;}
        
        // Update platform metrics
        if (data.metrics) {
            Object.assign(platform.metrics || {}, data.metrics);
        }
        
        // Update platform status
        if (data.status) {
            platform.status = data.status;
        }
        
        // Handle specific update types
        switch (data.type) {
            case 'engagement_update':
                this._handleEngagementUpdate(platformId, data);
                break;
            case 'post_performance':
                this._handlePostPerformanceUpdate(platformId, data);
                break;
            case 'api_limit_warning':
                this._handleApiLimitWarning(platformId, data);
                break;
            case 'connection_status':
                this._handleConnectionStatusUpdate(platformId, data);
                break;
        }
        
        this.eventBus.emit('platforms:realtime-update', {
            platform: platformId,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle general platform updates
     */
    _handleGeneralPlatformUpdate(data) {
        switch (data.type) {
            case 'algorithm_change':
                this._handleAlgorithmChange(data);
                break;
            case 'feature_update':
                this._handleFeatureUpdate(data);
                break;
            case 'maintenance_notice':
                this._handleMaintenanceNotice(data);
                break;
        }
    }

    /**
     * Handle engagement update
     */
    _handleEngagementUpdate(platformId, data) {
        const { postId, metrics } = data;
        
        // Store engagement data
        const engagementKey = `engagement:${platformId}:${postId}`;
        this.stateManager.setState(engagementKey, metrics);
        
        // Trigger engagement analytics
        this.eventBus.emit('analytics:engagement-update', {
            platform: platformId,
            postId,
            metrics,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle post performance update
     */
    _handlePostPerformanceUpdate(platformId, data) {
        const { postId, performance } = data;
        
        // Update performance tracking
        const performanceKey = `performance:${platformId}:${postId}`;
        this.stateManager.setState(performanceKey, performance);
        
        // Emit performance event
        this.eventBus.emit('platforms:post-performance', {
            platform: platformId,
            postId,
            performance,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle API limit warning
     */
    _handleApiLimitWarning(platformId, data) {
        const platform = this.platforms.get(platformId);
        if (platform) {
            platform.rateLimiter.warningReceived = true;
            platform.rateLimiter.remainingRequests = data.remainingRequests;
            platform.rateLimiter.resetTime = data.resetTime;
        }
        
        this.eventBus.emit('platforms:api-limit-warning', {
            platform: platformId,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle connection status update
     */
    _handleConnectionStatusUpdate(platformId, data) {
        const platform = this.platforms.get(platformId);
        if (platform) {
            platform.status = data.status;
            platform.lastPing = data.timestamp;
        }
        
        this.eventBus.emit('platforms:connection-status', {
            platform: platformId,
            status: data.status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle algorithm change notification
     */
    _handleAlgorithmChange(data) {
        const { platform, changes, effective_date } = data;
        
        // Store algorithm change info
        this.stateManager.setState(`algorithm_changes:${platform}`, {
            changes,
            effective_date,
            notified_at: new Date().toISOString()
        });
        
        // Notify components
        this.eventBus.emit('platforms:algorithm-change', {
            platform,
            changes,
            effective_date,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle feature update notification
     */
    _handleFeatureUpdate(data) {
        const { platform, features, version } = data;
        
        // Update platform configuration
        const platformConfig = this.platformConfigs[platform];
        if (platformConfig) {
            platformConfig.features = [...(platformConfig.features || []), ...features];
            platformConfig.version = version;
        }
        
        this.eventBus.emit('platforms:feature-update', {
            platform,
            features,
            version,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle maintenance notice
     */
    _handleMaintenanceNotice(data) {
        const { platform, start_time, end_time, description } = data;
        
        // Store maintenance info
        this.stateManager.setState(`maintenance:${platform}`, {
            start_time,
            end_time,
            description,
            notified_at: new Date().toISOString()
        });
        
        this.eventBus.emit('platforms:maintenance-notice', {
            platform,
            start_time,
            end_time,
            description,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Destroy platform manager
     */
    destroy() {
        // Close WebSocket connections
        for (const [platformId, ws] of this.websockets) {
            if (ws.unsubscribe) {
                ws.unsubscribe();
            } else if (ws.interval) {
                clearInterval(ws.interval);
                ws.close();
            }
        }
        
        this.platforms.clear();
        this.websockets.clear();
        this.activeSessions.clear();
        
        console.log('📱 Platform Manager destroyed');
    }
}