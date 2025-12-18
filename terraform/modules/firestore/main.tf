# Firestore Module
# Creates a Firestore database in Native mode.

resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  # Prevent accidental deletion
  deletion_policy = "DELETE"

  # Point-in-time recovery (disabled for dev)
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
}

