resource "aws_iam_policy" "demo_insecure" {
  name = "demo-insecure"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "*", Resource = "*" }]
  })
}
