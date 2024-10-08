# Build Stage
FROM node:20-alpine AS build
WORKDIR /

# We copy all of the needed local files into the docker container and run commands to install dependencies and build
COPY .babelrc .prettierrc.cjs eslint.config.js package.json tsconfig.json webpack.config.js workbox-config.js yarn.lock .env ./
COPY src/ ./src/
COPY public/ ./public/

RUN yarn install

RUN yarn run build:prod

# Production Stage
FROM node:20-alpine

WORKDIR /
COPY --from=build /build ./build

# Install serve package
RUN yarn global add serve

CMD ["serve", "-s", "build", "-l", "80"]
