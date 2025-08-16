# API Gateway resources

# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "REST API for ${var.project_name} ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# API Gateway resources
resource "aws_api_gateway_resource" "items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "items"
}

resource "aws_api_gateway_resource" "item_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.items.id
  path_part   = "{id}"
}

# CORS OPTIONS method for /items
resource "aws_api_gateway_method" "items_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "items_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.items_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "items_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.items_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "items_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.items_options.http_method
  status_code = aws_api_gateway_method_response.items_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
  }
}

# CORS OPTIONS method for /items/{id}
resource "aws_api_gateway_method" "item_by_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item_by_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "item_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.item_by_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "item_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.item_by_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "item_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.item_by_id_options.http_method
  status_code = aws_api_gateway_method_response.item_by_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
  }
}

# GET /items - List items
resource "aws_api_gateway_method" "list_items" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.querystring.limit"  = false
    "method.request.querystring.offset" = false
    "method.request.querystring.status" = false
  }
}

resource "aws_api_gateway_integration" "list_items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.list_items.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.list_items.invoke_arn
}

# POST /items - Create item
resource "aws_api_gateway_method" "create_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.create_item.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.create_item.invoke_arn
}

# GET /items/{id} - Get specific item
resource "aws_api_gateway_method" "get_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item_by_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "get_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.get_item.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.get_item.invoke_arn
}

# PUT /items/{id} - Update item
resource "aws_api_gateway_method" "update_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item_by_id.id
  http_method   = "PUT"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "update_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.update_item.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.update_item.invoke_arn
}

# DELETE /items/{id} - Delete item
resource "aws_api_gateway_method" "delete_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item_by_id.id
  http_method   = "DELETE"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "delete_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item_by_id.id
  http_method = aws_api_gateway_method.delete_item.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.delete_item.invoke_arn
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.list_items,
    aws_api_gateway_integration.create_item,
    aws_api_gateway_integration.get_item,
    aws_api_gateway_integration.update_item,
    aws_api_gateway_integration.delete_item,
    aws_api_gateway_integration.items_options,
    aws_api_gateway_integration.item_by_id_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.items.id,
      aws_api_gateway_resource.item_by_id.id,
      aws_api_gateway_method.list_items.id,
      aws_api_gateway_method.create_item.id,
      aws_api_gateway_method.get_item.id,
      aws_api_gateway_method.update_item.id,
      aws_api_gateway_method.delete_item.id,
      aws_api_gateway_integration.list_items.id,
      aws_api_gateway_integration.create_item.id,
      aws_api_gateway_integration.get_item.id,
      aws_api_gateway_integration.update_item.id,
      aws_api_gateway_integration.delete_item.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.api_gateway_stage_name

  # Note: Throttling is configured via aws_api_gateway_method_settings

  # X-Ray tracing (disabled to avoid service linked role requirement)
  xray_tracing_enabled = false

  # Access logging (disabled to avoid service linked role requirement)
  # Uncomment when service linked role is available
  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.api_gateway.arn
  #   format = jsonencode({
  #     requestId      = "$context.requestId"
  #     ip             = "$context.identity.sourceIp"
  #     caller         = "$context.identity.caller"
  #     user           = "$context.identity.user"
  #     requestTime    = "$context.requestTime"
  #     httpMethod     = "$context.httpMethod"
  #     resourcePath   = "$context.resourcePath"
  #     status         = "$context.status"
  #     protocol       = "$context.protocol"
  #     responseLength = "$context.responseLength"
  #     error          = "$context.error.message"
  #     errorType      = "$context.error.messageString"
  #   })
  # }

  tags = local.common_tags

  depends_on = [
    aws_cloudwatch_log_group.api_gateway
  ]
}

# Method settings for detailed monitoring and throttling
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = var.enable_detailed_monitoring
    logging_level         = var.enable_detailed_monitoring ? "INFO" : "OFF"
    data_trace_enabled    = var.environment != "prod" && var.enable_detailed_monitoring
    throttling_rate_limit = var.api_gateway_throttle_rate_limit
    throttling_burst_limit = var.api_gateway_throttle_burst_limit
  }
}

# Request validators
resource "aws_api_gateway_request_validator" "main" {
  name                        = "${local.name_prefix}-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# Gateway responses for CORS
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_templates = {
    "application/json" = "{\"message\":$context.error.messageString}"
  }

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_templates = {
    "application/json" = "{\"message\":$context.error.messageString}"
  }

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
  }
}