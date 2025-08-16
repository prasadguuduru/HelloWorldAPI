# Terraform outputs for the API Gateway + Lambda application

output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com"
}

output "api_gateway_stage_url" {
  description = "Full URL of the API Gateway stage"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    list_items   = aws_lambda_function.list_items.function_name
    get_item     = aws_lambda_function.get_item.function_name
    create_item  = aws_lambda_function.create_item.function_name
    update_item  = aws_lambda_function.update_item.function_name
    delete_item  = aws_lambda_function.delete_item.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value = {
    list_items   = aws_lambda_function.list_items.arn
    get_item     = aws_lambda_function.get_item.arn
    create_item  = aws_lambda_function.create_item.arn
    update_item  = aws_lambda_function.update_item.arn
    delete_item  = aws_lambda_function.delete_item.arn
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway.name
    lambda_logs = {
      list_items   = aws_cloudwatch_log_group.lambda_list_items.name
      get_item     = aws_cloudwatch_log_group.lambda_get_item.name
      create_item  = aws_cloudwatch_log_group.lambda_create_item.name
      update_item  = aws_cloudwatch_log_group.lambda_update_item.name
      delete_item  = aws_cloudwatch_log_group.lambda_delete_item.name
    }
  }
}

output "iam_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    project_name = var.project_name
    environment  = var.environment
    region       = var.aws_region
    stage_name   = var.api_gateway_stage_name
    deployed_at  = timestamp()
  }
}