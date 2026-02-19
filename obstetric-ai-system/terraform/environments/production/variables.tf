variable "project_id" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "obstetric-ai"
}

variable "region" {
  type    = string
  default = "GRA"
}

variable "kube_version" {
  type    = string
  default = "1.29"
}

variable "vrack_id" {
  type    = string
  default = ""
}
