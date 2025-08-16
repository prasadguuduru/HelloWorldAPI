#!/bin/bash

# Deployment summary script for AWS API Gateway + Lambda application
# Usage: ./scripts/deployment-summary.sh [environment]

set -e

# Default values
ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
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

log_header() {
    echo -e "${BOLD}${CYAN}$1${NC}"
}

# Get project information
get_project_info() {
    cd "$PROJECT_ROOT"
    
    PROJECT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "aws-api-app")
    PROJECT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
    
    if [ -d ".git" ]; then
        GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    else
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
    fi
}

# Get deployment information
get_deployment_info() {
    cd "$PROJECT_ROOT/terraform"
    
    if terraform output &> /dev/null; then
        API_GATEWAY_URL=$(terraform output -raw api_gateway_stage_url 2>/dev/null || echo "Not deployed")
        API_GATEWAY_ID=$(terraform output -raw api_gateway_id 2>/dev/null || echo "unknown")
        
        # Get Lambda function information
        LAMBDA_FUNCTIONS=$(terraform output -json lambda_function_names 2>/dev/null || echo "{}")
        LAMBDA_ARNS=$(terraform output -json lambda_function_arns 2>/dev/null || echo "{}")
        
        # Get CloudWatch log groups
        LOG_GROUPS=$(terraform output -json cloudwatch_log_groups 2>/dev/null || echo "{}")
        
        DEPLOYMENT_STATUS="✅ Deployed"
    else
        API_GATEWAY_URL="Not deployed"
        API_GATEWAY_ID="unknown"
        LAMBDA_FUNCTIONS="{}"
        LAMBDA_ARNS="{}"
        LOG_GROUPS="{}"
        DEPLOYMENT_STATUS="❌ Not deployed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check AWS resources
check_aws_resources() {
    if [ "$API_GATEWAY_ID" != "unknown" ] && [ "$API_GATEWAY_ID" != "Not deployed" ]; then
        if aws apigateway get-rest-api --rest-api-id "$API_GATEWAY_ID" &> /dev/null; then
            API_GATEWAY_STATUS="✅ Active"
        else
            API_GATEWAY_STATUS="❌ Not found"
        fi
    else
        API_GATEWAY_STATUS="❌ Not deployed"
    fi
    
    # Check Lambda functions
    LAMBDA_STATUS="✅ All active"
    if [ "$LAMBDA_FUNCTIONS" != "{}" ]; then
        local lambda_functions=$(echo "$LAMBDA_FUNCTIONS" | jq -r 'to_entries[] | .value' 2>/dev/null || echo "")
        for function_name in $lambda_functions; do
            if ! aws lambda get-function --function-name "$function_name" &> /dev/null; then
                LAMBDA_STATUS="❌ Some functions missing"
                break
            fi
        done
    else
        LAMBDA_STATUS="❌ Not deployed"
    fi
}

# Get build information
get_build_info() {
    cd "$PROJECT_ROOT"
    
    if [ -d "lib" ]; then
        BUILD_STATUS="✅ Built"
        BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" lib 2>/dev/null || stat -c "%y" lib 2>/dev/null | cut -d'.' -f1 || echo "unknown")
    else
        BUILD_STATUS="❌ Not built"
        BUILD_TIME="unknown"
    fi
    
    if [ -d "node_modules" ]; then
        DEPENDENCIES_STATUS="✅ Installed"
    else
        DEPENDENCIES_STATUS="❌ Not installed"
    fi
}

# Get test information
get_test_info() {
    cd "$PROJECT_ROOT"
    
    # Check if test files exist
    if [ -d "tests" ]; then
        UNIT_TESTS=$(find tests/unit -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
        INTEGRATION_TESTS=$(find tests/integration -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
        TEST_STATUS="✅ $((UNIT_TESTS + INTEGRATION_TESTS)) test files"
    else
        UNIT_TESTS=0
        INTEGRATION_TESTS=0
        TEST_STATUS="❌ No tests found"
    fi
    
    # Check coverage directory
    if [ -d "coverage" ]; then
        COVERAGE_STATUS="✅ Available"
    else
        COVERAGE_STATUS="❌ Not generated"
    fi
}

# Display deployment summary
display_summary() {
    clear
    echo ""
    log_header "╔══════════════════════════════════════════════════════════════════════════════╗"
    log_header "║                        AWS API GATEWAY + LAMBDA                             ║"
    log_header "║                           DEPLOYMENT SUMMARY                                ║"
    log_header "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Project Information
    log_header "📋 PROJECT INFORMATION"
    echo "   Project Name:     $PROJECT_NAME"
    echo "   Version:          $PROJECT_VERSION"
    echo "   Environment:      $ENVIRONMENT"
    echo "   Git Branch:       $GIT_BRANCH"
    echo "   Git Commit:       $GIT_COMMIT"
    echo "   Timestamp:        $(date)"
    echo ""
    
    # Build Information
    log_header "🔨 BUILD INFORMATION"
    echo "   Build Status:     $BUILD_STATUS"
    echo "   Build Time:       $BUILD_TIME"
    echo "   Dependencies:     $DEPENDENCIES_STATUS"
    echo ""
    
    # Test Information
    log_header "🧪 TEST INFORMATION"
    echo "   Test Status:      $TEST_STATUS"
    echo "   Unit Tests:       $UNIT_TESTS files"
    echo "   Integration Tests: $INTEGRATION_TESTS files"
    echo "   Coverage Report:  $COVERAGE_STATUS"
    echo ""
    
    # Deployment Status
    log_header "🚀 DEPLOYMENT STATUS"
    echo "   Overall Status:   $DEPLOYMENT_STATUS"
    echo "   API Gateway:      $API_GATEWAY_STATUS"
    echo "   Lambda Functions: $LAMBDA_STATUS"
    echo ""
    
    # Infrastructure Details
    if [ "$API_GATEWAY_URL" != "Not deployed" ]; then
        log_header "🏗️  INFRASTRUCTURE DETAILS"
        echo "   API Gateway URL:  $API_GATEWAY_URL"
        echo "   API Gateway ID:   $API_GATEWAY_ID"
        echo ""
        
        # Lambda Functions
        if [ "$LAMBDA_FUNCTIONS" != "{}" ]; then
            log_header "⚡ LAMBDA FUNCTIONS"
            echo "$LAMBDA_FUNCTIONS" | jq -r 'to_entries[] | "   \(.key | gsub("_"; " ") | ascii_upcase): \(.value)"' 2>/dev/null || echo "   Unable to parse Lambda functions"
            echo ""
        fi
        
        # CloudWatch Log Groups
        if [ "$LOG_GROUPS" != "{}" ]; then
            log_header "📊 MONITORING"
            echo "   API Gateway Logs: $(echo "$LOG_GROUPS" | jq -r '.api_gateway // "Not configured"' 2>/dev/null)"
            echo "   Lambda Logs:      $(echo "$LOG_GROUPS" | jq -r '.lambda_logs | length // 0' 2>/dev/null) log groups configured"
            echo ""
        fi
    fi
    
    # Quick Actions
    log_header "⚡ QUICK ACTIONS"
    echo "   Health Check:     ./scripts/health-check.sh $API_GATEWAY_URL $ENVIRONMENT"
    echo "   Verify Deploy:    ./scripts/verify-deployment.sh $ENVIRONMENT"
    echo "   View Logs:        aws logs tail /aws/lambda/aws-api-app-$ENVIRONMENT-list-items --follow"
    echo "   Destroy:          ./scripts/deploy.sh $ENVIRONMENT destroy"
    echo ""
    
    # API Endpoints
    if [ "$API_GATEWAY_URL" != "Not deployed" ]; then
        log_header "🌐 API ENDPOINTS"
        echo "   GET    $API_GATEWAY_URL/items"
        echo "   POST   $API_GATEWAY_URL/items"
        echo "   GET    $API_GATEWAY_URL/items/{id}"
        echo "   PUT    $API_GATEWAY_URL/items/{id}"
        echo "   DELETE $API_GATEWAY_URL/items/{id}"
        echo ""
        
        # Quick Test Commands
        log_header "🧪 QUICK TESTS"
        echo "   List Items:       curl $API_GATEWAY_URL/items"
        echo "   Create Item:      curl -X POST $API_GATEWAY_URL/items -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"description\":\"Test item\"}'"
        echo "   Health Check:     curl $API_GATEWAY_URL/items | jq '.success'"
        echo ""
    fi
    
    # Status Summary
    log_header "📈 STATUS SUMMARY"
    if [ "$DEPLOYMENT_STATUS" = "✅ Deployed" ] && [ "$API_GATEWAY_STATUS" = "✅ Active" ] && [ "$LAMBDA_STATUS" = "✅ All active" ]; then
        log_success "🎉 Deployment is healthy and ready for use!"
    elif [ "$DEPLOYMENT_STATUS" = "✅ Deployed" ]; then
        log_warning "⚠️  Deployment exists but some issues detected. Check the details above."
    else
        log_error "❌ Application is not deployed. Run: npm run deploy:$ENVIRONMENT"
    fi
    echo ""
    
    log_header "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Main execution
main() {
    log_info "Gathering deployment information for $ENVIRONMENT environment..."
    
    get_project_info
    get_deployment_info
    check_aws_resources
    get_build_info
    get_test_info
    
    display_summary
}

# Run main function
main "$@"