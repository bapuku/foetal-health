output "kube_id" {
  value = module.infra.kube_id
}

output "kube_name" {
  value = module.infra.kube_name
}

output "kubeconfig" {
  value     = module.infra.kubeconfig
  sensitive = true
}

output "storage_instructions" {
  value = module.infra.storage_instructions
}

output "kms_instructions" {
  value = module.infra.kms_instructions
}
