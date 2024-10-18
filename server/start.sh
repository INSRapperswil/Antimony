#!/usr/bin/env bash

pm2 start authbind --log antimony_server.log --time -- \
  --deep /home/ins/.local/share/nvm/v23.0.0/bin/npx smoke --host 0.0.0.0 --port 80
