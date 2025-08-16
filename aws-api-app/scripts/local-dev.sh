#!/bin/bash

# Local development script for AWS API Gateway + Lambda application
# Usage: ./scripts/local-dev.sh [command]
# Commands: start, stop, build, test, logs, clean

set -e

# Default values
COMMAND=${1:-start}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SAM_PORT=${SAM_PORT:-3000}
SAM_DEBUG_PORT=${SAM_DEBUG_PORT:-5858}

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

# Validate command
validate_command() {
    case $COMMAND in
        start|stop|build|test|logs|clean|help)
            log_info "Running command: $COMMAND"
            ;;
        *)
            log_error "Invalid command: $COMMAND"
            log_error "Valid commands: start, stop, build, test, logs, clean, help"
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
    
    # Check if SAM CLI is installed
    if ! command -v sam &> /dev/null; then
        log_warning "SAM CLI is not installed."
        log_info "Please install SAM CLI manually:"
        log_info "  macOS: brew install aws-sam-cli"
        log_info "  Linux: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html"
        log_info "  Windows: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-windows.html"
        log_error "SAM CLI is required for local development"
        exit 1
    fi
    
    # Check if Docker is running (required for SAM local)
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        log_info "SAM CLI requires Docker to run Lambda functions locally."
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
    
    # Clean previous build
    rm -rf lib/
    
    # Build TypeScript
    npm run build
    
    # Copy package.json to lib directory for SAM
    cp package.json lib/
    
    # Install production dependencies in lib directory
    cd lib
    npm install --production --silent
    cd ..
    
    log_success "Application built successfully"
}

# Start local development server
start_local_server() {
    log_info "Starting local development server..."
    
    cd "$PROJECT_ROOT"
    
    # Build first
    build_application
    
    log_info "Starting SAM local API on port $SAM_PORT"
    log_info "API will be available at: http://localhost:$SAM_PORT"
    log_info "Press Ctrl+C to stop the server"
    
    # Start SAM local API
    sam local start-api \
        --port $SAM_PORT \
        --host 0.0.0.0 \
        --debug-port $SAM_DEBUG_PORT \
        --warm-containers EAGER \
        --parameter-overrides Stage=local
}

# Stop local development server
stop_local_server() {
    log_info "Stopping local development server..."
    
    # Find and kill SAM processes
    SAM_PIDS=$(pgrep -f "sam local start-api" || true)
    if [ -n "$SAM_PIDS" ]; then
        echo "$SAM_PIDS" | xargs kill -TERM
        log_success "Local development server stopped"
    else
        log_info "No running local development server found"
    fi
    
    # Clean up Docker containers
    log_info "Cleaning up Docker containers..."
    docker container prune -f &> /dev/null || true
    
    log_success "Cleanup completed"
}

# Run local tests
run_local_tests() {
    log_info "Running tests against local server..."
    
    # Check if local server is running
    if ! curl -s http://localhost:$SAM_PORT/items &> /dev/null; then
        log_error "Local server is not running on port $SAM_PORT"
        log_info "Start the local server first with: ./scripts/local-dev.sh start"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Set environment variable for integration tests
    export API_BASE_URL="http://localhost:$SAM_PORT"
    
    # Run integration tests
    npm run test:integration
    
    log_success "Local tests completed"
}

# Show logs
show_logs() {
    log_info "Showing SAM local logs..."
    
    # This will show Docker logs for SAM containers
    docker logs $(docker ps -q --filter "ancestor=public.ecr.aws/sam/emulation-nodejs18.x") 2>/dev/null || {
        log_warning "No SAM containers found. Make sure the local server is running."
    }
}

# Clean up local development environment
clean_environment() {
    log_info "Cleaning up local development environment..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any running servers
    stop_local_server
    
    # Clean build artifacts
    rm -rf lib/
    rm -rf .aws-sam/
    
    # Clean Docker images and containers
    log_info "Cleaning Docker resources..."
    docker system prune -f &> /dev/null || true
    
    log_success "Environment cleaned"
}

# Show help
show_help() {
    echo "Local Development Script for AWS API Gateway + Lambda"
    echo ""
    echo "Usage: ./scripts/local-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    Start the local development server (default)"
    echo "  stop     Stop the local development server"
    echo "  build    Build the application for local testing"
    echo "  test     Run tests against the local server"
    echo "  logs     Show logs from the local server"
    echo "  clean    Clean up local development environment"
    echo "  help     Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SAM_PORT         Port for SAM local API (default: 3000)"
    echo "  SAM_DEBUG_PORT   Port for debugging (default: 5858)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/local-dev.sh start"
    echo "  SAM_PORT=8080 ./scripts/local-dev.sh start"
    echo "  ./scripts/local-dev.sh test"
    echo "  ./scripts/local-dev.sh clean"
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js and npm"
    echo "  - Docker (running)"
    echo "  - AWS SAM CLI (will be installed if missing)"
}

# Main execution
main() {
    case $COMMAND in
        help)
            show_help
            ;;
        *)
            log_info "Starting local development script..."
            validate_command
            check_prerequisites
            install_dependencies
            
            case $COMMAND in
                start)
                    start_local_server
                    ;;
                stop)
                    stop_local_server
                    ;;
                build)
                    build_application
                    ;;
                test)
                    run_local_tests
                    ;;
                logs)
                    show_logs
                    ;;
                clean)
                    clean_environment
                    ;;
            esac
            ;;
    esac
    
    log_success "Local development script completed!"
}

# Handle Ctrl+C gracefully
trap 'log_info "Received interrupt signal, cleaning up..."; stop_local_server; exit 0' INT TERM

# Run main function
main "$@"