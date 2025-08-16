# Deployment Guide

This guide covers deployment procedures for the AWS API Gateway + Lambda application using Terraform.

## Prerequisites

### Required Tools

- **Terraform** >= 1.0 ([Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli))
- **AWS CLI** >= 2.0 ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **Node.js** >= 18.x
- **npm** (comes with Node.js)

### AWS Configuration

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```
   Or use environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=us-east-1
   ```

2. **Verify AWS access:**
   ```bash
   aws sts get-caller-identity
   ```

### Required AWS Permissions

Your AWS user/role needs the following permissions:
- **Lambda**: Create, update, delete functions
- **API Gateway**: Create, update, delete APIs
- **IAM**: Create, update, delete roles and policies
- **CloudWatch**: Create, update, delete log groups and alarms
- **S3**: Access to Terraform state bucket (if using remote state)

## Quick Deployment

### Development Environment

```bash
# Deploy to development
npm run deploy:dev

# Or using the deployment script directly
./scripts/deploy.sh dev apply
```

### Staging Environment

```bash
# Deploy to staging
npm run deploy:staging

# Or using the deployment script directly
./scripts/deploy.sh staging apply
```

### Production Environment

```bash
# Deploy to production
npm run deploy:prod

# Or using the deployment script directly
./scripts/deploy.sh prod apply
```

## Deployment Scripts

### Main Deployment Script

The `scripts/deploy.sh` script provides comprehensive deployment functionality:

```bash
# Usage
./scripts/deploy.sh [environment] [action]

# Examples
./scripts/deploy.sh dev plan      # Plan development deployment
./scripts/deploy.sh dev apply     # Apply development deployment
./scripts/deploy.sh staging plan  # Plan staging deployment
./scripts/deploy.sh prod apply    # Apply production deployment
./scripts/deploy.sh dev destroy   # Destroy development resources
```

### Available Actions

- **`init`**: Initialize Terraform
- **`plan`**: Show deployment plan
- **`apply`**: Apply changes to AWS
- **`destroy`**: Destroy all resources
- **`output`**: Show deployment outputs
- **`validate`**: Validate Terraform configuration

### Environment-Specific Deployments

Each environment has its own configuration file:

- **Development**: `terraform/environments/dev.tfvars`
- **Staging**: `terraform/environments/staging.tfvars`
- **Production**: `terraform/environments/prod.tfvars`

## Terraform Configuration

### Backend Configuration

#### S3 Backend (Recommended for Production)

1. **Create S3 bucket for Terraform state:**
   ```bash
   aws s3 mb s3://your-terraform-state-bucket
   aws s3api put-bucket-versioning \
     --bucket your-terraform-state-bucket \
     --versioning-configuration Status=Enabled
   ```

2. **Create DynamoDB table for state locking:**
   ```bash
   aws dynamodb create-table \
     --table-name terraform-state-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

3. **Create backend configuration:**
   ```bash
   cp terraform/backend.tf.example terraform/backend.tf
   # Edit backend.tf with your bucket and table names
   ```

#### Local Backend (Development Only)

For local development, you can use local state:
```bash
# No additional setup required
# State will be stored in terraform.tfstate file
```

### Environment Configuration

#### Development Environment

```hcl
# terraform/environments/dev.tfvars
environment  = "dev"
aws_region   = "us-east-1"

# Lambda configuration
lambda_timeout     = 30
lambda_memory_size = 256

# API Gateway configuration
api_gateway_throttle_rate_limit  = 100
api_gateway_throttle_burst_limit = 200

# Monitoring
log_retention_days = 7
enable_xray_tracing = true
```

#### Staging Environment

```hcl
# terraform/environments/staging.tfvars
environment  = "staging"
aws_region   = "us-east-1"

# Lambda configuration
lambda_timeout     = 30
lambda_memory_size = 512

# API Gateway configuration
api_gateway_throttle_rate_limit  = 500
api_gateway_throttle_burst_limit = 1000

# Monitoring
log_retention_days = 30
enable_xray_tracing = true
enable_detailed_monitoring = true
```

#### Production Environment

```hcl
# terraform/environments/prod.tfvars
environment  = "prod"
aws_region   = "us-east-1"

