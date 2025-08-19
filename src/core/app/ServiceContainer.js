/**
 * Service Container - Dependency Injection Container
 * Manages service lifecycle and dependencies
 * 
 * @author BrainSAIT Team
 */

class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.factories = new Map();
        this.singletons = new Set();
        this.dependencies = new Map();
    }

    /**
     * Register a service instance
     */
    register(name, service, options = {}) {
        if (options.singleton !== false) {
            this.singletons.add(name);
        }
        
        if (options.dependencies) {
            this.dependencies.set(name, options.dependencies);
        }

        this.services.set(name, service);
        return this;
    }

    /**
     * Register a service factory
     */
    factory(name, factory, options = {}) {
        this.factories.set(name, factory);
        
        if (options.singleton !== false) {
            this.singletons.add(name);
        }
        
        if (options.dependencies) {
            this.dependencies.set(name, options.dependencies);
        }
        
        return this;
    }

    /**
     * Get service instance
     */
    get(name) {
        // Return existing instance if singleton
        if (this.singletons.has(name) && this.services.has(name)) {
            return this.services.get(name);
        }

        // Create from factory
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const dependencies = this.resolveDependencies(name);
            const service = factory(dependencies);
            
            if (this.singletons.has(name)) {
                this.services.set(name, service);
            }
            
            return service;
        }

        // Return registered service
        if (this.services.has(name)) {
            return this.services.get(name);
        }

        throw new Error(`Service "${name}" not found`);
    }

    /**
     * Resolve service dependencies
     */
    resolveDependencies(name) {
        const deps = this.dependencies.get(name);
        if (!deps) {return {};}

        const resolved = {};
        for (const dep of deps) {
            resolved[dep] = this.get(dep);
        }
        
        return resolved;
    }

    /**
     * Check if service is registered
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }

    /**
     * Remove service
     */
    remove(name) {
        this.services.delete(name);
        this.factories.delete(name);
        this.singletons.delete(name);
        this.dependencies.delete(name);
    }

    /**
     * Clear all services
     */
    clear() {
        this.services.clear();
        this.factories.clear();
        this.singletons.clear();
        this.dependencies.clear();
    }
}

export { ServiceContainer };