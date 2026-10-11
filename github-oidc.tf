variable "github_repo" {
  description = "GitHub repo allowed to assume the role, as owner/name"
  type        = string
  default     = "usman9856/cloud-security-pipeline"
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_repo}:pull_request",
      ]
    }
  }
}

resource "aws_iam_role" "github_pipeline" {
  name               = "p3-cloudsec-github-pipeline"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}

resource "aws_iam_role_policy_attachment" "github_readonly" {
  role       = aws_iam_role.github_pipeline.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

output "github_pipeline_role_arn" {
  value = aws_iam_role.github_pipeline.arn
}
