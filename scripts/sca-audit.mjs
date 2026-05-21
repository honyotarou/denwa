#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execSync('npx tsx scripts/sca-audit-run.ts', { cwd: ROOT, stdio: 'inherit' });
