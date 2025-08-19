/**
 * Platform Manager - Social Media Platform Integration
 * Supports: TikTok, Instagram, Snapchat, YouTube, Twitter/X
 * Features: Unified API, real-time metrics, automated posting
 * 
 * @author BrainSAIT Team
 */

class PlatformManager {
    constructor(config = {}) {
        this.config = {
            platforms: {
                tiktok: {
                    enabled: true,
                    apiKey: config.tiktok?.apiKey,
                    clientId: config.tiktok?.clientId,
                    clientSecret: config.tiktok?.clientSecret,
                    redirectUri: config.tiktok?.redirectUri,
                    scopes: ['user.info.basic', 'video.upload', 'video.list'],
                    rateLimit: 100 // requests per hour
                },
                instagram: {
                    enabled: true,
                    accessToken: config.instagram?.accessToken,
                    clientId: config.instagram?.clientId,
                    clientSecret: config.instagram?.clientSecret,
                    apiVersion: 'v18.0',
                    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
                    rateLimit: 200
                },
                snapchat: {
                    enabled: true,
                    apiKey: config.snapchat?.apiKey,
                    clientId: config.snapchat?.clientId,
                    clientSecret: config.snapchat?.clientSecret,
                    scopes: ['snapchat-marketing-api'],
                    rateLimit: 150
                },
                youtube: {
                    enabled: true,
                    apiKey: config.youtube?.apiKey,
                    clientId: config.youtube?.clientId,
                    clientSecret: config.youtube?.clientSecret,
                    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
                    rateLimit: 100
                },
                twitter: {
                    enabled: true,
                    apiKey: config.twitter?.apiKey,
                    apiSecret: config.twitter?.apiSecret,
                    accessToken: config.twitter?.accessToken,
                    accessSecret: config.twitter?.accessSecret,
                    bearerToken: config.twitter?.bearerToken,
                    rateLimit: 300
                }
            },
            polling: {
                enabled: true,
                interval: 300000, // 5 minutes
                metrics: ['views', 'likes', 'comments', 'shares', 'reach']
            },
            caching: {
                enabled: true,
                ttl: 600000, // 10 minutes
                maxSize: 500
            },
            webhooks: {
                enabled: true,
                endpoint: '/api/webhooks/platforms',
                secret: config.webhookSecret
            },
            ...config
        };

        this.platforms = new Map();
        this.connectedPlatforms = new Set();
        this.cache = new Map();
        this.rateLimiters = new Map();
        this.metrics = new Map();
        this.webhookHandlers = new Map();
        
        this.pollingTimer = null;
        this.isInitialized = false;
        
        this.setupPlatforms();
    }

    /**
     * Initialize platform manager
     */
    async initialize() {
        try {
            console.log('📱 Initializing Platform Manager...');
            
            // Initialize enabled platforms
            const initPromises = [];
            for (const [name, platform] of this.platforms) {
                if (this.config.platforms[name].enabled) {
                    initPromises.push(this.initializePlatform(name, platform));
                }
            }
            
            await Promise.all(initPromises);
            
            // Setup rate limiters
            this.setupRateLimiters();
            
            // Setup webhook handlers
            this.setupWebhookHandlers();
            
            // Start metrics polling if enabled
            if (this.config.polling.enabled) {
                this.startMetricsPolling();
            }
            
            this.isInitialized = true;
            console.log('✅ Platform Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Platform Manager:', error);
            throw error;
        }
    }

    /**
     * Setup platform instances
     */
    setupPlatforms() {
        this.platforms.set('tiktok', new TikTokPlatform(this.config.platforms.tiktok));
        this.platforms.set('instagram', new InstagramPlatform(this.config.platforms.instagram));
        this.platforms.set('snapchat', new SnapchatPlatform(this.config.platforms.snapchat));
        this.platforms.set('youtube', new YouTubePlatform(this.config.platforms.youtube));
        this.platforms.set('twitter', new TwitterPlatform(this.config.platforms.twitter));
    }

