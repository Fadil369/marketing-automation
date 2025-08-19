/**
 * Advanced SPA Router - Single Page Application Routing
 * Features: Dynamic imports, route guards, middleware, nested routes
 * 
 * @author BrainSAIT Team
 */

class Router {
    constructor(options = {}) {
        this.routes = new Map();
        this.middlewares = [];
        this.guards = [];
        this.currentRoute = null;
        this.history = [];
        this.maxHistorySize = 50;
        
        this.options = {
            base: '',
            mode: 'history', // 'history' or 'hash'
            scrollBehavior: 'top',
            ...options
        };

        this.setupEventListeners();
    }

    /**
     * Add a route to the router
     */
    addRoute(route) {
        const {
            path,
            component,
            name = null,
            meta = {},
            guards = [],
            middleware = [],
            children = null,
            exact = false,
            redirect = null,
            lazy = true
        } = route;

        const routeConfig = {
            path: this.normalizePath(path),
            component,
            name,
            meta,
            guards: [...this.guards, ...guards],
            middleware: [...this.middlewares, ...middleware],
            children,
            exact,
            redirect,
            lazy,
            params: {},
            query: {},
            regex: this.pathToRegex(path)
        };

        this.routes.set(path, routeConfig);
        return this;
    }

    /**
     * Add multiple routes
     */
    addRoutes(routes) {
        routes.forEach(route => this.addRoute(route));
        return this;
    }

    /**
     * Add global middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Add global route guard
     */
    guard(guard) {
        this.guards.push(guard);
        return this;
    }

    /**
     * Initialize the router
     */
    async initialize() {
        const currentPath = this.getCurrentPath();
        await this.navigate(currentPath, { replace: true });
        console.log('✅ Router initialized');
    }

    /**
     * Navigate to a route
     */
    async navigate(path, options = {}) {
        try {
            const {
                replace = false,
                params = {},
                query = {},
                state = null
            } = options;

            // Normalize path
            const normalizedPath = this.normalizePath(path);
            const fullPath = this.buildFullPath(normalizedPath, query);

            // Find matching route
            const matchedRoute = this.matchRoute(normalizedPath);
            if (!matchedRoute) {
                throw new Error(`Route not found: ${path}`);
            }

            // Handle redirects
            if (matchedRoute.redirect) {
                return this.navigate(matchedRoute.redirect, { replace: true });
            }

            // Extract params from URL
            const routeParams = this.extractParams(matchedRoute, normalizedPath);
            const finalParams = { ...routeParams, ...params };

            // Create route context
            const routeContext = {
                path: normalizedPath,
                fullPath,
                route: matchedRoute,
                params: finalParams,
                query: this.parseQuery(query),
                meta: matchedRoute.meta,
                state
            };

            // Run route guards
            const guardResult = await this.runGuards(matchedRoute, routeContext);
            if (guardResult !== true) {
                if (typeof guardResult === 'string') {
                    return this.navigate(guardResult, { replace: true });
                }
                return; // Guard blocked navigation
            }

            // Run middleware
            await this.runMiddleware(matchedRoute, routeContext);

            // Load component
            const component = await this.loadComponent(matchedRoute, routeContext);

            // Update browser history
            this.updateHistory(fullPath, state, replace);

            // Update current route
            this.currentRoute = { ...routeContext, component };

            // Add to internal history
            this.addToHistory(this.currentRoute);

            // Render component
            await this.renderComponent(component, routeContext);

            // Handle scroll behavior
            this.handleScrollBehavior(routeContext);

            // Emit navigation event
            this.emit('route:changed', this.currentRoute);

            return this.currentRoute;

        } catch (error) {
            console.error('Navigation error:', error);
            this.emit('route:error', { error, path });
            throw error;
        }
    }

    /**
     * Go back in history
     */
    back() {
        if (this.history.length > 1) {
            window.history.back();
        }
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get current path from browser
     */
    getCurrentPath() {
        if (this.options.mode === 'hash') {
            return window.location.hash.slice(1) || '/';
        }
        return window.location.pathname.replace(new RegExp(`^${this.options.base}`), '') || '/';
    }

    /**
     * Match route by path
     */
    matchRoute(path) {
        for (const [, route] of this.routes) {
            if (route.exact && route.path === path) {
                return route;
            }
            if (!route.exact && route.regex.test(path)) {
                return route;
            }
        }
        return null;
    }

    /**
     * Convert path pattern to regex
     */
    pathToRegex(path) {
        if (path === '*') {return /.*/;}
        
        const regexPath = path
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, '([^\\/]+)')
            .replace(/\*/g, '.*');
            
        return new RegExp(`^${regexPath}$`);
    }

