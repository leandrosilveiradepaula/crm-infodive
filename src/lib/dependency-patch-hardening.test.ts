import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('protobuf and source-map dependency hardening', () => {
  it('pins patched protobufjs 7.x transitive versions', () => {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const packages = lock.packages;

    expect(packages['node_modules/protobufjs']?.version).toBe('7.6.6');
    expect(packages['node_modules/@protobufjs/codegen']?.version).toBe('2.0.5');
    expect(packages['node_modules/@protobufjs/eventemitter']?.version).toBe('1.1.1');
    expect(packages['node_modules/@protobufjs/fetch']?.version).toBe('1.1.1');
    expect(packages['node_modules/@protobufjs/utf8']?.version).toBe('1.1.1');
    expect(packages['node_modules/@protobufjs/inquire']).toBeUndefined();
  });

  it('pins patched source-map-js within existing consumer ranges', () => {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    expect(lock.packages['node_modules/source-map-js']?.version).toBe('1.2.2');
  });
});
