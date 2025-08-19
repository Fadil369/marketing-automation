/**
 * Advanced State Manager with reactive updates and time-travel debugging
 */

export class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = new Map();
        this.history = [];
        this.maxHistorySize = 100;
        this.subscribers = new Map();
        this.computedCache = new Map();
        this.middleware = [];
        this.isTimeTravel = false;
    }

    /**
     * Get state value with computed property support
     */
    getState(key) {
        if (key.includes('.')) {
            return this._getNestedState(key);
        }
        
        return this.state.get(key);
    }

    /**
     * Set state with validation and history tracking
     */
    setState(key, value, options = {}) {
        const { silent = false, merge = false } = options;
        
        // Get current value for comparison
        const currentValue = this.getState(key);
        
        // Apply middleware
        let processedValue = value;
        for (const middleware of this.middleware) {
            processedValue = middleware(key, processedValue, currentValue);
        }

        // Handle merging for objects
        if (merge && typeof currentValue === 'object' && typeof processedValue === 'object') {
            processedValue = { ...currentValue, ...processedValue };
        }

        // Only update if value actually changed
        if (JSON.stringify(currentValue) === JSON.stringify(processedValue)) {
            return;
        }

        // Save to history (if not in time travel mode)
        if (!this.isTimeTravel) {
            this._saveToHistory(key, currentValue, processedValue);
        }

        // Update state
        this.state.set(key, processedValue);

        // Clear computed cache for dependent keys
        this._clearComputedCache(key);

        // Notify subscribers
        if (!silent) {
            this._notifySubscribers(key, processedValue, currentValue);
        }

        // Emit global state change event
        this.eventBus?.emit('state:changed', {
            key,
            value: processedValue,
            previousValue: currentValue,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback, options = {}) {
        const { immediate = false } = options;
        
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        const subscription = {
            callback,
            id: Date.now() + Math.random()
        };
        
        this.subscribers.get(key).add(subscription);

        // Call immediately with current value if requested
        if (immediate) {
            callback(this.getState(key), undefined);
        }

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(key);
            if (subs) {
                subs.delete(subscription);
                if (subs.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }

    /**
     * Watch state changes (alias for subscribe)
     */
    watch(key, callback, options = {}) {
        return this.subscribe(key, callback, options);
    }

    /**
     * Update state by merging with existing value
     */
    updateState(key, value, options = {}) {
        return this.setState(key, value, { ...options, merge: true });
    }

    /**
     * Create computed properties that auto-update
     */
    computed(key, dependencies, computeFn) {
        const compute = () => {
            const depValues = dependencies.map(dep => this.getState(dep));
            return computeFn(...depValues);
        };

        // Subscribe to all dependencies
        const unsubscribes = dependencies.map(dep => 
            this.subscribe(dep, () => {
                const newValue = compute();
                this.setState(key, newValue, { silent: true });
                this._notifySubscribers(key, newValue, this.getState(key));
            })
        );

        // Initial computation
        this.setState(key, compute(), { silent: true });

        return () => unsubscribes.forEach(unsub => unsub());
    }

    /**
     * Batch multiple state updates
     */
    batch(updates) {
        const changes = [];
        
        for (const [key, value] of Object.entries(updates)) {
            const currentValue = this.getState(key);
            this.setState(key, value, { silent: true });
            changes.push({ key, value, previousValue: currentValue });
        }

        // Notify all subscribers after batch
        for (const change of changes) {
            this._notifySubscribers(change.key, change.value, change.previousValue);
        }

        this.eventBus?.emit('state:batch-changed', { changes });
    }

    /**
     * Add state middleware
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Remove state middleware
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
        }
    }

    /**
     * Time travel debugging - go back in history
     */
    timeTravel(steps = 1) {
        if (this.history.length === 0) {return;}

        this.isTimeTravel = true;
        
        for (let i = 0; i < steps && this.history.length > 0; i++) {
            const historyEntry = this.history.pop();
            this.setState(historyEntry.key, historyEntry.previousValue, { silent: true });
        }
        
        this.isTimeTravel = false;
        
        this.eventBus?.emit('state:time-travel', { steps });
    }

    /**
     * Get state history
     */
    getHistory(key = null, limit = 50) {
        let history = this.history;
        
        if (key) {
            history = history.filter(entry => entry.key === key);
        }
        
        return history.slice(-limit);
    }

    /**
     * Clear state history
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Reset state to initial values
     */
    reset(keys = null) {
        if (keys) {
            for (const key of keys) {
                this.state.delete(key);
                this._notifySubscribers(key, undefined, this.getState(key));
            }
        } else {
            this.state.clear();
            this.computedCache.clear();
            this.history = [];
            
            // Notify all subscribers
            for (const [key, subscribers] of this.subscribers) {
                for (const subscription of subscribers) {
                    subscription.callback(undefined, undefined);
                }
            }
        }

        this.eventBus?.emit('state:reset', { keys });
    }

    /**
     * Export state for persistence
     */
    export(keys = null) {
        const exportData = {};
        
        if (keys) {
            for (const key of keys) {
                exportData[key] = this.getState(key);
            }
        } else {
            for (const [key, value] of this.state) {
                exportData[key] = value;
            }
        }
        
        return {
            state: exportData,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Import state from persistence
     */
    import(data, options = {}) {
        const { merge = false, validate = true } = options;
        
        if (validate && (!data.state || typeof data.state !== 'object')) {
            throw new Error('Invalid state data format');
        }

        if (!merge) {
            this.reset();
        }

        for (const [key, value] of Object.entries(data.state)) {
            this.setState(key, value, { silent: true });
        }

        this.eventBus?.emit('state:imported', { 
            keys: Object.keys(data.state),
            timestamp: data.timestamp 
        });
    }

    /**
     * Get nested state value using dot notation
     */
    _getNestedState(key) {
        const keys = key.split('.');
        let value = this.state.get(keys[0]);
        
        for (let i = 1; i < keys.length && value !== undefined; i++) {
            value = value[keys[i]];
        }
        
        return value;
    }

    /**
     * Save state change to history
     */
    _saveToHistory(key, previousValue, newValue) {
        this.history.push({
            key,
            previousValue,
            newValue,
            timestamp: new Date().toISOString()
        });

        // Maintain history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Notify subscribers of state changes
     */
    _notifySubscribers(key, newValue, previousValue) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
            for (const subscription of subscribers) {
                try {
                    subscription.callback(newValue, previousValue);
                } catch (error) {
                    console.error(`State subscriber error for key "${key}":`, error);
                }
            }
        }
    }

    /**
     * Clear computed cache for dependent keys
     */
    _clearComputedCache(changedKey) {
        for (const [cacheKey, dependencies] of this.computedCache) {
            if (dependencies.includes(changedKey)) {
                this.computedCache.delete(cacheKey);
            }
        }
    }

    /**
     * Get all current state
     */
    getAllState() {
        const result = {};
        for (const [key, value] of this.state) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Get state statistics
     */
    getStats() {
        return {
            stateKeys: this.state.size,
            subscribers: Array.from(this.subscribers.keys()).length,
            historySize: this.history.length,
            computedProperties: this.computedCache.size,
            middleware: this.middleware.length
        };
    }

    /**
     * Destroy state manager
     */
    destroy() {
        this.state.clear();
        this.subscribers.clear();
        this.computedCache.clear();
        this.history = [];
        this.middleware = [];
        console.log('🗃️ StateManager destroyed');
    }
}