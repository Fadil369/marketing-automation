/**
 * Event Bus - Application-wide event management
 * Provides pub/sub pattern for loose coupling between components
 * 
 * @author BrainSAIT Team
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Set();
        this.maxListeners = 100;
        this.debug = false;
    }

    /**
     * Subscribe to an event
     */
    on(event, handler, priority = 0) {
        if (typeof handler !== 'function') {
            throw new Error('Event handler must be a function');
        }

        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listeners = this.events.get(event);
        
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners exceeded for event: ${event}`);
        }

        listeners.push({ handler, priority, id: this.generateId() });
        
        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debug) {
            console.log(`EventBus: Subscribed to "${event}" (${listeners.length} total listeners)`);
        }

        // Return unsubscribe function
        return () => this.off(event, handler);
    }

    /**
     * Subscribe to an event (one time only)
     */
    once(event, handler, priority = 0) {
        const wrappedHandler = (...args) => {
            this.off(event, wrappedHandler);
            handler(...args);
        };

        const unsubscribe = this.on(event, wrappedHandler, priority);
        this.onceEvents.add(wrappedHandler);
        
        return unsubscribe;
    }

    /**
     * Unsubscribe from an event
     */
    off(event, handler = null) {
        if (!this.events.has(event)) {
            return false;
        }

        const listeners = this.events.get(event);

        if (handler === null) {
            // Remove all listeners for this event
            this.events.delete(event);
            if (this.debug) {
                console.log(`EventBus: Removed all listeners for "${event}"`);
            }
            return true;
        }

        const index = listeners.findIndex(listener => listener.handler === handler);
        if (index > -1) {
            listeners.splice(index, 1);
            
            if (listeners.length === 0) {
                this.events.delete(event);
            }
            
            this.onceEvents.delete(handler);
            
            if (this.debug) {
                console.log(`EventBus: Unsubscribed from "${event}" (${listeners.length} remaining)`);
            }
            
            return true;
        }

        return false;
    }

    /**
     * Emit an event
     */
    emit(event, data = null) {
        if (!this.events.has(event)) {
            if (this.debug) {
                console.log(`EventBus: No listeners for "${event}"`);
            }
            return false;
        }

        const listeners = this.events.get(event);
        const timestamp = Date.now();

        if (this.debug) {
            console.log(`EventBus: Emitting "${event}" to ${listeners.length} listeners`, data);
        }

        // Execute all listeners
        for (const listener of listeners) {
            try {
                listener.handler(data, { event, timestamp });
            } catch (error) {
                console.error(`EventBus: Error in listener for "${event}":`, error);
            }
        }

        return true;
    }

    /**
     * Emit an event asynchronously
     */
    async emitAsync(event, data = null) {
        if (!this.events.has(event)) {
            return false;
        }

        const listeners = this.events.get(event);
        const timestamp = Date.now();

        if (this.debug) {
            console.log(`EventBus: Emitting async "${event}" to ${listeners.length} listeners`, data);
        }

        // Execute all listeners in parallel
        const promises = listeners.map(listener => 
            Promise.resolve().then(() => 
                listener.handler(data, { event, timestamp })
            ).catch(error => {
                console.error(`EventBus: Error in async listener for "${event}":`, error);
            })
        );

        await Promise.all(promises);
        return true;
    }

    /**
     * Get all events and their listener counts
     */
    getEvents() {
        const events = {};
        for (const [event, listeners] of this.events) {
            events[event] = listeners.length;
        }
        return events;
    }

    /**
     * Check if event has listeners
     */
    hasListeners(event) {
        return this.events.has(event) && this.events.get(event).length > 0;
    }

    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Set maximum listeners per event
     */
    setMaxListeners(max) {
        this.maxListeners = max;
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        this.events.clear();
        this.onceEvents.clear();
        
        if (this.debug) {
            console.log('EventBus: Removed all listeners');
        }
    }

    /**
     * Generate unique ID for listeners
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create a namespaced event bus
     */
    namespace(prefix) {
        return {
            on: (event, handler, priority) => this.on(`${prefix}:${event}`, handler, priority),
            once: (event, handler, priority) => this.once(`${prefix}:${event}`, handler, priority),
            off: (event, handler) => this.off(`${prefix}:${event}`, handler),
            emit: (event, data) => this.emit(`${prefix}:${event}`, data),
            emitAsync: (event, data) => this.emitAsync(`${prefix}:${event}`, data)
        };
    }
}

export { EventBus };