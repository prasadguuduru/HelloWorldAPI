# Lambda function resources

# Create deployment packages for Lambda functions
data "archive_file" "lambda_deployment_package" {
  type        = "zip"
  source_dir  = "${path.module}/../lib"
  output_path = "${path.module}/lambda-deployment.zip"
  
  depends_on = [null_resource.build_lambda]
}

# Build Lambda functions before packaging
resource "null_resource" "build_lambda" {
  triggers = {
    # Rebuild when source files change
    source_hash = filebase64sha256("${path.module}/../package.json")
  }

  provisioner "local-exec" {
    command     = "npm run build"
    working_dir = "${path.module}/.."
  }
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy attachment for basic Lambda execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM policy attachment for X-Ray tracing (if enabled)
resource "aws_iam_role_policy_attachment" "lambda_xray_execution" {
  count      = var.enable_xray_tracing ? 1 : 0
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Custom IAM policy for additional permissions
resource "aws_iam_role_policy" "lambda_custom_policy" {
  name = "${local.name_prefix}-lambda-custom-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      }
    ]
  })
}

# Lambda function for listing items (GET /items)
resource "aws_lambda_function" "list_items" {
  filename         = data.archive_file.lambda_deployment_package.output_path
  function_name    = "${local.name_prefix}-list-items"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda/handlers/items.listItems"
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_deployment_package.output_base64sha256

  environment {
    variables = {
      NODE_ENV    = var.environment
      LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      PROJECT_NAME = var.project_name
    }
  }

  dynamic "tracing_config" {
    for_each = var.enable_xray_tracing ? [1] : []
    content {
      mode = "Active"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]

  tags = local.common_tags
}

# Lambda function for getting a specific item (GET /items/{id})
resource "aws_lambda_function" "get_item" {
  filename         = data.archive_file.lambda_deployment_package.output_path
  function_name    = "${local.name_prefix}-get-item"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda/handlers/items.getItem"
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_deployment_package.output_base64sha256

  environment {
    variables = {
      NODE_ENV    = var.environment
      LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      PROJECT_NAME = var.project_name
    }
  }

  dynamic "tracing_config" {
    for_each = var.enable_xray_tracing ? [1] : []
    content {
      mode = "Active"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]

  tags = local.common_tags
}

# Lambda function for creating items (POST /items)
resource "aws_lambda_function" "create_item" {
  filename         = data.archive_file.lambda_deployment_package.output_path
  function_name    = "${local.name_prefix}-create-item"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda/handlers/items.createItem"
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_deployment_package.output_base64sha256

  environment {
    variables = {
      NODE_ENV    = var.environment
      LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      PROJECT_NAME = var.project_name
    }
  }

  dynamic "tracing_config" {
    for_each = var.enable_xray_tracing ? [1] : []
    content {
      mode = "Active"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]

  tags = local.common_tags
}

# Lambda function for updating items (PUT /items/{id})
resource "aws_lambda_function" "update_item" {
  filename         = data.archive_file.lambda_deployment_package.output_path
  function_name    = "${local.name_prefix}-update-item"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda/handlers/items.updateItem"
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_deployment_package.output_base64sha256

  environment {
    variables = {
      NODE_ENV    = var.environment
      LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      PROJECT_NAME = var.project_name
    }
  }

  dynamic "tracing_config" {
    for_each = var.enable_xray_tracing ? [1] : []
    content {
      mode = "Active"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]

  tags = local.common_tags
}

# Lambda function for deleting items (DELETE /items/{id})
resource "aws_lambda_function" "delete_item" {
  filename         = data.archive_file.lambda_deployment_package.output_path
  function_name    = "${local.name_prefix}-delete-item"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda/handlers/items.deleteItem"
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_deployment_package.output_base64sha256

  environment {
    variables = {
      NODE_ENV    = var.environment
      LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      PROJECT_NAME = var.project_name
    }
  }

  dynamic "tracing_config" {
    for_each = var.enable_xray_tracing ? [1] : []
    content {
      mode = "Active"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]

  tags = local.common_tags
}

# Lambda permissions for API Gateway to invoke functions
resource "aws_lambda_permission" "api_gateway_list_items" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_items.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_get_item" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_create_item" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_update_item" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_delete_item" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}