# OVHcloud Managed Kubernetes Service (MKS) cluster
# Requires: OVH Public Cloud project with Kubernetes enabled

resource "ovh_cloud_project_kube" "cluster" {
  service_name = var.project_id
  name         = var.cluster_name
  region       = var.region
  version      = var.kube_version
}

# Production node pool - general workload
resource "ovh_cloud_project_kube_nodepool" "production" {
  service_name  = ovh_cloud_project_kube.cluster.service_name
  kube_id      = ovh_cloud_project_kube.cluster.id
  name         = "production-pool"
  flavor_name  = var.flavor_production
  desired_nodes = var.node_pool_production_size
  min_nodes    = 2
  max_nodes    = 10

  anti_affinity = true
}

# ML node pool - high-memory for model serving
resource "ovh_cloud_project_kube_nodepool" "ml" {
  count = var.enable_ml_pool ? 1 : 0

  service_name   = ovh_cloud_project_kube.cluster.service_name
  kube_id       = ovh_cloud_project_kube.cluster.id
  name          = "ml-pool"
  flavor_name   = var.flavor_ml
  desired_nodes = var.node_pool_ml_size
  min_nodes     = 1
  max_nodes     = 5

  anti_affinity = true
}
