output "database_name" {
  description = "Firestore database name"
  value       = google_firestore_database.database.name
}

output "database_id" {
  description = "Firestore database ID"
  value       = google_firestore_database.database.id
}

