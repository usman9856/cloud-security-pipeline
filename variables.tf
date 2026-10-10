variable "aws_region" {
  description = "Region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "p3-cloudsec"
}

variable "secret_param_name" {
  description = "SSM parameter the Lambda reads. Created OUTSIDE Terraform so the value never lands in state."
  type        = string
  default     = "/p3-cloudsec/demo-api-key"
}
