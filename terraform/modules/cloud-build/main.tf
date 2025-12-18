# Cloud Build Module
# Creates a Cloud Build trigger for CI/CD.

# Cloud Build trigger for development branch
resource "google_cloudbuild_trigger" "praxos_dev" {
  name        = "praxos-${var.environment}-deploy"
  description = "Build and deploy PraxOS services on ${var.github_branch} branch"
  location    = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo

    push {
      branch = "^${var.github_branch}$"
    }
  }

  filename = "cloudbuild/cloudbuild.yaml"

  substitutions = {
    _REGION                = var.region
    _ARTIFACT_REGISTRY_URL = var.artifact_registry_url
    _ENVIRONMENT           = var.environment
  }

  # Service account for Cloud Build
  service_account = google_service_account.cloud_build.id

  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"
}

# Service account for Cloud Build
resource "google_service_account" "cloud_build" {
  account_id   = "praxos-cloudbuild-${var.environment}"
  display_name = "PraxOS Cloud Build Service Account (${var.environment})"
  description  = "Service account for Cloud Build to deploy PraxOS services"
}

# Cloud Build needs to push to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "cloud_build_writer" {
  project    = var.project_id
  location   = var.region
  repository = "praxos-${var.environment}"
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.cloud_build.email}"
}

# Cloud Build needs to deploy to Cloud Run
resource "google_project_iam_member" "cloud_build_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
}

# Cloud Build needs to act as service accounts
resource "google_project_iam_member" "cloud_build_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
}

# Cloud Build needs logging
resource "google_project_iam_member" "cloud_build_logs_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
}

