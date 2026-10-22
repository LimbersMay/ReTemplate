#!/usr/bin/env node
// Checks a commit message against the suite's git norm (AGENTS.md › Git). Run by .githooks/commit-msg.
import { readFileSync } from 'node:fs';

const TYPES = ['feat', 'fix', 'refactor', 'test', 'docs', 'build', 'ci', 'chore', 'perf'];
const TITLE = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9-]+\\))?!?: \\S`);
const MAX_TITLE = 72;

const lines = readFileSync(process.argv[2], 'utf8')
  .split(/\r?\n/)
  .filter((line) => !line.startsWith('#'));
const title = lines[0] ?? '';

// Messages that git writes itself (bringing main into a branch, a revert) keep their own form.
if (/^(Merge|Revert) /.test(title)) process.exit(0);

const errors = [];
if (!TITLE.test(title)) {
  errors.push(`El título debe ser «tipo(ámbito): resumen», con tipo en: ${TYPES.join(', ')}.`);
}
if (title.length > MAX_TITLE) errors.push(`El título tiene ${title.length} caracteres; el máximo es ${MAX_TITLE}.`);
if (/\.$/.test(title)) errors.push('El título no termina en punto.');
if (lines[1] !== undefined && lines[1].trim() !== '') errors.push('La segunda línea va en blanco.');
if (lines.some((line) => /^co-authored-by:/i.test(line))) errors.push('Sin trailers de coautoría.');

if (errors.length > 0) {
  process.stderr.write(`Commit rechazado:\n  ${title}\n\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}
