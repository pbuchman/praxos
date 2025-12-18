terraform {
  backend "gcs" {
    # Bucket name is set via -backend-config or terraform init
    # bucket = "praxos-terraform-state-dev"
    prefix = "terraform/state"
  }
}

