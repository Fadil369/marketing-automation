/**
 * Webpack Configuration for BrainSAIT Marketing Platform
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    mode: isProduction ? 'production' : 'development',
    
    entry: './src/core/Application.js',
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
        chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
        clean: true
    },
    
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@core': path.resolve(__dirname, 'src/core'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@assets': path.resolve(__dirname, 'src/assets'),
        }
    },
    
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
                                modules: false
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
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[contenthash:8][ext]'
                }
            }
        ]
    },
    
    plugins: [
        new HtmlWebpackPlugin({
            template: './index-new.html',
            filename: 'index.html',
            inject: 'body',
            minify: isProduction
        }),
        
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'sw.js', to: 'sw.js' },
                {
                    from: 'src/assets/styles/design-system.css',
                    to: 'css/design-system.css'
                }
            ]
        }),
        
        ...(isProduction ? [
            new MiniCssExtractPlugin({
                filename: 'css/[name].[contenthash:8].css'
            })
        ] : [])
    ],
    
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    devServer: {
        port: 3000,
        hot: true,
        static: {
            directory: path.resolve(__dirname, 'dist')
        }
    }
};