/**
 * BrainSAIT Marketing Platform - Main Application Entry Point
 * Enterprise-grade marketing automation platform
 * 
 * @author BrainSAIT Team
 * @version 1.0.0
 */

import { Application } from './core/app/Application.js';
import { environment } from './config/environment.js';

/**
 * Application bootstrap and initialization
 */
class BrainSAITApp {
    constructor() {
        this.app = null;
        this.isInitialized = false;
        this.startTime = Date.now();
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.handleUnload = this.handleUnload.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('%c🚀 BrainSAIT Marketing Platform', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
            console.log(`%cVersion: ${environment.getAll().config.app.version}`, 'color: #6b7280;');
            console.log(`%cEnvironment: ${environment.env}`, 'color: #6b7280;');
            console.log(`%cFeature Flags: ${Object.keys(environment.featureFlags).length} enabled`, 'color: #6b7280;');

            // Show loading indicator
            this.showLoadingScreen();

            // Setup error handling
            this.setupErrorHandling();

            // Setup browser event listeners
            this.setupBrowserEvents();

            // Initialize application configuration
            const appConfig = this.buildAppConfig();

            // Create and initialize application instance
            this.app = new Application(appConfig);
            await this.app.initialize();

            // Setup application-wide services
            await this.setupServices();

            // Setup UI components
            await this.setupUI();

            // Setup real-time features
            if (environment.isFeatureEnabled('real-time-analytics')) {
                await this.setupRealTimeFeatures();
            }

            // Setup performance monitoring
            if (environment.getAll().config.monitoring.performanceMonitoring) {
                this.setupPerformanceMonitoring();
            }

            // Initialize feature-specific modules
            await this.initializeFeatureModules();

            // Hide loading screen and show app
            this.hideLoadingScreen();
            this.showApplication();

            this.isInitialized = true;
            const initTime = Date.now() - this.startTime;
            
            console.log(`%c✅ BrainSAIT Platform initialized in ${initTime}ms`, 'color: #10b981; font-weight: bold;');
            
            // Emit initialization complete event
            this.app.emit('app:ready', {
                initTime,
                environment: environment.env,
                features: environment.featureFlags
            });

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Build application configuration
     */
    buildAppConfig() {
        const envConfig = environment.getAll();
        
        return {
            ...envConfig.config,
            environment: environment.env,
            featureFlags: envConfig.featureFlags,
            
            // Service configurations
            ai: environment.getServiceConfig('openai'),
            platforms: {
                tiktok: environment.getServiceConfig('tiktok'),
                instagram: environment.getServiceConfig('instagram'),
                snapchat: environment.getServiceConfig('snapchat')
            },
            
            // WebSocket configuration
            websocket: environment.getWebSocketConfig(),
            
            // Monitoring configuration
            monitoring: environment.getMonitoringConfig(),
            
            // Custom BrainSAIT configurations
            branding: {
                name: 'BrainSAIT',
                logo: '/assets/images/brainsait-logo.svg',
                primaryColor: '#3b82f6',
                secondaryColor: '#8b5cf6'
            }
        };
    }

    /**
     * Setup application-wide services
     */
    async setupServices() {
        // Services are initialized within the Application class
        // Here we can add any additional service configuration
        
        const services = this.app.services;
        
        // Configure AI service with custom settings
        const aiService = services.get('ai');
        if (aiService && environment.isFeatureEnabled('ai-content-generation')) {
            await this.configureAIService(aiService);
        }

        // Configure platform services
        const platformService = services.get('platforms');
        if (platformService) {
            await this.configurePlatformService(platformService);
        }

        // Configure analytics service
        const analyticsService = services.get('analytics');
        if (analyticsService && environment.isFeatureEnabled('real-time-analytics')) {
            await this.configureAnalyticsService(analyticsService);
        }
    }

    /**
     * Configure AI service with BrainSAIT-specific settings
     */
    async configureAIService(aiService) {
        // Set up BrainSAIT-specific AI prompts and configurations
        const brandedPrompts = {
            socialPost: `Create engaging social media content for BrainSAIT's marketing platform. 
                        Emphasize AI-powered automation and professional results.`,
            adCopy: `Write compelling ad copy that highlights BrainSAIT's unique value proposition 
                    in marketing automation and AI-driven insights.`,
            emailContent: `Draft professional email content for BrainSAIT marketing campaigns, 
                          focusing on conversion and engagement.`
        };

        // Configure custom content templates
        aiService.customTemplates = brandedPrompts;
    }

    /**
     * Configure platform service
     */
    async configurePlatformService(platformService) {
        // Setup platform-specific BrainSAIT configurations
        platformService.defaultHashtags = ['#BrainSAIT', '#AIMarketing', '#MarketingAutomation'];
        
        // Configure posting schedules
        platformService.optimalPostingTimes = {
            tiktok: ['09:00', '15:00', '19:00'],
            instagram: ['08:00', '12:00', '17:00'],
            youtube: ['14:00', '18:00', '20:00']
        };
    }

    /**
     * Configure analytics service
     */
    async configureAnalyticsService(analyticsService) {
        // Setup custom BrainSAIT metrics
        analyticsService.defineMetric('brainsait_user_engagement', {
            type: 'gauge',
            description: 'BrainSAIT platform user engagement score',
            dimensions: ['user_type', 'feature_used', 'session_duration']
        });

        analyticsService.defineMetric('brainsait_ai_usage', {
            type: 'counter',
            description: 'AI feature usage count',
            dimensions: ['ai_service', 'content_type', 'user_id']
        });
    }

    /**
     * Setup UI components and themes
     */
    async setupUI() {
        // Apply BrainSAIT branding
        this.applyBranding();
        
        // Setup theme based on user preference
        const theme = environment.getAll().config.ui.theme;
        this.applyTheme(theme);
        
        // Setup RTL support for Arabic
        if (environment.getAll().config.ui.rtlSupport) {
            this.setupRTLSupport();
        }
        
        // Initialize global UI components
        await this.initializeGlobalComponents();
    }

    /**
     * Apply BrainSAIT branding
     */
    applyBranding() {
        // Set CSS custom properties for branding
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', '#3b82f6');
        root.style.setProperty('--brand-secondary', '#8b5cf6');
        root.style.setProperty('--brand-gradient', 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)');
        
        // Update page title and meta tags
        document.title = 'BrainSAIT - AI-Powered Marketing Platform';
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = 'Transform your marketing with BrainSAIT\'s AI-powered automation platform. Create, manage, and optimize campaigns across all social media platforms.';
        }
    }

    /**
     * Apply theme
     */
    applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        
        // Store theme preference
        localStorage.setItem('brainsait-theme', theme);
    }

