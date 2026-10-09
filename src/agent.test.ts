import { describe, expect, it } from 'vitest';
import {
  AGENT_STEPS,
  LOCAL_LLM_PROVIDERS,
  RESULT_KINDS,
  SELECTION_MODES,
  SITE_PAGE_ROUTE_SOURCES,
  type RaidrAgentDataParts,
} from './index';

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

describe('local mode types', () => {
  it('lists the local providers once, openai first', () => {
    expect(LOCAL_LLM_PROVIDERS).toEqual([
      'openai',
      'anthropic',
      'deepseek',
      'openrouter',
    ]);
  });
});

describe('v2 workflow types', () => {
  it('lists steps, selection modes and route sources once, in order', () => {
    expect(AGENT_STEPS).toEqual([
      'understand',
      'plan-search',
      'rank-sites',
      'prepare',
      'plan',
      'extract',
      'pick-best',
      'dedupe',
    ]);
    expect(SELECTION_MODES).toEqual(['single', 'best', 'all']);
    expect(SITE_PAGE_ROUTE_SOURCES).toEqual([
      'router',
      'code',
      'response',
      'visited',
      'link',
    ]);
  });
});
