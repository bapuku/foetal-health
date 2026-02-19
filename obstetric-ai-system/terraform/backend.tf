# Terraform backend - State stored in OVH Object Storage S3
# Uncomment and configure once Object Storage bucket exists
# terraform {
#   backend "s3" {
#     bucket         = "obstetric-ai-terraform-state"
#     key            = "terraform.tfstate"
#     region         = "gra"
#     endpoint       = "https://s3.gra.io.cloud.ovh.net"
#     skip_region_validation = true
#     skip_credentials_validation = true
#   }
# }

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    ovh = {
      source  = "ovh/ovh"
      version = "~> 0.36"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
}
