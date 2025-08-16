#!/bin/bash

# Test script for AWS API Gateway + Lambda application
# Usage: ./scripts/test.sh [test-type]
# Example: ./scripts/test.sh unit

set -e

# Default values
TEST_TYPE=${1:-all}
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

# Validate test type
validate_test_type() {
    case $TEST_TYPE in
        unit|integration|all|coverage)
            log_info "Running $TEST_TYPE tests"
            ;;
        *)
            log_error "Invalid test type: $TEST_TYPE"
            log_error "Valid test types: unit, integration, all, coverage"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log_info "Dependencies already installed"
    fi
    
    log_success "Dependencies ready"
}

# Build the application
build_application() {
    log_info "Building the application..."
    
    cd "$PROJECT_ROOT"
    npm run build
    
    log_success "Application built successfully"
}

# Run unit tests
run_unit_tests() {
    log_info "Running unit tests..."
    
    cd "$PROJECT_ROOT"
    npx jest tests/unit --verbose --coverage=false
    
    log_success "Unit tests completed"
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$PROJECT_ROOT"
    npx jest tests/integration --verbose --coverage=false
    
    log_success "Integration tests completed"
}

# Run all tests
run_all_tests() {
    log_info "Running all tests..."
    
    cd "$PROJECT_ROOT"
    npx jest --verbose --coverage=false
    
    log_success "All tests completed"
}

# Run tests with coverage
run_coverage_tests() {
    log_info "Running tests with coverage..."
    
    cd "$PROJECT_ROOT"
    npx jest --coverage --verbose
    
    log_success "Coverage tests completed"
    log_info "Coverage report generated in coverage/ directory"
}

# Display test summary
display_summary() {
    log_info "Test Summary:"
    echo "============================================"
    
    case $TEST_TYPE in
        unit)
            echo "✓ Unit tests: PASSED"
            ;;
        integration)
            echo "✓ Integration tests: PASSED"
            ;;
        all)
            echo "✓ Unit tests: PASSED"
            echo "✓ Integration tests: PASSED"
            ;;
        coverage)
            echo "✓ All tests with coverage: PASSED"
            echo "✓ Coverage report: Generated"
            ;;
    esac
    
    echo "============================================"
}

# Main execution
main() {
    log_info "Starting test script..."
    
    validate_test_type
    check_prerequisites
    install_dependencies
    build_application
    
    # Execute the requested test type
    case $TEST_TYPE in
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        all)
            run_all_tests
            ;;
        coverage)
            run_coverage_tests
            ;;
    esac
    
    display_summary
    log_success "Test script completed successfully!"
}

# Run main function
main "$@"