# Lambda configuration
lambda_timeout     = 30
lambda_memory_size = 1024

# API Gateway configuration
api_gateway_throttle_rate_limit  = 2000
api_gateway_throttle_burst_limit = 4000

# Monitoring
log_retention_days = 90
enable_xray_tracing = true
enable_detailed_monitoring = true
enable_waf = true
```

## Deployment Process

### Step-by-Step Deployment

1. **Prepare the application:**
   ```bash
   # Install dependencies
   npm install
   
   # Run tests
   npm test
   
   # Build the application
   npm run build
   ```

2. **Initialize Terraform (first time only):**
   ```bash
   ./scripts/deploy.sh dev init
   ```

3. **Plan the deployment:**
   ```bash
   ./scripts/deploy.sh dev plan
   ```

4. **Review the plan output** and ensure it matches expectations

5. **Apply the deployment:**
   ```bash
   ./scripts/deploy.sh dev apply
   ```

6. **Verify the deployment:**
   ```bash
   # Get API Gateway URL
   ./scripts/deploy.sh dev output
   
   # Test the API
   curl https://your-api-gateway-url/items
   ```

### Deployment Outputs

After successful deployment, you'll get:

```bash
# API Gateway URLs
api_gateway_url = "https://abc123.execute-api.us-east-1.amazonaws.com/"
api_gateway_stage_url = "https://abc123.execute-api.us-east-1.amazonaws.com/v1"

# Lambda function names
lambda_function_names = {
  "create_item" = "aws-api-app-dev-create-item"
  "delete_item" = "aws-api-app-dev-delete-item"
  "get_item" = "aws-api-app-dev-get-item"
  "list_items" = "aws-api-app-dev-list-items"
  "update_item" = "aws-api-app-dev-update-item"
}

# CloudWatch log groups
cloudwatch_log_groups = {
  "api_gateway" = "/aws/apigateway/aws-api-app-dev"
  "lambda_logs" = {
    "create_item" = "/aws/lambda/aws-api-app-dev-create-item"
    # ... other functions
  }
}
```

## Environment Management

### Multiple Environments

The application supports multiple environments with isolated resources:

```bash
# Deploy to all environments
./scripts/deploy.sh dev apply
./scripts/deploy.sh staging apply
./scripts/deploy.sh prod apply

# Each environment has separate:
# - Lambda functions
# - API Gateway
# - CloudWatch logs
# - IAM roles
```

### Environment Promotion

To promote code from one environment to another:

1. **Test in development:**
   ```bash
   ./scripts/deploy.sh dev apply
   # Run integration tests
   npm run test:integration
   ```

2. **Deploy to staging:**
   ```bash
   ./scripts/deploy.sh staging apply
   # Run staging tests
   ```

3. **Deploy to production:**
   ```bash
   ./scripts/deploy.sh prod apply
   # Monitor production metrics
   ```

## Rollback Procedures

### Terraform Rollback

1. **Identify the previous state:**
   ```bash
   terraform state list
   terraform show
   ```

2. **Rollback using previous Terraform configuration:**
   ```bash
   git checkout previous-working-commit
   ./scripts/deploy.sh prod apply
   ```

### Lambda Function Rollback

1. **List function versions:**
   ```bash
   aws lambda list-versions-by-function \
     --function-name aws-api-app-prod-list-items
   ```

2. **Update function to previous version:**
   ```bash
   aws lambda update-alias \
     --function-name aws-api-app-prod-list-items \
     --name LIVE \
     --function-version previous-version
   ```

## Monitoring and Verification

### Post-Deployment Verification

1. **Check API Gateway:**
   ```bash
   # Get API URL from Terraform output
   API_URL=$(terraform -chdir=terraform output -raw api_gateway_stage_url)
   
   # Test endpoints
   curl $API_URL/items
   curl -X POST $API_URL/items \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","description":"Test item"}'
   ```

2. **Check Lambda functions:**
   ```bash
   # List functions
   aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `aws-api-app-prod`)].FunctionName'
   
   # Check function logs
   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/aws-api-app-prod"
   ```

3. **Check CloudWatch metrics:**
   ```bash
   # API Gateway metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApiGateway \
     --metric-name Count \
     --dimensions Name=ApiName,Value=aws-api-app-prod-api \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-01T23:59:59Z \
     --period 3600 \
     --statistics Sum
   ```

### Health Checks

Create a simple health check script:

```bash
#!/bin/bash
# scripts/health-check.sh

