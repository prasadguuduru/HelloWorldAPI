# Development Guide

This guide covers local development setup and workflows for the AWS API Gateway + Lambda application.

## Prerequisites

- **Node.js** 18.x or later
- **npm** (comes with Node.js)
- **Docker** (for SAM local testing)
- **AWS SAM CLI** (install manually: `brew install aws-sam-cli` on macOS)
- **Git** (for version control)

### Optional Tools

- **AWS CLI** (for AWS operations)
- **Terraform** (for infrastructure deployment)
- **VS Code** (recommended IDE with provided configurations)

## Quick Start

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd aws-api-app
   npm install
   ```

2. **Start local development server:**
   ```bash
   npm run dev
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/items
   ```

## Development Scripts

### Core Development Commands

```bash
# Start local development server
npm run dev

# Start with hot reloading (rebuilds on file changes)
npm run dev:watch

# Stop local development server
npm run dev:stop

# Build the application
npm run build

# Build and watch for changes
npm run watch
```

### Testing Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Local Development Commands

```bash
# Build for local development
npm run dev:build

# View local server logs
npm run dev:logs

# Clean local development environment
npm run dev:clean

# Start SAM local directly
npm run sam:start

# Build SAM application
npm run sam:build
```

### Code Quality Commands

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Local Development Environment

### SAM Local

The application uses AWS SAM (Serverless Application Model) for local development. SAM provides:

- **Local API Gateway**: Simulates API Gateway locally
- **Local Lambda Runtime**: Runs Lambda functions in Docker containers
- **Hot Reloading**: Automatically reloads on code changes
- **Debug Support**: Attach debugger to running functions

### Configuration Files

- **`template.yaml`**: SAM template for local development
- **`nodemon.json`**: Hot reloading configuration
- **`.env.example`**: Environment variables template
- **`docker-compose.yml`**: Additional local services (optional)

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables:
- `NODE_ENV`: Environment (development/test/production)
- `LOG_LEVEL`: Logging level (DEBUG/INFO/WARN/ERROR)
- `SAM_PORT`: Port for local API (default: 3000)
- `SAM_DEBUG_PORT`: Port for debugging (default: 5858)

## VS Code Integration

The project includes VS Code configurations for:

### Debugging

- **Debug Lambda Function**: Attach to running SAM local function
- **Debug Tests**: Debug Jest tests with breakpoints
- **Debug Integration Tests**: Debug integration tests against local API

### Tasks

- **Build**: Compile TypeScript
- **Test**: Run test suite
- **Start Local Server**: Launch SAM local
- **Deploy Dev**: Deploy to development environment

### Extensions Recommended

- **TypeScript**: Language support
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Test runner integration
- **AWS Toolkit**: AWS integration

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development server with hot reloading
npm run dev:watch

# Make changes to src/ files
# Server automatically rebuilds and reloads

# Run tests
npm run test:unit

# Test against local API
npm run test:integration
```

### 2. Testing Workflow

```bash
# Run specific test file
npx jest tests/unit/handlers/items.test.ts

# Run tests matching pattern
npx jest --testNamePattern="should create item"

# Run tests with coverage
npm run test:coverage

# Debug tests in VS Code
# Use "Debug Tests" launch configuration
```

### 3. API Testing

```bash
# Start local server
npm run dev

# Test endpoints manually
curl -X GET http://localhost:3000/items
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test Description"}'

# Or use automated integration tests
npm run test:integration
```

## Project Structure

```
aws-api-app/
├── src/                    # Source code
│   ├── types/             # TypeScript type definitions
│   └── lambda/            # Lambda function code
│       ├── handlers/      # Lambda handlers
│       └── utils/         # Utility functions
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test fixtures
├── terraform/            # Infrastructure code
├── scripts/              # Development scripts
├── .vscode/              # VS Code configuration
├── template.yaml         # SAM template
├── nodemon.json          # Hot reloading config
└── docker-compose.yml    # Local services
```

## Debugging

### Lambda Functions

1. Start SAM local with debug mode:
   ```bash
   npm run dev
   ```

2. In VS Code, use "Debug Lambda Function" configuration
3. Set breakpoints in your TypeScript code
4. Make API requests to trigger breakpoints

### Tests

1. Set breakpoints in test files
2. Use "Debug Tests" VS Code configuration
3. Or run with Node.js debugger:
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

## Hot Reloading

The development setup supports hot reloading:

1. **File Watching**: Nodemon watches `src/` directory
2. **Auto Build**: TypeScript compiles on file changes
3. **SAM Reload**: SAM local detects changes and reloads

To enable hot reloading:
```bash
npm run dev:watch
```

## Local Services (Optional)

Use Docker Compose for additional services:

```bash
# Start LocalStack (AWS services emulation)
docker-compose --profile localstack up -d

# Start DynamoDB Local
docker-compose --profile database up -d

# Start Redis cache
docker-compose --profile cache up -d

# Start development proxy
docker-compose --profile proxy up -d
```

## Performance Optimization

### Development Performance

- **Warm Containers**: SAM keeps containers warm for faster responses
- **Incremental Builds**: TypeScript compiles only changed files
- **Test Parallelization**: Jest runs tests in parallel

### Build Optimization

```bash
# Clean build (removes all artifacts)
npm run dev:clean

# Rebuild everything
npm run dev:build
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Docker Not Running**:
   ```bash
   # Start Docker Desktop or Docker daemon
   # SAM requires Docker for Lambda containers
   ```

3. **Build Errors**:
   ```bash
   # Clean and rebuild
   npm run dev:clean
   npm run build
   ```

4. **SAM CLI Issues**:
   ```bash
   # Reinstall SAM CLI
   npm uninstall -g @aws-sam/cli
   npm install -g @aws-sam/cli
   ```

### Debug Logs

```bash
# View SAM local logs
npm run dev:logs

# View application logs with debug level
LOG_LEVEL=DEBUG npm run dev

# View Docker container logs
docker logs $(docker ps -q --filter "ancestor=public.ecr.aws/sam/emulation-nodejs18.x")
```

## Best Practices

### Code Organization

- Keep handlers thin, move logic to utility functions
- Use proper TypeScript types throughout
- Write tests for all new functionality
- Follow ESLint and Prettier configurations

### Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Use meaningful test descriptions
- Mock external dependencies in unit tests

### Development

- Use feature branches for new development
- Test locally before pushing changes
- Run linting and tests before committing
- Keep dependencies up to date

## Next Steps

- **Deploy to AWS**: Use `npm run deploy:dev`
- **Set up CI/CD**: Configure automated testing and deployment
- **Add Database**: Integrate with DynamoDB or other databases
- **Add Authentication**: Implement API authentication
- **Add Monitoring**: Set up CloudWatch dashboards and alerts