#!/bin/bash

# prometheus & Grafana
docker-compose -f docker-compose.monitoring.yml up -d
pnpm run start:prod
