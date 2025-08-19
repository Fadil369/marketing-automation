/**
 * Unit Tests - Core Application
 * Testing the main application initialization and core functionality
 * 
 * @author BrainSAIT Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '../../src/core/app/Application.js';
import { ServiceContainer } from '../../src/core/app/ServiceContainer.js';
import { EventBus } from '../../src/core/app/EventBus.js';
import { StateManager } from '../../src/core/state/StateManager.js';

// Mock external dependencies
vi.mock('../../src/services/ai/AIServiceManager.js');
vi.mock('../../src/services/platforms/PlatformManager.js');
vi.mock('../../src/services/analytics/AnalyticsEngine.js');

describe('Application', () => {
    let app;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            environment: 'test',
            debug: false,
            apiBaseUrl: 'https://test-api.brainsait.io',
            defaultLanguage: 'en',
            enableRealTime: false,
            performanceMonitoring: false
        };

        app = new Application(mockConfig);
    });

    afterEach(() => {
        if (app) {
            app.destroy();
        }
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            const defaultApp = new Application();
            expect(defaultApp.config.environment).toBe('development');
            expect(defaultApp.config.debug).toBe(true);
            expect(defaultApp.isInitialized).toBe(false);
        });

        it('should merge custom configuration with defaults', () => {
            expect(app.config.environment).toBe('test');
            expect(app.config.debug).toBe(false);
            expect(app.config.defaultLanguage).toBe('en');
        });

        it('should initialize core components', () => {
            expect(app.services).toBeInstanceOf(ServiceContainer);
            expect(app.eventBus).toBeInstanceOf(EventBus);
            expect(app.stateManager).toBeInstanceOf(StateManager);
        });
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const initSpy = vi.spyOn(app, 'initializeServices').mockResolvedValue();
            const routingSpy = vi.spyOn(app, 'setupRouting').mockResolvedValue();
            const stateSpy = vi.spyOn(app, 'initializeState').mockResolvedValue();

            await app.initialize();

            expect(app.isInitialized).toBe(true);
            expect(initSpy).toHaveBeenCalled();
            expect(routingSpy).toHaveBeenCalled();
            expect(stateSpy).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            const error = new Error('Initialization failed');
            vi.spyOn(app, 'initializeServices').mockRejectedValue(error);
            vi.spyOn(app.errorHandler, 'handleError');

            await expect(app.initialize()).rejects.toThrow('Initialization failed');
            expect(app.errorHandler.handleError).toHaveBeenCalledWith(error, 'Application initialization failed');
        });

        it('should emit initialization event on success', async () => {
            const emitSpy = vi.spyOn(app.eventBus, 'emit');
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();

            await app.initialize();

            expect(emitSpy).toHaveBeenCalledWith('app:initialized', expect.any(Object));
        });
    });

    describe('Service Management', () => {
        beforeEach(async () => {
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();
            await app.initialize();
        });

        it('should get service instance', () => {
            const mockService = { name: 'test-service' };
            app.services.register('test', mockService);

            const service = app.getService('test');
            expect(service).toBe(mockService);
        });

        it('should throw error for non-existent service', () => {
            expect(() => app.getService('non-existent')).toThrow('Service "non-existent" not found');
        });
    });

    describe('State Management', () => {
        beforeEach(async () => {
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();
            await app.initialize();
        });

        it('should get state', () => {
            app.stateManager.updateState(['test'], { value: 'test-data' });
            const state = app.getState(['test']);
            expect(state).toEqual({ value: 'test-data' });
        });

        it('should update state', () => {
            app.updateState(['test'], { value: 'updated-data' });
            const state = app.getState(['test']);
            expect(state).toEqual({ value: 'updated-data' });
        });
    });

    describe('Event System', () => {
        it('should emit events', () => {
            const emitSpy = vi.spyOn(app.eventBus, 'emit');
            app.emit('test-event', { data: 'test' });
            expect(emitSpy).toHaveBeenCalledWith('test-event', { data: 'test' });
        });

        it('should listen to events', () => {
            const handler = vi.fn();
            app.on('test-event', handler);
            app.emit('test-event', { data: 'test' });
            expect(handler).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object));
        });
    });

    describe('User Authentication', () => {
        beforeEach(async () => {
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();
            await app.initialize();
        });

        it('should handle user login', async () => {
            const userData = { id: 'user123', email: 'test@brainsait.io' };
            const updateStateSpy = vi.spyOn(app, 'updateState');
            const emitSpy = vi.spyOn(app, 'emit');

            await app.handleUserLogin(userData);

            expect(updateStateSpy).toHaveBeenCalledWith(['user'], {
                isAuthenticated: true,
                profile: userData
            });
            expect(emitSpy).toHaveBeenCalledWith('app:user-ready', userData);
        });

        it('should handle user logout', async () => {
            const updateStateSpy = vi.spyOn(app, 'updateState');
            const navigateSpy = vi.spyOn(app.router, 'navigate').mockImplementation(() => {});

            await app.handleUserLogout();

            expect(updateStateSpy).toHaveBeenCalledWith(['user'], {
                isAuthenticated: false,
                profile: null
            });
            expect(navigateSpy).toHaveBeenCalledWith('/');
        });
    });

    describe('Language Management', () => {
        beforeEach(async () => {
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();
            await app.initialize();
        });

        it('should handle language change', async () => {
            const setLanguageSpy = vi.spyOn(app.i18n, 'setLanguage').mockResolvedValue();
            const updateStateSpy = vi.spyOn(app, 'updateState');
            const emitSpy = vi.spyOn(app, 'emit');

            await app.handleLanguageChange('ar');

            expect(setLanguageSpy).toHaveBeenCalledWith('ar');
            expect(updateStateSpy).toHaveBeenCalledWith(['user', 'preferences', 'language'], 'ar');
            expect(emitSpy).toHaveBeenCalledWith('ui:language-changed', 'ar');
        });
    });

    describe('Navigation', () => {
        it('should navigate to route', () => {
            const navigateSpy = vi.spyOn(app.router, 'navigate').mockImplementation(() => {});
            app.navigate('/campaigns', { id: '123' });
            expect(navigateSpy).toHaveBeenCalledWith('/campaigns', { id: '123' });
        });
    });

    describe('Cleanup', () => {
        it('should destroy cleanly', async () => {
            vi.spyOn(app, 'initializeServices').mockResolvedValue();
            vi.spyOn(app, 'setupRouting').mockResolvedValue();
            vi.spyOn(app, 'initializeState').mockResolvedValue();
            
            await app.initialize();
            
            const stateDestroySpy = vi.spyOn(app.stateManager, 'destroy');
            const routerDestroySpy = vi.spyOn(app.router, 'destroy');
            const eventBusDestroySpy = vi.spyOn(app.eventBus, 'removeAllListeners');

            await app.destroy();

            expect(stateDestroySpy).toHaveBeenCalled();
            expect(routerDestroySpy).toHaveBeenCalled();
            expect(eventBusDestroySpy).toHaveBeenCalled();
        });
    });
});

// Test ServiceContainer
describe('ServiceContainer', () => {
    let container;

    beforeEach(() => {
        container = new ServiceContainer();
    });

    afterEach(() => {
        container.clear();
    });

    describe('Service Registration', () => {
        it('should register and retrieve services', () => {
            const service = { name: 'test-service' };
            container.register('test', service);
            
            expect(container.get('test')).toBe(service);
            expect(container.has('test')).toBe(true);
        });

        it('should register service factories', () => {
            const factory = vi.fn(() => ({ name: 'factory-service' }));
            container.factory('test', factory);
            
            const service = container.get('test');
            expect(factory).toHaveBeenCalled();
            expect(service.name).toBe('factory-service');
        });

        it('should handle singletons', () => {
            const factory = vi.fn(() => ({ name: 'singleton-service' }));
            container.factory('singleton', factory, { singleton: true });
            
            const service1 = container.get('singleton');
            const service2 = container.get('singleton');
            
            expect(service1).toBe(service2);
            expect(factory).toHaveBeenCalledTimes(1);
        });

        it('should resolve dependencies', () => {
            const depService = { name: 'dependency' };
            const factory = vi.fn((deps) => ({ deps }));
            
            container.register('dep', depService);
            container.factory('test', factory, { dependencies: ['dep'] });
            
            const service = container.get('test');
            expect(service.deps.dep).toBe(depService);
        });
    });

    describe('Error Handling', () => {
        it('should throw error for non-existent service', () => {
            expect(() => container.get('non-existent')).toThrow('Service "non-existent" not found');
        });
    });

    describe('Service Management', () => {
        it('should remove services', () => {
            const service = { name: 'test-service' };
            container.register('test', service);
            
            expect(container.has('test')).toBe(true);
            container.remove('test');
            expect(container.has('test')).toBe(false);
        });

        it('should clear all services', () => {
            container.register('test1', {});
            container.register('test2', {});
            
            expect(container.has('test1')).toBe(true);
            expect(container.has('test2')).toBe(true);
            
            container.clear();
            
            expect(container.has('test1')).toBe(false);
            expect(container.has('test2')).toBe(false);
        });
    });
});

// Test EventBus
describe('EventBus', () => {
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    afterEach(() => {
        eventBus.removeAllListeners();
    });

    describe('Event Subscription', () => {
        it('should subscribe and emit events', () => {
            const handler = vi.fn();
            eventBus.on('test-event', handler);
            eventBus.emit('test-event', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object));
        });

        it('should handle once events', () => {
            const handler = vi.fn();
            eventBus.once('test-event', handler);
            
            eventBus.emit('test-event', { data: 'test1' });
            eventBus.emit('test-event', { data: 'test2' });
            
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ data: 'test1' }, expect.any(Object));
        });

        it('should support priority ordering', () => {
            const calls = [];
            const handler1 = vi.fn(() => calls.push('handler1'));
            const handler2 = vi.fn(() => calls.push('handler2'));
            
            eventBus.on('test-event', handler1, 1);
            eventBus.on('test-event', handler2, 2);
            
            eventBus.emit('test-event');
            
            expect(calls).toEqual(['handler2', 'handler1']);
        });

        it('should unsubscribe events', () => {
            const handler = vi.fn();
            const unsubscribe = eventBus.on('test-event', handler);
            
            unsubscribe();
            eventBus.emit('test-event', { data: 'test' });
            
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Event Management', () => {
        it('should return listener count', () => {
            eventBus.on('test-event', () => {});
            eventBus.on('test-event', () => {});
            
            expect(eventBus.listenerCount('test-event')).toBe(2);
        });

        it('should check for listeners', () => {
            expect(eventBus.hasListeners('test-event')).toBe(false);
            eventBus.on('test-event', () => {});
            expect(eventBus.hasListeners('test-event')).toBe(true);
        });

        it('should handle async events', async () => {
            const handler = vi.fn().mockResolvedValue();
            eventBus.on('async-event', handler);
            
            await eventBus.emitAsync('async-event', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object));
        });
    });

    describe('Namespacing', () => {
        it('should create namespaced event bus', () => {
            const handler = vi.fn();
            const namespaced = eventBus.namespace('test');
            
            namespaced.on('event', handler);
            eventBus.emit('test:event', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object));
        });
    });

    describe('Error Handling', () => {
        it('should handle handler errors gracefully', () => {
            const errorHandler = vi.fn(() => { throw new Error('Handler error'); });
            const normalHandler = vi.fn();
            
            eventBus.on('test-event', errorHandler);
            eventBus.on('test-event', normalHandler);
            
            expect(() => eventBus.emit('test-event')).not.toThrow();
            expect(normalHandler).toHaveBeenCalled();
        });
    });
});