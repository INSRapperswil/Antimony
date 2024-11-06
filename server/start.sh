#!/usr/bin/env bash

bash ./stop.sh

docker run -d \
  --restart=always \
  -p 3000:8080 \
  -p 8081:8081 \
  --name smocker \
  ghcr.io/smocker-dev/smocker

curl -XPOST \
  --header "Content-Type: application/x-yaml" \
  --data-binary "@get_topologies.yaml" \
  localhost:8081/mocks

curl -XPOST \
  --header "Content-Type: application/x-yaml" \
  --data-binary "@get_devices.yaml" \
  localhost:8081/mocks

curl -XPOST \
  --header "Content-Type: application/x-yaml" \
  --data-binary "@get_groups.yaml" \
  localhost:8081/mocks

curl -XPOST \
  --header "Content-Type: application/x-yaml" \
  --data-binary "@get_labs.yaml" \
  localhost:8081/mocks

for file in labs_mock/*.yaml; do
  curl -XPOST \
    --header "Content-Type: application/x-yaml" \
    --data-binary "@$file" \
    localhost:8081/mocks
done
