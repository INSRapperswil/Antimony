import express from 'express';

import {createProxyMiddleware} from 'http-proxy-middleware';

const app = express();

const exampleProxy = createProxyMiddleware({
  target: 'http://152.96.10.35/',
  changeOrigin: true,
  pathRewrite: {'^/api': ''},
});

app.use('/api', exampleProxy);
app.use('/', express.static('build'));
app.listen(8100);
