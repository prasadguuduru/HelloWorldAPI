# CloudWatch monitoring and logging resources

# CloudWatch log group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# CloudWatch log groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_list_items" {
  name              = "/aws/lambda/${local.name_prefix}-list-items"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_get_item" {
  name              = "/aws/lambda/${local.name_prefix}-get-item"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_create_item" {
  name              = "/aws/lambda/${local.name_prefix}-create-item"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_update_item" {
  name              = "/aws/lambda/${local.name_prefix}-update-item"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_delete_item" {
  name              = "/aws/lambda/${local.name_prefix}-delete-item"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# CloudWatch alarms for API Gateway
resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 4XX errors"
  alarm_actions       = []

  dimensions = {
    ApiName   = aws_api_gateway_rest_api.main.name
    Stage     = aws_api_gateway_stage.main.stage_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = []

  dimensions = {
    ApiName   = aws_api_gateway_rest_api.main.name
    Stage     = aws_api_gateway_stage.main.stage_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "${local.name_prefix}-api-gateway-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000"
  alarm_description   = "This metric monitors API Gateway latency"
  alarm_actions       = []

  dimensions = {
    ApiName   = aws_api_gateway_rest_api.main.name
    Stage     = aws_api_gateway_stage.main.stage_name
  }

  tags = local.common_tags
}

# CloudWatch alarms for Lambda functions
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = {
    list_items   = aws_lambda_function.list_items.function_name
    get_item     = aws_lambda_function.get_item.function_name
    create_item  = aws_lambda_function.create_item.function_name
    update_item  = aws_lambda_function.update_item.function_name
    delete_item  = aws_lambda_function.delete_item.function_name
  }

  alarm_name          = "${local.name_prefix}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors for ${each.key}"
  alarm_actions       = []

  dimensions = {
    FunctionName = each.value
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = {
    list_items   = aws_lambda_function.list_items.function_name
    get_item     = aws_lambda_function.get_item.function_name
    create_item  = aws_lambda_function.create_item.function_name
    update_item  = aws_lambda_function.update_item.function_name
    delete_item  = aws_lambda_function.delete_item.function_name
  }

  alarm_name          = "${local.name_prefix}-lambda-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = var.lambda_timeout * 1000 * 0.8  # 80% of timeout
  alarm_description   = "This metric monitors Lambda function duration for ${each.key}"
  alarm_actions       = []

  dimensions = {
    FunctionName = each.value
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = {
    list_items   = aws_lambda_function.list_items.function_name
    get_item     = aws_lambda_function.get_item.function_name
    create_item  = aws_lambda_function.create_item.function_name
    update_item  = aws_lambda_function.update_item.function_name
    delete_item  = aws_lambda_function.delete_item.function_name
  }

  alarm_name          = "${local.name_prefix}-lambda-${each.key}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors Lambda function throttles for ${each.key}"
  alarm_actions       = []

  dimensions = {
    FunctionName = each.value
  }

  tags = local.common_tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.main.name, "Stage", aws_api_gateway_stage.main.stage_name],
            [".", "4XXError", ".", ".", ".", "."],
            [".", "5XXError", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Requests and Errors"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", aws_api_gateway_rest_api.main.name, "Stage", aws_api_gateway_stage.main.stage_name],
            [".", "IntegrationLatency", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.list_items.function_name],
            [".", ".", ".", aws_lambda_function.get_item.function_name],
            [".", ".", ".", aws_lambda_function.create_item.function_name],
            [".", ".", ".", aws_lambda_function.update_item.function_name],
            [".", ".", ".", aws_lambda_function.delete_item.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Duration"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.list_items.function_name],
            [".", ".", ".", aws_lambda_function.get_item.function_name],
            [".", ".", ".", aws_lambda_function.create_item.function_name],
            [".", ".", ".", aws_lambda_function.update_item.function_name],
            [".", ".", ".", aws_lambda_function.delete_item.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Errors"
          period  = 300
        }
      }
    ]
  })

  # Note: CloudWatch dashboards don't support tags
}

# Custom metrics for business logic (optional)
resource "aws_cloudwatch_log_metric_filter" "item_created" {
  name           = "${local.name_prefix}-items-created"
  log_group_name = aws_cloudwatch_log_group.lambda_create_item.name
  pattern        = "[timestamp, requestId, level=\"INFO\", message=\"Item created successfully\", ...]"

  metric_transformation {
    name      = "ItemsCreated"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "item_deleted" {
  name           = "${local.name_prefix}-items-deleted"
  log_group_name = aws_cloudwatch_log_group.lambda_delete_item.name
  pattern        = "[timestamp, requestId, level=\"INFO\", message=\"Item deleted successfully\", ...]"

  metric_transformation {
    name      = "ItemsDeleted"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "validation_errors" {
  name           = "${local.name_prefix}-validation-errors"
  log_group_name = aws_cloudwatch_log_group.lambda_create_item.name
  pattern        = "[timestamp, requestId, level=\"WARN\", message=\"Invalid*\", ...]"

  metric_transformation {
    name      = "ValidationErrors"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}