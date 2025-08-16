#!/bin/bash

# Health check script for AWS API Gateway + Lambda application
# Usage: ./scripts/health-check.sh <api-url> [environment]

set -e

# Default values
API_URL=${1}
ENVIRONMENT=${2:-unknown}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate input
validate_input() {
    if [ -z "$API_URL" ]; then
        log_error "API URL is required"
        echo "Usage: $0 <api-url> [environment]"
        echo "Example: $0 https://abc123.execute-api.us-east-1.amazonaws.com/v1 production"
        exit 1
    fi
    
    # Remove trailing slash
    API_URL=${API_URL%/}
    
    log_info "Running health checks for $ENVIRONMENT environment"
    log_info "API URL: $API_URL"
}

# Test basic connectivity
test_connectivity() {
    log_info "Testing basic connectivity..."
    
    if curl -s --max-time 10 "$API_URL" > /dev/null; then
        log_success "✓ Basic connectivity - OK"
        return 0
    else
        log_error "✗ Basic connectivity - FAILED"
        return 1
    fi
}

# Test GET /items endpoint
test_get_items() {
    log_info "Testing GET /items endpoint..."
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time 30 "$API_URL/items")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq 200 ]; then
        # Validate JSON response
        if echo "$body" | jq -e '.success == true' > /dev/null 2>&1; then
            log_success "✓ GET /items - OK (Status: $status_code)"
            return 0
        else
            log_error "✗ GET /items - Invalid JSON response"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "✗ GET /items - FAILED (Status: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test POST /items endpoint
test_post_items() {
    log_info "Testing POST /items endpoint..."
    
    local test_item='{
        "name": "Health Check Item",
        "description": "Test item created by health check script"
    }'
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --max-time 30 \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$test_item" \
        "$API_URL/items")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq 201 ]; then
        # Validate JSON response and extract item ID
        if echo "$body" | jq -e '.success == true' > /dev/null 2>&1; then
            CREATED_ITEM_ID=$(echo "$body" | jq -r '.data.id')
            log_success "✓ POST /items - OK (Status: $status_code, ID: $CREATED_ITEM_ID)"
            return 0
        else
            log_error "✗ POST /items - Invalid JSON response"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "✗ POST /items - FAILED (Status: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test GET /items/{id} endpoint
test_get_item_by_id() {
    if [ -z "$CREATED_ITEM_ID" ]; then
        log_warning "⚠ GET /items/{id} - SKIPPED (No item ID available)"
        return 0
    fi
    
    log_info "Testing GET /items/$CREATED_ITEM_ID endpoint..."
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --max-time 30 \
        "$API_URL/items/$CREATED_ITEM_ID")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq 200 ]; then
        if echo "$body" | jq -e '.success == true' > /dev/null 2>&1; then
            log_success "✓ GET /items/{id} - OK (Status: $status_code)"
            return 0
        else
            log_error "✗ GET /items/{id} - Invalid JSON response"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "✗ GET /items/{id} - FAILED (Status: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test PUT /items/{id} endpoint
test_put_item() {
    if [ -z "$CREATED_ITEM_ID" ]; then
        log_warning "⚠ PUT /items/{id} - SKIPPED (No item ID available)"
        return 0
    fi
    
    log_info "Testing PUT /items/$CREATED_ITEM_ID endpoint..."
    
    local update_data='{
        "name": "Updated Health Check Item",
        "description": "Updated by health check script"
    }'
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --max-time 30 \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "$update_data" \
        "$API_URL/items/$CREATED_ITEM_ID")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq 200 ]; then
        if echo "$body" | jq -e '.success == true' > /dev/null 2>&1; then
            log_success "✓ PUT /items/{id} - OK (Status: $status_code)"
            return 0
        else
            log_error "✗ PUT /items/{id} - Invalid JSON response"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "✗ PUT /items/{id} - FAILED (Status: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test DELETE /items/{id} endpoint
test_delete_item() {
    if [ -z "$CREATED_ITEM_ID" ]; then
        log_warning "⚠ DELETE /items/{id} - SKIPPED (No item ID available)"
        return 0
    fi
    
    log_info "Testing DELETE /items/$CREATED_ITEM_ID endpoint..."
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --max-time 30 \
        -X DELETE \
        "$API_URL/items/$CREATED_ITEM_ID")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq 200 ]; then
        if echo "$body" | jq -e '.success == true' > /dev/null 2>&1; then
            log_success "✓ DELETE /items/{id} - OK (Status: $status_code)"
            return 0
        else
            log_error "✗ DELETE /items/{id} - Invalid JSON response"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "✗ DELETE /items/{id} - FAILED (Status: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test CORS functionality
test_cors() {
    log_info "Testing CORS functionality..."
    
    local response
    local cors_headers
    
    response=$(curl -s -I \
        --max-time 30 \
        -X OPTIONS \
        -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "$API_URL/items")
    
    if echo "$response" | grep -i "access-control-allow-origin" > /dev/null; then
        log_success "✓ CORS - OK"
        return 0
    else
        log_error "✗ CORS - FAILED"
        echo "Response headers: $response"
        return 1
    fi
}

# Test response time
test_response_time() {
    log_info "Testing response time..."
    
    local start_time
    local end_time
    local response_time
    
    start_time=$(date +%s%N)
    curl -s --max-time 30 "$API_URL/items" > /dev/null
    end_time=$(date +%s%N)
    
    response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$response_time" -lt 5000 ]; then # Less than 5 seconds
        log_success "✓ Response time - OK (${response_time}ms)"
        return 0
    else
        log_warning "⚠ Response time - SLOW (${response_time}ms)"
        return 1
    fi
}

# Generate health check report
generate_report() {
    local total_tests=$1
    local passed_tests=$2
    local failed_tests=$3
    
    echo ""
    echo "============================================"
    echo "           HEALTH CHECK REPORT"
    echo "============================================"
    echo "Environment: $ENVIRONMENT"
    echo "API URL: $API_URL"
    echo "Timestamp: $(date)"
    echo ""
    echo "Test Results:"
    echo "  Total Tests: $total_tests"
    echo "  Passed: $passed_tests"
    echo "  Failed: $failed_tests"
    echo "  Success Rate: $(( passed_tests * 100 / total_tests ))%"
    echo ""
    
    if [ "$failed_tests" -eq 0 ]; then
        log_success "All health checks passed! 🎉"
        echo "Status: HEALTHY ✅"
    else
        log_error "Some health checks failed!"
        echo "Status: UNHEALTHY ❌"
    fi
    
    echo "============================================"
}

# Main execution
main() {
    log_info "Starting health check for AWS API Gateway + Lambda application..."
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi
    
    validate_input
    
    # Initialize counters
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Run health checks
    local tests=(
        "test_connectivity"
        "test_get_items"
        "test_post_items"
        "test_get_item_by_id"
        "test_put_item"
        "test_delete_item"
        "test_cors"
        "test_response_time"
    )
    
    for test in "${tests[@]}"; do
        total_tests=$((total_tests + 1))
        if $test; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
        fi
        echo "" # Add spacing between tests
    done
    
    # Generate report
    generate_report $total_tests $passed_tests $failed_tests
    
    # Exit with appropriate code
    if [ "$failed_tests" -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"