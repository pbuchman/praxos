import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getActionsQueueTopic } from '../../../infra/pubsub/config.js';

describe('getActionsQueueTopic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns topic when env var is set', () => {
    process.env['INTEXURAOS_PUBSUB_ACTIONS_QUEUE'] = 'my-topic';
    expect(getActionsQueueTopic()).toBe('my-topic');
  });

  it('returns null when env var is undefined', () => {
    delete process.env['INTEXURAOS_PUBSUB_ACTIONS_QUEUE'];
    expect(getActionsQueueTopic()).toBeNull();
  });

  it('returns null when env var is empty', () => {
    process.env['INTEXURAOS_PUBSUB_ACTIONS_QUEUE'] = '';
    expect(getActionsQueueTopic()).toBeNull();
  });
});