    /**
     * Setup RTL support
     */
    setupRTLSupport() {
        // Detect if Arabic language is selected
        const currentLang = this.app.getState(['user', 'preferences', 'language']);
        
        if (currentLang === 'ar') {
            document.body.dir = 'rtl';
            document.body.classList.add('rtl');
        }
        
        // Listen for language changes
        this.app.on('language:change', (language) => {
            if (language === 'ar') {
                document.body.dir = 'rtl';
                document.body.classList.add('rtl');
            } else {
                document.body.dir = 'ltr';
                document.body.classList.remove('rtl');
            }
        });
    }

    /**
     * Initialize global UI components
     */
    async initializeGlobalComponents() {
        // Load global components
        const { ToastManager } = await import('./components/ui/ToastManager.js');
        const { ModalManager } = await import('./components/ui/ModalManager.js');
        const { LoadingManager } = await import('./components/ui/LoadingManager.js');
        
        // Initialize global managers
        window.BrainSAIT = {
            toast: new ToastManager(),
            modal: new ModalManager(),
            loading: new LoadingManager(),
            app: this.app
        };
        
        // Make components globally available
        window.BrainSAITComponents = {};
    }

    /**
     * Setup real-time features
     */
    async setupRealTimeFeatures() {
        // Initialize WebSocket connections for real-time updates
        this.app.on('websocket:connected', () => {
            console.log('🔗 Real-time connection established');
        });

        this.app.on('websocket:disconnected', () => {
            console.log('🔌 Real-time connection lost - attempting reconnection...');
        });

        // Setup real-time metric updates
        this.app.on('metrics:updated', (data) => {
            // Update dashboard in real-time
            this.updateRealTimeDashboard(data);
        });
    }

