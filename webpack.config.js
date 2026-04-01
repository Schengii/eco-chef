import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (_env, {mode}) => {

    return {
        mode: mode,
        entry: {
            index: './ui-src/index.ts',
        },
        devtool: 'inline-source-map',
        devServer: {
            static: './dist',
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
            })
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
            filename: 'bundle.js',
            clean: true
        },
        optimization: {
            usedExports: false,
        },
    }
};
