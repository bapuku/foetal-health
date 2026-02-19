variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "environment" {
  type = string
}

variable "bucket_backup_name" {
  type        = string
  default     = "obstetric-ai-backups"
  description = "Object Storage S3 bucket for backups"
}

variable "bucket_terraform_state_name" {
  type        = string
  default     = "obstetric-ai-terraform-state"
  description = "Object Storage S3 bucket for Terraform state"
}
