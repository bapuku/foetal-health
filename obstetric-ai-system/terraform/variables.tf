variable "ovh_endpoint" {
  description = "OVH API endpoint (ovh-eu, ovh-ca, ovh-us)"
  type        = string
  default     = "ovh-eu"
}

variable "ovh_application_key" {
  description = "OVH Application Key"
  type        = string
  sensitive   = true
}

variable "ovh_application_secret" {
  description = "OVH Application Secret"
  type        = string
  sensitive   = true
}

variable "ovh_consumer_key" {
  description = "OVH Consumer Key"
  type        = string
  sensitive   = true
}

variable "project_id" {
  description = "OVHcloud Public Cloud project ID"
  type        = string
}

variable "environment" {
  description = "Environment (production, staging, ml)"
  type        = string
  default     = "staging"
}

variable "region" {
  description = "OVH region (GRA, SBG, BHS, etc.)"
  type        = string
  default     = "GRA"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "obstetric-ai-mks"
}

variable "kube_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "node_pool_production_size" {
  description = "Number of nodes in production pool"
  type        = number
  default     = 3
}

variable "node_pool_ml_size" {
  description = "Number of nodes in ML pool (GPU/highmem)"
  type        = number
  default     = 2
}

variable "vrack_id" {
  description = "vRack ID for private network isolation"
  type        = string
  default     = ""
}
