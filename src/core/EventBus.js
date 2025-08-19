/**
 * Enterprise Event Bus - High-performance pub/sub system with priority handling
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.middlewares = [];
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.isDebugMode = false;
    }

    /**
     * Subscribe to an event with priority support
     */
    on(eventName, callback, priority = 0) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = { callback, priority, id: Date.now() + Math.random() };
        const listeners = this.events.get(eventName);
        
        // Insert with priority (higher priority first)
        let inserted = false;
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].priority < priority) {
                listeners.splice(i, 0, listener);
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            listeners.push(listener);
        }

        if (this.isDebugMode) {
            console.log(`📡 Event listener registered: ${eventName} (priority: ${priority})`);
        }

        // Return unsubscribe function
        return () => this.off(eventName, listener.id);
    }

    /**
     * Subscribe to an event only once
     */
    once(eventName, callback, priority = 0) {
        const unsubscribe = this.on(eventName, (...args) => {
            unsubscribe();
            callback(...args);
        }, priority);
        
        return unsubscribe;
    }

    /**
     * Unsubscribe from an event
     */
    off(eventName, listenerIdOrCallback) {
        if (!this.events.has(eventName)) {return;}

        const listeners = this.events.get(eventName);
        let index = -1;
        
        // Support both callback function and listener ID
        if (typeof listenerIdOrCallback === 'function') {
            index = listeners.findIndex(l => l.callback === listenerIdOrCallback);
        } else {
            index = listeners.findIndex(l => l.id === listenerIdOrCallback);
        }
        
        if (index > -1) {
            listeners.splice(index, 1);
            
            if (listeners.length === 0) {
                this.events.delete(eventName);
            }
            
            if (this.isDebugMode) {
                console.log(`📡 Event listener removed: ${eventName}`);
            }
        }
    }

    /**
     * Emit an event with middleware processing
     */
    async emit(eventName, data = {}, options = {}) {
        const eventData = {
            name: eventName,
            data,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            ...options
        };

        // Add to history
        this._addToHistory(eventData);

        // Process middlewares
        let processedData = eventData;
        for (const middleware of this.middlewares) {
            try {
                processedData = await middleware(processedData);
                if (!processedData) {break;} // Middleware cancelled the event
            } catch (error) {
                console.error('❌ Event middleware error:', error);
            }
        }

        if (!processedData) {return;} // Event was cancelled

        // Emit to listeners
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            const promises = [];

            for (const listener of listeners) {
                try {
                    const result = listener.callback(processedData.data, processedData);
                    if (result && typeof result.then === 'function') {
                        promises.push(result);
                    }
                } catch (error) {
                    console.error(`❌ Event listener error for ${eventName}:`, error);
                }
            }

            // Wait for async listeners if any
            if (promises.length > 0) {
                await Promise.allSettled(promises);
            }
        }

        if (this.isDebugMode) {
            console.log(`📡 Event emitted: ${eventName}`, processedData.data);
        }
    }

    /**
     * Add middleware for event processing
     */
    addMiddleware(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Remove middleware
     */
    removeMiddleware(middleware) {
        const index = this.middlewares.indexOf(middleware);
        if (index > -1) {
            this.middlewares.splice(index, 1);
        }
    }

    /**
     * Get event history
     */
    getHistory(eventName = null, limit = 100) {
        let history = this.eventHistory;
        
        if (eventName) {
            history = history.filter(event => event.name === eventName);
        }
        
        return history.slice(-limit);
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * Get all active event listeners
     */
    getListeners() {
        const result = {};
        for (const [eventName, listeners] of this.events) {
            result[eventName] = listeners.length;
        }
        return result;
    }

    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.isDebugMode = enabled;
        console.log(`📡 EventBus debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Wildcard event subscription
     */
    onAny(callback, priority = 0) {
        return this.on('*', callback, priority);
    }

    /**
     * Add event to history
     */
    _addToHistory(eventData) {
        this.eventHistory.push(eventData);
        
        // Maintain history size limit
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * Destroy the event bus
     */
    destroy() {
        this.events.clear();
        this.middlewares = [];
        this.eventHistory = [];
        console.log('📡 EventBus destroyed');
    }
}