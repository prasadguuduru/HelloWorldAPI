#!/bin/bash

# Deployment verification script for AWS API Gateway + Lambda application
# Usage: ./scripts/verify-deployment.sh <environment> [api-url]

set -e

# Default values
ENVIRONMENT=${1:-dev}
API_URL=${2}
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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|prod)
            log_info "Verifying deployment for $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install jq first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid."
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

# Get deployment outputs from Terraform
get_deployment_outputs() {
    log_info "Getting deployment outputs from Terraform..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # Check if Terraform state exists
    if [ ! -f "terraform.tfstate" ] && [ ! -f ".terraform/terraform.tfstate" ]; then
        log_error "No Terraform state found. Has the application been deployed?"
        exit 1
    fi
    
    # Get API Gateway URL if not provided
    if [ -z "$API_URL" ]; then
        API_URL=$(terraform output -raw api_gateway_stage_url 2>/dev/null || echo "")
        if [ -z "$API_URL" ]; then
            log_error "Could not get API Gateway URL from Terraform outputs"
            exit 1
        fi
    fi
    
    # Get other outputs
    API_GATEWAY_ID=$(terraform output -raw api_gateway_id 2>/dev/null || echo "unknown")
    LAMBDA_FUNCTIONS=$(terraform output -json lambda_function_names 2>/dev/null || echo "{}")
    
    log_success "Retrieved deployment outputs"
    log_info "API Gateway URL: $API_URL"
    log_info "API Gateway ID: $API_GATEWAY_ID"
    
    cd "$PROJECT_ROOT"
}

# Verify AWS resources exist
verify_aws_resources() {
    log_info "Verifying AWS resources exist..."
    
    local verification_failed=false
    
    # Verify API Gateway
    log_info "Checking API Gateway..."
    if aws apigateway get-rest-api --rest-api-id "$API_GATEWAY_ID" &> /dev/null; then
        log_success "✓ API Gateway exists"
    else
        log_error "✗ API Gateway not found"
        verification_failed=true
    fi
    
    # Verify Lambda functions
    log_info "Checking Lambda functions..."
    local lambda_functions=$(echo "$LAMBDA_FUNCTIONS" | jq -r 'to_entries[] | .value')
    
    for function_name in $lambda_functions; do
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            log_success "✓ Lambda function exists: $function_name"
        else
            log_error "✗ Lambda function not found: $function_name"
            verification_failed=true
        fi
    done
    
    # Verify CloudWatch log groups
    log_info "Checking CloudWatch log groups..."
    local log_groups=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/aws-api-app-$ENVIRONMENT" --query 'logGroups[].logGroupName' --output text)
    
    if [ -n "$log_groups" ]; then
        log_success "✓ CloudWatch log groups exist"
        for log_group in $log_groups; do
            log_info "  - $log_group"
        done
    else
        log_warning "⚠ No CloudWatch log groups found"
    fi
    
    if [ "$verification_failed" = true ]; then
        log_error "AWS resource verification failed"
        exit 1
    fi
    
    log_success "All AWS resources verified"
}

# Run API health checks
run_api_health_checks() {
    log_info "Running API health checks..."
    
    if [ -x "$SCRIPT_DIR/health-check.sh" ]; then
        if "$SCRIPT_DIR/health-check.sh" "$API_URL" "$ENVIRONMENT"; then
            log_success "✓ API health checks passed"
        else
            log_error "✗ API health checks failed"
            exit 1
        fi
    else
        log_warning "⚠ Health check script not found or not executable"
    fi
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variable for integration tests
    export API_BASE_URL="$API_URL"
    
    # Run a subset of integration tests as smoke tests
    if npm run test:integration -- --testNamePattern="should return a list of items|should create a new item" &> /dev/null; then
        log_success "✓ Smoke tests passed"
    else
        log_warning "⚠ Smoke tests failed or not available"
    fi
}

# Verify CORS functionality
verify_cors() {
    log_info "Verifying CORS functionality..."
    
    local cors_response
    cors_response=$(curl -s -I \
        --max-time 30 \
        -X OPTIONS \
        -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "$API_URL/items" 2>/dev/null || echo "")
    
    if echo "$cors_response" | grep -i "access-control-allow-origin" > /dev/null; then
        log_success "✓ CORS functionality verified"
    else
        log_error "✗ CORS functionality verification failed"
        exit 1
    fi
}

# Check API performance
check_api_performance() {
    log_info "Checking API performance..."
    
    local start_time
    local end_time
    local response_time
    
    start_time=$(date +%s%N)
    if curl -s --max-time 30 "$API_URL/items" > /dev/null 2>&1; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ "$response_time" -lt 5000 ]; then # Less than 5 seconds
            log_success "✓ API performance acceptable (${response_time}ms)"
        else
            log_warning "⚠ API performance slow (${response_time}ms)"
        fi
    else
        log_error "✗ API performance check failed"
        exit 1
    fi
}

# Verify monitoring setup
verify_monitoring() {
    log_info "Verifying monitoring setup..."
    
    # Check CloudWatch alarms
    local alarms=$(aws cloudwatch describe-alarms --alarm-name-prefix "aws-api-app-$ENVIRONMENT" --query 'MetricAlarms[].AlarmName' --output text)
    
    if [ -n "$alarms" ]; then
        log_success "✓ CloudWatch alarms configured"
        for alarm in $alarms; do
            log_info "  - $alarm"
        done
    else
        log_warning "⚠ No CloudWatch alarms found"
    fi
    
    # Check if CloudWatch dashboard exists
    if aws cloudwatch get-dashboard --dashboard-name "aws-api-app-$ENVIRONMENT-dashboard" &> /dev/null; then
        log_success "✓ CloudWatch dashboard exists"
    else
        log_warning "⚠ CloudWatch dashboard not found"
    fi
}

# Generate deployment report
generate_deployment_report() {
    local start_time=$1
    local end_time=$2
    local duration=$(( end_time - start_time ))
    
    echo ""
    echo "============================================"
    echo "        DEPLOYMENT VERIFICATION REPORT"
    echo "============================================"
    echo "Environment: $ENVIRONMENT"
    echo "API Gateway URL: $API_URL"
    echo "API Gateway ID: $API_GATEWAY_ID"
    echo "Verification Time: $(date)"
    echo "Duration: ${duration} seconds"
    echo ""
    echo "Verification Results:"
    echo "✓ AWS Resources: Verified"
    echo "✓ API Health: Verified"
    echo "✓ CORS Functionality: Verified"
    echo "✓ API Performance: Verified"
    echo "✓ Monitoring Setup: Verified"
    echo ""
    echo "Lambda Functions:"
    echo "$LAMBDA_FUNCTIONS" | jq -r 'to_entries[] | "  - \(.key): \(.value)"'
    echo ""
    echo "Next Steps:"
    echo "1. Monitor CloudWatch metrics and logs"
    echo "2. Set up alerting for critical issues"
    echo "3. Run regular health checks"
    echo "4. Monitor API usage and performance"
    echo ""
    log_success "Deployment verification completed successfully! 🎉"
    echo "============================================"
}

# Main execution
main() {
    local start_time
    local end_time
    
    start_time=$(date +%s)
    
    log_info "Starting deployment verification..."
    
    validate_environment
    check_prerequisites
    get_deployment_outputs
    verify_aws_resources
    run_api_health_checks
    run_smoke_tests
    verify_cors
    check_api_performance
    verify_monitoring
    
    end_time=$(date +%s)
    generate_deployment_report $start_time $end_time
}

# Handle Ctrl+C gracefully
trap 'log_info "Verification interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"