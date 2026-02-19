# vRack and Load Balancer configuration for OVHcloud
# vRack: create in OVH Control Panel, then pass vrack_id
# LoadBalancer: typically created by Kubernetes when using LoadBalancer service type

# Placeholder for vRack private network - configure in OVH Control Panel
# Documentation: https://docs.ovh.com/gb/en/network-ip/ovhcloud-network-manager/

output "vrack_instructions" {
  value = "Configure vRack in OVH Control Panel. Use private network for worker nodes (MKS supports private_network_id on nodepool in newer versions)."
}
