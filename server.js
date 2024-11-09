import express from 'express';

import {createProxyMiddleware} from 'http-proxy-middleware';

const app = express();

const exampleProxy = createProxyMiddleware({
  // target:
  //   'https://antimony-backend-development-491689167898.europe-west1.run.app',
  target: process.env.PROXY_URL ?? 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {'^/api': ''},
});

const websocketproxy = createProxyMiddleware({
  target: process.env.PROXY_URL ?? 'http://localhost:3000',
  ws: true,
});

app.use('/api', exampleProxy);
app.use('/socket.io', websocketproxy);
app.use('/', express.static('build'));
app.use('/icons', express.static('build/assets/icons'));
app.use('*', express.static('build'));
app.listen(8100);
