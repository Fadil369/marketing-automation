/**
 * Advanced State Manager - Centralized application state management
 * Features: Reactive updates, persistence, time-travel debugging, middleware
 * 
 * @author BrainSAIT Team
 */

class StateManager {
    constructor(options = {}) {
        this.state = {};
        this.subscribers = new Map();
        this.middleware = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        this.options = {
            enableTimeTravel: true,
            enablePersistence: true,
            persistenceKey: 'brainsait_state',
            enableDevTools: process.env.NODE_ENV === 'development',
            ...options
        };

        this.actionTypes = new Set();
        this.mutations = new Map();
        this.actions = new Map();
        this.getters = new Map();

        // Persistence settings
        this.persistedPaths = new Set();
        this.persistenceDebounceTime = 1000;
        this.persistenceTimer = null;

        this.setupDevTools();
    }

    /**
     * Initialize state manager with initial state
     */
    initialize(initialState = {}) {
        // Load persisted state
        if (this.options.enablePersistence) {
            const persistedState = this.loadPersistedState();
            this.state = this.mergeState(initialState, persistedState);
        } else {
            this.state = { ...initialState };
        }

        // Add to history
        if (this.options.enableTimeTravel) {
            this.addToHistory('INIT', this.state, null);
        }

        // Notify subscribers of initialization
        this.notifySubscribers(['*'], this.state, { type: 'INIT' });

        console.log('✅ StateManager initialized', this.state);
    }

    /**
     * Get state value by path
     */
    getState(path = null) {
        if (!path) {return { ...this.state };}
        
        const pathArray = Array.isArray(path) ? path : path.split('.');
        return this.getValueByPath(this.state, pathArray);
    }

    /**
     * Update state with mutation
     */
    commit(mutationType, payload) {
        const mutation = this.mutations.get(mutationType);
        if (!mutation) {
            throw new Error(`Mutation "${mutationType}" not found`);
        }

        const previousState = { ...this.state };
        
        // Run middleware (before)
        this.runMiddleware('before', { type: mutationType, payload, state: this.state });

        // Apply mutation
        mutation(this.state, payload);

        // Add to history
        if (this.options.enableTimeTravel) {
            this.addToHistory(mutationType, this.state, payload);
        }

        // Run middleware (after)
        this.runMiddleware('after', { type: mutationType, payload, state: this.state, previousState });

        // Notify subscribers
        this.notifySubscribers(['*'], this.state, { type: mutationType, payload });

        // Handle persistence
        this.handlePersistence();

        return this.state;
    }

    /**
     * Dispatch action
     */
    async dispatch(actionType, payload) {
        const action = this.actions.get(actionType);
        if (!action) {
            throw new Error(`Action "${actionType}" not found`);
        }

        const context = {
            state: this.state,
            commit: this.commit.bind(this),
            dispatch: this.dispatch.bind(this),
            getters: this.createGetterProxy()
        };

        return await action(context, payload);
    }

    /**
     * Update state directly (for simple updates)
     */
    updateState(path, value) {
        const pathArray = Array.isArray(path) ? path : path.split('.');
        const previousState = { ...this.state };
        
        this.setValueByPath(this.state, pathArray, value);
        
        // Add to history
        if (this.options.enableTimeTravel) {
            this.addToHistory('UPDATE', this.state, { path: pathArray, value });
        }

        // Notify subscribers
        this.notifySubscribers(pathArray, value, { type: 'UPDATE', path: pathArray });

        // Handle persistence
        this.handlePersistence();

        return value;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback, options = {}) {
        const pathKey = Array.isArray(path) ? path.join('.') : path;
        const subscriptionId = this.generateId();
        
        const subscription = {
            id: subscriptionId,
            path: pathKey,
            callback,
            immediate: options.immediate || false,
            once: options.once || false
        };

        if (!this.subscribers.has(pathKey)) {
            this.subscribers.set(pathKey, new Map());
        }
        
        this.subscribers.get(pathKey).set(subscriptionId, subscription);

        // Call immediately if requested
        if (options.immediate) {
            const currentValue = this.getState(path);
            callback(currentValue, { type: 'IMMEDIATE' });
        }

        // Return unsubscribe function
        return () => this.unsubscribe(pathKey, subscriptionId);
    }

    /**
     * Unsubscribe from state changes
     */
    unsubscribe(path, subscriptionId) {
        const pathSubscribers = this.subscribers.get(path);
        if (pathSubscribers) {
            pathSubscribers.delete(subscriptionId);
            if (pathSubscribers.size === 0) {
                this.subscribers.delete(path);
            }
        }
    }

    /**
     * Register mutation
     */
    registerMutation(type, handler) {
        this.mutations.set(type, handler);
        this.actionTypes.add(type);
    }

    /**
     * Register action
     */
    registerAction(type, handler) {
        this.actions.set(type, handler);
        this.actionTypes.add(type);
    }

    /**
     * Register getter
     */
    registerGetter(name, getter) {
        this.getters.set(name, getter);
    }

    /**
     * Add middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Enable persistence for specific paths
     */
    enablePersistence(paths) {
        if (Array.isArray(paths)) {
            paths.forEach(path => this.persistedPaths.add(path));
        } else {
            this.persistedPaths.add(paths);
        }
    }

