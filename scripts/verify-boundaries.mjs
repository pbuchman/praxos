#!/usr/bin/env node
/**
 * Boundary enforcement verification script.
 * Verifies that eslint-plugin-boundaries is correctly configured and rules are active.
 *
 * This script:
 * 1. Inspects eslint config for an existing source file
 * 2. Verifies boundaries plugin is loaded
 * 3. Verifies element patterns cover all layers (common, domain, infra, apps)
 * 4. Verifies rules boundaries/no-unknown and boundaries/element-types are set to error
 * 5. Verifies element-types rules enforce the correct import hierarchy
 */

import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');

// Use an existing source file to inspect config
const testFile = join(repoRoot, 'packages', 'common', 'src', 'result.ts');
const eslintBin = join(repoRoot, 'node_modules', '.bin', 'eslint');

const result = spawnSync(process.execPath, [eslintBin, '--print-config', testFile], {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  console.error('❌ Failed to get eslint config:', result.stderr);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(result.stdout);
} catch {
  console.error('❌ Failed to parse eslint config output');
  process.exit(1);
}

const errors = [];

// Check boundaries plugin is loaded
const plugins = config.plugins ?? [];
if (!plugins.some((p) => p.includes('boundaries'))) {
  errors.push('boundaries plugin not loaded');
}

// Check settings have boundary elements
const elements = config.settings?.['boundaries/elements'] ?? [];
const elementTypes = elements.map((e) => e.type);
const requiredTypes = ['common', 'domain', 'infra', 'apps'];
for (const type of requiredTypes) {
  if (!elementTypes.includes(type)) {
    errors.push(`missing boundary element type: ${type}`);
  }
}

// Check rules are set to error level
const rules = config.rules ?? {};

// boundaries/no-unknown must be error (2)
const noUnknown = rules['boundaries/no-unknown'];
if (!noUnknown || noUnknown[0] !== 2) {
  errors.push('boundaries/no-unknown rule not set to error');
}

// boundaries/element-types must be error (2) with correct rules
const elementTypesRule = rules['boundaries/element-types'];
if (!elementTypesRule || elementTypesRule[0] !== 2) {
  errors.push('boundaries/element-types rule not set to error');
} else {
  const ruleConfig = elementTypesRule[1];
  if (ruleConfig?.default !== 'disallow') {
    errors.push('boundaries/element-types default not set to disallow');
  }

  const allowRules = ruleConfig?.rules ?? [];

  // Verify import hierarchy:
  // - common can only import common
  // - domain can import common, domain
  // - infra can import common, domain, infra
  // - apps can import everything
  const expectedRules = {
    common: ['common'],
    domain: ['common', 'domain'],
    infra: ['common', 'domain', 'infra'],
    apps: ['common', 'domain', 'infra', 'apps'],
  };

  for (const [from, expectedAllow] of Object.entries(expectedRules)) {
    const rule = allowRules.find((r) => r.from === from);
    if (!rule) {
      errors.push(`missing element-types rule for: ${from}`);
    } else {
      const actualAllow = [...(rule.allow ?? [])].sort();
      const sortedExpected = [...expectedAllow].sort();
      if (JSON.stringify(actualAllow) !== JSON.stringify(sortedExpected)) {
        errors.push(
          `incorrect allow list for ${from}: expected [${sortedExpected}], got [${actualAllow}]`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error('❌ Boundary enforcement verification failed:');
  for (const err of errors) {
    console.error(`   - ${err}`);
  }
  process.exit(1);
}

console.log('✓ Boundary enforcement verified:');
console.log('  - boundaries plugin loaded');
console.log('  - all element types defined (common, domain, infra, apps)');
console.log('  - boundaries/no-unknown rule active at error level');
console.log('  - boundaries/element-types rule active with correct hierarchy');
console.log(
  '  - import hierarchy: common→common, domain→common+domain, infra→common+domain+infra, apps→all'
);
process.exit(0);
