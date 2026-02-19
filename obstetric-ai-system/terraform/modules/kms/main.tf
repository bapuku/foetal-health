# OVH KMS for encryption (etcd Encryption at Rest, secrets)
# KMS Encryption Provider for Kubernetes: configure post-cluster-creation
# Documentation: OVHcloud Secret Manager / KMS

output "kms_instructions" {
  value = <<-EOT
    Post-provisioning:
    1. Enable OVHcloud Secret Manager (beta) for application secrets.
    2. Configure External Secrets Operator to sync secrets into Kubernetes.
    3. For etcd encryption at rest: deploy KMS Encryption Provider with OVH KMS (KMIP) if available for MKS.
  EOT
}
