/**
 * Webpack Development Configuration
 * Optimized for development with fast rebuilds and hot reloading
 */

import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from './build.config.js';
import { environmentConfig } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(buildConfig, {
    mode: 'development',
    
    // Entry points for development
    entry: {
        main: {
            import: './src/core/Application.js',
            dependOn: 'shared'
        },
        vendor: {
            import: ['chart.js', 'date-fns', 'uuid'],
            dependOn: 'shared'
        },
        shared: ['lodash-es']
    },

    // Development server configuration
    devServer: {
        ...buildConfig.devServer,
        hot: true,
        liveReload: true,
        watchFiles: [
            'src/**/*.js',
            'src/**/*.css',
            'src/**/*.html',
            'config/**/*.js',
            'manifest.json',
            'sw.js'
        ],
        devMiddleware: {
            stats: 'minimal'
        },
        client: {
            logging: 'info',
            overlay: {
                errors: true,
                warnings: false
            },
            progress: true
        }
    },

    // Source maps for debugging
    devtool: 'eval-cheap-module-source-map',

    // Optimization for development
    optimization: {
        ...buildConfig.optimization,
        minimize: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                default: false,
                vendor: {
                    name: 'vendor',
                    chunks: 'all',
                    test: /node_modules/,
                    priority: 20
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    priority: 10,
                    reuseExistingChunk: true,
                    enforce: true
                }
            }
        }
    },

    // Module configuration for development
    module: {
        rules: [
            ...buildConfig.module.rules,
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: /node_modules/
            }
        ]
    },

    // Development-specific plugins
    plugins: [
        ...buildConfig.plugins,
        
        // Hot Module Replacement
        new (await import('webpack')).default.HotModuleReplacementPlugin(),
        
        // Define plugin with development variables
        new (await import('webpack')).default.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            'process.env.DEBUG': JSON.stringify(true),
            '__DEV__': JSON.stringify(true),
            '__API_URL__': JSON.stringify(environmentConfig.get('api.baseUrl')),
            '__WS_URL__': JSON.stringify(environmentConfig.get('websocket.url'))
        })
    ],

    // Performance hints disabled for development
    performance: {
        hints: false
    },

    // Cache configuration for faster rebuilds
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename, './build.config.js', './config/environment.js']
        },
        cacheDirectory: path.resolve(__dirname, '.cache/webpack')
    },

    // Watch options
    watchOptions: {
        aggregateTimeout: 300,
        poll: false,
        ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/coverage/**',
            '**/.git/**'
        ]
    },

    // Stats configuration for cleaner output
    stats: {
        preset: 'minimal',
        moduleTrace: true,
        errorDetails: true,
        warnings: true,
        errors: true,
        modules: false,
        chunks: false,
        assets: false,
        entrypoints: false,
        version: false,
        builtAt: true,
        timings: true
    },

    // Resolve configuration
    resolve: {
        ...buildConfig.resolve,
        symlinks: false,
        cacheWithContext: false
    },

    // Experiments for development
    experiments: {
        buildHttp: false,
        lazyCompilation: {
            entries: false,
            imports: true
        }
    }
});