/**
 * AI Service Manager - Unified AI Provider Integration
 * Supports: OpenAI GPT-4, Anthropic Claude, Midjourney, Coqui TTS
 * Features: Load balancing, fallback, rate limiting, cost optimization
 * 
 * @author BrainSAIT Team
 */

class AIServiceManager {
    constructor(config = {}) {
        this.config = {
            providers: {
                openai: {
                    enabled: true,
                    apiKey: config.openai?.apiKey,
                    model: 'gpt-4',
                    maxTokens: 4000,
                    temperature: 0.7,
                    rateLimit: 100, // requests per minute
                    cost: 0.03 // per 1K tokens
                },
                anthropic: {
                    enabled: true,
                    apiKey: config.anthropic?.apiKey,
                    model: 'claude-3-sonnet-20240229',
                    maxTokens: 4000,
                    temperature: 0.7,
                    rateLimit: 50,
                    cost: 0.015
                },
                midjourney: {
                    enabled: true,
                    apiKey: config.midjourney?.apiKey,
                    server: config.midjourney?.server,
                    rateLimit: 20,
                    cost: 0.08 // per image
                },
                coqui: {
                    enabled: true,
                    apiKey: config.coqui?.apiKey,
                    voiceId: 'ar-speaker-1',
                    rateLimit: 30,
                    cost: 0.002 // per character
                }
            },
            fallbackStrategy: 'sequential', // 'sequential', 'parallel', 'best'
            loadBalancing: true,
            caching: {
                enabled: true,
                ttl: 3600000, // 1 hour
                maxSize: 1000
            },
            monitoring: {
                enabled: true,
                trackUsage: true,
                trackCosts: true,
                trackPerformance: true
            },
            ...config
        };

        this.providers = new Map();
        this.cache = new Map();
        this.rateLimiter = new Map();
        this.usage = {
            total: { requests: 0, tokens: 0, cost: 0 },
            providers: {}
        };
        
        this.isInitialized = false;
        this.setupProviders();
    }

    /**
     * Initialize AI services
     */
    async initialize() {
        try {
            console.log('🤖 Initializing AI Service Manager...');
            
            // Initialize enabled providers
            const initPromises = [];
            for (const [name, provider] of this.providers) {
                if (this.config.providers[name].enabled) {
                    initPromises.push(this.initializeProvider(name, provider));
                }
            }
            
            await Promise.all(initPromises);
            
            // Setup rate limiters
            this.setupRateLimiters();
            
            // Load cached data
            if (this.config.caching.enabled) {
                this.loadCache();
            }
            
            this.isInitialized = true;
            console.log('✅ AI Service Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize AI Service Manager:', error);
            throw error;
        }
    }

    /**
     * Setup AI providers
     */
    setupProviders() {
        this.providers.set('openai', new OpenAIProvider(this.config.providers.openai));
        this.providers.set('anthropic', new AnthropicProvider(this.config.providers.anthropic));
        this.providers.set('midjourney', new MidjourneyProvider(this.config.providers.midjourney));
        this.providers.set('coqui', new CoquiProvider(this.config.providers.coqui));
    }

    /**
     * Initialize single provider
     */
    async initializeProvider(name, provider) {
        try {
            await provider.initialize();
            this.usage.providers[name] = { requests: 0, tokens: 0, cost: 0 };
            console.log(`✅ ${name} provider initialized`);
        } catch (error) {
            console.warn(`⚠️ Failed to initialize ${name} provider:`, error);
        }
    }

