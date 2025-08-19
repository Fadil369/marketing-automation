/**
 * Environment Configuration Manager
 * Handles environment-specific settings and configurations for BrainSAIT platform
 */

export class EnvironmentConfig {
    constructor() {
        this.env = this.detectEnvironment();
        this.config = this.loadConfig();
        this.secrets = this.loadSecrets();
    }

    /**
     * Detect current environment
     */
    detectEnvironment() {
        // Check for environment variables
        if (typeof process !== 'undefined' && process.env) {
            return process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
        }
        
        // Check for browser hostname
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('dev')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        
        return 'development';
    }

    /**
     * Load environment-specific configuration
     */
    loadConfig() {
        const baseConfig = {
            app: {
                name: 'BrainSAIT Marketing Platform',
                version: '2.0.0',
                description: 'AI-powered marketing automation platform',
                author: 'BrainSAIT Team'
            },
            features: {
                analytics: true,
                realTimeUpdates: true,
                darkMode: true,
                multiLanguage: true,
                aiGeneration: true,
                platformIntegration: true,
                workflowAutomation: true,
                offlineSupport: true
            },
            performance: {
                cacheTTL: 300000, // 5 minutes
                requestTimeout: 30000, // 30 seconds
                maxRetries: 3,
                debounceDelay: 300
            },
            security: {
                rateLimit: {
                    requests: 100,
                    window: 900000 // 15 minutes
                },
                cors: {
                    enabled: true,
                    origins: []
                },
                encryption: {
                    algorithm: 'AES-256-GCM'
                }
            }
        };

        const envConfigs = {
            development: {
                api: {
                    baseUrl: 'http://localhost:3001',
                    timeout: 10000,
                    retries: 1
                },
                websocket: {
                    url: 'ws://localhost:3001/ws',
                    reconnectInterval: 5000,
                    maxReconnectAttempts: 10
                },
                debug: {
                    enabled: true,
                    level: 'debug',
                    console: true,
                    network: true
                },
                cache: {
                    enabled: false,
                    ttl: 60000
                },
                monitoring: {
                    enabled: false,
                    endpoint: null
                }
            },

            staging: {
                api: {
                    baseUrl: 'https://api-staging.brainsait.com',
                    timeout: 15000,
                    retries: 2
                },
                websocket: {
                    url: 'wss://ws-staging.brainsait.com',
                    reconnectInterval: 3000,
                    maxReconnectAttempts: 15
                },
                debug: {
                    enabled: true,
                    level: 'info',
                    console: false,
                    network: false
                },
                cache: {
                    enabled: true,
                    ttl: 300000
                },
                monitoring: {
                    enabled: true,
                    endpoint: 'https://monitoring-staging.brainsait.com'
                }
            },

            production: {
                api: {
                    baseUrl: 'https://api.brainsait.com',
                    timeout: 20000,
                    retries: 3
                },
                websocket: {
                    url: 'wss://ws.brainsait.com',
                    reconnectInterval: 1000,
                    maxReconnectAttempts: 20
                },
                debug: {
                    enabled: false,
                    level: 'error',
                    console: false,
                    network: false
                },
                cache: {
                    enabled: true,
                    ttl: 600000
                },
                monitoring: {
                    enabled: true,
                    endpoint: 'https://monitoring.brainsait.com'
                }
            }
        };

        return {
            ...baseConfig,
            ...envConfigs[this.env],
            environment: this.env
        };
    }

