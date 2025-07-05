#!/bin/bash

echo "🔍 Vérification de santé des services..."
echo ""

check_service() {
    local service_name=$1
    local url=$2
    
    if curl -f -s -o /dev/null "$url"; then
        echo "✅ $service_name: OK"
    else
        echo "❌ $service_name: DOWN"
    fi
}

check_service "Backend API" "http://localhost:8080/health"
check_service "Metrics Endpoint" "http://localhost:8080/metrics"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3001/api/health"

echo ""
echo "📊 État des conteneurs Docker:"
docker-compose -f docker-compose.prod.yml ps