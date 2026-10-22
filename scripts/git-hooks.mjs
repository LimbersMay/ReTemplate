#!/usr/bin/env node
// Points git at .githooks/. npm runs it on install ("prepare"). It never fails: outside a git checkout
// there is nothing to set up, and a broken hook setup must not break npm install.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  // Silent on purpose: see the header.
}