    /**
     * Generate text content using AI
     */
    async generateText(prompt, options = {}) {
        const config = {
            provider: options.provider || 'auto',
            maxTokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            language: options.language || 'en',
            style: options.style || 'professional',
            format: options.format || 'text',
            useCache: options.useCache !== false,
            ...options
        };

        try {
            // Check cache first
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('text', prompt, config);
                const cached = this.cache.get(cacheKey);
                if (cached && !this.isCacheExpired(cached)) {
                    return cached.data;
                }
            }

            // Select provider
            const provider = await this.selectProvider('text', config.provider);
            if (!provider) {
                throw new Error('No available text generation provider');
            }

            // Generate content
            const result = await provider.generateText(prompt, config);
            
            // Update usage tracking
            this.trackUsage(provider.name, 'text', result);
            
            // Cache result
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('text', prompt, config);
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                    ttl: this.config.caching.ttl
                });
            }

            return result;
            
        } catch (error) {
            console.error('Text generation failed:', error);
            
            // Try fallback provider if available
            if (config.provider !== 'auto') {
                return this.generateText(prompt, { ...config, provider: 'auto' });
            }
            
            throw error;
        }
    }

    /**
     * Generate images using AI
     */
    async generateImage(prompt, options = {}) {
        const config = {
            provider: options.provider || 'midjourney',
            style: options.style || 'professional',
            aspectRatio: options.aspectRatio || '16:9',
            quality: options.quality || 'high',
            size: options.size || '1024x1024',
            count: options.count || 1,
            useCache: options.useCache !== false,
            ...options
        };

        try {
            // Check cache first
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('image', prompt, config);
                const cached = this.cache.get(cacheKey);
                if (cached && !this.isCacheExpired(cached)) {
                    return cached.data;
                }
            }

            // Select provider
            const provider = await this.selectProvider('image', config.provider);
            if (!provider) {
                throw new Error('No available image generation provider');
            }

            // Generate images
            const result = await provider.generateImage(prompt, config);
            
            // Update usage tracking
            this.trackUsage(provider.name, 'image', result);
            
            // Cache result
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('image', prompt, config);
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                    ttl: this.config.caching.ttl
                });
            }

            return result;
            
        } catch (error) {
            console.error('Image generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate voice/audio using TTS
     */
    async generateVoice(text, options = {}) {
        const config = {
            provider: options.provider || 'coqui',
            voice: options.voice || 'ar-speaker-1',
            language: options.language || 'ar',
            speed: options.speed || 1.0,
            pitch: options.pitch || 1.0,
            format: options.format || 'mp3',
            useCache: options.useCache !== false,
            ...options
        };

        try {
            // Check cache first
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('voice', text, config);
                const cached = this.cache.get(cacheKey);
                if (cached && !this.isCacheExpired(cached)) {
                    return cached.data;
                }
            }

            // Select provider
            const provider = await this.selectProvider('voice', config.provider);
            if (!provider) {
                throw new Error('No available voice generation provider');
            }

            // Generate voice
            const result = await provider.generateVoice(text, config);
            
            // Update usage tracking
            this.trackUsage(provider.name, 'voice', result);
            
            // Cache result
            if (config.useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey('voice', text, config);
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                    ttl: this.config.caching.ttl
                });
            }

            return result;
            
        } catch (error) {
            console.error('Voice generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate marketing content with AI optimization
     */
    async generateMarketingContent(contentType, brief, options = {}) {
        const templates = {
            'social-post': {
                prompt: `Create an engaging social media post about: ${brief}. 
                        Include relevant hashtags and call-to-action. 
                        Style: ${options.style || 'professional'} 
                        Platform: ${options.platform || 'instagram'}
                        Language: ${options.language || 'en'}`,
                maxTokens: 300
            },
            'ad-copy': {
                prompt: `Write compelling ad copy for: ${brief}. 
                        Focus on benefits and create urgency. 
                        Target audience: ${options.audience || 'general'}
                        Tone: ${options.tone || 'persuasive'}
                        Language: ${options.language || 'en'}`,
                maxTokens: 200
            },
            'blog-post': {
                prompt: `Write a comprehensive blog post about: ${brief}. 
                        Include SEO-optimized headings and engaging content. 
                        Target length: ${options.length || 'medium'}
                        Language: ${options.language || 'en'}`,
                maxTokens: 2000
            },
            'video-script': {
                prompt: `Create a video script for: ${brief}. 
                        Include visual cues and engaging narration. 
                        Duration: ${options.duration || '60 seconds'}
                        Style: ${options.style || 'informative'}
                        Language: ${options.language || 'en'}`,
                maxTokens: 800
            }
        };

        const template = templates[contentType];
        if (!template) {
            throw new Error(`Unsupported content type: ${contentType}`);
        }

        return this.generateText(template.prompt, {
            ...options,
            maxTokens: template.maxTokens,
            temperature: options.creativity || 0.7
        });
    }

    /**
     * Select optimal provider based on load balancing and availability
     */
    async selectProvider(serviceType, preferredProvider = 'auto') {
        const availableProviders = this.getAvailableProviders(serviceType);
        
        if (availableProviders.length === 0) {
            return null;
        }

        // Return specific provider if requested and available
        if (preferredProvider !== 'auto') {
            const provider = availableProviders.find(p => p.name === preferredProvider);
            if (provider && await this.checkProviderAvailability(provider)) {
                return provider;
            }
        }

        // Load balancing logic
        if (this.config.loadBalancing) {
            return this.selectOptimalProvider(availableProviders);
        }

        // Default to first available provider
        return availableProviders[0];
    }

    /**
     * Get available providers for service type
     */
    getAvailableProviders(serviceType) {
        const serviceMap = {
            'text': ['openai', 'anthropic'],
            'image': ['midjourney'],
            'voice': ['coqui']
        };

        const providerNames = serviceMap[serviceType] || [];
        return providerNames
            .filter(name => this.config.providers[name].enabled)
            .map(name => ({ name, provider: this.providers.get(name) }))
            .filter(({ provider }) => provider);
    }

    /**
     * Select optimal provider based on performance metrics
     */
    selectOptimalProvider(providers) {
        // Score providers based on:
        // - Rate limit availability
        // - Response time
        // - Success rate
        // - Cost efficiency
        
        const scoredProviders = providers.map(({ name, provider }) => {
            const usage = this.usage.providers[name] || { requests: 0 };
            const config = this.config.providers[name];
            
            let score = 100;
            
            // Rate limit penalty
            const rateLimitUsage = this.getRateLimitUsage(name);
            if (rateLimitUsage > 0.8) {
                score -= 40;
            } else if (rateLimitUsage > 0.6) {
                score -= 20;
            }
            
            // Cost efficiency bonus
            score += (1 / config.cost) * 10;
            
            // Success rate bonus (if available)
            if (provider.successRate) {
                score += provider.successRate * 20;
            }
            
            return { name, provider, score };
        });

        // Sort by score and return best
        scoredProviders.sort((a, b) => b.score - a.score);
        return scoredProviders[0];
    }

    /**
     * Check provider availability and rate limits
     */
    async checkProviderAvailability(providerInfo) {
        const { name } = providerInfo;
        
        // Check rate limits
        if (this.isRateLimited(name)) {
            return false;
        }

        // Provider-specific health check could be added here
        return true;
    }

    /**
     * Rate limiting functionality
     */
    setupRateLimiters() {
        for (const [name, config] of Object.entries(this.config.providers)) {
            if (config.enabled) {
                this.rateLimiter.set(name, {
                    requests: [],
                    limit: config.rateLimit,
                    window: 60000 // 1 minute
                });
            }
        }
    }

    isRateLimited(providerName) {
        const limiter = this.rateLimiter.get(providerName);
        if (!limiter) {return false;}

        const now = Date.now();
        const windowStart = now - limiter.window;
        
        // Remove old requests
        limiter.requests = limiter.requests.filter(time => time > windowStart);
        
        return limiter.requests.length >= limiter.limit;
    }

    recordRequest(providerName) {
        const limiter = this.rateLimiter.get(providerName);
        if (limiter) {
            limiter.requests.push(Date.now());
        }
    }

    getRateLimitUsage(providerName) {
        const limiter = this.rateLimiter.get(providerName);
        if (!limiter) {return 0;}
        
        const now = Date.now();
        const windowStart = now - limiter.window;
        const recentRequests = limiter.requests.filter(time => time > windowStart);
        
        return recentRequests.length / limiter.limit;
    }

    /**
     * Usage tracking and analytics
     */
    trackUsage(providerName, serviceType, result) {
        if (!this.config.monitoring.enabled) {return;}

        const providerUsage = this.usage.providers[providerName];
        const cost = this.calculateCost(providerName, serviceType, result);
        
        providerUsage.requests++;
        providerUsage.cost += cost;
        
        if (result.tokensUsed) {
            providerUsage.tokens += result.tokensUsed;
        }

        this.usage.total.requests++;
        this.usage.total.cost += cost;
        if (result.tokensUsed) {
            this.usage.total.tokens += result.tokensUsed;
        }

        // Record request for rate limiting
        this.recordRequest(providerName);
    }

    calculateCost(providerName, serviceType, result) {
        const config = this.config.providers[providerName];
        
        switch (serviceType) {
            case 'text':
                return (result.tokensUsed || 0) / 1000 * config.cost;
            case 'image':
                return config.cost;
            case 'voice':
                return (result.charactersProcessed || 0) * config.cost;
            default:
                return 0;
        }
    }

    /**
     * Cache management
     */
    generateCacheKey(type, input, options) {
        const keyData = { type, input, options: this.sanitizeOptionsForCache(options) };
        return btoa(JSON.stringify(keyData));
    }

    sanitizeOptionsForCache(options) {
        const { useCache, ...cacheable } = options;
        return cacheable;
    }

    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }

    loadCache() {
        try {
            const cached = localStorage.getItem('brainsait_ai_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.cache = new Map(Object.entries(data));
            }
        } catch (error) {
            console.warn('Failed to load AI cache:', error);
        }
    }

    saveCache() {
        try {
            const cacheData = Object.fromEntries(this.cache);
            localStorage.setItem('brainsait_ai_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save AI cache:', error);
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            ...this.usage,
            rateLimits: Object.fromEntries(
                Array.from(this.rateLimiter.entries()).map(([name, limiter]) => [
                    name,
                    {
                        usage: this.getRateLimitUsage(name),
                        remaining: limiter.limit - limiter.requests.length
                    }
                ])
            )
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        this.usage = {
            total: { requests: 0, tokens: 0, cost: 0 },
            providers: {}
        };
        
        for (const providerName of this.providers.keys()) {
            this.usage.providers[providerName] = { requests: 0, tokens: 0, cost: 0 };
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.config.caching.enabled) {
            this.saveCache();
        }
        
        this.cache.clear();
        this.providers.clear();
        this.rateLimiter.clear();
    }
}

/**
 * Individual AI Provider Classes
 */

class OpenAIProvider {
    constructor(config) {
        this.name = 'openai';
        this.config = config;
        this.successRate = 0.95;
    }

    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
    }

    async generateText(prompt, options) {
        // OpenAI API implementation would go here
        const response = await this.makeRequest('/v1/chat/completions', {
            model: options.model || this.config.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens,
            temperature: options.temperature
        });

        return {
            text: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: response.model,
            provider: this.name
        };
    }

    async makeRequest(endpoint, data) {
        // Simulated API call - replace with actual implementation
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    choices: [{ message: { content: 'Generated content from OpenAI' } }],
                    usage: { total_tokens: 150 },
                    model: this.config.model
                });
            }, 1000);
        });
    }
}