API_URL=$1
if [ -z "$API_URL" ]; then
  echo "Usage: $0 <api-url>"
  exit 1
fi

echo "Checking API health at $API_URL"

# Test GET /items
if curl -s -f "$API_URL/items" > /dev/null; then
  echo "✓ GET /items - OK"
else
  echo "✗ GET /items - FAILED"
  exit 1
fi

# Test POST /items
if curl -s -f -X POST "$API_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Health Check","description":"Test item"}' > /dev/null; then
  echo "✓ POST /items - OK"
else
  echo "✗ POST /items - FAILED"
  exit 1
fi

echo "All health checks passed!"
```

## Troubleshooting

### Common Deployment Issues

1. **Terraform State Lock:**
   ```bash
   # If deployment is stuck due to state lock
   terraform force-unlock LOCK_ID
   ```

2. **Lambda Function Update Errors:**
   ```bash
   # Check function status
   aws lambda get-function --function-name function-name
   
   # Check CloudWatch logs
   aws logs tail /aws/lambda/function-name --follow
   ```

3. **API Gateway Deployment Issues:**
   ```bash
   # Check API Gateway status
   aws apigateway get-rest-apis
   
   # Check deployment status
   aws apigateway get-deployments --rest-api-id api-id
   ```

4. **Permission Issues:**
   ```bash
   # Check IAM role
   aws iam get-role --role-name role-name
   
   # Check attached policies
   aws iam list-attached-role-policies --role-name role-name
   ```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Terraform debug
TF_LOG=DEBUG ./scripts/deploy.sh dev apply

# AWS CLI debug
AWS_CLI_DEBUG=1 aws lambda list-functions
```

## Security Considerations

### Secrets Management

- **Never commit secrets** to version control
- **Use AWS Secrets Manager** or Parameter Store for sensitive data
- **Rotate credentials** regularly
- **Use IAM roles** instead of access keys when possible

### Network Security

- **API Gateway**: Configure throttling and request validation
- **Lambda**: Use VPC configuration if needed
- **CloudWatch**: Monitor for suspicious activity

### Access Control

- **Principle of least privilege** for IAM roles
- **Environment isolation** with separate AWS accounts
- **Resource tagging** for cost allocation and governance

## Cost Optimization

### Resource Sizing

- **Lambda memory**: Start with 256MB, adjust based on performance
- **API Gateway**: Use caching for frequently accessed data
- **CloudWatch**: Set appropriate log retention periods

### Monitoring Costs

```bash
# Check AWS costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Automation and CI/CD

The deployment scripts are designed to work with CI/CD pipelines. See the CI/CD configuration files for:

- **GitHub Actions**: `.github/workflows/`
- **GitLab CI**: `.gitlab-ci.yml`
- **Jenkins**: `Jenkinsfile`

## Best Practices

### Deployment Best Practices

1. **Always run tests** before deployment
2. **Use infrastructure as code** (Terraform)
3. **Deploy to staging first**
4. **Monitor deployments** with CloudWatch
5. **Have rollback procedures** ready
6. **Use blue-green deployments** for zero downtime
7. **Tag all resources** for organization
8. **Document all changes**

### Security Best Practices

1. **Use least privilege** IAM policies
2. **Enable CloudTrail** for audit logging
3. **Encrypt data** at rest and in transit
4. **Regular security reviews**
5. **Keep dependencies updated**

### Operational Best Practices

1. **Monitor application metrics**
2. **Set up alerting** for critical issues
3. **Regular backup** of important data
4. **Disaster recovery planning**
5. **Performance optimization**