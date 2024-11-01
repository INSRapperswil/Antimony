FROM node:22-alpine

RUN apk add --no-cache curl tar wget

ENV SMOCKER_URL="https://github.com/smocker-dev/smocker/releases/latest/download/smocker.tar.gz"

WORKDIR /

RUN curl -L $SMOCKER_URL -o smocker.tar.gz && \
    tar -xf smocker.tar.gz && \
    rm smocker.tar.gz && \
    chmod 777 /smocker


# Set the entrypoint to smocker
ENTRYPOINT ["nohup", "./smocker"]