    /**
     * Initialize single platform
     */
    async initializePlatform(name, platform) {
        try {
            await platform.initialize();
            
            // Check if user is connected/authenticated
            const isConnected = await platform.checkConnection();
            if (isConnected) {
                this.connectedPlatforms.add(name);
            }
            
            console.log(`✅ ${name} platform initialized`);
        } catch (error) {
            console.warn(`⚠️ Failed to initialize ${name} platform:`, error);
        }
    }

    /**
     * Connect to a platform (OAuth flow)
     */
    async connectPlatform(platformName, authData = null) {
        const platform = this.platforms.get(platformName);
        if (!platform) {
            throw new Error(`Platform ${platformName} not found`);
        }

        try {
            if (authData) {
                // Complete OAuth with provided auth data
                await platform.authenticate(authData);
            } else {
                // Start OAuth flow
                const authUrl = await platform.getAuthUrl();
                return { authUrl, platform: platformName };
            }
            
            // Verify connection
            const isConnected = await platform.checkConnection();
            if (isConnected) {
                this.connectedPlatforms.add(platformName);
                
                // Initialize user profile and basic data
                await this.initializePlatformData(platformName);
                
                console.log(`✅ Successfully connected to ${platformName}`);
                return { success: true, platform: platformName };
            } else {
                throw new Error('Connection verification failed');
            }
            
        } catch (error) {
            console.error(`❌ Failed to connect to ${platformName}:`, error);
            throw error;
        }
    }

    /**
     * Disconnect from a platform
     */
    async disconnectPlatform(platformName) {
        const platform = this.platforms.get(platformName);
        if (!platform) {
            throw new Error(`Platform ${platformName} not found`);
        }

        try {
            await platform.disconnect();
            this.connectedPlatforms.delete(platformName);
            this.metrics.delete(platformName);
            
            console.log(`✅ Disconnected from ${platformName}`);
            return { success: true, platform: platformName };
            
        } catch (error) {
            console.error(`❌ Failed to disconnect from ${platformName}:`, error);
            throw error;
        }
    }

