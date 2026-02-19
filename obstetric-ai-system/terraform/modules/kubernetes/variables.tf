variable "project_id" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "kube_version" {
  type = string
}

variable "private_network_id" {
  type        = string
  default     = ""
  description = "vRack private network ID for node isolation"
}

variable "flavor_production" {
  type        = string
  default     = "b2-7"
  description = "Flavor for production nodes (8 vCPU, 30GB RAM equivalent)"
}

variable "flavor_ml" {
  type        = string
  default     = "b2-15"
  description = "Flavor for ML nodes (high memory)"
}

variable "node_pool_production_size" {
  type    = number
  default = 3
}

variable "node_pool_ml_size" {
  type    = number
  default = 2
}

variable "enable_ml_pool" {
  type    = bool
  default = true
}
