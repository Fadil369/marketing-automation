/**
 * BrainSAIT Marketing Automation Platform - Core Application
 * Enterprise-grade application controller with dependency injection and service management
 */

class BrainSAITApplication {
    constructor() {
        this.version = '2.0.0';
        this.services = new Map();
        this.components = new Map();
        this.eventBus = null;
        this.router = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        // Performance monitoring
        this.startTime = performance.now();
        this.loadMetrics = {
            coreInit: 0,
            servicesInit: 0,
            componentsInit: 0,
            totalInit: 0
        };
    }

    /**
     * Initialize the application with all services and components
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing BrainSAIT Marketing Automation Platform...');
            
            // Initialize core systems
            await this._initializeCore();
            
            // Initialize services
            await this._initializeServices();
            
            // Initialize UI components
            await this._initializeComponents();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            this.loadMetrics.totalInit = performance.now() - this.startTime;
            
            console.log('✅ BrainSAIT Platform initialized successfully');
            console.log('📊 Load Metrics:', this.loadMetrics);
            
            // Dispatch initialization complete event
            this.eventBus.emit('app:initialized', {
                version: this.version,
                loadTime: this.loadMetrics.totalInit,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize BrainSAIT Platform:', error);
            this.eventBus?.emit('app:error', { error, phase: 'initialization' });
            throw error;
        }
    }

    /**
     * Initialize core systems (EventBus, Router, StateManager)
     */
    async _initializeCore() {
        const coreStart = performance.now();
        
        // Initialize EventBus
        const { EventBus } = await import('./EventBus.js');
        this.eventBus = new EventBus();
        
        // Initialize Router
        const { Router } = await import('./Router.js');
        this.router = new Router(this.eventBus);
        this.router.initialize();
        
        // Initialize State Manager
        const { StateManager } = await import('./StateManager.js');
        this.stateManager = new StateManager(this.eventBus);
        
        this.loadMetrics.coreInit = performance.now() - coreStart;
        console.log('✅ Core systems initialized');
    }

    /**
     * Initialize all application services
     */
    async _initializeServices() {
        const servicesStart = performance.now();
        
        try {
            // AI Services
            const { AIServiceManager } = await import('../services/AIServiceManager.js');
            const aiService = new AIServiceManager(this.eventBus, this.stateManager);
            await aiService.initialize();
            this.services.set('ai', aiService);

            // Platform API Manager
            const { PlatformManager } = await import('../services/PlatformManager.js');
            const platformService = new PlatformManager(this.eventBus, this.stateManager);
            await platformService.initialize();
            this.services.set('platforms', platformService);

            // Workflow Engine
            const { WorkflowEngine } = await import('../services/WorkflowEngine.js');
            const workflowService = new WorkflowEngine(this.eventBus, this.stateManager);
            await workflowService.initialize();
            this.services.set('workflows', workflowService);

            // Analytics Engine
            const { AnalyticsEngine } = await import('../services/AnalyticsEngine.js');
            const analyticsService = new AnalyticsEngine(this.eventBus, this.stateManager);
            await analyticsService.initialize();
            this.services.set('analytics', analyticsService);

            // WebSocket Service
            const { WebSocketService } = await import('../services/WebSocketService.js');
            const webSocketService = new WebSocketService(this.eventBus, this.stateManager);
            await webSocketService.initialize();
            this.services.set('websocket', webSocketService);

            this.loadMetrics.servicesInit = performance.now() - servicesStart;
            console.log('✅ Services initialized');
            
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize UI components
     */
    async _initializeComponents() {
        const componentsStart = performance.now();
        
        try {
            // Dashboard Components
            const { DashboardManager } = await import('../components/DashboardManager.js');
            const dashboardManager = new DashboardManager(this.eventBus, this.stateManager, this.services);
            await dashboardManager.initialize();
            this.components.set('dashboard', dashboardManager);

            // Real-time Metrics
            const { MetricsManager } = await import('../components/MetricsManager.js');
            const metricsManager = new MetricsManager(this.eventBus, this.stateManager, this.services);
            await metricsManager.initialize();
            this.components.set('metrics', metricsManager);

            // AI Hub
            const { AIHubManager } = await import('../components/AIHubManager.js');
            const aiHubManager = new AIHubManager(this.eventBus, this.stateManager, this.services);
            await aiHubManager.initialize();
            this.components.set('aiHub', aiHubManager);

            this.loadMetrics.componentsInit = performance.now() - componentsStart;
            console.log('✅ Components initialized');
            
        } catch (error) {
            console.error('❌ Component initialization failed:', error);
            throw error;
        }
    }

    /**
     * Set up global event listeners
     */
    _setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (event) => {
            this.eventBus.emit('app:error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.eventBus.emit('app:error', {
                type: 'unhandledrejection',
                reason: event.reason
            });
        });

        // Performance monitoring
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.eventBus.emit('app:performance', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            this.eventBus.emit('app:visibility', {
                hidden: document.hidden,
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Get a service by name
     */
    getService(name) {
        return this.services.get(name);
    }

    /**
     * Get a component by name
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Navigate to a specific route
     */
    navigate(route, params = {}) {
        if (this.router) {
            this.router.navigate(route, params);
        }
    }

    /**
     * Get current application state
     */
    getState(key) {
        return this.stateManager?.getState(key);
    }

    /**
     * Update application state
     */
    setState(key, value) {
        if (this.stateManager) {
            this.stateManager.setState(key, value);
        }
    }

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (this.eventBus) {
            return this.eventBus.on(event, callback);
        }
    }

    /**
     * Emit events
     */
    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    /**
     * Get application health status
     */
    getHealthStatus() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            uptime: performance.now() - this.startTime,
            services: Array.from(this.services.keys()),
            components: Array.from(this.components.keys()),
            loadMetrics: this.loadMetrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🔄 Shutting down BrainSAIT Platform...');
        
        // Cleanup components
        for (const [name, component] of this.components) {
            if (component.destroy) {
                await component.destroy();
            }
        }

        // Cleanup services
        for (const [name, service] of this.services) {
            if (service.destroy) {
                await service.destroy();
            }
        }

        // Clear maps
        this.services.clear();
        this.components.clear();
        
        this.isInitialized = false;
        console.log('✅ BrainSAIT Platform shutdown complete');
    }
}

// Create and export global application instance
export const app = new BrainSAITApplication();

// Initialize on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Export for external use
export default BrainSAITApplication;