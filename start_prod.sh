#!/bin/bash

docker compose up --build -d
docker exec -it nest-app pnpm run start:prod