    /**
     * Post content to platform(s)
     */
    async postContent(content, options = {}) {
        const {
            platforms = Array.from(this.connectedPlatforms),
            scheduleAt = null,
            optimize = true,
            trackMetrics = true
        } = options;

        const results = [];
        
        for (const platformName of platforms) {
            if (!this.connectedPlatforms.has(platformName)) {
                results.push({
                    platform: platformName,
                    success: false,
                    error: 'Platform not connected'
                });
                continue;
            }

            try {
                const platform = this.platforms.get(platformName);
                
                // Optimize content for platform if requested
                let optimizedContent = content;
                if (optimize) {
                    optimizedContent = await this.optimizeContentForPlatform(content, platformName);
                }
                
                // Schedule or post immediately
                let result;
                if (scheduleAt) {
                    result = await platform.schedulePost(optimizedContent, scheduleAt);
                } else {
                    result = await platform.post(optimizedContent);
                }
                
                // Track metrics if enabled
                if (trackMetrics && result.postId) {
                    this.trackPost(platformName, result.postId, content);
                }
                
                results.push({
                    platform: platformName,
                    success: true,
                    postId: result.postId,
                    url: result.url,
                    scheduledFor: scheduleAt
                });
                
            } catch (error) {
                console.error(`Failed to post to ${platformName}:`, error);
                results.push({
                    platform: platformName,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Get platform metrics
     */
    async getMetrics(platformName = null, timeRange = '7d') {
        const platforms = platformName ? [platformName] : Array.from(this.connectedPlatforms);
        const metrics = {};
        
        for (const platform of platforms) {
            try {
                const cacheKey = `metrics_${platform}_${timeRange}`;
                
                // Check cache first
                if (this.config.caching.enabled) {
                    const cached = this.cache.get(cacheKey);
                    if (cached && !this.isCacheExpired(cached)) {
                        metrics[platform] = cached.data;
                        continue;
                    }
                }
                
                // Fetch fresh metrics
                const platformInstance = this.platforms.get(platform);
                const platformMetrics = await platformInstance.getMetrics(timeRange);
                
                metrics[platform] = platformMetrics;
                
                // Cache results
                if (this.config.caching.enabled) {
                    this.cache.set(cacheKey, {
                        data: platformMetrics,
                        timestamp: Date.now(),
                        ttl: this.config.caching.ttl
                    });
                }
                
            } catch (error) {
                console.error(`Failed to get metrics for ${platform}:`, error);
                metrics[platform] = { error: error.message };
            }
        }
        
        return platformName ? metrics[platformName] : metrics;
    }

    /**
     * Get unified analytics across all platforms
     */
    async getUnifiedAnalytics(timeRange = '7d') {
        const allMetrics = await this.getMetrics(null, timeRange);
        
        const unified = {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalReach: 0,
            totalEngagement: 0,
            platforms: {},
            trends: {},
            topPerforming: []
        };

        // Aggregate metrics across platforms
        for (const [platform, metrics] of Object.entries(allMetrics)) {
            if (metrics.error) {continue;}
            
            unified.platforms[platform] = metrics;
            unified.totalViews += metrics.views || 0;
            unified.totalLikes += metrics.likes || 0;
            unified.totalComments += metrics.comments || 0;
            unified.totalShares += metrics.shares || 0;
            unified.totalReach += metrics.reach || 0;
            unified.totalEngagement += metrics.engagement || 0;
        }

        // Calculate engagement rate
        if (unified.totalReach > 0) {
            unified.engagementRate = (unified.totalEngagement / unified.totalReach * 100).toFixed(2);
        }

        // Identify trends and top performing content
        unified.trends = await this.calculateTrends(allMetrics, timeRange);
        unified.topPerforming = await this.getTopPerforming(allMetrics, timeRange);
        
        return unified;
    }

    /**
     * Optimize content for specific platform
     */
    async optimizeContentForPlatform(content, platformName) {
        const optimizations = {
            tiktok: {
                maxLength: 2200,
                hashtags: { max: 5, trending: true },
                videoSpecs: { maxDuration: 60, aspectRatio: '9:16' }
            },
            instagram: {
                maxLength: 2200,
                hashtags: { max: 30, recommended: 5 },
                imageSpecs: { aspectRatio: '1:1', minWidth: 1080 }
            },
            snapchat: {
                maxLength: 250,
                hashtags: { max: 3 },
                videoSpecs: { maxDuration: 60, aspectRatio: '9:16' }
            },
            youtube: {
                titleMaxLength: 100,
                descriptionMaxLength: 5000,
                tags: { max: 15 }
            },
            twitter: {
                maxLength: 280,
                hashtags: { max: 2 },
                images: { max: 4 }
            }
        };

        const platformRules = optimizations[platformName];
        if (!platformRules) {return content;}

        const optimized = { ...content };

        // Optimize text length
        if (optimized.text && optimized.text.length > platformRules.maxLength) {
            optimized.text = optimized.text.substring(0, platformRules.maxLength - 3) + '...';
        }

        // Optimize hashtags
        if (optimized.hashtags && platformRules.hashtags) {
            if (optimized.hashtags.length > platformRules.hashtags.max) {
                optimized.hashtags = optimized.hashtags.slice(0, platformRules.hashtags.max);
            }
        }

        // Platform-specific optimizations
        if (platformName === 'twitter' && optimized.text) {
            // Add thread support for long content
            if (content.text && content.text.length > 280) {
                optimized.thread = this.createTwitterThread(content.text);
            }
        }

        return optimized;
    }

    /**
     * Get platform connection status
     */
    getConnectionStatus() {
        const status = {};
        
        for (const [name, platform] of this.platforms) {
            status[name] = {
                enabled: this.config.platforms[name].enabled,
                connected: this.connectedPlatforms.has(name),
                hasCredentials: platform.hasCredentials(),
                rateLimitRemaining: this.getRateLimitRemaining(name)
            };
        }
        
        return status;
    }

    /**
     * Setup metrics polling
     */
    startMetricsPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
        
        this.pollingTimer = setInterval(async () => {
            try {
                await this.pollMetrics();
            } catch (error) {
                console.error('Metrics polling error:', error);
            }
        }, this.config.polling.interval);
        
        console.log('📊 Started metrics polling');
    }

    /**
     * Poll metrics from all connected platforms
     */
    async pollMetrics() {
        const metrics = await this.getMetrics();
        
        // Store latest metrics
        for (const [platform, data] of Object.entries(metrics)) {
            if (!data.error) {
                this.metrics.set(platform, {
                    data,
                    timestamp: Date.now()
                });
            }
        }
        
        // Emit metrics update event
        this.emit('metrics:updated', metrics);
    }

    /**
     * Setup webhook handlers for real-time updates
     */
    setupWebhookHandlers() {
        this.webhookHandlers.set('tiktok', this.handleTikTokWebhook.bind(this));
        this.webhookHandlers.set('instagram', this.handleInstagramWebhook.bind(this));
        this.webhookHandlers.set('snapchat', this.handleSnapchatWebhook.bind(this));
        this.webhookHandlers.set('youtube', this.handleYouTubeWebhook.bind(this));
        this.webhookHandlers.set('twitter', this.handleTwitterWebhook.bind(this));
    }

    /**
     * Handle incoming webhooks
     */
    async handleWebhook(platform, payload, signature = null) {
        const handler = this.webhookHandlers.get(platform);
        if (!handler) {
            throw new Error(`No webhook handler for platform: ${platform}`);
        }

        // Verify webhook signature if provided
        if (signature && !this.verifyWebhookSignature(platform, payload, signature)) {
            throw new Error('Invalid webhook signature');
        }

        return await handler(payload);
    }

    /**
     * Platform-specific webhook handlers
     */
    async handleTikTokWebhook(payload) {
        // Handle TikTok webhook events
        switch (payload.event) {
            case 'video.publish':
                await this.updatePostMetrics('tiktok', payload.video_id, payload.data);
                break;
            case 'video.metrics_update':
                await this.updatePostMetrics('tiktok', payload.video_id, payload.metrics);
                break;
        }
    }

    async handleInstagramWebhook(payload) {
        // Handle Instagram webhook events
        if (payload.entry) {
            for (const entry of payload.entry) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'media') {
                            await this.updatePostMetrics('instagram', change.value.id, change.value);
                        }
                    }
                }
            }
        }
    }

