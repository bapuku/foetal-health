module "kubernetes" {
  source = "../../modules/kubernetes"

  project_id                 = var.project_id
  cluster_name               = "${var.cluster_name}-prod"
  region                     = var.region
  kube_version               = var.kube_version
  node_pool_production_size  = 3
  node_pool_ml_size          = 2
  enable_ml_pool             = true
  flavor_production         = "b2-7"
  flavor_ml                 = "b2-15"
}

module "networking" {
  source = "../../modules/networking"

  project_id = var.project_id
  region     = var.region
  vrack_id   = var.vrack_id
}

module "storage" {
  source = "../../modules/storage"

  project_id   = var.project_id
  region       = var.region
  environment  = "production"
}

module "kms" {
  source = "../../modules/kms"

  project_id  = var.project_id
  environment = "production"
}
