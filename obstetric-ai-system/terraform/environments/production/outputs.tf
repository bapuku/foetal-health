output "kube_id" {
  value = module.kubernetes.kube_id
}

output "kube_name" {
  value = module.kubernetes.kube_name
}

output "kube_version" {
  value = module.kubernetes.kube_version
}

output "kubeconfig" {
  value     = module.kubernetes.kubeconfig
  sensitive = true
}

output "storage_instructions" {
  value = module.storage.storage_instructions
}

output "kms_instructions" {
  value = module.kms.kms_instructions
}