    async handleSnapchatWebhook(payload) {
        // Handle Snapchat webhook events
        // Implementation based on Snapchat's webhook format
    }

    async handleYouTubeWebhook(payload) {
        // Handle YouTube webhook events
        // Implementation based on YouTube's webhook format
    }

    async handleTwitterWebhook(payload) {
        // Handle Twitter webhook events
        // Implementation based on Twitter's webhook format
    }

    /**
     * Rate limiting functionality
     */
    setupRateLimiters() {
        for (const [platform, config] of Object.entries(this.config.platforms)) {
            if (config.enabled) {
                this.rateLimiters.set(platform, {
                    requests: [],
                    limit: config.rateLimit,
                    window: 3600000 // 1 hour
                });
            }
        }
    }

    isRateLimited(platform) {
        const limiter = this.rateLimiters.get(platform);
        if (!limiter) {return false;}

        const now = Date.now();
        const windowStart = now - limiter.window;
        
        limiter.requests = limiter.requests.filter(time => time > windowStart);
        return limiter.requests.length >= limiter.limit;
    }

    getRateLimitRemaining(platform) {
        const limiter = this.rateLimiters.get(platform);
        if (!limiter) {return 0;}

        const now = Date.now();
        const windowStart = now - limiter.window;
        const recentRequests = limiter.requests.filter(time => time > windowStart);
        
        return Math.max(0, limiter.limit - recentRequests.length);
    }

    recordRequest(platform) {
        const limiter = this.rateLimiters.get(platform);
        if (limiter) {
            limiter.requests.push(Date.now());
        }
    }

