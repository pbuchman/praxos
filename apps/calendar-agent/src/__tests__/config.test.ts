import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default values when no env vars are set', () => {
    delete process.env['PORT'];
    delete process.env['INTEXURAOS_GCP_PROJECT_ID'];
    delete process.env['INTEXURAOS_USER_SERVICE_URL'];
    delete process.env['INTEXURAOS_INTERNAL_AUTH_TOKEN'];

    const config = loadConfig();

    expect(config.port).toBe(8080);
    expect(config.gcpProjectId).toBe('');
    expect(config.userServiceUrl).toBe('');
    expect(config.internalAuthToken).toBe('');
  });

  it('returns configured values when env vars are set', () => {
    process.env['PORT'] = '3000';
    process.env['INTEXURAOS_GCP_PROJECT_ID'] = 'my-project';
    process.env['INTEXURAOS_USER_SERVICE_URL'] = 'http://user-service';
    process.env['INTEXURAOS_INTERNAL_AUTH_TOKEN'] = 'secret-token';

    const config = loadConfig();

    expect(config.port).toBe(3000);
    expect(config.gcpProjectId).toBe('my-project');
    expect(config.userServiceUrl).toBe('http://user-service');
    expect(config.internalAuthToken).toBe('secret-token');
  });

  it('returns mixed values with partial env vars set', () => {
    process.env['PORT'] = '9000';
    process.env['INTEXURAOS_GCP_PROJECT_ID'] = 'partial-project';
    delete process.env['INTEXURAOS_USER_SERVICE_URL'];
    delete process.env['INTEXURAOS_INTERNAL_AUTH_TOKEN'];

    const config = loadConfig();

    expect(config.port).toBe(9000);
    expect(config.gcpProjectId).toBe('partial-project');
    expect(config.userServiceUrl).toBe('');
    expect(config.internalAuthToken).toBe('');
  });

  it('correctly converts PORT string to number', () => {
    process.env['PORT'] = '5000';

    const config = loadConfig();

    expect(config.port).toBe(5000);
    expect(typeof config.port).toBe('number');
  });
});
