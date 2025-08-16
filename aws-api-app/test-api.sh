#!/bin/bash

# API Gateway URL
API_URL="https://502bpgl4s0.execute-api.us-east-1.amazonaws.com/v1"

echo "🧪 Testing API Gateway + Lambda Deployment"
echo "API URL: $API_URL"
echo ""

echo "1. Testing CORS preflight..."
curl -s -X OPTIONS "$API_URL/items" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -w "Status: %{http_code}\n" -o /dev/null

echo ""
echo "2. Testing GET /items (list all items)..."
curl -s -X GET "$API_URL/items" \
  -w "Status: %{http_code}\n"

echo ""
echo "3. Testing POST /items (create item)..."
curl -s -X POST "$API_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test Description"}' \
  -w "Status: %{http_code}\n"

echo ""
echo "4. Testing GET /items/1 (get specific item)..."
curl -s -X GET "$API_URL/items/1" \
  -w "Status: %{http_code}\n"

echo ""
echo "5. Testing PUT /items/1 (update item)..."
curl -s -X PUT "$API_URL/items/1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Item","description":"Updated Description"}' \
  -w "Status: %{http_code}\n"

echo ""
echo "6. Testing DELETE /items/1 (delete item)..."
curl -s -X DELETE "$API_URL/items/1" \
  -w "Status: %{http_code}\n"

echo ""
echo "7. Testing 404 error (nonexistent item)..."
curl -s -X GET "$API_URL/items/999999" \
  -w "Status: %{http_code}\n"

echo ""
echo "8. Testing validation error (invalid data)..."
curl -s -X POST "$API_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}' \
  -w "Status: %{http_code}\n"

echo ""
echo "9. Testing query parameters..."
curl -s -X GET "$API_URL/items?limit=5&offset=0" \
  -w "Status: %{http_code}\n"

echo ""
echo "✅ API testing complete!"