output "repository_id" {
  description = "Artifact Registry repository ID"
  value       = google_artifact_registry_repository.praxos.repository_id
}

output "repository_url" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.praxos.repository_id}"
}

