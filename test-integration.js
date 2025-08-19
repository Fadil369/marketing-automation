#!/usr/bin/env node

/**
 * Integration Test for BrainSAIT Marketing Platform
 * Tests core functionality and integration points
 */

import BrainSAITApplication from './src/core/Application.js';
import { EventBus } from './src/core/EventBus.js';
import { StateManager } from './src/core/StateManager.js';

console.log('🧪 Starting BrainSAIT Integration Tests...\n');

async function runIntegrationTests() {
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Event Bus
    console.log('📡 Testing Event Bus...');
    try {
        const eventBus = new EventBus();
        let eventReceived = false;
        
        eventBus.on('test:event', () => {
            eventReceived = true;
        });
        
        eventBus.emit('test:event', { message: 'test' });
        
        if (eventReceived) {
            console.log('✅ Event Bus: PASSED');
            testsPassed++;
        } else {
            throw new Error('Event not received');
        }
    } catch (error) {
        console.log('❌ Event Bus: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 2: State Manager
    console.log('🏪 Testing State Manager...');
    try {
        const stateManager = new StateManager();
        
        stateManager.setState('test', { value: 'hello world' });
        const state = stateManager.getState('test');
        
        if (state && state.value === 'hello world') {
            console.log('✅ State Manager: PASSED');
            testsPassed++;
        } else {
            throw new Error('State not stored correctly');
        }
    } catch (error) {
        console.log('❌ State Manager: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 3: Application Initialization
    console.log('🚀 Testing Application Initialization...');
    try {
        // Mock DOM environment for testing
        global.document = {
            readyState: 'complete',
            addEventListener: () => {},
            querySelector: () => null,
            querySelectorAll: () => []
        };
        global.window = {
            location: { hostname: 'localhost' }
        };
        
        const app = new BrainSAITApplication();
        
        if (app.eventBus && app.stateManager && app.router) {
            console.log('✅ Application Initialization: PASSED');
            testsPassed++;
        } else {
            throw new Error('Application components not initialized');
        }
    } catch (error) {
        console.log('❌ Application Initialization: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 4: Environment Configuration
    console.log('⚙️ Testing Environment Configuration...');
    try {
        const { environmentConfig } = await import('./config/environment.js');
        
        const appName = environmentConfig.get('app.name');
        const version = environmentConfig.get('app.version');
        
        if (appName && version) {
            console.log('✅ Environment Configuration: PASSED');
            console.log(`   App: ${appName} v${version}`);
            testsPassed++;
        } else {
            throw new Error('Configuration not loaded');
        }
    } catch (error) {
        console.log('❌ Environment Configuration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 5: AI Service Manager (Mock Test)
    console.log('🤖 Testing AI Service Manager...');
    try {
        const { AIServiceManager } = await import('./src/services/AIServiceManager.js');
        
        const eventBus = new EventBus();
        const stateManager = new StateManager();
        const aiManager = new AIServiceManager(eventBus, stateManager);
        
        if (aiManager.providers && aiManager.templates) {
            console.log('✅ AI Service Manager: PASSED');
            testsPassed++;
        } else {
            throw new Error('AI Service Manager not initialized properly');
        }
    } catch (error) {
        console.log('❌ AI Service Manager: FAILED -', error.message);
        testsFailed++;
    }
    
    // Summary
    console.log('\n📊 Integration Test Results:');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All integration tests passed! Ready for deployment.');
        process.exit(0);
    } else {
        console.log('\n⚠️ Some tests failed. Review before deployment.');
        process.exit(1);
    }
}

// Run tests
runIntegrationTests().catch(error => {
    console.error('❌ Integration test suite failed:', error);
    process.exit(1);
});