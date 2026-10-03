import { describe, expect, it } from 'vitest';
import { RESULT_KINDS, type RaidrAgentDataParts } from './index';

describe('agent types', () => {
  it('lists every result kind once', () => {
    expect(new Set(RESULT_KINDS).size).toBe(RESULT_KINDS.length);
    expect(RESULT_KINDS).toContain('recipe');
  });
  it('data part keys match the stream part names', () => {
    const keys: Array<keyof RaidrAgentDataParts> = [
      'run',
      'site-status',
      'call',
      'result',
    ];
    expect(keys).toHaveLength(4);
  });
});
