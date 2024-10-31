#!/usr/bin/env bash

docker run -d \
  --restart=always \
  -p 8080:8080 \
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
