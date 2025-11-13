import { describe, expect, it } from 'vitest';
import { pluginContractsManifest } from '../src/contract.js';
import { parsePluginContracts } from '../src/schema/contract.schema.js';
import { contractsVersion } from '../src/version.js';
import { AI_REVIEW_PLUGIN_ID } from '../src/types.js';

describe('pluginContractsManifest', () => {
  it('is valid according to the schema', () => {
    expect(() => parsePluginContracts(pluginContractsManifest)).not.toThrow();
  });

  it('exposes the ai-review plugin id', () => {
    expect(pluginContractsManifest.pluginId).toBe(AI_REVIEW_PLUGIN_ID);
  });

  it('lists the expected artifact ids', () => {
    const artifactIds = Object.keys(pluginContractsManifest.artifacts).sort();
    expect(artifactIds).toEqual(
      [
        'ai-review.context',
        'ai-review.review.html',
        'ai-review.review.human-md',
        'ai-review.review.json',
        'ai-review.review.md'
      ].sort()
    );
  });

  it('rejects malformed manifests', () => {
    const malformed = {
      ...pluginContractsManifest,
      schema: 'kb.plugin.contracts/999'
    };

    expect(() => parsePluginContracts(malformed)).toThrowError();
  });

  it('uses a semver-compatible contractsVersion', () => {
    const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
    expect(semverPattern.test(contractsVersion)).toBe(true);
  });
});