class AnthropicProvider {
    constructor(config) {
        this.name = 'anthropic';
        this.config = config;
        this.successRate = 0.97;
    }

    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('Anthropic API key not configured');
        }
    }

    async generateText(prompt, options) {
        // Anthropic API implementation would go here
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    text: 'Generated content from Claude',
                    tokensUsed: 120,
                    model: this.config.model,
                    provider: this.name
                });
            }, 800);
        });
    }
}

class MidjourneyProvider {
    constructor(config) {
        this.name = 'midjourney';
        this.config = config;
        this.successRate = 0.90;
    }

    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('Midjourney API key not configured');
        }
    }

    async generateImage(prompt, options) {
        // Midjourney API implementation would go here
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    images: [{ url: 'https://example.com/generated-image.jpg' }],
                    prompt,
                    provider: this.name
                });
            }, 5000);
        });
    }
}

class CoquiProvider {
    constructor(config) {
        this.name = 'coqui';
        this.config = config;
        this.successRate = 0.93;
    }

    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('Coqui API key not configured');
        }
    }

    async generateVoice(text, options) {
        // Coqui TTS API implementation would go here
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    audioUrl: 'https://example.com/generated-audio.mp3',
                    charactersProcessed: text.length,
                    voice: options.voice,
                    provider: this.name
                });
            }, 2000);
        });
    }
}

export { AIServiceManager };