#!/usr/bin/env node
/**
 * Deploy affected services to Cloud Run.
 *
 * Reads /workspace/affected.json and deploys each affected service.
 * This script is called by cloudbuild.yaml after images are built and pushed.
 *
 * Note: In the current cloudbuild.yaml, deployment is handled inline.
 * This script is provided for manual deployments and future flexibility.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const AFFECTED_FILE = join(WORKSPACE, 'affected.json');
const REGION = process.env.REGION || 'europe-central2';
const PROJECT_ID = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

// Service configuration
const SERVICES = {
  'auth-service': {
    cloudRunName: 'praxos-auth-service',
    imageName: 'auth-service',
  },
  'notion-gpt-service': {
    cloudRunName: 'praxos-notion-gpt-service',
    imageName: 'notion-gpt-service',
  },
};

/**
 * Read affected services from JSON file.
 */
function readAffected() {
  const localFile = './affected.json';
  const file = existsSync(AFFECTED_FILE) ? AFFECTED_FILE : localFile;

  if (!existsSync(file)) {
    console.error(`Affected file not found: ${file}`);
    console.log('Assuming all services are affected.');
    return Object.keys(SERVICES);
  }

  const content = readFileSync(file, 'utf-8');
  const data = JSON.parse(content);
  return data.services || [];
}

/**
 * Deploy a service to Cloud Run.
 */
function deployService(serviceName, imageTag) {
  const config = SERVICES[serviceName];
  if (!config) {
    console.error(`Unknown service: ${serviceName}`);
    return false;
  }

  const registryUrl = `${REGION}-docker.pkg.dev/${PROJECT_ID}/praxos-dev`;
  const imageUrl = `${registryUrl}/${config.imageName}:${imageTag}`;

  console.log(`\n=== Deploying ${serviceName} ===`);
  console.log(`  Cloud Run service: ${config.cloudRunName}`);
  console.log(`  Image: ${imageUrl}`);
  console.log(`  Region: ${REGION}`);

  try {
    const cmd = [
      'gcloud',
      'run',
      'deploy',
      config.cloudRunName,
      `--image=${imageUrl}`,
      `--region=${REGION}`,
      '--platform=managed',
      '--quiet',
    ].join(' ');

    console.log(`  Command: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`  ✓ ${serviceName} deployed successfully`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to deploy ${serviceName}:`, error.message);
    return false;
  }
}

/**
 * Main entry point.
 */
function main() {
  console.log('=== Deploy Affected Services ===');
  console.log(`PROJECT_ID: ${PROJECT_ID || 'not set'}`);
  console.log(`REGION: ${REGION}`);
  console.log(`COMMIT_SHA: ${process.env.COMMIT_SHA || 'not set'}`);

  if (!PROJECT_ID) {
    console.error('Error: PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set');
    process.exit(1);
  }

  const imageTag = process.env.COMMIT_SHA || 'latest';
  const affected = readAffected();

  console.log(`\nAffected services: ${affected.join(', ') || 'none'}`);
  console.log(`Image tag: ${imageTag}`);

  if (affected.length === 0) {
    console.log('\nNo services to deploy.');
    return;
  }

  let success = true;
  for (const service of affected) {
    if (!deployService(service, imageTag)) {
      success = false;
    }
  }

  console.log('\n=== Deployment Summary ===');
  if (success) {
    console.log('All services deployed successfully.');
  } else {
    console.error('Some services failed to deploy.');
    process.exit(1);
  }
}

main();
