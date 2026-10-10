# Least-privilege execution role for the Lambda.
# Rule for this file: every permission has a "why" comment. If you cannot write one, delete the permission.

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    sid     = "LambdaServiceAssumesRole"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project_name}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_permissions" {
  # WHY: the function must write its own logs. The log group is created in
  # Terraform (see lambda.tf), so CreateLogGroup is NOT granted. Scoped to
  # that one group, not logs:* on *.
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.lambda.arn}:*"]
  }

  # WHY: the function reads exactly one config secret. GetParameter only (no
  # GetParameters/ByPath/Put), scoped to that single parameter ARN.
  # Note: the default aws/ssm KMS key needs no extra kms:Decrypt grant.
  statement {
    sid       = "ReadOneParameter"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.secret_param_name}"]
  }
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "least-privilege"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}
