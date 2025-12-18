#!/usr/bin/env node
/**
 * Verify that package.json does not contain truncation artifacts.
 * Fails if "..." is found anywhere in the file or in any script value.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const packageJsonPath = resolve(repoRoot, 'package.json');

const rawContent = readFileSync(packageJsonPath, 'utf8');
const pkg = JSON.parse(rawContent);

let hasError = false;

// Check A: raw file text does not contain "..."
if (rawContent.includes('...')) {
  console.error('❌ package.json contains literal "..." in raw text');
  hasError = true;
}

// Check B: every scripts[key] string does not contain "..."
if (pkg.scripts && typeof pkg.scripts === 'object') {
  for (const [key, value] of Object.entries(pkg.scripts)) {
    if (typeof value === 'string' && value.includes('...')) {
      console.error(`❌ package.json scripts.${key} contains "..."`);
      console.error(`   Value: ${value}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('');
  console.error('This typically indicates a truncated or placeholder script.');
  console.error('All scripts must be explicit and complete.');
  process.exit(1);
} else {
  console.log('✓ package.json verification passed');
  console.log('  No "..." artifacts found');
  process.exit(0);
}
