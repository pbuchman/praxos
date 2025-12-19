#!/usr/bin/env bash
#
# Sync PRAXOS secrets from GCP Secret Manager to .envrc file.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - PROJECT_ID environment variable set
#
# Usage:
#   export PROJECT_ID=praxos-dev-pbuchman
#   ./scripts/sync-secrets.sh
#

set -euo pipefail

if [[ -z "${PROJECT_ID:-}" ]]; then
  echo "ERROR: PROJECT_ID is not set"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVRC_FILE="${SCRIPT_DIR}/../.envrc"

# Start with PROJECT_ID
echo "export PROJECT_ID=${PROJECT_ID}" > "${ENVRC_FILE}"

# Get all PRAXOS secrets and append to .envrc
for secret in $(gcloud secrets list --project="${PROJECT_ID}" --format="value(name)" | grep "^PRAXOS_"); do
  value=$(gcloud secrets versions access latest --secret="${secret}" --project="${PROJECT_ID}" 2>/dev/null || echo "")
  if [[ -n "$value" ]]; then
    echo "export ${secret}=${value}" >> "${ENVRC_FILE}"
  fi
done

echo "Updated ${ENVRC_FILE}"
