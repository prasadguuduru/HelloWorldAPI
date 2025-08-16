#!/bin/bash

# Deployment script for AWS API Gateway + Lambda application
# Usage: ./scripts/deploy.sh [environment] [action]
# Example: ./scripts/deploy.sh dev apply

set -e

# Default values
ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

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
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Validate action
validate_action() {
    case $ACTION in
        init|plan|apply|destroy|output|validate)
            log_info "Running Terraform $ACTION"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            log_error "Valid actions: init, plan, apply, destroy, output, validate"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
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

# Build the application
build_application() {
    log_info "Building the application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        npm install
    fi
    
    # Build the TypeScript code
    log_info "Building TypeScript code..."
    npm run build
    
    log_success "Application built successfully"
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    terraform init
    
    log_success "Terraform initialized successfully"
}

# Validate Terraform configuration
terraform_validate() {
    log_info "Validating Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    terraform validate
    
    log_success "Terraform configuration is valid"
}

# Plan Terraform deployment
terraform_plan() {
    log_info "Planning Terraform deployment for $ENVIRONMENT..."
    
    cd "$TERRAFORM_DIR"
    
    terraform plan \
        -var-file="environments/${ENVIRONMENT}.tfvars" \
        -out="${ENVIRONMENT}.tfplan"
    
    log_success "Terraform plan completed"
}

# Apply Terraform deployment
terraform_apply() {
    log_info "Applying Terraform deployment for $ENVIRONMENT..."
    
    cd "$TERRAFORM_DIR"
    
    # Check if plan file exists
    if [ -f "${ENVIRONMENT}.tfplan" ]; then
        terraform apply "${ENVIRONMENT}.tfplan"
    else
        log_warning "No plan file found. Running apply with auto-approve..."
        terraform apply \
            -var-file="environments/${ENVIRONMENT}.tfvars" \
            -auto-approve
    fi
    
    log_success "Terraform deployment completed"
}

# Destroy Terraform resources
terraform_destroy() {
    log_warning "This will destroy all resources in the $ENVIRONMENT environment!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Destroying Terraform resources for $ENVIRONMENT..."
        
        cd "$TERRAFORM_DIR"
        
        terraform destroy \
            -var-file="environments/${ENVIRONMENT}.tfvars" \
            -auto-approve
        
        log_success "Terraform resources destroyed"
    else
        log_info "Destroy operation cancelled"
        exit 0
    fi
}

# Show Terraform outputs
terraform_output() {
    log_info "Showing Terraform outputs for $ENVIRONMENT..."
    
    cd "$TERRAFORM_DIR"
    
    terraform output
}

# Main execution
main() {
    log_info "Starting deployment script..."
    
    validate_environment
    validate_action
    check_prerequisites
    
    # Build application for all actions except output
    if [ "$ACTION" != "output" ]; then
        build_application
    fi
    
    # Execute the requested action
    case $ACTION in
        init)
            terraform_init
            ;;
        validate)
            terraform_init
            terraform_validate
            ;;
        plan)
            terraform_init
            terraform_validate
            terraform_plan
            ;;
        apply)
            terraform_init
            terraform_validate
            terraform_plan
            terraform_apply
            terraform_output
            ;;
        destroy)
            terraform_destroy
            ;;
        output)
            terraform_output
            ;;
    esac
    
    log_success "Deployment script completed successfully!"
}

# Run main function
main "$@"