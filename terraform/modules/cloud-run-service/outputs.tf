output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.service.uri
}

output "service_name" {
  description = "Cloud Run service name"
  value       = google_cloud_run_v2_service.service.name
}

output "latest_revision" {
  description = "Latest revision name"
  value       = google_cloud_run_v2_service.service.latest_ready_revision
}

