import express from 'express';

import {createProxyMiddleware} from 'http-proxy-middleware';

const app = express();

const exampleProxy = createProxyMiddleware({
  target:
    'https://antimony-backend-development-491689167898.europe-west1.run.app',
  changeOrigin: true,
  pathRewrite: {'^/api': ''},
});

app.use('/api', exampleProxy);
app.use('/', express.static('build'));
app.listen(8100);
