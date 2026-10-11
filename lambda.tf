# One small workload so the IAM policies have something real to protect.
# No Function URL / public endpoint: invoke it with the AWS CLI.

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/build/lambda.zip"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-fn"
  retention_in_days = 365
}

resource "aws_lambda_function" "demo" {
  function_name    = "${var.project_name}-fn"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 5
  memory_size      = 128

  environment {
    variables = {
      SECRET_PARAM_NAME = var.secret_param_name # the NAME, never the value
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}