    /**
     * Update real-time dashboard
     */
    updateRealTimeDashboard(data) {
        // Dispatch custom event for dashboard components to listen to
        const event = new CustomEvent('dashboard:update', { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorWebVitals();
        
        // Monitor application performance
        this.monitorAppPerformance();
        
        // Setup error tracking
        this.setupErrorTracking();
    }

    /**
     * Monitor Web Vitals
     */
    monitorWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                    this.trackMetric('web_vital_lcp', entry.startTime);
                }
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.entryType === 'first-input') {
                    this.trackMetric('web_vital_fid', entry.processingStart - entry.startTime);
                }
            }
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.trackMetric('web_vital_cls', clsValue);
        }).observe({ type: 'layout-shift', buffered: true });
    }

    /**
     * Monitor application performance
     */
    monitorAppPerformance() {
        // Track navigation timing
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.trackMetric('page_load_time', perfData.loadEventEnd - perfData.fetchStart);
            this.trackMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart);
        });

        // Monitor resource loading
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.entryType === 'resource') {
                    this.trackMetric('resource_load_time', entry.duration, {
                        resource_type: entry.initiatorType,
                        resource_name: entry.name.split('/').pop()
                    });
                }
            }
        }).observe({ type: 'resource', buffered: true });
    }

    /**
     * Initialize feature-specific modules
     */
    async initializeFeatureModules() {
        const features = environment.featureFlags;
        
        // Initialize modules based on enabled features
        if (features['ai-content-generation']) {
            await this.loadAIContentModule();
        }
        
        if (features['predictive-analytics']) {
            await this.loadPredictiveAnalyticsModule();
        }
        
        if (features['a-b-testing']) {
            await this.loadABTestingModule();
        }
        
        if (features['voice-content-generation']) {
            await this.loadVoiceContentModule();
        }
    }

    /**
     * Load feature modules dynamically
     */
    async loadAIContentModule() {
        try {
            const module = await import('./modules/AIContentModule.js');
            module.initialize(this.app);
        } catch (error) {
            console.warn('Failed to load AI Content module:', error);
        }
    }

    async loadPredictiveAnalyticsModule() {
        try {
            const module = await import('./modules/PredictiveAnalyticsModule.js');
            module.initialize(this.app);
        } catch (error) {
            console.warn('Failed to load Predictive Analytics module:', error);
        }
    }

    async loadABTestingModule() {
        try {
            const module = await import('./modules/ABTestingModule.js');
            module.initialize(this.app);
        } catch (error) {
            console.warn('Failed to load A/B Testing module:', error);
        }
    }

    async loadVoiceContentModule() {
        try {
            const module = await import('./modules/VoiceContentModule.js');
            module.initialize(this.app);
        } catch (error) {
            console.warn('Failed to load Voice Content module:', error);
        }
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', this.handleError);
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: event.reason.message || 'Unhandled Promise Rejection',
                stack: event.reason.stack,
                type: 'unhandledrejection'
            });
        });
    }

    /**
     * Setup browser events
     */
    setupBrowserEvents() {
        // Handle page unload
        window.addEventListener('beforeunload', this.handleUnload);
        
        // Handle visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            if (this.app) {
                this.app.emit('network:online');
                this.showNetworkStatus('Connected', 'success');
            }
        });

        window.addEventListener('offline', () => {
            if (this.app) {
                this.app.emit('network:offline');
                this.showNetworkStatus('Disconnected', 'error');
            }
        });
    }

    /**
     * Handle application errors
     */
    handleError(error) {
        console.error('Application Error:', error);
        
        // Track error for analytics
        if (this.app) {
            const analyticsService = this.app.getService('analytics');
            if (analyticsService) {
                analyticsService.track('application_error', 1, {
                    error_type: error.type || 'javascript_error',
                    error_message: error.message,
                    user_agent: navigator.userAgent,
                    url: window.location.href
                });
            }
        }
        
        // Show user-friendly error message
        if (window.BrainSAIT?.toast) {
            window.BrainSAIT.toast.error('An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        this.hideLoadingScreen();
        
        // Show error screen
        const errorScreen = document.createElement('div');
        errorScreen.className = 'init-error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <h1>🚫 Initialization Failed</h1>
                <p>BrainSAIT Platform failed to initialize. Please refresh the page and try again.</p>
                <details>
                    <summary>Error Details</summary>
                    <pre>${error.stack}</pre>
                </details>
                <button onclick="window.location.reload()" class="retry-button">
                    🔄 Retry
                </button>
            </div>
        `;
        
        document.body.appendChild(errorScreen);
    }

    /**
     * Handle page unload
     */
    handleUnload(event) {
        if (this.app) {
            // Clean up application resources
            this.app.destroy();
        }
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (this.app) {
            if (document.hidden) {
                this.app.emit('app:hidden');
            } else {
                this.app.emit('app:visible');
            }
        }
    }

    /**
     * Show/hide loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'brainsait-loading';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <div class="loading-logo">
                    <svg viewBox="0 0 100 100" class="loading-spinner">
                        <circle cx="50" cy="50" r="40" stroke="#3b82f6" stroke-width="4" fill="none" />
                    </svg>
                </div>
                <h2>BrainSAIT</h2>
                <p>Initializing AI-Powered Marketing Platform...</p>
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingScreen);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('brainsait-loading');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }

    showApplication() {
        document.body.classList.add('app-loaded');
    }

    showNetworkStatus(message, type) {
        if (window.BrainSAIT?.toast) {
            window.BrainSAIT.toast[type](`Network ${message}`);
        }
    }

    trackMetric(metric, value, dimensions = {}) {
        if (this.app) {
            const analyticsService = this.app.getService('analytics');
            if (analyticsService) {
                analyticsService.track(metric, value, dimensions);
            }
        }
    }

    setupErrorTracking() {
        // Setup Sentry or similar error tracking service if configured
        if (environment.getAll().config.monitoring.errorTracking) {
            // Initialize error tracking service
            console.log('Error tracking enabled');
        }
    }
}

/**
 * Application startup
 */
document.addEventListener('DOMContentLoaded', async () => {
    const brainsaitApp = new BrainSAITApp();
    
    try {
        await brainsaitApp.init();
    } catch (error) {
        console.error('Failed to start BrainSAIT application:', error);
    }
});

/**
 * Export for testing and external access
 */
export { BrainSAITApp };