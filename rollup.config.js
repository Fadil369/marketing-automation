/**
 * Rollup Configuration for BrainSAIT Marketing Platform
 * Creates ES modules and CommonJS builds for library distribution
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { environmentConfig } from './config/environment.js';

const isProduction = environmentConfig.isProduction();

// Base configuration
const baseConfig = {
    external: [
        'openai',
        '@anthropic-ai/sdk',
        'ws',
        'node-fetch',
        'uuid',
        'date-fns',
        'chart.js',
        'marked',
        'dompurify',
        'lodash-es'
    ],
    plugins: [
        nodeResolve({
            preferBuiltins: true,
            browser: false
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: '18'
                    },
                    modules: false
                }]
            ]
        })
    ]
};

// Production plugins
if (isProduction) {
    baseConfig.plugins.push(
        terser({
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            format: {
                comments: false
            }
        })
    );
}

// Multiple build configurations
export default [
    // ES Modules build
    {
        ...baseConfig,
        input: {
            index: 'src/core/Application.js',
            services: 'src/services/index.js',
            components: 'src/components/index.js',
            utils: 'src/utils/index.js'
        },
        output: {
            dir: 'dist/esm',
            format: 'es',
            entryFileNames: '[name].js',
            chunkFileNames: '[name]-[hash].js',
            sourcemap: true,
            preserveModules: false
        }
    },

    // CommonJS build
    {
        ...baseConfig,
        input: {
            index: 'src/core/Application.js',
            services: 'src/services/index.js',
            components: 'src/components/index.js',
            utils: 'src/utils/index.js'
        },
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            entryFileNames: '[name].cjs',
            chunkFileNames: '[name]-[hash].cjs',
            sourcemap: true,
            exports: 'auto'
        }
    },

    // UMD build for browsers
    {
        ...baseConfig,
        input: 'src/core/Application.js',
        output: {
            file: 'dist/umd/brainsait-marketing.js',
            format: 'umd',
            name: 'BrainSAITMarketing',
            sourcemap: true,
            globals: {
                'chart.js': 'Chart',
                'date-fns': 'dateFns',
                'uuid': 'uuid',
                'marked': 'marked',
                'dompurify': 'DOMPurify',
                'lodash-es': '_'
            }
        }
    },

    // Minified UMD build
    {
        ...baseConfig,
        input: 'src/core/Application.js',
        output: {
            file: 'dist/umd/brainsait-marketing.min.js',
            format: 'umd',
            name: 'BrainSAITMarketing',
            sourcemap: true,
            globals: {
                'chart.js': 'Chart',
                'date-fns': 'dateFns',
                'uuid': 'uuid',
                'marked': 'marked',
                'dompurify': 'DOMPurify',
                'lodash-es': '_'
            }
        },
        plugins: [
            ...baseConfig.plugins,
            terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info']
                },
                format: {
                    comments: false
                }
            })
        ]
    }
];