    /**
     * Time travel - go back in history
     */
    timeTravel(steps = 1) {
        if (!this.options.enableTimeTravel) {
            throw new Error('Time travel is not enabled');
        }

        const newIndex = Math.max(0, this.historyIndex - steps);
        if (newIndex !== this.historyIndex) {
            this.historyIndex = newIndex;
            this.state = { ...this.history[newIndex].state };
            this.notifySubscribers(['*'], this.state, { type: 'TIME_TRAVEL', index: newIndex });
        }
    }

    /**
     * Time travel - go forward in history
     */
    timeTravelForward(steps = 1) {
        if (!this.options.enableTimeTravel) {
            throw new Error('Time travel is not enabled');
        }

        const newIndex = Math.min(this.history.length - 1, this.historyIndex + steps);
        if (newIndex !== this.historyIndex) {
            this.historyIndex = newIndex;
            this.state = { ...this.history[newIndex].state };
            this.notifySubscribers(['*'], this.state, { type: 'TIME_TRAVEL', index: newIndex });
        }
    }

    /**
     * Get history
     */
    getHistory() {
        return this.history.map((entry, index) => ({
            ...entry,
            isCurrent: index === this.historyIndex
        }));
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // This could be enhanced to track specific changes
        return this.historyIndex > 0;
    }

    /**
     * Reset state to initial state
     */
    reset() {
        if (this.history.length > 0) {
            this.state = { ...this.history[0].state };
            this.historyIndex = 0;
            this.notifySubscribers(['*'], this.state, { type: 'RESET' });
        }
    }

    /**
     * Private methods
     */

    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(changedPath, value, action) {
        const pathKey = changedPath.join('.');
        
        // Notify specific path subscribers
        this.notifyPathSubscribers(pathKey, value, action);
        
        // Notify wildcard subscribers
        this.notifyPathSubscribers('*', this.state, action);
        
        // Notify parent path subscribers
        const parentPath = changedPath.slice();
        while (parentPath.length > 0) {
            parentPath.pop();
            const parentPathKey = parentPath.join('.') || '*';
            const parentValue = parentPath.length > 0 ? this.getValueByPath(this.state, parentPath) : this.state;
            this.notifyPathSubscribers(parentPathKey, parentValue, action);
        }
    }

    /**
     * Notify subscribers for a specific path
     */
    notifyPathSubscribers(pathKey, value, action) {
        const pathSubscribers = this.subscribers.get(pathKey);
        if (!pathSubscribers) {return;}

        const subscribersToRemove = [];
        
        pathSubscribers.forEach((subscription, subscriptionId) => {
            try {
                subscription.callback(value, action);
                
                if (subscription.once) {
                    subscribersToRemove.push(subscriptionId);
                }
            } catch (error) {
                console.error(`Error in state subscriber for "${pathKey}":`, error);
            }
        });

        // Remove one-time subscribers
        subscribersToRemove.forEach(id => pathSubscribers.delete(id));
    }

    /**
     * Run middleware
     */
    runMiddleware(phase, context) {
        this.middleware.forEach(middleware => {
            if (middleware[phase]) {
                middleware[phase](context);
            }
        });
    }

    /**
     * Add entry to history
     */
    addToHistory(type, state, payload) {
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push({
            type,
            state: { ...state },
            payload,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * Handle persistence
     */
    handlePersistence() {
        if (!this.options.enablePersistence || this.persistedPaths.size === 0) {
            return;
        }

        // Debounce persistence
        if (this.persistenceTimer) {
            clearTimeout(this.persistenceTimer);
        }

        this.persistenceTimer = setTimeout(() => {
            this.persistState();
        }, this.persistenceDebounceTime);
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const stateToPersist = {};
            
            this.persistedPaths.forEach(path => {
                const value = this.getState(path);
                if (value !== undefined) {
                    this.setValueByPath(stateToPersist, path.split('.'), value);
                }
            });

            localStorage.setItem(this.options.persistenceKey, JSON.stringify(stateToPersist));
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const persisted = localStorage.getItem(this.options.persistenceKey);
            return persisted ? JSON.parse(persisted) : {};
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
            return {};
        }
    }

    /**
     * Merge states (deep merge)
     */
    mergeState(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeState(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Get value by path array
     */
    getValueByPath(obj, path) {
        return path.reduce((current, key) => current && current[key], obj);
    }

    /**
     * Set value by path array
     */
    setValueByPath(obj, path, value) {
        const lastKey = path.pop();
        const target = path.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Create getter proxy
     */
    createGetterProxy() {
        const proxy = {};
        this.getters.forEach((getter, name) => {
            Object.defineProperty(proxy, name, {
                get: () => getter(this.state, proxy),
                enumerable: true
            });
        });
        return proxy;
    }

    /**
     * Setup development tools
     */
    setupDevTools() {
        if (this.options.enableDevTools && window.__BRAINSAIT_DEVTOOLS__) {
            window.__BRAINSAIT_DEVTOOLS__.connect(this);
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.subscribers.clear();
        this.middleware = [];
        this.history = [];
        this.persistedPaths.clear();
        
        if (this.persistenceTimer) {
            clearTimeout(this.persistenceTimer);
        }
    }
}

export { StateManager };