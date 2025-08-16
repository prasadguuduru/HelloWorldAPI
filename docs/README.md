# API Documentation

This directory contains the API documentation for the HelloWorld API.

## Files

- **`openapi.yaml`** - OpenAPI 3.0 specification defining all API endpoints, request/response schemas, and examples
- **`index.html`** - Swagger UI documentation page for interactive API exploration
- **`README.md`** - This documentation guide

## Viewing the Documentation

### Option 1: GitHub Pages (Recommended)

The easiest way to view the interactive Swagger documentation is through GitHub Pages:

1. **Enable GitHub Pages** for your repository:
   - Go to your repository: https://github.com/prasadguuduru/HelloWorldAPI
   - Navigate to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/docs" folder
   - Click "Save"

2. **Access the documentation**:
   - Your documentation will be available at: `https://prasadguuduru.github.io/HelloWorldAPI/`
   - It may take a few minutes for GitHub Pages to deploy

### Option 2: Local Development

To view the documentation locally:

```bash
# Navigate to the docs directory
cd docs

# Serve the files using Python (Python 3)
python -m http.server 8080

# Or using Python 2
python -m SimpleHTTPServer 8080

# Or using Node.js (if you have http-server installed)
npx http-server -p 8080

# Or using any other static file server
```

Then open your browser and go to: `http://localhost:8080`

### Option 3: Online Swagger Editor

You can also view and edit the OpenAPI specification using the online Swagger Editor:

1. Go to https://editor.swagger.io/
2. Copy the contents of `openapi.yaml`
3. Paste it into the editor

## API Overview

The HelloWorld API provides the following endpoints:

- **GET /items** - List all items with optional filtering and pagination
- **POST /items** - Create a new item
- **GET /items/{id}** - Get a specific item by ID
- **PUT /items/{id}** - Update an existing item
- **DELETE /items/{id}** - Delete an item

## Features

- ✅ Complete CRUD operations
- ✅ Input validation and error handling
- ✅ Pagination support
- ✅ Status filtering
- ✅ CORS support
- ✅ Comprehensive error responses
- ✅ Request/response examples
- ✅ Interactive API testing

## Testing the API

Once your API is deployed, you can test it using:

1. **Swagger UI** - Use the "Try it out" feature in the documentation
2. **curl** - Command line testing
3. **Postman** - Import the OpenAPI specification
4. **Any HTTP client** - Use the provided examples

## Updating Documentation

When you make changes to the API:

1. Update the `openapi.yaml` file with new endpoints, schemas, or examples
2. Commit and push the changes to GitHub
3. The documentation will automatically update on GitHub Pages

## Integration with Development

The OpenAPI specification can be used for:

- **Code Generation** - Generate client SDKs in various languages
- **API Testing** - Automated testing based on the specification
- **Validation** - Ensure API responses match the specification
- **Mock Servers** - Create mock servers for development