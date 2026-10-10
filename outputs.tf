output "lambda_function_name" {
  value = aws_lambda_function.demo.function_name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

output "trail_bucket" {
  value = aws_s3_bucket.trail.id
}
