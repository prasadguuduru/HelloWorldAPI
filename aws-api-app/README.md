# AWS API Gateway + Lambda Application

A production-ready serverless API application built with AWS API Gateway, Lambda functions, and Terraform using TypeScript.

## 🚀 Features

- **RESTful API** with full CRUD operations
- **AWS Lambda functions** for serverless business logic
- **Terraform** for Infrastructure as Code
- **TypeScript** for type safety and developer experience
- **Comprehensive testing** with Jest (unit + integration)
- **Local development** environment with SAM
- **CI/CD pipelines** for GitHub Actions, GitLab CI, and Jenkins
- **CORS support** for cross-origin requests
- **Error handling** and input validation
- **Monitoring** and logging with CloudWatch
- **Security** best practices and vulnerability scanning

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Monitoring](#monitoring)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or later
- **npm** (comes with Node.js)
- **AWS CLI** configured with appropriate permissions
- **Terraform** >= 1.0 ([Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli))
- **Docker** (for local development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd aws-api-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Deploy to AWS:**
   ```bash
   npm run deploy:dev
   ```

## 📁 Project Structure

```
aws-api-app/
├── src/                          # Source code
│   ├── types/                   # TypeScript type definitions
│   └── lambda/
│       ├── handlers/            # Lambda function handlers
│       └── utils/               # Utility functions
├── terraform/                   # Infrastructure as Code
│   ├── environments/           # Environment-specific configurations
│   ├── main.tf                 # Main Terraform configuration
│   ├── variables.tf            # Input variables
│   └── outputs.tf              # Output values
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test fixtures and data
├── scripts/                     # Deployment and utility scripts
├── .github/workflows/          # GitHub Actions CI/CD
├── .vscode/                    # VS Code configuration
├── template.yaml               # SAM template for local development
├── DEVELOPMENT.md              # Development guide
├── DEPLOYMENT.md               # Deployment guide
└── lib/                        # Compiled TypeScript output
```

## 💻 Development

### Local Development

Start the local development server:
```bash
npm run dev
```

This will:
- Build the TypeScript code
- Start SAM local API on port 3000
- Enable hot reloading on file changes

### Available Scripts

#### Development
- `npm run dev` - Start local development server
- `npm run dev:watch` - Start with hot reloading
- `npm run dev:build` - Build for local development
- `npm run dev:stop` - Stop local development server

#### Building
- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and compile

#### Testing
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

#### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

#### Deployment
- `npm run deploy:dev` - Deploy to development
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:prod` - Deploy to production
- `npm run destroy` - Destroy development resources

### Local API Testing

Once the local server is running, test the API:

```bash
# List items
curl http://localhost:3000/items

# Create item
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test Description"}'

# Get specific item
curl http://localhost:3000/items/1

# Update item
curl -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Item"}'

# Delete item
curl -X DELETE http://localhost:3000/items/1
```

## 🚀 Deployment

### Environment Configuration

The application supports multiple environments:

- **Development** (`dev`): For feature development and testing
- **Staging** (`staging`): For pre-production testing
- **Production** (`prod`): For live production traffic

### Quick Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires manual approval in CI/CD)
npm run deploy:prod
```

### Manual Deployment

```bash
# Using deployment script
./scripts/deploy.sh dev apply
./scripts/deploy.sh staging apply
./scripts/deploy.sh prod apply

# Using Terraform directly
terraform -chdir=terraform init
terraform -chdir=terraform plan -var-file=environments/dev.tfvars
terraform -chdir=terraform apply -var-file=environments/dev.tfvars
```

### Deployment Outputs

After deployment, you'll receive:
- **API Gateway URL**: The endpoint for your API
- **Lambda Function Names**: Names of deployed functions
- **CloudWatch Log Groups**: For monitoring and debugging

## 📖 API Documentation

### Interactive Documentation

🌟 **View the complete interactive API documentation with Swagger UI:**

- **GitHub Pages**: https://prasadguuduru.github.io/HelloWorldAPI/ *(Enable GitHub Pages in repository settings)*
- **Local**: Run `cd docs && python -m http.server 8080` then visit http://localhost:8080

The documentation includes:
- ✅ Interactive API testing
- ✅ Complete request/response examples  
- ✅ Schema definitions and validation rules
- ✅ Error response formats
- ✅ Authentication details

### Base URL
```
https://{api-gateway-id}.execute-api.{region}.amazonaws.com/{stage}
```

### Endpoints

#### GET /items
List all items with optional filtering and pagination.

**Query Parameters:**
- `limit` (optional): Number of items to return (1-100, default: 10)
- `offset` (optional): Number of items to skip (default: 0)
- `status` (optional): Filter by status (`active` or `inactive`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Sample Item",
      "description": "Item description",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /items/{id}
Get a specific item by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Sample Item",
    "description": "Item description",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /items
Create a new item.

**Request Body:**
```json
{
  "name": "New Item",
  "description": "Item description"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "New Item",
    "description": "Item description",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /items/{id}
Update an existing item.

**Request Body:**
```json
{
  "name": "Updated Item",
  "description": "Updated description",
  "status": "inactive"
}
```

#### DELETE /items/{id}
Delete an item.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1"
  }
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

### Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints end-to-end
- **Performance Tests**: Test response times and concurrency
- **Security Tests**: Test input validation and error handling

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest tests/unit/handlers/items.test.ts
```

### Test Coverage

The project maintains high test coverage:
- **Unit Tests**: >90% code coverage
- **Integration Tests**: All API endpoints
- **Error Scenarios**: Validation, not found, server errors

## 🔄 CI/CD

### Supported Platforms

- **GitHub Actions** (`.github/workflows/ci-cd.yml`)
- **GitLab CI** (`.gitlab-ci.yml`)
- **Jenkins** (`Jenkinsfile`)

### Pipeline Stages

1. **Test & Build**: Lint, test, and build the application
2. **Security Scan**: Vulnerability scanning with Snyk
3. **Terraform Validation**: Validate infrastructure code
4. **Deploy Dev**: Automatic deployment to development
5. **Deploy Staging**: Manual deployment to staging
6. **Deploy Production**: Manual deployment to production

### Environment Variables

Set these secrets in your CI/CD platform:

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `SNYK_TOKEN` - Snyk security scanning token

## 📊 Monitoring

### CloudWatch Integration

- **Lambda Metrics**: Duration, errors, throttles
- **API Gateway Metrics**: Request count, latency, errors
- **Custom Metrics**: Business logic metrics
- **Alarms**: Automated alerting for issues

### Health Checks

Run health checks against deployed API:

```bash
# Check API health
./scripts/health-check.sh https://your-api-url.com/v1 production

# The script tests:
# - Basic connectivity
# - All CRUD endpoints
# - CORS functionality
# - Response times
```

### Logs

Access logs through AWS CloudWatch:

```bash
# View Lambda logs
aws logs tail /aws/lambda/aws-api-app-prod-list-items --follow

# View API Gateway logs
aws logs tail /aws/apigateway/aws-api-app-prod --follow
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make changes** and write tests
4. **Run tests**: `npm test`
5. **Run linting**: `npm run lint:fix`
6. **Commit changes**: `git commit -m "Add new feature"`
7. **Push to branch**: `git push origin feature/new-feature`
8. **Create Pull Request**

### Code Standards

- **TypeScript**: Use strict typing throughout
- **ESLint**: Follow configured linting rules
- **Prettier**: Use consistent code formatting
- **Testing**: Write tests for all new functionality
- **Documentation**: Update documentation for changes

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add description of changes
4. Request review from maintainers
5. Address feedback and re-request review

## 📚 Additional Documentation

- **[Development Guide](DEVELOPMENT.md)** - Detailed development setup and workflows
- **[Deployment Guide](DEPLOYMENT.md)** - Comprehensive deployment instructions

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the guides in this repository

## 🏷️ Version

Current version: 1.0.0