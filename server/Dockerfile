# Build Stage
FROM node:22-alpine
WORKDIR /

COPY . .

RUN yarn global add smoke

CMD ["npx", "smoke", "--host", "0.0.0.0"]
