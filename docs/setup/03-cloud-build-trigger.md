# 03 - Cloud Build Trigger

This document describes the Cloud Build CI/CD pipeline and trigger configuration.

## Overview

PraxOS uses Cloud Build to:

1. Run CI checks (lint, typecheck, test)
2. Detect which services are affected by changes
3. Build Docker images for affected services
4. Deploy affected services to Cloud Run

## Trigger Configuration

Terraform creates the trigger automatically. The trigger:

- **Name**: `praxos-dev-deploy`
- **Branch**: `development` (exact match)
- **Config**: `cloudbuild/cloudbuild.yaml`

## Manual Trigger Setup (If Needed)

If you need to create the trigger manually (e.g., for GitHub app connection):

### 1. Connect GitHub Repository

```bash
# Open Cloud Build settings in browser
gcloud builds triggers list

# Or go to Console: Cloud Build → Triggers → Connect Repository
```

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Connect Repository"
3. Select "GitHub (Cloud Build GitHub App)"
4. Authorize and select your repository
5. Click "Connect"

### 2. Create Trigger via gcloud

```bash
gcloud builds triggers create github \
  --name="praxos-dev-deploy" \
  --repo-name="praxos" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^development$" \
  --build-config="cloudbuild/cloudbuild.yaml" \
  --substitutions="_REGION=europe-central2,_ENVIRONMENT=dev"
```

## Build Pipeline Steps

The pipeline (`cloudbuild/cloudbuild.yaml`) executes:

| Step                        | Description                             | Duration |
| --------------------------- | --------------------------------------- | -------- |
| 1. node-version             | Print Node.js version                   | ~1s      |
| 2. npm-ci                   | Install dependencies                    | ~30s     |
| 3. npm-run-ci               | Run lint, typecheck, tests              | ~60s     |
| 4. detect-affected          | Determine which services changed        | ~2s      |
| 5. build-auth-service       | Build Docker image (if affected)        | ~60s     |
| 6. build-notion-gpt-service | Build Docker image (if affected)        | ~60s     |
| 7. push-auth-service        | Push to Artifact Registry (if affected) | ~30s     |
| 8. push-notion-gpt-service  | Push to Artifact Registry (if affected) | ~30s     |
| 9. deploy-affected          | Deploy to Cloud Run                     | ~60s     |

## Affected Detection Logic

The `detect-affected.mjs` script determines which services need deployment:

```
packages/common/** → both services
packages/domain/** → both services
packages/infra/** → both services
apps/auth-service/** → auth-service only
apps/notion-gpt-service/** → notion-gpt-service only
package.json, package-lock.json → both services
```

## View Build Logs

```bash
# List recent builds
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID

# Stream logs of running build
gcloud builds log BUILD_ID --stream
```

Or use the [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds).

## Manual Build Trigger

To trigger a build manually:

```bash
# Trigger from current branch
gcloud builds triggers run praxos-dev-deploy \
  --branch=development

# Or submit directly
gcloud builds submit \
  --config=cloudbuild/cloudbuild.yaml \
  --substitutions="_REGION=europe-central2,_ENVIRONMENT=dev"
```

## Service Account Permissions

The Cloud Build service account (`praxos-cloudbuild-dev@...`) has:

- `roles/artifactregistry.writer` - Push images
- `roles/run.admin` - Deploy to Cloud Run
- `roles/iam.serviceAccountUser` - Act as service accounts
- `roles/logging.logWriter` - Write build logs

## Troubleshooting

### "Repository not found"

Ensure GitHub repository is connected to Cloud Build.

### "Permission denied" on deploy

Check that Cloud Build service account has `roles/run.admin`.

### Build succeeds but nothing deployed

Check `affected.json` in build logs. If empty, no files matched service dependencies.

## Summary

After completing these steps, you should have:

- [x] Cloud Build trigger configured
- [x] GitHub repository connected
- [x] Automatic deployments on push to `development`

## Next Step

→ [04-cloud-run-services.md](./04-cloud-run-services.md)
