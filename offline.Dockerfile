# Build Stage
FROM node:22-alpine AS build
WORKDIR /

# We copy all of the needed local files into the docker container and run commands to install dependencies and build
COPY .babelrc .prettierrc.cjs eslint.config.js package.json tsconfig.json workbox-config.cjs yarn.lock .env server.js ./
COPY webpack.common.cjs webpack.prod.cjs ./
COPY src/ ./src/
COPY public/ ./public/
COPY local-data/ ./local-data/

RUN yarn install

RUN yarn run build-offline:prod

# Production Stage
FROM node:22-alpine

WORKDIR /
COPY --from=build /build ./build
COPY --from=build /server.js ./server.js

RUN yarn add express
RUN yarn add http-proxy-middleware

CMD ["node", "server.js"]
