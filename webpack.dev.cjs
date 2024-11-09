const common = require('./webpack.common');

const {merge} = require('webpack-merge');

module.exports = merge(common, {
  devtool: 'source-map',
  mode: 'development',
  devServer: {
    host: '0.0.0.0',
    port: '8080',
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
      '/socket.io': {
        target: {
          host: 'localhost',
          protocol: 'ws:',
          port: 3000,
        },
        ws: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(ts|tsx)$/i,
        use: [
          'babel-loader',
          {
            loader: 'ifdef-loader',
            options: {
              'ifdef-verbose': true,
              DEBUG: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
});
