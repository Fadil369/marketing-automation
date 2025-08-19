/**
 * Build Configuration for BrainSAIT Marketing Platform
 * Handles webpack, rollup, and deployment configurations
 */

import { environmentConfig } from './config/environment.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base build configuration
 */
export const buildConfig = {
    // Source and output directories
    paths: {
        src: path.resolve(__dirname, 'src'),
        dist: path.resolve(__dirname, 'dist'),
        public: path.resolve(__dirname, 'public'),
        assets: path.resolve(__dirname, 'src/assets'),
        config: path.resolve(__dirname, 'config'),
        workers: path.resolve(__dirname, 'workers'),
        functions: path.resolve(__dirname, 'functions')
    },

    // Entry points
    entry: {
        main: './src/core/Application.js',
        worker: './sw.js',
        config: './config/environment.js'
    },

    // Output configuration
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: environmentConfig.isProduction() 
            ? '[name].[contenthash:8].js' 
            : '[name].js',
        chunkFilename: environmentConfig.isProduction() 
            ? '[name].[contenthash:8].chunk.js' 
            : '[name].chunk.js',
        assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
        publicPath: environmentConfig.isProduction() ? '/dist/' : '/',
        clean: true
    },

    // Module resolution
    resolve: {
        extensions: ['.js', '.mjs', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@core': path.resolve(__dirname, 'src/core'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@config': path.resolve(__dirname, 'config')
        }
    },

    // Development server
    devServer: {
        port: 3000,
        host: 'localhost',
        hot: true,
        liveReload: true,
        open: true,
        historyApiFallback: true,
        static: {
            directory: path.resolve(__dirname, 'public'),
            publicPath: '/'
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            },
            '/ws': {
                target: 'ws://localhost:3001',
                ws: true,
                changeOrigin: true
            }
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
        }
    },

    // Optimization settings
    optimization: {
        minimize: environmentConfig.isProduction(),
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    enforce: true
                },
                core: {
                    test: /[\\/]src[\\/]core[\\/]/,
                    name: 'core',
                    priority: 5,
                    enforce: true
                },
                services: {
                    test: /[\\/]src[\\/]services[\\/]/,
                    name: 'services',
                    priority: 5,
                    enforce: true
                },
                components: {
                    test: /[\\/]src[\\/]components[\\/]/,
                    name: 'components',
                    priority: 5,
                    enforce: true
                }
            }
        },
        runtimeChunk: 'single',
        moduleIds: 'deterministic'
    },

    // Module rules
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['> 1%', 'last 2 versions']
                                },
                                modules: false,
                                useBuiltIns: 'usage',
                                corejs: 3
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-syntax-dynamic-import',
                            '@babel/plugin-transform-class-properties'
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    environmentConfig.isProduction() ? 'style-loader' : 'style-loader',
                    'css-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[contenthash:8][ext]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[contenthash:8][ext]'
                }
            },
            {
                test: /\.json$/,
                type: 'asset/resource',
                generator: {
                    filename: 'data/[name].[contenthash:8][ext]'
                }
            }
        ]
    },

    // Plugins configuration
    plugins: getPlugins(),

    // Performance settings
    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000,
        hints: environmentConfig.isProduction() ? 'warning' : false
    },

    // Source maps
    devtool: environmentConfig.isDevelopment() 
        ? 'eval-source-map' 
        : environmentConfig.isProduction() 
            ? 'source-map' 
            : 'cheap-module-source-map',

    // Target environment
    target: 'web',

    // Mode
    mode: environmentConfig.isProduction() ? 'production' : 'development',

    // Stats
    stats: {
        errorDetails: true,
        warnings: true,
        modules: false,
        chunks: false,
        assets: environmentConfig.isDevelopment()
    }
};

/**
 * Get plugins based on environment
 */