    /**
     * Extract parameters from URL
     */
    extractParams(route, path) {
        const params = {};
        const routePath = route.path;
        const pathParts = path.split('/');
        const routeParts = routePath.split('/');

        routeParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                params[paramName] = decodeURIComponent(pathParts[index] || '');
            }
        });

        return params;
    }

    /**
     * Run route guards
     */
    async runGuards(route, context) {
        for (const guard of route.guards) {
            const result = await guard(context);
            if (result !== true) {
                return result;
            }
        }
        return true;
    }

    /**
     * Run middleware
     */
    async runMiddleware(route, context) {
        for (const middleware of route.middleware) {
            await middleware(context);
        }
    }

    /**
     * Load component (with lazy loading support)
     */
    async loadComponent(route, context) {
        if (typeof route.component === 'string') {
            if (route.lazy) {
                // Dynamic import for lazy loading
                const componentPath = `../../pages/${route.component}.js`;
                const module = await import(componentPath);
                return module.default || module[route.component];
            } else {
                // Direct reference (component should be pre-imported)
                return window.BrainSAITComponents[route.component];
            }
        }
        return route.component;
    }

    /**
     * Render component
     */
    async renderComponent(component, context) {
        const container = document.getElementById('app');
        if (!container) {
            throw new Error('App container not found');
        }

        // Create component instance
        let componentHTML = '';
        
        if (typeof component === 'function') {
            if (component.prototype && component.prototype.render) {
                // Class component
                const instance = new component(context);
                componentHTML = await instance.render();
            } else {
                // Function component
                componentHTML = await component(context);
            }
        } else if (typeof component === 'string') {
            componentHTML = component;
        }

        // Update DOM
        container.innerHTML = componentHTML;

        // Initialize component scripts if present
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
            document.head.removeChild(newScript);
        });

        // Emit render event
        this.emit('component:rendered', { component, context });
    }

    /**
     * Handle scroll behavior
     */
    handleScrollBehavior(context) {
        switch (this.options.scrollBehavior) {
            case 'top':
                window.scrollTo(0, 0);
                break;
            case 'preserve':
                // Don't change scroll position
                break;
            case 'auto':
                if (context.state && context.state.scroll) {
                    window.scrollTo(context.state.scroll.x, context.state.scroll.y);
                } else {
                    window.scrollTo(0, 0);
                }
                break;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle browser navigation
        window.addEventListener('popstate', (event) => {
            const path = this.getCurrentPath();
            this.navigate(path, { replace: true, state: event.state });
        });

        // Handle link clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-route]');
            if (link) {
                event.preventDefault();
                const href = link.getAttribute('href') || link.getAttribute('data-route');
                this.navigate(href);
            }
        });
    }

    /**
     * Update browser history
     */
    updateHistory(path, state, replace) {
        const fullUrl = this.options.mode === 'hash' ? `#${path}` : `${this.options.base}${path}`;
        
        if (replace) {
            window.history.replaceState(state, '', fullUrl);
        } else {
            window.history.pushState(state, '', fullUrl);
        }
    }

    /**
     * Add to internal history
     */
    addToHistory(route) {
        this.history.push(route);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Utility functions
     */
    normalizePath(path) {
        return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    buildFullPath(path, query) {
        const queryString = this.buildQueryString(query);
        return queryString ? `${path}?${queryString}` : path;
    }

    buildQueryString(query) {
        if (!query || typeof query !== 'object') {return '';}
        return Object.entries(query)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    parseQuery(query) {
        if (typeof query === 'object') {return query;}
        if (typeof query !== 'string') {return {};}
        
        const params = {};
        const pairs = query.replace(/^\?/, '').split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });
        
        return params;
    }

    /**
     * Event system
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`router:${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.routes.clear();
        this.middlewares = [];
        this.guards = [];
        this.history = [];
        this.currentRoute = null;
    }
}

export { Router };