    /**
     * Load environment secrets
     */
    loadSecrets() {
        const secrets = {
            development: {
                openai: {
                    apiKey: 'dev-openai-key',
                    organization: 'dev-org'
                },
                anthropic: {
                    apiKey: 'dev-anthropic-key'
                },
                platforms: {
                    tiktok: { clientId: 'dev-tiktok-id', clientSecret: 'dev-tiktok-secret' },
                    instagram: { clientId: 'dev-ig-id', clientSecret: 'dev-ig-secret' },
                    youtube: { clientId: 'dev-yt-id', clientSecret: 'dev-yt-secret' },
                    snapchat: { clientId: 'dev-sc-id', clientSecret: 'dev-sc-secret' }
                },
                database: {
                    url: 'sqlite://./dev.db'
                },
                jwt: {
                    secret: 'dev-jwt-secret-key-32-chars-long',
                    expiresIn: '7d'
                }
            },

            staging: {
                openai: {
                    apiKey: process.env?.OPENAI_API_KEY_STAGING,
                    organization: process.env?.OPENAI_ORG_STAGING
                },
                anthropic: {
                    apiKey: process.env?.ANTHROPIC_API_KEY_STAGING
                },
                platforms: {
                    tiktok: { 
                        clientId: process.env?.TIKTOK_CLIENT_ID_STAGING, 
                        clientSecret: process.env?.TIKTOK_CLIENT_SECRET_STAGING 
                    },
                    instagram: { 
                        clientId: process.env?.INSTAGRAM_CLIENT_ID_STAGING, 
                        clientSecret: process.env?.INSTAGRAM_CLIENT_SECRET_STAGING 
                    },
                    youtube: { 
                        clientId: process.env?.YOUTUBE_CLIENT_ID_STAGING, 
                        clientSecret: process.env?.YOUTUBE_CLIENT_SECRET_STAGING 
                    },
                    snapchat: { 
                        clientId: process.env?.SNAPCHAT_CLIENT_ID_STAGING, 
                        clientSecret: process.env?.SNAPCHAT_CLIENT_SECRET_STAGING 
                    }
                },
                database: {
                    url: process.env?.DATABASE_URL_STAGING
                },
                jwt: {
                    secret: process.env?.JWT_SECRET_STAGING,
                    expiresIn: '24h'
                }
            },

            production: {
                openai: {
                    apiKey: process.env?.OPENAI_API_KEY,
                    organization: process.env?.OPENAI_ORG
                },
                anthropic: {
                    apiKey: process.env?.ANTHROPIC_API_KEY
                },
                platforms: {
                    tiktok: { 
                        clientId: process.env?.TIKTOK_CLIENT_ID, 
                        clientSecret: process.env?.TIKTOK_CLIENT_SECRET 
                    },
                    instagram: { 
                        clientId: process.env?.INSTAGRAM_CLIENT_ID, 
                        clientSecret: process.env?.INSTAGRAM_CLIENT_SECRET 
                    },
                    youtube: { 
                        clientId: process.env?.YOUTUBE_CLIENT_ID, 
                        clientSecret: process.env?.YOUTUBE_CLIENT_SECRET 
                    },
                    snapchat: { 
                        clientId: process.env?.SNAPCHAT_CLIENT_ID, 
                        clientSecret: process.env?.SNAPCHAT_CLIENT_SECRET 
                    }
                },
                database: {
                    url: process.env?.DATABASE_URL
                },
                jwt: {
                    secret: process.env?.JWT_SECRET,
                    expiresIn: '12h'
                }
            }
        };

        return secrets[this.env] || secrets.development;
    }

    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value
     */
    set(key, value) {
        const keys = key.split('.');
        let config = this.config;

        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!config[k] || typeof config[k] !== 'object') {
                config[k] = {};
            }
            config = config[k];
        }

        // Set the final value
        config[keys[keys.length - 1]] = value;
    }

    /**
     * Get secret value
     */
    getSecret(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.secrets;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Get all configuration
     */
    getAll() {
        return this.config;
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }

    /**
     * Get environment name
     */
    getEnvironment() {
        return this.env;
    }

    /**
     * Check if development environment
     */
    isDevelopment() {
        return this.env === 'development';
    }

    /**
     * Check if staging environment
     */
    isStaging() {
        return this.env === 'staging';
    }

    /**
     * Check if production environment
     */
    isProduction() {
        return this.env === 'production';
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        // Check required API keys for production
        if (this.isProduction()) {
            const requiredSecrets = [
                'openai.apiKey',
                'anthropic.apiKey',
                'platforms.tiktok.clientId',
                'platforms.instagram.clientId',
                'database.url',
                'jwt.secret'
            ];

            for (const secret of requiredSecrets) {
                if (!this.getSecret(secret)) {
                    errors.push(`Missing required secret: ${secret}`);
                }
            }
        }

        // Validate URLs
        const urls = [
            this.get('api.baseUrl'),
            this.get('websocket.url')
        ];

        for (const url of urls) {
            if (url && !this.isValidUrl(url)) {
                errors.push(`Invalid URL: ${url}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate URL format
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return {
            url: this.getSecret('database.url'),
            type: this.isDevelopment() ? 'sqlite' : 'postgresql',
            ssl: this.isProduction(),
            poolSize: this.isProduction() ? 20 : 5,
            timeout: 30000
        };
    }

    /**
     * Get Cloudflare configuration
     */
    getCloudflareConfig() {
        return {
            accountId: process.env?.CLOUDFLARE_ACCOUNT_ID,
            apiToken: process.env?.CLOUDFLARE_API_TOKEN,
            zoneId: process.env?.CLOUDFLARE_ZONE_ID,
            workers: {
                apiUrl: this.get('api.baseUrl'),
                websocketUrl: this.get('websocket.url')
            },
            pages: {
                projectName: 'brainsait-marketing',
                customDomain: this.isProduction() ? 'app.brainsait.com' : null
            },
            kv: {
                namespace: this.isProduction() ? 'BRAINSAIT_PROD' : 'BRAINSAIT_DEV'
            },
            r2: {
                bucket: this.isProduction() ? 'brainsait-storage' : 'brainsait-dev-storage'
            }
        };
    }

    /**
     * Get monitoring configuration
     */
    getMonitoringConfig() {
        return {
            enabled: this.get('monitoring.enabled'),
            endpoint: this.get('monitoring.endpoint'),
            apiKey: process.env?.MONITORING_API_KEY,
            sampleRate: this.isProduction() ? 1.0 : 0.1,
            environment: this.env,
            service: 'brainsait-marketing',
            version: this.get('app.version')
        };
    }

    /**
     * Export configuration for client-side use
     */
    exportClientConfig() {
        return {
            environment: this.env,
            app: this.get('app'),
            api: {
                baseUrl: this.get('api.baseUrl'),
                timeout: this.get('api.timeout')
            },
            websocket: {
                url: this.get('websocket.url')
            },
            features: this.get('features'),
            debug: this.get('debug'),
            cache: this.get('cache'),
            performance: this.get('performance')
        };
    }
}

// Create global instance
export const environmentConfig = new EnvironmentConfig();

// Export for use in build tools
export default environmentConfig;