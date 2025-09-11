#!/bin/bash

# Grafana setup script to ensure datasource is configured
# This runs after Grafana starts to ensure the datasource is properly configured

GRAFANA_URL="http://grafana:3000"
GRAFANA_USER="admin"
GRAFANA_PASS="${GRAFANA_ADMIN_PASSWORD:-admin123}"
PROMETHEUS_URL="http://prometheus:9090"

echo "Waiting for Grafana to start..."

# Wait for Grafana to be ready (max 60 seconds)
for i in $(seq 1 30); do
    if curl -s "$GRAFANA_URL/api/health" | grep -q '"database":"ok"'; then
        echo "Grafana is ready!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "Grafana failed to start within 60 seconds"
        exit 1
    fi
    
    echo "Waiting... ($i/30)"
    sleep 2
done

# Check if Prometheus datasource already exists
DATASOURCE_EXISTS=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/datasources" | grep -c '"name":"Prometheus"' || true)

if [ "$DATASOURCE_EXISTS" -eq 0 ]; then
    echo "Creating Prometheus datasource..."
    
    RESPONSE=$(curl -s -w "%{http_code}" -u "$GRAFANA_USER:$GRAFANA_PASS" \
        -H "Content-Type: application/json" \
        -X POST "$GRAFANA_URL/api/datasources" \
        -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "'$PROMETHEUS_URL'",
            "access": "proxy",
            "isDefault": true,
            "basicAuth": false,
            "withCredentials": false,
            "jsonData": {
                "httpMethod": "POST",
                "prometheusType": "Prometheus",
                "prometheusVersion": "2.0.0"
            }
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Prometheus datasource created successfully"
    else
        echo "❌ Failed to create datasource (HTTP $HTTP_CODE): $RESPONSE_BODY"
        exit 1
    fi
else
    echo "✅ Prometheus datasource already exists"
fi

# Test the datasource connection
echo "Testing datasource connection..."
TEST_RESPONSE=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/datasources/proxy/1/api/v1/query?query=up" || true)

if echo "$TEST_RESPONSE" | grep -q '"status":"success"'; then
    echo "✅ Datasource is working correctly"
else
    echo "⚠️  Datasource connection test inconclusive, but datasource is configured"
fi

echo "Grafana setup complete!"