function getPlugins() {
    const plugins = [];

    // HTML webpack plugin for generating HTML files
    if (typeof HTMLWebpackPlugin !== 'undefined') {
        plugins.push(new HTMLWebpackPlugin({
            template: './index-new.html',
            filename: 'index.html',
            inject: 'body',
            minify: environmentConfig.isProduction() ? {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
            } : false
        }));
    }

    // Define plugin for environment variables
    if (typeof DefinePlugin !== 'undefined') {
        plugins.push(new DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(environmentConfig.getEnvironment()),
            'process.env.APP_VERSION': JSON.stringify(environmentConfig.get('app.version')),
            '__DEV__': JSON.stringify(environmentConfig.isDevelopment()),
            '__PROD__': JSON.stringify(environmentConfig.isProduction())
        }));
    }

    // Copy webpack plugin for static assets
    if (typeof CopyWebpackPlugin !== 'undefined') {
        plugins.push(new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'manifest.json',
                    to: 'manifest.json'
                },
                {
                    from: 'sw.js',
                    to: 'sw.js'
                },
                {
                    from: 'public/icons',
                    to: 'icons',
                    noErrorOnMissing: true
                },
                {
                    from: 'public/screenshots',
                    to: 'screenshots',
                    noErrorOnMissing: true
                }
            ]
        }));
    }

    // Production-only plugins
    if (environmentConfig.isProduction()) {
        // Workbox for service worker
        if (typeof WorkboxPlugin !== 'undefined') {
            plugins.push(new WorkboxPlugin.GenerateSW({
                clientsClaim: true,
                skipWaiting: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\.brainsait\.com/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 300 // 5 minutes
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 86400 // 24 hours
                            }
                        }
                    }
                ]
            }));
        }

        // Bundle analyzer
        if (typeof BundleAnalyzerPlugin !== 'undefined' && process.env.ANALYZE) {
            plugins.push(new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: 'bundle-report.html'
            }));
        }
    }

    return plugins;
}

/**
 * Rollup configuration for ES modules
 */
export const rollupConfig = {
    input: {
        main: 'src/core/Application.js',
        services: 'src/services/index.js',
        components: 'src/components/index.js'
    },
    output: [
        {
            dir: 'dist/esm',
            format: 'es',
            entryFileNames: '[name].js',
            chunkFileNames: '[name]-[hash].js',
            sourcemap: true
        },
        {
            dir: 'dist/cjs',
            format: 'cjs',
            entryFileNames: '[name].cjs',
            chunkFileNames: '[name]-[hash].cjs',
            sourcemap: true
        }
    ],
    external: [
        'openai',
        'anthropic',
        'ws',
        'node-fetch'
    ],
    plugins: [
        // Rollup plugins would go here
    ]
};

/**
 * PostCSS configuration
 */
export const postcssConfig = {
    plugins: [
        require('autoprefixer')({
            overrideBrowserslist: ['> 1%', 'last 2 versions']
        }),
        require('cssnano')({
            preset: ['default', {
                discardComments: {
                    removeAll: true
                }
            }]
        })
    ]
};

/**
 * Babel configuration
 */
export const babelConfig = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                browsers: ['> 1%', 'last 2 versions']
            },
            modules: false,
            useBuiltIns: 'usage',
            corejs: 3
        }]
    ],
    plugins: [
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator'
    ]
};

/**
 * ESLint configuration
 */
export const eslintConfig = {
    extends: [
        'eslint:recommended',
        '@babel/eslint-parser'
    ],
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        requireConfigFile: false
    },
    env: {
        browser: true,
        es2022: true,
        node: true,
        worker: true
    },
    rules: {
        'no-console': environmentConfig.isProduction() ? 'warn' : 'off',
        'no-debugger': environmentConfig.isProduction() ? 'error' : 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prefer-const': 'error',
        'no-var': 'error'
    }
};

/**
 * Jest configuration for testing
 */
export const jestConfig = {
    testEnvironment: 'jsdom',
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/src/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/core/Application.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html']
};

export default buildConfig;