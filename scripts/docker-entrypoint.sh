#!/bin/sh
set -e

echo "🚀 Starting Infra Control backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Run migrations
echo "🔄 Running database migrations..."
pnpm migration:run

# Start the application
echo "🎯 Starting the application..."
exec "$@"