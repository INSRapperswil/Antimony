# Build Stage
FROM node:22-alpine AS build
WORKDIR /

# We copy all of the needed local files into the docker container and run commands to install dependencies and build
COPY .babelrc .prettierrc.cjs eslint.config.js package.json tsconfig.json webpack.config.cjs workbox-config.cjs yarn.lock .env server.js ./
COPY src/ ./src/
COPY public/ ./public/

RUN yarn install

RUN yarn run build:dev

# Production Stage
FROM node:22-alpine

WORKDIR /
COPY --from=build /build ./build
COPY --from=build /server.js ./server.js

RUN yarn add express
RUN yarn add http-proxy-middleware

CMD ["node", "server.js"]

#CMD ["serve", "-s", "build", "-l", "8100"]
