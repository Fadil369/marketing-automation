/**
 * Router - Client-side routing system with history management
 * Supports dynamic routes, middleware, and state preservation
 */

export class Router {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.routes = new Map();
        this.middleware = [];
        this.currentRoute = null;
        this.history = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            mode: 'hash', // 'hash' or 'history'
            base: '/',
            enableHistoryAPI: typeof window !== 'undefined' && window.history,
            maxHistorySize: 50
        };
        
        // Route parameters and query
        this.params = {};
        this.query = {};
    }

    /**
     * Initialize router
     */
    initialize() {
        if (this.isInitialized) {return;}
        
        console.log('🛣️ Initializing Router...');
        
        try {
            // Set up default routes
            this._setupDefaultRoutes();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Handle initial route
            this._handleInitialRoute();
            
            this.isInitialized = true;
            console.log('✅ Router initialized');
            
            this.eventBus.emit('router:initialized', {
                mode: this.config.mode,
                routes: Array.from(this.routes.keys()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Router initialization failed:', error);
            throw error;
        }
    }

    /**
     * Register a route
     */
    route(path, handler, options = {}) {
        const { 
            name = null,
            middleware = [],
            meta = {},
            beforeEnter = null,
            beforeLeave = null
        } = options;
        
        const route = {
            path,
            handler,
            name,
            middleware: [...this.middleware, ...middleware],
            meta,
            beforeEnter,
            beforeLeave,
            paramNames: this._extractParamNames(path),
            regex: this._pathToRegex(path)
        };
        
        this.routes.set(path, route);
        
        this.eventBus.emit('router:route-registered', {
            path,
            name,
            meta,
            timestamp: new Date().toISOString()
        });
        
        return this;
    }

    /**
     * Navigate to a route
     */
    async navigate(path, options = {}) {
        const { 
            replace = false,
            state = null,
            query = {},
            params = {}
        } = options;
        
        try {
            // Build full path with query parameters
            const fullPath = this._buildPath(path, query);
            
            // Find matching route
            const matchedRoute = this._matchRoute(fullPath);
            if (!matchedRoute) {
                throw new Error(`Route not found: ${path}`);
            }
            
            // Execute beforeLeave on current route
            if (this.currentRoute && this.currentRoute.route.beforeLeave) {
                const canLeave = await this.currentRoute.route.beforeLeave(this.currentRoute);
                if (canLeave === false) {
                    return false; // Navigation cancelled
                }
            }
            
            // Execute beforeEnter on new route
            if (matchedRoute.route.beforeEnter) {
                const canEnter = await matchedRoute.route.beforeEnter(matchedRoute);
                if (canEnter === false) {
                    return false; // Navigation cancelled
                }
            }
            
            // Execute middleware
            for (const middleware of matchedRoute.route.middleware) {
                const result = await middleware(matchedRoute);
                if (result === false) {
                    return false; // Navigation cancelled by middleware
                }
            }
            
            // Update browser history
            this._updateBrowserHistory(fullPath, state, replace);
            
            // Update current route
            const previousRoute = this.currentRoute;
            this.currentRoute = matchedRoute;
            this.params = { ...params, ...matchedRoute.params };
            this.query = { ...query, ...this._parseQuery(fullPath) };
            
            // Add to internal history
            this._addToHistory(matchedRoute, previousRoute);
            
            // Execute route handler
            await matchedRoute.route.handler(matchedRoute);
            
            // Emit navigation events
            this.eventBus.emit('router:navigated', {
                from: previousRoute?.route.path || null,
                to: matchedRoute.route.path,
                params: this.params,
                query: this.query,
                timestamp: new Date().toISOString()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            
            this.eventBus.emit('router:navigation-failed', {
                path,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    /**
     * Go back in history
     */
    back() {
        if (this.config.enableHistoryAPI && window.history.length > 1) {
            window.history.back();
        } else if (this.history.length > 1) {
            const previousRoute = this.history[this.history.length - 2];
            this.navigate(previousRoute.path);
        }
    }

    /**
     * Go forward in history
     */
    forward() {
        if (this.config.enableHistoryAPI) {
            window.history.forward();
        }
    }

    /**
     * Replace current route
     */
    replace(path, options = {}) {
        return this.navigate(path, { ...options, replace: true });
    }

    /**
     * Add global middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Get current route information
     */
    getCurrentRoute() {
        return {
            route: this.currentRoute?.route || null,
            path: this.currentRoute?.path || null,
            params: this.params,
            query: this.query,
            meta: this.currentRoute?.route.meta || {}
        };
    }

    /**
     * Generate URL for named route
     */
    url(name, params = {}, query = {}) {
        const route = Array.from(this.routes.values()).find(r => r.name === name);
        if (!route) {
            throw new Error(`Named route not found: ${name}`);
        }
        
        let path = route.path;
        
        // Replace parameters
        for (const [key, value] of Object.entries(params)) {
            path = path.replace(`:${key}`, value);
        }
        
        // Add query parameters
        return this._buildPath(path, query);
    }

    /**
     * Check if route is active
     */
    isActive(path, exact = false) {
        if (!this.currentRoute) {return false;}
        
        const currentPath = this.currentRoute.path;
        
        if (exact) {
            return currentPath === path;
        } else {
            return currentPath.startsWith(path);
        }
    }

    /**
     * Set up default routes
     */
    _setupDefaultRoutes() {
        // Default dashboard route
        this.route('/', () => {
            this._renderView('dashboard');
        }, {
            name: 'dashboard',
            meta: { title: 'Dashboard', icon: '📊' }
        });
        
        // AI Hub route
        this.route('/ai-hub', () => {
            this._renderView('ai-hub');
        }, {
            name: 'ai-hub',
            meta: { title: 'AI Hub', icon: '🤖' }
        });
        
        // Analytics route
        this.route('/analytics', () => {
            this._renderView('analytics');
        }, {
            name: 'analytics',
            meta: { title: 'Analytics', icon: '📈' }
        });
        
        // Campaigns route with parameter
        this.route('/campaigns/:id?', (matched) => {
            this._renderView('campaigns', { campaignId: matched.params.id });
        }, {
            name: 'campaigns',
            meta: { title: 'Campaigns', icon: '📢' }
        });
        
        // Settings route
        this.route('/settings', () => {
            this._renderView('settings');
        }, {
            name: 'settings',
            meta: { title: 'Settings', icon: '⚙️' }
        });
        
        // 404 route (catch-all)
        this.route('*', () => {
            this._renderView('404');
        }, {
            name: '404',
            meta: { title: 'Page Not Found', icon: '❌' }
        });
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        if (typeof window === 'undefined') {return;}
        
        // Handle browser navigation
        if (this.config.enableHistoryAPI) {
            window.addEventListener('popstate', (event) => {
                this._handlePopState(event);
            });
        }
        
        // Handle hash changes for hash mode
        if (this.config.mode === 'hash') {
            window.addEventListener('hashchange', () => {
                this._handleHashChange();
            });
        }
        
        // Handle link clicks
        document.addEventListener('click', (event) => {
            this._handleLinkClick(event);
        });
    }

    /**
     * Handle initial route
     */
    _handleInitialRoute() {
        if (typeof window === 'undefined') {return;}
        
        let initialPath;
        
        if (this.config.mode === 'hash') {
            initialPath = window.location.hash.slice(1) || '/';
        } else {
            initialPath = window.location.pathname + window.location.search;
        }
        
        this.navigate(initialPath).catch(error => {
            console.error('Failed to handle initial route:', error);
            this.navigate('/'); // Fallback to home
        });
    }

    /**
     * Handle popstate event
     */
    _handlePopState(event) {
        const path = window.location.pathname + window.location.search;
        this.navigate(path, { replace: true }).catch(error => {
            console.error('Failed to handle popstate:', error);
        });
    }

    /**
     * Handle hash change
     */
    _handleHashChange() {
        const path = window.location.hash.slice(1) || '/';
        this.navigate(path, { replace: true }).catch(error => {
            console.error('Failed to handle hash change:', error);
        });
    }

    /**
     * Handle link clicks
     */
    _handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) {return;}
        
        const href = link.getAttribute('href');
        
        // Check if it's an internal link
        if (this._isInternalLink(href)) {
            event.preventDefault();
            
            let path = href;
            if (this.config.mode === 'hash' && href.startsWith('#')) {
                path = href.slice(1);
            }
            
            this.navigate(path || '/').catch(error => {
                console.error('Failed to navigate on link click:', error);
            });
        }
    }

    /**
     * Check if link is internal
     */
    _isInternalLink(href) {
        if (!href) {return false;}
        
        // Hash links
        if (href.startsWith('#')) {return true;}
        
        // Relative paths
        if (href.startsWith('/')) {return true;}
        
        // Same origin
        if (typeof window !== 'undefined') {
            try {
                const url = new URL(href, window.location.origin);
                return url.origin === window.location.origin;
            } catch {
                return false;
            }
        }
        
        return false;
    }

    /**
     * Match route against current path
     */
    _matchRoute(path) {
        // Remove query string for matching
        const pathWithoutQuery = path.split('?')[0];
        
        for (const route of this.routes.values()) {
            if (route.path === '*') {continue;} // Skip catch-all for now
            
            const match = pathWithoutQuery.match(route.regex);
            if (match) {
                const params = {};
                
                // Extract parameters
                route.paramNames.forEach((paramName, index) => {
                    params[paramName] = match[index + 1];
                });
                
                return {
                    route,
                    path: pathWithoutQuery,
                    params,
                    fullPath: path
                };
            }
        }
        
        // Return catch-all route if no match
        const catchAllRoute = Array.from(this.routes.values()).find(r => r.path === '*');
        if (catchAllRoute) {
            return {
                route: catchAllRoute,
                path: pathWithoutQuery,
                params: {},
                fullPath: path
            };
        }
        
        return null;
    }

    /**
     * Convert path to regex
     */
    _pathToRegex(path) {
        if (path === '*') {
            return /.*/;
        }
        
        // Escape special regex characters except parameters
        const escaped = path.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        
        // Convert parameters to regex groups
        const withParams = escaped.replace(/:([^\/\?]+)\?/g, '([^/]*)?') // Optional parameters
                                 .replace(/:([^\/\?]+)/g, '([^/]+)'); // Required parameters
        
        return new RegExp(`^${withParams}$`);
    }

    /**
     * Extract parameter names from path
     */
    _extractParamNames(path) {
        const matches = path.match(/:([^\/\?]+)/g);
        if (!matches) {return [];}
        
        return matches.map(match => match.slice(1).replace('?', ''));
    }

    /**
     * Build path with query parameters
     */
    _buildPath(path, query = {}) {
        const queryString = new URLSearchParams(query).toString();
        return queryString ? `${path}?${queryString}` : path;
    }

    /**
     * Parse query parameters from path
     */
    _parseQuery(path) {
        const queryStart = path.indexOf('?');
        if (queryStart === -1) {return {};}
        
        const queryString = path.slice(queryStart + 1);
        const params = new URLSearchParams(queryString);
        const query = {};
        
        for (const [key, value] of params) {
            query[key] = value;
        }
        
        return query;
    }

    /**
     * Update browser history
     */
    _updateBrowserHistory(path, state, replace) {
        if (typeof window === 'undefined') {return;}
        
        let url;
        
        if (this.config.mode === 'hash') {
            url = `${window.location.pathname}${window.location.search}#${path}`;
        } else {
            url = path;
        }
        
        if (this.config.enableHistoryAPI) {
            if (replace) {
                window.history.replaceState(state, '', url);
            } else {
                window.history.pushState(state, '', url);
            }
        } else if (this.config.mode === 'hash') {
            if (replace) {
                window.location.replace(url);
            } else {
                window.location.hash = path;
            }
        }
    }

    /**
     * Add to internal history
     */
    _addToHistory(matchedRoute, previousRoute) {
        const historyEntry = {
            route: matchedRoute.route,
            path: matchedRoute.path,
            params: matchedRoute.params,
            timestamp: Date.now()
        };
        
        this.history.push(historyEntry);
        
        // Maintain history size
        if (this.history.length > this.config.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Render view based on route
     */
    _renderView(viewName, data = {}) {
        // Emit view change event
        this.eventBus.emit('router:view-changed', {
            view: viewName,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Update document title
        if (this.currentRoute?.route.meta?.title) {
            document.title = `${this.currentRoute.route.meta.title} - BrainSAIT`;
        }
        
        // Show/hide view containers
        this._toggleViewContainers(viewName);
        
        // Update navigation
        this._updateNavigation();
    }

    /**
     * Toggle view containers
     */
    _toggleViewContainers(activeView) {
        const containers = {
            'dashboard': 'dashboard-container',
            'ai-hub': 'ai-hub-container',
            'analytics': 'analytics-container',
            'campaigns': 'campaigns-container',
            'settings': 'settings-container',
            '404': '404-container'
        };
        
        // Hide all containers
        for (const containerId of Object.values(containers)) {
            const container = document.getElementById(containerId);
            if (container) {
                container.style.display = 'none';
            }
        }
        
        // Show active container
        const activeContainerId = containers[activeView];
        if (activeContainerId) {
            let activeContainer = document.getElementById(activeContainerId);
            
            // Create container if it doesn't exist
            if (!activeContainer) {
                activeContainer = this._createViewContainer(activeView, activeContainerId);
            }
            
            activeContainer.style.display = 'block';
        }
    }

    /**
     * Create view container
     */
    _createViewContainer(viewName, containerId) {
        const container = document.createElement('div');
        container.id = containerId;
        container.className = `view-container ${viewName}-view`;
        
        // Add basic content based on view
        switch (viewName) {
            case 'analytics':
                container.innerHTML = `
                    <div style="padding: 24px;">
                        <h1>📈 Analytics</h1>
                        <p>Analytics view coming soon...</p>
                    </div>
                `;
                break;
                
            case 'campaigns':
                container.innerHTML = `
                    <div style="padding: 24px;">
                        <h1>📢 Campaigns</h1>
                        <p>Campaign management view coming soon...</p>
                    </div>
                `;
                break;
                
            case 'settings':
                container.innerHTML = `
                    <div style="padding: 24px;">
                        <h1>⚙️ Settings</h1>
                        <p>Settings view coming soon...</p>
                    </div>
                `;
                break;
                
            case '404':
                container.innerHTML = `
                    <div style="padding: 24px; text-align: center;">
                        <h1>❌ Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <button onclick="window.router?.navigate('/')" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Go Home
                        </button>
                    </div>
                `;
                break;
                
            default:
                container.innerHTML = `
                    <div style="padding: 24px;">
                        <h1>${viewName.charAt(0).toUpperCase() + viewName.slice(1)}</h1>
                        <p>View content goes here...</p>
                    </div>
                `;
        }
        
        document.body.appendChild(container);
        return container;
    }

    /**
     * Update navigation
     */
    _updateNavigation() {
        // Update active navigation items
        const navItems = document.querySelectorAll('[data-route]');
        
        navItems.forEach(item => {
            const routePath = item.getAttribute('data-route');
            const isActive = this.isActive(routePath);
            
            if (isActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Get router metrics
     */
    getMetrics() {
        return {
            routes: this.routes.size,
            historySize: this.history.length,
            currentRoute: this.currentRoute?.route.path || null,
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Destroy router
     */
    destroy() {
        // Remove event listeners
        if (typeof window !== 'undefined') {
            window.removeEventListener('popstate', this._handlePopState);
            window.removeEventListener('hashchange', this._handleHashChange);
            document.removeEventListener('click', this._handleLinkClick);
        }
        
        this.routes.clear();
        this.middleware = [];
        this.history = [];
        this.currentRoute = null;
        
        console.log('🛣️ Router destroyed');
    }
}

// Make available globally for navigation
if (typeof window !== 'undefined') {
    window.router = null;
}