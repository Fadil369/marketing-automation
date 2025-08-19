/**
 * Environment Configuration - Multi-environment setup
 * Supports: development, staging, production environments
 * Features: API endpoints, feature flags, service configurations
 * 
 * @author BrainSAIT Team
 */

class EnvironmentConfig {
    constructor() {
        this.env = this.detectEnvironment();
        this.config = this.loadConfiguration();
        this.featureFlags = this.loadFeatureFlags();
        
        // Validate required environment variables
        this.validateConfiguration();
    }

    /**
     * Detect current environment
     */
    detectEnvironment() {
        // Check for explicit environment variable
        if (typeof process !== 'undefined' && process.env) {
            return process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
        }

        // Check for Cloudflare Workers environment
        if (typeof globalThis !== 'undefined' && globalThis.ENVIRONMENT) {
            return globalThis.ENVIRONMENT;
        }

        // Detect based on hostname
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        
        if (hostname.includes('brainsait.io') && !hostname.includes('staging')) {
            return 'production';
        } else if (hostname.includes('staging') || hostname.includes('preview')) {
            return 'staging';
        } else {
            return 'development';
        }
    }

    /**
     * Load configuration based on environment
     */
    loadConfiguration() {
        const baseConfig = {
            app: {
                name: 'BrainSAIT Marketing Platform',
                version: '1.0.0',
                description: 'AI-Powered Marketing Automation Platform',
                author: 'BrainSAIT Team',
                contact: 'support@brainsait.io'
            },
            features: {
                realTimeUpdates: true,
                darkMode: true,
                multilingual: true,
                notifications: true,
                analytics: true,
                automation: true,
                aiIntegration: true,
                collaboration: false // Premium feature
            },
            ui: {
                theme: 'brainsait',
                language: 'en',
                rtlSupport: true,
                animationsEnabled: true,
                compactMode: false
            },
            performance: {
                enableServiceWorker: true,
                enableCaching: true,
                lazyLoading: true,
                bundleSplitting: true,
                compressionEnabled: true
            },
            monitoring: {
                errorTracking: true,
                performanceMonitoring: true,
                userAnalytics: true,
                debugMode: false
            }
        };

        const environmentConfigs = {
            development: {
                api: {
                    baseUrl: 'http://localhost:8787',
                    timeout: 10000,
                    retries: 2
                },
                database: {
                    url: 'sqlite://./dev.db',
                    migrations: true,
                    logging: true
                },
                services: {
                    openai: {
                        baseUrl: 'https://api.openai.com/v1',
                        timeout: 30000
                    },
                    anthropic: {
                        baseUrl: 'https://api.anthropic.com/v1',
                        timeout: 30000
                    },
                    platforms: {
                        tiktok: {
                            baseUrl: 'https://open-api.tiktok.com',
                            apiVersion: 'v1.3'
                        },
                        instagram: {
                            baseUrl: 'https://graph.instagram.com',
                            apiVersion: 'v18.0'
                        },
                        snapchat: {
                            baseUrl: 'https://adsapi.snapchat.com',
                            apiVersion: 'v1'
                        }
                    }
                },
                websocket: {
                    url: 'ws://localhost:8787/ws',
                    reconnectInterval: 5000,
                    maxReconnectAttempts: 10
                },
                monitoring: {
                    ...baseConfig.monitoring,
                    debugMode: true,
                    verboseLogging: true
                },
                features: {
                    ...baseConfig.features,
                    debugPanel: true,
                    mockData: true
                }
            },

            staging: {
                api: {
                    baseUrl: 'https://staging-api.brainsait.io',
                    timeout: 15000,
                    retries: 3
                },
                database: {
                    url: process.env.DATABASE_URL || 'postgresql://staging',
                    migrations: false,
                    logging: false
                },
                services: {
                    openai: {
                        baseUrl: 'https://api.openai.com/v1',
                        timeout: 45000
                    },
                    anthropic: {
                        baseUrl: 'https://api.anthropic.com/v1',
                        timeout: 45000
                    },
                    platforms: {
                        tiktok: {
                            baseUrl: 'https://open-api.tiktok.com',
                            apiVersion: 'v1.3'
                        },
                        instagram: {
                            baseUrl: 'https://graph.instagram.com',
                            apiVersion: 'v18.0'
                        },
                        snapchat: {
                            baseUrl: 'https://adsapi.snapchat.com',
                            apiVersion: 'v1'
                        }
                    }
                },
                websocket: {
                    url: 'wss://staging-api.brainsait.io/ws',
                    reconnectInterval: 3000,
                    maxReconnectAttempts: 15
                },
                monitoring: {
                    ...baseConfig.monitoring,
                    debugMode: false,
                    performanceMonitoring: true
                },
                features: {
                    ...baseConfig.features,
                    debugPanel: false,
                    mockData: false
                }
            },

            production: {
                api: {
                    baseUrl: 'https://api.brainsait.io',
                    timeout: 20000,
                    retries: 3
                },
                database: {
                    url: process.env.DATABASE_URL,
                    migrations: false,
                    logging: false
                },
                services: {
                    openai: {
                        baseUrl: 'https://api.openai.com/v1',
                        timeout: 60000
                    },
                    anthropic: {
                        baseUrl: 'https://api.anthropic.com/v1',
                        timeout: 60000
                    },
                    platforms: {
                        tiktok: {
                            baseUrl: 'https://open-api.tiktok.com',
                            apiVersion: 'v1.3'
                        },
                        instagram: {
                            baseUrl: 'https://graph.instagram.com',
                            apiVersion: 'v18.0'
                        },
                        snapchat: {
                            baseUrl: 'https://adsapi.snapchat.com',
                            apiVersion: 'v1'
                        }
                    }
                },
                websocket: {
                    url: 'wss://api.brainsait.io/ws',
                    reconnectInterval: 2000,
                    maxReconnectAttempts: 20
                },
                monitoring: {
                    ...baseConfig.monitoring,
                    debugMode: false,
                    errorReporting: true,
                    performanceMonitoring: true
                },
                features: {
                    ...baseConfig.features,
                    debugPanel: false,
                    mockData: false,
                    collaboration: true // Enable in production
                }
            }
        };

        return this.deepMerge(baseConfig, environmentConfigs[this.env] || {});
    }

