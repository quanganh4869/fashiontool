#!/usr/bin/env bash
set -e

echo "Starting TrendMotion Studio infra (PostgreSQL & Redis)..."
docker compose up -d
sleep 3
docker compose ps
