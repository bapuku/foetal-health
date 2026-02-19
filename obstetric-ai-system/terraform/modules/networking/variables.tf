variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "vrack_id" {
  type        = string
  default     = ""
  description = "vRack ID for private network isolation"
}
