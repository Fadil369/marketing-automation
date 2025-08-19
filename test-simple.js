#!/usr/bin/env node

/**
 * Simple Integration Test for BrainSAIT Marketing Platform
 * Tests core module functionality in Node.js environment
 */

console.log('🧪 Starting BrainSAIT Simple Integration Tests...\n');

async function runSimpleTests() {
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Event Bus Module
    console.log('📡 Testing Event Bus Module...');
    try {
        const { EventBus } = await import('./src/core/EventBus.js');
        
        const eventBus = new EventBus();
        let eventReceived = false;
        
        eventBus.on('test:event', () => {
            eventReceived = true;
        });
        
        eventBus.emit('test:event', { message: 'test' });
        
        if (eventReceived) {
            console.log('✅ Event Bus Module: PASSED');
            testsPassed++;
        } else {
            throw new Error('Event not received');
        }
    } catch (error) {
        console.log('❌ Event Bus Module: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 2: State Manager Module
    console.log('🏪 Testing State Manager Module...');
    try {
        const { StateManager } = await import('./src/core/StateManager.js');
        
        const stateManager = new StateManager();
        
        stateManager.setState('test', { value: 'hello world' });
        const state = stateManager.getState('test');
        
        if (state && state.value === 'hello world') {
            console.log('✅ State Manager Module: PASSED');
            testsPassed++;
        } else {
            throw new Error('State not stored correctly');
        }
    } catch (error) {
        console.log('❌ State Manager Module: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 3: Environment Configuration
    console.log('⚙️ Testing Environment Configuration...');
    try {
        const { environmentConfig } = await import('./config/environment.js');
        
        const appName = environmentConfig.get('app.name');
        const version = environmentConfig.get('app.version');
        const environment = environmentConfig.getEnvironment();
        
        if (appName && version && environment) {
            console.log('✅ Environment Configuration: PASSED');
            console.log(`   App: ${appName} v${version} (${environment})`);
            testsPassed++;
        } else {
            throw new Error('Configuration not loaded properly');
        }
    } catch (error) {
        console.log('❌ Environment Configuration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 4: Build Artifacts
    console.log('📦 Testing Build Artifacts...');
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        const distPath = './dist';
        const requiredFiles = ['index.html', 'manifest.json', 'sw.js'];
        
        for (const file of requiredFiles) {
            const filePath = path.resolve(distPath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required build file missing: ${file}`);
            }
        }
        
        // Check if JS files exist
        const jsDir = path.resolve(distPath, 'js');
        if (!fs.existsSync(jsDir)) {
            throw new Error('JavaScript build directory missing');
        }
        
        const jsFiles = fs.readdirSync(jsDir);
        if (jsFiles.length === 0) {
            throw new Error('No JavaScript files built');
        }
        
        console.log('✅ Build Artifacts: PASSED');
        console.log(`   Found ${jsFiles.length} JavaScript files in build`);
        testsPassed++;
    } catch (error) {
        console.log('❌ Build Artifacts: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 5: Package Configuration
    console.log('📄 Testing Package Configuration...');
    try {
        const fs = await import('fs');
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        
        if (packageJson.name && packageJson.version && packageJson.scripts) {
            console.log('✅ Package Configuration: PASSED');
            console.log(`   Package: ${packageJson.name} v${packageJson.version}`);
            console.log(`   Scripts: ${Object.keys(packageJson.scripts).length} available`);
            testsPassed++;
        } else {
            throw new Error('Package.json incomplete');
        }
    } catch (error) {
        console.log('❌ Package Configuration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Test 6: Webpack Configuration
    console.log('🔧 Testing Webpack Configuration...');
    try {
        const fs = await import('fs');
        
        if (fs.existsSync('./webpack.config.cjs')) {
            console.log('✅ Webpack Configuration: PASSED');
            testsPassed++;
        } else {
            throw new Error('Webpack config file missing');
        }
    } catch (error) {
        console.log('❌ Webpack Configuration: FAILED -', error.message);
        testsFailed++;
    }
    
    // Summary
    console.log('\n📊 Integration Test Results:');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All integration tests passed! Platform is ready for deployment.');
        console.log('\n🚀 Next Steps:');
        console.log('1. Set up Cloudflare environment variables');
        console.log('2. Run: npm run deploy:staging');
        console.log('3. Test staging deployment');
        console.log('4. Run: npm run deploy:production');
        
        process.exit(0);
    } else {
        console.log('\n⚠️ Some tests failed. Please review and fix issues before deployment.');
        process.exit(1);
    }
}

// Run tests
runSimpleTests().catch(error => {
    console.error('❌ Integration test suite failed:', error);
    process.exit(1);
});