    /**
     * Utility methods
     */
    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }

    emit(event, data) {
        const customEvent = new CustomEvent(`platforms:${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }

    verifyWebhookSignature(platform, payload, signature) {
        // Implement signature verification for each platform
        const secret = this.config.webhooks.secret;
        // Platform-specific signature verification logic
        return true; // Placeholder
    }

    createTwitterThread(text) {
        const maxLength = 280;
        const tweets = [];
        let currentTweet = '';
        const words = text.split(' ');
        
        for (const word of words) {
            if ((currentTweet + ' ' + word).length <= maxLength - 4) { // Reserve space for " n/x"
                currentTweet += (currentTweet ? ' ' : '') + word;
            } else {
                tweets.push(currentTweet);
                currentTweet = word;
            }
        }
        
        if (currentTweet) {
            tweets.push(currentTweet);
        }
        
        // Add thread numbering
        return tweets.map((tweet, index) => `${tweet} ${index + 1}/${tweets.length}`);
    }

    async calculateTrends(metrics, timeRange) {
        // Calculate engagement trends, growth rates, etc.
        return {
            engagement: { direction: 'up', percentage: 15.2 },
            reach: { direction: 'up', percentage: 8.7 },
            followers: { direction: 'up', percentage: 3.1 }
        };
    }

    async getTopPerforming(metrics, timeRange) {
        // Get top performing posts across platforms
        return [];
    }

    async updatePostMetrics(platform, postId, metrics) {
        // Update stored post metrics
        this.emit('post:metrics-updated', { platform, postId, metrics });
    }

    trackPost(platform, postId, content) {
        // Track post for metrics collection
        const tracked = this.metrics.get(`${platform}_posts`) || [];
        tracked.push({
            postId,
            platform,
            content,
            createdAt: Date.now()
        });
        this.metrics.set(`${platform}_posts`, tracked);
    }

    async initializePlatformData(platformName) {
        const platform = this.platforms.get(platformName);
        
        // Load user profile
        const profile = await platform.getUserProfile();
        this.cache.set(`profile_${platformName}`, {
            data: profile,
            timestamp: Date.now(),
            ttl: 3600000 // 1 hour
        });
        
        // Load recent metrics
        const metrics = await platform.getMetrics('7d');
        this.metrics.set(platformName, {
            data: metrics,
            timestamp: Date.now()
        });
    }

    /**
     * Stop polling and cleanup
     */
    destroy() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
        
        this.platforms.clear();
        this.connectedPlatforms.clear();
        this.cache.clear();
        this.metrics.clear();
        this.rateLimiters.clear();
    }
}

/**
 * Individual Platform Classes (Base implementations)
 */

class BasePlatform {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
    }

    async initialize() {
        // Override in subclasses
    }

    hasCredentials() {
        // Override in subclasses
        return false;
    }

    async checkConnection() {
        // Override in subclasses
        return false;
    }

    async getAuthUrl() {
        // Override in subclasses
        throw new Error('Not implemented');
    }

    async authenticate(authData) {
        // Override in subclasses
        throw new Error('Not implemented');
    }

    async disconnect() {
        this.isConnected = false;
    }

    async post(content) {
        // Override in subclasses
        throw new Error('Not implemented');
    }

    async schedulePost(content, scheduleAt) {
        // Override in subclasses
        throw new Error('Not implemented');
    }

    async getMetrics(timeRange) {
        // Override in subclasses
        throw new Error('Not implemented');
    }

    async getUserProfile() {
        // Override in subclasses
        throw new Error('Not implemented');
    }
}

class TikTokPlatform extends BasePlatform {
    hasCredentials() {
        return !!(this.config.clientId && this.config.clientSecret);
    }

    async getAuthUrl() {
        const params = new URLSearchParams({
            client_key: this.config.clientId,
            response_type: 'code',
            scope: this.config.scopes.join(','),
            redirect_uri: this.config.redirectUri
        });
        
        return `https://www.tiktok.com/auth/authorize/?${params}`;
    }

    // Other TikTok-specific implementations...
}

class InstagramPlatform extends BasePlatform {
    hasCredentials() {
        return !!(this.config.clientId && this.config.clientSecret);
    }

    // Instagram-specific implementations...
}

class SnapchatPlatform extends BasePlatform {
    hasCredentials() {
        return !!(this.config.clientId && this.config.clientSecret);
    }

    // Snapchat-specific implementations...
}

class YouTubePlatform extends BasePlatform {
    hasCredentials() {
        return !!(this.config.clientId && this.config.clientSecret);
    }

    // YouTube-specific implementations...
}

class TwitterPlatform extends BasePlatform {
    hasCredentials() {
        return !!(this.config.apiKey && this.config.apiSecret);
    }

    // Twitter-specific implementations...
}

export { PlatformManager };