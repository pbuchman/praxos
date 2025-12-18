output "trigger_id" {
  description = "Cloud Build trigger ID"
  value       = google_cloudbuild_trigger.praxos_dev.trigger_id
}

output "trigger_name" {
  description = "Cloud Build trigger name"
  value       = google_cloudbuild_trigger.praxos_dev.name
}

output "cloud_build_service_account" {
  description = "Cloud Build service account email"
  value       = google_service_account.cloud_build.email
}