    /**
     * Load feature flags
     */
    loadFeatureFlags() {
        const defaultFlags = {
            // Core features
            'ai-content-generation': true,
            'multi-platform-posting': true,
            'real-time-analytics': true,
            'automated-workflows': true,
            
            // Advanced features
            'sentiment-analysis': this.env === 'production',
            'predictive-analytics': this.env === 'production',
            'a-b-testing': this.env !== 'development',
            'white-label-branding': false,
            
            // Experimental features
            'voice-content-generation': this.env === 'development',
            'video-auto-generation': false,
            'ai-influencer-matching': false,
            'blockchain-verification': false,
            
            // Platform-specific features
            'tiktok-trends-integration': true,
            'instagram-stories-automation': true,
            'snapchat-ar-filters': false,
            'youtube-shorts-optimization': true,
            
            // Performance features
            'edge-computing': this.env === 'production',
            'cdn-optimization': this.env !== 'development',
            'image-optimization': true,
            'lazy-loading': true,
            
            // Security features
            'two-factor-auth': this.env === 'production',
            'audit-logging': this.env !== 'development',
            'data-encryption': true,
            'gdpr-compliance': true
        };

        // Override with environment-specific flags
        const envFlags = this.getEnvironmentFlags();
        return { ...defaultFlags, ...envFlags };
    }

    /**
     * Get environment-specific feature flags
     */
    getEnvironmentFlags() {
        // These could be loaded from external configuration service
        try {
            if (typeof globalThis !== 'undefined' && globalThis.FEATURE_FLAGS) {
                return JSON.parse(globalThis.FEATURE_FLAGS);
            }
            return {};
        } catch (error) {
            console.warn('Failed to parse feature flags:', error);
            return {};
        }
    }

    /**
     * Validate required configuration
     */
    validateConfiguration() {
        const required = [
            'api.baseUrl',
            'app.name',
            'app.version'
        ];

        const missing = [];
        
        for (const path of required) {
            if (!this.getConfigValue(path)) {
                missing.push(path);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        // Environment-specific validations
        this.validateEnvironmentSpecific();
    }

    /**
     * Environment-specific validation
     */
    validateEnvironmentSpecific() {
        if (this.env === 'production') {
            const productionRequired = [
                'database.url',
                'monitoring.errorReporting'
            ];

            for (const path of productionRequired) {
                if (!this.getConfigValue(path)) {
                    console.warn(`Production environment missing: ${path}`);
                }
            }
        }
    }

    /**
     * Get configuration value by path
     */
    getConfigValue(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.featureFlags[featureName] === true;
    }

    /**
     * Get API configuration
     */
    getApiConfig() {
        return {
            ...this.config.api,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Version': this.config.app.version,
                'X-Environment': this.env
            }
        };
    }

    /**
     * Get service configuration
     */
    getServiceConfig(serviceName) {
        const serviceConfig = this.config.services[serviceName];
        if (!serviceConfig) {
            throw new Error(`Service configuration not found: ${serviceName}`);
        }

        return {
            ...serviceConfig,
            apiKey: this.getSecretValue(`${serviceName.toUpperCase()}_API_KEY`),
            headers: {
                'User-Agent': `${this.config.app.name}/${this.config.app.version}`,
                ...serviceConfig.headers
            }
        };
    }

    /**
     * Get secret value from environment
     */
    getSecretValue(key) {
        // Try different sources for secrets
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key];
        }
        
        if (typeof globalThis !== 'undefined') {
            return globalThis[key];
        }
        
        return null;
    }

    /**
     * Get WebSocket configuration
     */
    getWebSocketConfig() {
        return {
            ...this.config.websocket,
            protocols: ['brainsait-v1'],
            headers: {
                'X-Client-Version': this.config.app.version,
                'X-Environment': this.env
            }
        };
    }

    /**
     * Get monitoring configuration
     */
    getMonitoringConfig() {
        return {
            ...this.config.monitoring,
            environment: this.env,
            version: this.config.app.version,
            userId: this.getUserId(),
            sessionId: this.getSessionId()
        };
    }

    /**
     * Get user ID for monitoring
     */
    getUserId() {
        // Implementation depends on authentication system
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    /**
     * Get session ID for monitoring
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Get all configuration
     */
    getAll() {
        return {
            environment: this.env,
            config: this.config,
            featureFlags: this.featureFlags
        };
    }

    /**
     * Export configuration for debugging
     */
    exportConfig() {
        const safeConfig = this.sanitizeForExport(this.config);
        return {
            environment: this.env,
            config: safeConfig,
            featureFlags: this.featureFlags,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Remove sensitive data for export
     */
    sanitizeForExport(obj) {
        const sanitized = { ...obj };
        const sensitiveKeys = ['apiKey', 'secret', 'password', 'token'];
        
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeForExport(sanitized[key]);
            }
        }
        
        return sanitized;
    }
}

// Create singleton instance
const environment = new EnvironmentConfig();

// Export both the class and instance
export { EnvironmentConfig, environment };