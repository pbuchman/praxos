# Artifact Registry Module
# Creates a Docker repository for Cloud Run service images.

resource "google_artifact_registry_repository" "praxos" {
  location      = var.region
  repository_id = "praxos-${var.environment}"
  description   = "Docker repository for PraxOS ${var.environment} services"
  format        = "DOCKER"
  labels        = var.labels

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 10
    }
  }
}

