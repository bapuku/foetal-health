output "kube_id" {
  value = ovh_cloud_project_kube.cluster.id
}

output "kube_name" {
  value = ovh_cloud_project_kube.cluster.name
}

output "kube_version" {
  value = ovh_cloud_project_kube.cluster.version
}

output "kubeconfig" {
  value     = ovh_cloud_project_kube.cluster.kubeconfig
  sensitive = true
}
