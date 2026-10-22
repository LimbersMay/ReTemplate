#!/usr/bin/env node
// Requirement → tests. Reads the IDs of docs/requirements.md (`### PAU-01 · …`) and finds the specs whose
// describe/it names cite them (docs/standards/testing/README.md › Trazabilidad).
//
//   npm run trace                          every requirement
//   npm run trace -- --ids PAU-01,PRT-05   only these (what sdd-verify uses for a slice)
//   npm run trace -- --strict              exits 1 if a Must requirement has no test
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ID = /\b([A-Z]{2,4}-\d{2,3})\b/g;
const REQUIREMENT = /^###\s+([A-Z]{2,4}-\d{2,3})\b\s*·?\s*(.*)$/;
const PRIORITY = /Prioridad:\s*(Must|Should|Could|Won't)/i;
const TEST_NAME = /\b(?:describe|it|test)(?:\.\w+)*\(\s*(['"`])(.*?)\1/g;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

if (!existsSync('docs/requirements.md')) {
  process.stdout.write('trace · no hay docs/requirements.md\n');
  process.exit(0);
}

const requirements = [];
let current;
let inFence = false;
for (const line of readFileSync('docs/requirements.md', 'utf8').split(/\r?\n/)) {
  // The format section shows an example requirement inside a code block: it is not one.
  if (line.startsWith('```')) inFence = !inFence;
  if (inFence) continue;
  const heading = REQUIREMENT.exec(line);
  if (heading) {
    current = { id: heading[1], title: heading[2], priority: '—', tests: [] };
    requirements.push(current);
    continue;
  }
  const priority = current && PRIORITY.exec(line);
  if (priority) current.priority = priority[1];
  // A retired requirement keeps its ID (IDs are never reused) but no longer needs tests.
  if (current && line.startsWith('Retirado:')) current.retired = true;
}
const active = requirements.filter((r) => !r.retired);

function specs(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return specs(path);
    return entry.endsWith('.spec.ts') ? [path] : [];
  });
}

const byId = new Map(active.map((r) => [r.id, r]));
const unknown = new Set();
for (const file of specs('src')) {
  const source = readFileSync(file, 'utf8');
  for (const [, , name] of source.matchAll(TEST_NAME)) {
    for (const [id] of name.matchAll(ID)) {
      const requirement = byId.get(id);
      if (requirement) requirement.tests.push(`${relative('.', file)} › ${name}`);
      else unknown.add(`${id} (${relative('.', file)})`);
    }
  }
}

const only = arg('ids')?.split(',').map((id) => id.trim());
const shown = only ? active.filter((r) => only.includes(r.id)) : active;
const rows = shown.map(
  (r) =>
    `${r.tests.length > 0 ? '✅' : '⬜'} ${r.id.padEnd(7)} ${r.priority.padEnd(6)} ${String(r.tests.length).padStart(2)} test(s)  ${r.title}`,
);
const covered = shown.filter((r) => r.tests.length > 0).length;
process.stdout.write(`trace · ${covered}/${shown.length} requisitos con tests\n${rows.join('\n')}\n`);
if (unknown.size > 0) {
  process.stdout.write(
    `\nIDs citados en tests que no existen en requirements.md o están retirados:\n  ${[...unknown].join('\n  ')}\n`,
  );
}

const missingMust = shown.filter((r) => r.priority.toLowerCase() === 'must' && r.tests.length === 0);
if (process.argv.includes('--strict') && (missingMust.length > 0 || unknown.size > 0)) process.exit(1);
