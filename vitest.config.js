/**
 * Vitest Configuration - Unit Testing Setup
 * 
 * @author BrainSAIT Team
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Test files patterns
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
    exclude: ['node_modules', 'dist', 'build'],
    
    // Global test setup
    globals: true,
    setupFiles: ['tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/index.js',
        'scripts/',
        'docs/',
        'coverage/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html'
    },
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Watch mode
    watch: false,
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@config': resolve(__dirname, './src/config'),
      '@tests': resolve(__dirname, './tests')
    }
  },
  
  // Define configuration for different environments
  define: {
    __DEV__: true,
    __TEST__: true,
    __PROD__: false
  },
  
  // Server configuration for testing
  server: {
    deps: {
      inline: ['vitest-canvas-mock']
    }
  }
});