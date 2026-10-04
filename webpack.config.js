import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'fs';
import dotenv from 'dotenv';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Load .env file if it exists (dev-only API key injection, see DefinePlugin below)
const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env');
const dotenvVars = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (env, {mode}) => {
    const analyze = Boolean(env?.analyze);
    const buildVersion = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

    return {
        mode: mode,
        entry: {
            index: './ui-src/index.ts',
        },
        devtool: mode === 'production' ? false : 'inline-source-map',
        devServer: {
            static: false,
            host: 'localhost',
            port: '4444',
            historyApiFallback: true,
            hot: true,
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Development',
                template: 'ui-src/index.html',
                favicon: 'ui-src/favicon.ico',
               // publicPath: mode === 'development' ? '/' : '/demo-ui/',
            }),
            new MiniCssExtractPlugin(),
            new webpack.EnvironmentPlugin({
                'npm_package_name': 'packagejson-vars-missing',
                'npm_package_version': 'packagejson-vars-missing',
                'buildTimestamp': new Date().toISOString()
            }),
            // Dev only: inject the key from .env. Production bundles are public, so they never embed a key
            // and use the server proxy (api/gemini.ts) unless the user enters their own key in the settings.
            new webpack.DefinePlugin({
                'process.env.ECOCHEF_GEMINI_API_KEY': JSON.stringify(mode === 'production' ? '' : (dotenvVars['GEMINI_API_KEY'] || ''))
            }),
            ...(analyze ? [new BundleAnalyzerPlugin()] : []),
            {
                apply: (compiler) => {
                    compiler.hooks.afterEmit.tap('CopyAssetsPlugin', () => {
                        const wwwDir = path.resolve(__dirname, 'www');
                        if (fs.existsSync(wwwDir)) {
                            const swSource = fs.readFileSync(path.resolve(__dirname, 'ui-src/sw.js'), 'utf-8');
                            fs.writeFileSync(path.resolve(wwwDir, 'sw.js'), swSource.replace('__BUILD_VERSION__', buildVersion));
                            fs.copyFileSync(path.resolve(__dirname, 'ui-src/manifest.json'), path.resolve(wwwDir, 'manifest.json'));
                            // Copy PWA icons
                            const assetsDir = path.resolve(__dirname, 'ui-src/assets');
                            if (fs.existsSync(path.resolve(assetsDir, 'icon-192.png'))) {
                                fs.copyFileSync(path.resolve(assetsDir, 'icon-192.png'), path.resolve(wwwDir, 'icon-192.png'));
                            }
                            if (fs.existsSync(path.resolve(assetsDir, 'icon-512.png'))) {
                                fs.copyFileSync(path.resolve(assetsDir, 'icon-512.png'), path.resolve(wwwDir, 'icon-512.png'));
                            }
                        }
                    });
                }
            }
        ],
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                    exclude: /node_modules/,
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx'],
        },
        output: {
            path: path.resolve(__dirname, 'www'),
            filename: mode === 'production' ? '[name].[contenthash:8].js' : '[name].js',
            chunkFilename: mode === 'production' ? '[name].[chunkhash:8].js' : '[name].chunk.js',
            clean: true
        },
        optimization: {
            usedExports: true,
            runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
        },
    }
};
