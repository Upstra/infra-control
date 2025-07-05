#!/bin/sh
set -e

echo "🚀 Starting Infra Control backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Start the application without migrations
echo "🎯 Starting the application..."
exec node dist/src/main.js