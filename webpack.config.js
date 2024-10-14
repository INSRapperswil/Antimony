const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
  },
  devtool: 'source-map',
  mode: 'development',
  devServer: {
    host: '0.0.0.0',
    port: '8100',
    historyApiFallback: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: {
          host: 'localhost',
          protocol: 'http:',
          port: 3000,
        },
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: 'assets',
        },
      ],
    }),
    new MonacoWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    (() =>
      process.env.NODE_ENV === 'production'
        ? new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 8000000,
          })
        : new webpack.DefinePlugin({}))(),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(sa|sc|c)ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpe?g|gif|png|svg)$/i,
        loader: 'file-loader',
        options: {
          name: '[contenthash].[ext]',
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@sb': path.resolve(__dirname, 'src/'),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      url: require.resolve('url/'),
    },
  },
};
