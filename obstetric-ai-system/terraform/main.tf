# Obstetric AI - OVHcloud Infrastructure
# Usage: terraform init && terraform plan -var-file=environments/production/terraform.tfvars

provider "ovh" {
  endpoint           = var.ovh_endpoint
  application_key    = var.ovh_application_key
  application_secret = var.ovh_application_secret
  consumer_key       = var.ovh_consumer_key
}

# Use production environment by default; override with -var="environment=staging"
module "infra" {
  source = "./environments/production"

  project_id   = var.project_id
  cluster_name = var.cluster_name
  region       = var.region
  kube_version = var.kube_version
  vrack_id     = var.vrack_id
}
