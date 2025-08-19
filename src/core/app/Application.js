/**
 * BrainSAIT Marketing Automation Platform - Core Application
 * Enterprise-grade application controller with advanced features
 * 
 * Features:
 * - Modular architecture with dependency injection
 * - Real-time data synchronization
 * - Advanced error handling and recovery
 * - Performance monitoring and optimization
 * - Multi-language support (Arabic/English)
 * 
 * @author BrainSAIT Team
 * @version 1.0.0
 */

import { Router } from '../router/Router.js';
import { StateManager } from '../state/StateManager.js';
import { ServiceContainer } from '../app/ServiceContainer.js';
import { EventBus } from '../app/EventBus.js';
import { PerformanceMonitor } from '../middleware/PerformanceMonitor.js';
import { ErrorHandler } from '../middleware/ErrorHandler.js';
import { I18nManager } from '../app/I18nManager.js';

class Application {
    constructor(config = {}) {
        this.config = {
            environment: 'development',
            debug: true,
            apiBaseUrl: '',
            defaultLanguage: 'en',
            enableRealTime: true,
            performanceMonitoring: true,
            ...config
        };

        this.isInitialized = false;
        this.services = new ServiceContainer();
        this.eventBus = new EventBus();
        this.router = new Router();
        this.stateManager = new StateManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.errorHandler = new ErrorHandler();
        this.i18n = new I18nManager(this.config.defaultLanguage);

        this.setupEventListeners();
        this.setupMiddleware();
    }

    /**
     * Initialize the application with all services and dependencies
     */
    async initialize() {
        try {
            console.log('🚀 Initializing BrainSAIT Marketing Platform...');
            
            if (this.config.performanceMonitoring) {
                this.performanceMonitor.start();
            }

            // Initialize core services
            await this.initializeServices();
            
            // Setup routing
            await this.setupRouting();
            
            // Initialize state management
            await this.initializeState();
            
            // Setup internationalization
            await this.i18n.initialize();
            
            // Start real-time features
            if (this.config.enableRealTime) {
                await this.initializeRealTimeFeatures();
            }

            this.isInitialized = true;
            this.eventBus.emit('app:initialized', { timestamp: Date.now() });
            
            console.log('✅ BrainSAIT Platform initialized successfully');
            return this;
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Application initialization failed');
            throw error;
        }
    }

    /**
     * Initialize all application services
     */
    async initializeServices() {
        const { AIServiceManager } = await import('../../services/ai/AIServiceManager.js');
        const { PlatformManager } = await import('../../services/platforms/PlatformManager.js');
        const { AnalyticsEngine } = await import('../../services/analytics/AnalyticsEngine.js');
        const { WorkflowEngine } = await import('../../services/workflow/WorkflowEngine.js');
        const { WebhookManager } = await import('../../services/webhooks/WebhookManager.js');

        // Register services
        this.services.register('ai', new AIServiceManager(this.config.ai));
        this.services.register('platforms', new PlatformManager(this.config.platforms));
        this.services.register('analytics', new AnalyticsEngine(this.config.analytics));
        this.services.register('workflow', new WorkflowEngine(this.config.workflow));
        this.services.register('webhooks', new WebhookManager(this.config.webhooks));

        // Initialize services
        await Promise.all([
            this.services.get('ai').initialize(),
            this.services.get('platforms').initialize(),
            this.services.get('analytics').initialize(),
            this.services.get('workflow').initialize(),
            this.services.get('webhooks').initialize()
        ]);

        console.log('✅ Services initialized');
    }

    /**
     * Setup application routing
     */
    async setupRouting() {
        const routes = [
            { path: '/', component: 'DashboardPage', exact: true },
            { path: '/campaigns', component: 'CampaignsPage' },
            { path: '/campaigns/:id', component: 'CampaignDetailPage' },
            { path: '/analytics', component: 'AnalyticsPage' },
            { path: '/automation', component: 'AutomationPage' },
            { path: '/settings', component: 'SettingsPage' },
            { path: '/integrations', component: 'IntegrationsPage' },
            { path: '*', component: 'NotFoundPage' }
        ];

        routes.forEach(route => this.router.addRoute(route));
        await this.router.initialize();
        
        console.log('✅ Routing configured');
    }

