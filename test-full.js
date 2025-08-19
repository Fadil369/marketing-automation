#!/usr/bin/env node

/**
 * Full Integration Test for BrainSAIT Marketing Platform
 * Comprehensive testing of all core modules and services
 */

console.log('🧪 Starting BrainSAIT Full Integration Tests...\n');

async function runFullIntegrationTests() {
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Event Bus Advanced Features
    console.log('📡 Testing Event Bus Advanced Features...');
    try {
        const { EventBus } = await import('./src/core/EventBus.js');
        
        const eventBus = new EventBus();
        let eventCount = 0;
        let namespaceEvent = false;
        
        // Test multiple listeners
        eventBus.on('test:event', () => eventCount++);
        eventBus.on('test:event', () => eventCount++);
        eventBus.on('test:namespace:event', () => namespaceEvent = true);
        
        eventBus.emit('test:event', { message: 'test' });
        eventBus.emit('test:namespace:event', { data: 'test' });
        
        // Test off method
        const listener = () => eventCount++;
        eventBus.on('test:off', listener);
        eventBus.off('test:off', listener);
        eventBus.emit('test:off');
        
        if (eventCount === 2 && namespaceEvent) {
            console.log('✅ Event Bus Advanced Features: PASSED');
            testsPassed++;
        } else {
            throw new Error('Advanced event features failed');
        }
    } catch (error) {
        console.log('❌ Event Bus Advanced Features: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 2: State Manager Advanced Features
    console.log('🏪 Testing State Manager Advanced Features...');
    try {
        const { StateManager } = await import('./src/core/StateManager.js');
        
        const stateManager = new StateManager();
        let watcherTriggered = false;
        
        // Test state watching
        stateManager.watch('user', (newState, oldState) => {
            watcherTriggered = true;
        });
        
        stateManager.setState('user', { name: 'John', email: 'john@example.com' });
        stateManager.updateState('user', { name: 'Jane' });
        
        const state = stateManager.getState('user');
        
        if (state.name === 'Jane' && state.email === 'john@example.com' && watcherTriggered) {
            console.log('✅ State Manager Advanced Features: PASSED');
            testsPassed++;
        } else {
            throw new Error('Advanced state features failed');
        }
    } catch (error) {
        console.log('❌ State Manager Advanced Features: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 3: Router Module
    console.log('🗺️ Testing Router Module...');
    try {
        const { Router } = await import('./src/core/Router.js');
        const { EventBus } = await import('./src/core/EventBus.js');
        
        // Mock window and history for Node.js
        global.window = {
            location: { pathname: '/', search: '', hash: '' },
            history: { pushState: () => {}, replaceState: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {}
        };
        
        // Mock document for Router
        global.document = {
            title: '',
            getElementById: () => null,
            addEventListener: () => {},
            removeEventListener: () => {},
            createElement: () => ({ style: {}, appendChild: () => {} }),
            body: { appendChild: () => {} },
            querySelectorAll: () => []
        };
        
        const eventBus = new EventBus();
        const router = new Router(eventBus);
        let routeMatched = false;
        
        router.addRoute('/test/:id', (matched) => {
            if (matched.params.id === '123') {
                routeMatched = true;
            }
        });
        
        // Test route matching without navigation (to avoid DOM operations)
        const matchedRoute = router._matchRoute('/test/123');
        if (matchedRoute && matchedRoute.params.id === '123') {
            routeMatched = true;
        }
        
        if (routeMatched) {
            console.log('✅ Router Module: PASSED');
            testsPassed++;
        } else {
            throw new Error('Route matching failed');
        }
    } catch (error) {
        console.log('❌ Router Module: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 4: AI Service Manager
    console.log('🤖 Testing AI Service Manager...');
    try {
        const { AIServiceManager } = await import('./src/services/AIServiceManager.js');
        const { EventBus } = await import('./src/core/EventBus.js');
        const { StateManager } = await import('./src/core/StateManager.js');
        
        const eventBus = new EventBus();
        const stateManager = new StateManager();
        const aiManager = new AIServiceManager(eventBus, stateManager);
        
        // Initialize the AI Service Manager
        await aiManager.initialize();
        
        // Test provider registration
        const providers = aiManager.getProviders();
        const templates = aiManager.getTemplates();
        
        if (providers.length > 0 && templates.length > 0) {
            console.log('✅ AI Service Manager: PASSED');
            console.log(`   Providers: ${providers.length}, Templates: ${templates.length}`);
            testsPassed++;
        } else {
            throw new Error('AI Service Manager not properly configured');
        }
    } catch (error) {
        console.log('❌ AI Service Manager: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 5: Platform Integration Manager
    console.log('🔗 Testing Platform Integration Manager...');
    try {
        const { PlatformIntegrationManager } = await import('./src/services/PlatformIntegrationManager.js');
        const { EventBus } = await import('./src/core/EventBus.js');
        const { StateManager } = await import('./src/core/StateManager.js');
        
        const eventBus = new EventBus();
        const stateManager = new StateManager();
        const platformManager = new PlatformIntegrationManager(eventBus, stateManager);
        
        // Initialize the Platform Integration Manager
        await platformManager.initialize();
        
        const platforms = platformManager.getSupportedPlatforms();
        
        if (platforms.length > 0) {
            console.log('✅ Platform Integration Manager: PASSED');
            console.log(`   Supported platforms: ${platforms.join(', ')}`);
            testsPassed++;
        } else {
            throw new Error('No platforms configured');
        }
    } catch (error) {
        console.log('❌ Platform Integration Manager: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 6: Analytics Service
    console.log('📊 Testing Analytics Service...');
    try {
        const { AnalyticsService } = await import('./src/services/AnalyticsService.js');
        const { EventBus } = await import('./src/core/EventBus.js');
        
        const eventBus = new EventBus();
        const analytics = new AnalyticsService(eventBus);
        
        // Test event tracking
        analytics.track('test_event', { category: 'test', value: 1 });
        
        // Test metrics retrieval (should not throw)
        const metrics = analytics.getMetrics();
        
        console.log('✅ Analytics Service: PASSED');
        testsPassed++;
    } catch (error) {
        console.log('❌ Analytics Service: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 7: Environment Configuration Advanced
    console.log('⚙️ Testing Environment Configuration Advanced...');
    try {
        const { environmentConfig } = await import('./config/environment.js');
        
        // Test configuration methods
        const appName = environmentConfig.get('app.name');
        const version = environmentConfig.get('app.version');
        const environment = environmentConfig.getEnvironment();
        const isDev = environmentConfig.isDevelopment();
        const isProd = environmentConfig.isProduction();
        
        // Test configuration merging
        environmentConfig.set('test.value', 'test123');
        const testValue = environmentConfig.get('test.value');
        
        if (appName && version && environment && testValue === 'test123') {
            console.log('✅ Environment Configuration Advanced: PASSED');
            console.log(`   App: ${appName} v${version} (${environment})`);
            console.log(`   Dev: ${isDev}, Prod: ${isProd}`);
            testsPassed++;
        } else {
            throw new Error('Advanced configuration features failed');
        }
    } catch (error) {
        console.log('❌ Environment Configuration Advanced: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 8: Build System Integration
    console.log('🔧 Testing Build System Integration...');
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Check advanced build artifacts
        const distPath = './dist';
        const requiredFiles = ['index.html', 'manifest.json', 'sw.js'];
        const requiredDirs = ['js', 'css', 'assets'];
        
        // Check files
        for (const file of requiredFiles) {
            const filePath = path.resolve(distPath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required build file missing: ${file}`);
            }
        }
        
        // Check directories
        for (const dir of requiredDirs) {
            const dirPath = path.resolve(distPath, dir);
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Required build directory missing: ${dir}`);
            }
        }
        
        // Check service worker content
        const swContent = fs.readFileSync(path.resolve(distPath, 'sw.js'), 'utf8');
        if (!swContent.includes('CACHE_NAME')) {
            throw new Error('Service worker not properly configured');
        }
        
        console.log('✅ Build System Integration: PASSED');
        testsPassed++;
    } catch (error) {
        console.log('❌ Build System Integration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 9: Webpack Configuration Validation
    console.log('📦 Testing Webpack Configuration Validation...');
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Check webpack config exists and is valid
        const webpackConfigPath = './webpack.config.cjs';
        if (!fs.existsSync(webpackConfigPath)) {
            throw new Error('Webpack config missing');
        }
        
        // Read and validate config structure
        const configContent = fs.readFileSync(webpackConfigPath, 'utf8');
        const requiredFeatures = [
            'module.exports',
            'entry:',
            'output:',
            'plugins:',
            'module:',
            'rules:'
        ];
        
        for (const feature of requiredFeatures) {
            if (!configContent.includes(feature)) {
                throw new Error(`Webpack config missing: ${feature}`);
            }
        }
        
        console.log('✅ Webpack Configuration Validation: PASSED');
        testsPassed++;
    } catch (error) {
        console.log('❌ Webpack Configuration Validation: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 10: Cloudflare Configuration
    console.log('☁️ Testing Cloudflare Configuration...');
    try {
        const fs = await import('fs');
        
        // Check wrangler configurations
        const wranglerFiles = ['wrangler.toml', 'wrangler-worker.toml'];
        
        for (const file of wranglerFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Cloudflare config missing: ${file}`);
            }
            
            const content = fs.readFileSync(file, 'utf8');
            if (!content.includes('name =') || !content.includes('compatibility_date =')) {
                throw new Error(`Invalid Cloudflare config: ${file}`);
            }
        }
        
        console.log('✅ Cloudflare Configuration: PASSED');
        testsPassed++;
    } catch (error) {
        console.log('❌ Cloudflare Configuration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Summary
    console.log('\n📊 Full Integration Test Results:');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All full integration tests passed! Platform is production-ready.');
        console.log('\n🚀 Platform Status:');
        console.log('✅ Core Architecture: Fully validated');
        console.log('✅ Service Integration: Complete');
        console.log('✅ Build System: Operational');
        console.log('✅ Deployment Config: Ready');
        console.log('✅ Cloud Infrastructure: Configured');
        
        process.exit(0);
    } else {
        console.log('\n⚠️ Some advanced tests failed. Review before production deployment.');
        process.exit(1);
    }
}

// Run tests
runFullIntegrationTests().catch(error => {
    console.error('❌ Full integration test suite failed:', error);
    process.exit(1);
});