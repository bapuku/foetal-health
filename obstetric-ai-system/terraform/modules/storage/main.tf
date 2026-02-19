# OVH Object Storage S3 buckets for backups and Terraform state
# Block Storage (cinder-high-speed-gen2-luks) is provisioned at Kubernetes PVC level via StorageClass

# S3 buckets are created via OVH Control Panel or CLI (ovh-eu)
# Terraform OVH provider: cloud_project_storage_* for object storage if available

output "storage_instructions" {
  value = <<-EOT
    Object Storage (S3):
    1. Create bucket '${var.bucket_backup_name}' in region ${var.region} for PostgreSQL/backups (AES-256 encryption).
    2. Create bucket '${var.bucket_terraform_state_name}' for Terraform state.
    3. Enable versioning on both buckets.
    
    Block Storage (Kubernetes):
    Use StorageClass 'csi-cinder-high-speed-gen2-luks' for PVCs (NVMe encrypted).
    Configure in k8s/base when deploying PostgreSQL, Redis, etc.
  EOT
}