    /**
     * Initialize state management
     */
    async initializeState() {
        const initialState = {
            user: {
                isAuthenticated: false,
                profile: null,
                preferences: {
                    language: this.config.defaultLanguage,
                    theme: 'light',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            },
            campaigns: {
                active: [],
                metrics: {},
                loading: false
            },
            platforms: {
                connected: [],
                metrics: {},
                lastSync: null
            },
            automation: {
                workflows: [],
                active: [],
                scheduled: []
            },
            ui: {
                sidebarOpen: true,
                notifications: [],
                modals: {}
            }
        };

        this.stateManager.initialize(initialState);
        
        // Setup state persistence
        this.stateManager.enablePersistence(['user.preferences', 'ui.sidebarOpen']);
        
        console.log('✅ State management initialized');
    }

    /**
     * Initialize real-time features
     */
    async initializeRealTimeFeatures() {
        const { WebSocketManager } = await import('../app/WebSocketManager.js');
        
        this.wsManager = new WebSocketManager({
            url: this.config.websocketUrl || 'wss://reach.brainsait.io/ws',
            autoReconnect: true,
            heartbeat: true
        });

        await this.wsManager.connect();
        
        // Setup real-time event handlers
        this.wsManager.on('campaign-update', (data) => {
            this.stateManager.updateState(['campaigns', 'metrics'], data);
            this.eventBus.emit('campaigns:updated', data);
        });

        this.wsManager.on('platform-metrics', (data) => {
            this.stateManager.updateState(['platforms', 'metrics'], data);
            this.eventBus.emit('platforms:metrics-updated', data);
        });

        console.log('✅ Real-time features initialized');
    }

    /**
     * Setup application middleware
     */
    setupMiddleware() {
        // Error handling middleware
        this.errorHandler.setup({
            onError: (error, context) => {
                this.eventBus.emit('app:error', { error, context });
                if (this.config.debug) {
                    console.error('Application Error:', error, context);
                }
            }
        });

        // Performance monitoring middleware
        if (this.config.performanceMonitoring) {
            this.performanceMonitor.setup({
                trackPageViews: true,
                trackUserInteractions: true,
                trackAPIRequests: true
            });
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle application-wide events
        this.eventBus.on('auth:login', this.handleUserLogin.bind(this));
        this.eventBus.on('auth:logout', this.handleUserLogout.bind(this));
        this.eventBus.on('language:change', this.handleLanguageChange.bind(this));
        
        // Handle browser events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    /**
     * Handle user login
     */
    async handleUserLogin(userData) {
        this.stateManager.updateState(['user'], {
            isAuthenticated: true,
            profile: userData
        });

        // Initialize user-specific services
        await this.services.get('analytics').setUser(userData.id);
        await this.services.get('workflow').loadUserWorkflows(userData.id);
        
        this.eventBus.emit('app:user-ready', userData);
    }

    /**
     * Handle user logout
     */
    async handleUserLogout() {
        this.stateManager.updateState(['user'], {
            isAuthenticated: false,
            profile: null
        });

        // Clear user-specific data
        await this.services.get('analytics').clearUser();
        await this.services.get('workflow').clearUserWorkflows();
        
        this.router.navigate('/');
    }

    /**
     * Handle language change
     */
    async handleLanguageChange(language) {
        await this.i18n.setLanguage(language);
        this.stateManager.updateState(['user', 'preferences', 'language'], language);
        this.eventBus.emit('ui:language-changed', language);
    }

    /**
     * Handle before page unload
     */
    handleBeforeUnload(event) {
        if (this.stateManager.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    /**
     * Handle online status
     */
    handleOnline() {
        this.eventBus.emit('app:online');
        if (this.wsManager) {
            this.wsManager.reconnect();
        }
    }

    /**
     * Handle offline status
     */
    handleOffline() {
        this.eventBus.emit('app:offline');
    }

    /**
     * Get service instance
     */
    getService(name) {
        return this.services.get(name);
    }

    /**
     * Get current state
     */
    getState(path = null) {
        return this.stateManager.getState(path);
    }

    /**
     * Update application state
     */
    updateState(path, value) {
        this.stateManager.updateState(path, value);
    }

    /**
     * Navigate to route
     */
    navigate(path, params = {}) {
        this.router.navigate(path, params);
    }

    /**
     * Emit application event
     */
    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    /**
     * Listen to application events
     */
    on(event, handler) {
        this.eventBus.on(event, handler);
    }

    /**
     * Cleanup and destroy application
     */
    async destroy() {
        if (this.wsManager) {
            await this.wsManager.disconnect();
        }
        
        this.performanceMonitor.stop();
        this.stateManager.destroy();
        this.router.destroy();
        this.eventBus.removeAllListeners();
        
        console.log('🧹 Application cleaned up');
    }
}

export { Application };