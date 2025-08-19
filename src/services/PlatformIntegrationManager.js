/**
 * Platform Integration Manager - Multi-platform social media management
 * Supports Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube and more
 */

export class PlatformIntegrationManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.platforms = new Map();
        this.connectedAccounts = new Map();
        this.scheduledPosts = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            maxPostsPerDay: 50,
            maxCharacterLimits: {
                twitter: 280,
                facebook: 63206,
                instagram: 2200,
                linkedin: 3000,
                tiktok: 300,
                youtube: 5000
            },
            supportedFormats: {
                twitter: ['text', 'image', 'gif', 'video'],
                facebook: ['text', 'image', 'video', 'link', 'poll'],
                instagram: ['image', 'video', 'story', 'reel'],
                linkedin: ['text', 'image', 'video', 'document'],
                tiktok: ['video'],
                youtube: ['video', 'short']
            }
        };
        
        this.metrics = {
            totalPosts: 0,
            successfulPosts: 0,
            failedPosts: 0,
            totalEngagement: 0,
            platformUsage: {}
        };
    }

    /**
     * Initialize platform integrations
     */
    async initialize() {
        console.log('🔗 Initializing Platform Integration Manager...');
        
        try {
            // Initialize supported platforms
            this._initializeSupportedPlatforms();
            
            // Load connected accounts from state
            await this._loadConnectedAccounts();
            
            // Set up event listeners
            this._setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Platform Integration Manager initialized');
            
            this.eventBus.emit('platform:manager-initialized', {
                supportedPlatforms: this.getSupportedPlatforms(),
                connectedAccounts: this.connectedAccounts.size,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Platform Integration Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize supported platforms
     */
    _initializeSupportedPlatforms() {
        const platforms = [
            {
                id: 'facebook',
                name: 'Facebook',
                icon: '📘',
                type: 'social',
                features: ['post', 'schedule', 'analytics', 'pages', 'groups'],
                oauth: true,
                apiVersion: 'v17.0'
            },
            {
                id: 'instagram',
                name: 'Instagram',
                icon: '📷',
                type: 'social',
                features: ['post', 'story', 'reel', 'schedule', 'analytics'],
                oauth: true,
                apiVersion: 'graph'
            },
            {
                id: 'twitter',
                name: 'Twitter',
                icon: '🐦',
                type: 'social',
                features: ['post', 'thread', 'schedule', 'analytics', 'dm'],
                oauth: true,
                apiVersion: 'v2'
            },
            {
                id: 'linkedin',
                name: 'LinkedIn',
                icon: '💼',
                type: 'professional',
                features: ['post', 'article', 'schedule', 'analytics', 'company'],
                oauth: true,
                apiVersion: 'v2'
            },
            {
                id: 'tiktok',
                name: 'TikTok',
                icon: '🎵',
                type: 'video',
                features: ['post', 'schedule', 'analytics'],
                oauth: true,
                apiVersion: 'v1'
            },
            {
                id: 'youtube',
                name: 'YouTube',
                icon: '📺',
                type: 'video',
                features: ['upload', 'schedule', 'analytics', 'shorts'],
                oauth: true,
                apiVersion: 'v3'
            },
            {
                id: 'pinterest',
                name: 'Pinterest',
                icon: '📌',
                type: 'visual',
                features: ['pin', 'board', 'schedule', 'analytics'],
                oauth: true,
                apiVersion: 'v5'
            },
            {
                id: 'snapchat',
                name: 'Snapchat',
                icon: '👻',
                type: 'ephemeral',
                features: ['story', 'spotlight', 'analytics'],
                oauth: true,
                apiVersion: 'v1'
            }
        ];

        platforms.forEach(platform => {
            this.platforms.set(platform.id, {
                ...platform,
                status: 'available',
                lastSync: null,
                rateLimits: this._getPlatformRateLimits(platform.id)
            });
            
            this.metrics.platformUsage[platform.id] = {
                posts: 0,
                engagement: 0,
                lastUsed: null
            };
        });
    }

    /**
     * Get platform rate limits
     */
    _getPlatformRateLimits(platformId) {
        const limits = {
            facebook: { posts: 25, window: 3600000 }, // 25 posts/hour
            instagram: { posts: 25, window: 3600000 }, // 25 posts/hour
            twitter: { posts: 300, window: 900000 }, // 300 posts/15min
            linkedin: { posts: 100, window: 86400000 }, // 100 posts/day
            tiktok: { posts: 5, window: 3600000 }, // 5 posts/hour
            youtube: { uploads: 6, window: 86400000 }, // 6 uploads/day
            pinterest: { pins: 100, window: 86400000 }, // 100 pins/day
            snapchat: { stories: 10, window: 3600000 } // 10 stories/hour
        };
        
        return limits[platformId] || { posts: 10, window: 3600000 };
    }

    /**
     * Connect platform account
     */
    async connectPlatform(platformId, credentials, options = {}) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error(`Unsupported platform: ${platformId}`);
        }

        try {
            // Validate credentials
            await this._validateCredentials(platformId, credentials);
            
            // Get account information
            const accountInfo = await this._getAccountInfo(platformId, credentials);
            
            // Store connection
            const connection = {
                platformId,
                accountId: accountInfo.id,
                accountName: accountInfo.name,
                accountHandle: accountInfo.handle || accountInfo.username,
                credentials: this._encryptCredentials(credentials),
                permissions: accountInfo.permissions || [],
                connectedAt: new Date().toISOString(),
                lastSync: new Date().toISOString(),
                status: 'active',
                ...options
            };
            
            this.connectedAccounts.set(`${platformId}:${accountInfo.id}`, connection);
            
            // Update state
            this.stateManager.setState('connectedAccounts', 
                Array.from(this.connectedAccounts.values())
            );
            
            // Update platform status
            platform.status = 'connected';
            platform.lastSync = new Date().toISOString();
            
            this.eventBus.emit('platform:connected', {
                platformId,
                accountId: accountInfo.id,
                accountName: accountInfo.name,
                timestamp: new Date().toISOString()
            });
            
            return connection;
            
        } catch (error) {
            console.error(`Failed to connect ${platformId}:`, error);
            
            this.eventBus.emit('platform:connection-failed', {
                platformId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    /**
     * Disconnect platform account
     */
    async disconnectPlatform(platformId, accountId) {
        const connectionKey = `${platformId}:${accountId}`;
        const connection = this.connectedAccounts.get(connectionKey);
        
        if (!connection) {
            throw new Error(`Connection not found: ${connectionKey}`);
        }

        try {
            // Revoke access tokens if needed
            await this._revokeAccess(platformId, connection.credentials);
            
            // Remove connection
            this.connectedAccounts.delete(connectionKey);
            
            // Update state
            this.stateManager.setState('connectedAccounts', 
                Array.from(this.connectedAccounts.values())
            );
            
            // Update platform status if no more connections
            const hasOtherConnections = Array.from(this.connectedAccounts.keys())
                .some(key => key.startsWith(`${platformId}:`));
            
            if (!hasOtherConnections) {
                const platform = this.platforms.get(platformId);
                if (platform) {
                    platform.status = 'available';
                }
            }
            
            this.eventBus.emit('platform:disconnected', {
                platformId,
                accountId,
                timestamp: new Date().toISOString()
            });
            
            return true;
            
        } catch (error) {
            console.error(`Failed to disconnect ${platformId}:`, error);
            throw error;
        }
    }

    /**
     * Post content to platform(s)
     */
    async postContent(content, platforms, options = {}) {
        const {
            scheduleTime = null,
            mediaFiles = [],
            tags = [],
            location = null,
            targetAudience = null
        } = options;

        const results = [];
        
        for (const platformId of platforms) {
            try {
                // Get platform connection
                const connections = this._getConnections(platformId);
                if (connections.length === 0) {
                    throw new Error(`No connected accounts for ${platformId}`);
                }
                
                // Use first available connection (or implement account selection logic)
                const connection = connections[0];
                
                // Optimize content for platform
                const optimizedContent = this._optimizeContentForPlatform(content, platformId);
                
                // Prepare post data
                const postData = {
                    content: optimizedContent,
                    mediaFiles,
                    tags,
                    location,
                    targetAudience,
                    scheduleTime
                };
                
                // Post or schedule
                let result;
                if (scheduleTime) {
                    result = await this._schedulePost(platformId, connection, postData);
                } else {
                    result = await this._publishPost(platformId, connection, postData);
                }
                
                results.push({
                    platform: platformId,
                    accountId: connection.accountId,
                    success: true,
                    postId: result.id,
                    url: result.url,
                    scheduledFor: scheduleTime,
                    timestamp: new Date().toISOString()
                });
                
                // Update metrics
                this.metrics.totalPosts++;
                this.metrics.successfulPosts++;
                this.metrics.platformUsage[platformId].posts++;
                this.metrics.platformUsage[platformId].lastUsed = new Date().toISOString();
                
            } catch (error) {
                console.error(`Failed to post to ${platformId}:`, error);
                
                results.push({
                    platform: platformId,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.metrics.failedPosts++;
            }
        }
        
        // Emit posting completion event
        this.eventBus.emit('platform:content-posted', {
            results,
            totalPlatforms: platforms.length,
            successfulPosts: results.filter(r => r.success).length,
            timestamp: new Date().toISOString()
        });
        
        return results;
    }

    /**
     * Get supported platforms
     */
    getSupportedPlatforms() {
        return Array.from(this.platforms.keys());
    }

    /**
     * Get connected accounts
     */
    getConnectedAccounts(platformId = null) {
        if (platformId) {
            return this._getConnections(platformId);
        }
        return Array.from(this.connectedAccounts.values());
    }

    /**
     * Get platform information
     */
    getPlatformInfo(platformId) {
        return this.platforms.get(platformId) || null;
    }

    /**
     * Get platform metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            connectedPlatforms: this.platforms.size,
            connectedAccounts: this.connectedAccounts.size,
            scheduledPosts: this.scheduledPosts.length
        };
    }

    /**
     * Helper methods
     */
    _getConnections(platformId) {
        return Array.from(this.connectedAccounts.values())
            .filter(conn => conn.platformId === platformId && conn.status === 'active');
    }

    _optimizeContentForPlatform(content, platformId) {
        const limit = this.config.maxCharacterLimits[platformId];
        if (limit && content.length > limit) {
            return content.substring(0, limit - 3) + '...';
        }
        return content;
    }

    async _validateCredentials(platformId, credentials) {
        // Mock validation - in real implementation, make API calls
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    async _getAccountInfo(platformId, credentials) {
        // Mock account info - in real implementation, fetch from API
        return {
            id: `${platformId}_${Date.now()}`,
            name: `Test ${platformId} Account`,
            handle: `@test_${platformId}`,
            permissions: ['read', 'write', 'manage']
        };
    }

    _encryptCredentials(credentials) {
        // Mock encryption - in real implementation, use proper encryption
        return btoa(JSON.stringify(credentials));
    }

    async _revokeAccess(platformId, credentials) {
        // Mock revocation - in real implementation, revoke tokens
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async _publishPost(platformId, connection, postData) {
        // Mock publishing - in real implementation, use platform APIs
        return {
            id: `post_${Date.now()}`,
            url: `https://${platformId}.com/post/${Date.now()}`
        };
    }

    async _schedulePost(platformId, connection, postData) {
        // Mock scheduling - in real implementation, use platform scheduling APIs
        const scheduledPost = {
            id: `scheduled_${Date.now()}`,
            platformId,
            connection,
            postData,
            scheduledFor: postData.scheduleTime,
            status: 'scheduled'
        };
        
        this.scheduledPosts.push(scheduledPost);
        return scheduledPost;
    }

    async _loadConnectedAccounts() {
        const accounts = this.stateManager.getState('connectedAccounts') || [];
        accounts.forEach(account => {
            const key = `${account.platformId}:${account.accountId}`;
            this.connectedAccounts.set(key, account);
        });
    }

    _setupEventListeners() {
        // Listen for scheduled post execution
        this.eventBus.on('scheduler:execute-post', async (data) => {
            // Handle scheduled post execution
        });
    }

    /**
     * Destroy platform integration manager
     */
    destroy() {
        this.platforms.clear();
        this.connectedAccounts.clear();
        this.scheduledPosts = [];
        console.log('🔗 Platform Integration Manager destroyed');
    }
}