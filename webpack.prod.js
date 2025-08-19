/**
 * Webpack Production Configuration
 * Optimized for production builds with maximum optimization
 */

import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from './build.config.js';
import { environmentConfig } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(buildConfig, {
    mode: 'production',
    
    // Entry points for production
    entry: {
        main: './src/core/Application.js',
        vendor: ['chart.js', 'date-fns', 'uuid', 'lodash-es']
    },

    // Production output configuration
    output: {
        ...buildConfig.output,
        filename: 'js/[name].[contenthash:8].js',
        chunkFilename: 'js/[name].[contenthash:8].chunk.js',
        assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
        publicPath: '/',
        crossOriginLoading: 'anonymous'
    },

    // Source maps for production
    devtool: 'source-map',

    // Production optimization
    optimization: {
        ...buildConfig.optimization,
        minimize: true,
        minimizer: [
            // Terser for JavaScript minification
            new (await import('terser-webpack-plugin')).default({
                terserOptions: {
                    parse: {
                        ecma: 8
                    },
                    compress: {
                        ecma: 5,
                        warnings: false,
                        comparisons: false,
                        inline: 2,
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug']
                    },
                    mangle: {
                        safari10: true
                    },
                    output: {
                        ecma: 5,
                        comments: false,
                        ascii_only: true
                    }
                },
                parallel: true,
                extractComments: false
            }),

            // CSS optimization
            new (await import('css-minimizer-webpack-plugin')).default({
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true },
                            normalizeUnicode: false
                        }
                    ]
                }
            })
        ],

        // Advanced chunk splitting for production
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: 10,
            maxAsyncRequests: 10,
            cacheGroups: {
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                },
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: -10,
                    chunks: 'all',
                    enforce: true
                },
                core: {
                    test: /[\\/]src[\\/]core[\\/]/,
                    name: 'core',
                    priority: 5,
                    chunks: 'all',
                    minSize: 0
                },
                services: {
                    test: /[\\/]src[\\/]services[\\/]/,
                    name: 'services',
                    priority: 5,
                    chunks: 'all',
                    minSize: 0
                },
                components: {
                    test: /[\\/]src[\\/]components[\\/]/,
                    name: 'components',
                    priority: 5,
                    chunks: 'all',
                    minSize: 0
                },
                styles: {
                    test: /\.css$/,
                    name: 'styles',
                    priority: 10,
                    chunks: 'all',
                    enforce: true
                }
            }
        },

        // Runtime chunk optimization
        runtimeChunk: {
            name: 'runtime'
        },

        // Module concatenation
        concatenateModules: true,

        // Side effects optimization
        sideEffects: false,

        // Tree shaking
        usedExports: true
    },

    // Production module rules
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
                                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                                },
                                modules: false,
                                useBuiltIns: 'usage',
                                corejs: 3,
                                bugfixes: true
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-syntax-dynamic-import',
                            '@babel/plugin-proposal-class-properties',
                            ['@babel/plugin-transform-runtime', {
                                corejs: false,
                                helpers: true,
                                regenerator: true,
                                useESModules: true
                            }]
                        ],
                        cacheDirectory: true,
                        cacheCompression: false,
                        compact: true
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    (await import('mini-css-extract-plugin')).default.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    'autoprefixer',
                                    'cssnano'
                                ]
                            },
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024 // 8kb
                    }
                },
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
            }
        ]
    },

    // Production plugins
    plugins: [
        ...buildConfig.plugins,

        // Extract CSS to separate files
        new (await import('mini-css-extract-plugin')).default({
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].chunk.css',
            ignoreOrder: false
        }),

        // Define plugin with production variables
        new (await import('webpack')).default.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env.DEBUG': JSON.stringify(false),
            '__DEV__': JSON.stringify(false),
            '__PROD__': JSON.stringify(true),
            '__API_URL__': JSON.stringify(environmentConfig.get('api.baseUrl')),
            '__WS_URL__': JSON.stringify(environmentConfig.get('websocket.url')),
            '__VERSION__': JSON.stringify(environmentConfig.get('app.version'))
        }),

        // Workbox service worker
        new (await import('workbox-webpack-plugin')).GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            swDest: 'sw-generated.js',
            exclude: [/\.map$/, /manifest$/, /\.htaccess$/, /service-worker\.js$/],
            
            runtimeCaching: [
                {
                    urlPattern: /^https:\/\/api\.brainsait\.com\//,
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'api-cache',
                        expiration: {
                            maxEntries: 50,
                            maxAgeSeconds: 300 // 5 minutes
                        },
                        cacheKeyWillBeUsed: async ({ request }) => {
                            return `${request.url}?timestamp=${Math.floor(Date.now() / 300000)}`;
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
                            maxAgeSeconds: 86400 * 30 // 30 days
                        }
                    }
                },
                {
                    urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'fonts-cache',
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 86400 * 365 // 1 year
                        }
                    }
                },
                {
                    urlPattern: /\.(?:js|css)$/,
                    handler: 'StaleWhileRevalidate',
                    options: {
                        cacheName: 'static-resources',
                        expiration: {
                            maxEntries: 60,
                            maxAgeSeconds: 86400 // 1 day
                        }
                    }
                }
            ]
        }),

        // Bundle analyzer (conditionally)
        ...(process.env.ANALYZE ? [
            new (await import('webpack-bundle-analyzer')).BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: 'bundle-report.html',
                generateStatsFile: true,
                statsFilename: 'bundle-stats.json'
            })
        ] : []),

        // Compression plugin
        new (await import('compression-webpack-plugin')).default({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8
        }),

        // Copy additional files
        new (await import('copy-webpack-plugin')).default({
            patterns: [
                {
                    from: 'manifest.json',
                    to: 'manifest.json'
                },
                {
                    from: 'public/robots.txt',
                    to: 'robots.txt',
                    noErrorOnMissing: true
                },
                {
                    from: 'public/sitemap.xml',
                    to: 'sitemap.xml',
                    noErrorOnMissing: true
                },
                {
                    from: 'public/.well-known',
                    to: '.well-known',
                    noErrorOnMissing: true
                }
            ]
        })
    ],

    // Performance optimization
    performance: {
        maxAssetSize: 512000,
        maxEntrypointSize: 512000,
        hints: 'warning',
        assetFilter: (assetFilename) => {
            return !assetFilename.endsWith('.map') && !assetFilename.endsWith('.gz');
        }
    },

    // Production stats
    stats: {
        preset: 'normal',
        colors: true,
        hash: true,
        timings: true,
        chunks: true,
        chunkModules: false,
        modules: false,
        children: false,
        reasons: false,
        source: false,
        warnings: true,
        errors: true,
        errorDetails: true,
        publicPath: true,
        excludeAssets: [
            /\.map$/,
            /hot-update/
        ]
    },

    // Cache configuration for production
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename, './build.config.js', './config/environment.js']
        },
        cacheDirectory: path.resolve(__dirname, '.cache/webpack-prod'),
        compression: 'gzip'
    }
});