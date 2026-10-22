#!/usr/bin/env node
// Where are we? Printed at the start of every Claude Code session (.claude/settings.json › SessionStart)
// and by `npm run status`. Reads the git branch, docs/ (the phase 0 markers, docs/roadmap.md and the
// current tasks.md) and the known defects of the specs. It never fails: a broken status must not block a
// session.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PENDING = '<!-- sdd:pendiente -->';
const PHASE_0 = ['product.md', 'requirements.md', 'domain.md', 'architecture.md', 'ux.md', 'roadmap.md'];

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** Rows of every Markdown table whose first cell is a slice (S01) or task (T1) id. */
function tableRows(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[ST]\d+/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
}

function section(text, title) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith('## ') && line.includes(title));
  if (start === -1) return '';
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
}

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** `it.fails` and `it.todo` left in the specs: each one is a known defect (docs/standards/testing). */
function knownDefects() {
  if (!existsSync('src')) return { fails: 0, todo: 0 };
  const specs = readdirSync('src', { recursive: true })
    .filter((file) => String(file).endsWith('.spec.ts'))
    .map((file) => read(join('src', String(file))));
  const count = (pattern) => specs.reduce((sum, text) => sum + (text.match(pattern)?.length ?? 0), 0);
  return { fails: count(/\bit\.fails\(/g), todo: count(/\bit\.todo\(/g) };
}

try {
  if (!existsSync('docs')) process.exit(0);
  const out = [];

  const branch = git('branch', '--show-current');
  if (branch !== null) {
    const changed = (git('status', '--porcelain') ?? '').split('\n').filter(Boolean).length;
    out.push(`Rama: ${branch || '(sin rama)'}${changed > 0 ? ` · ${changed} archivos sin commitear` : ''}`);
    if (branch === 'main' && changed > 0) out.push('  En main no se commitea: /git:commit los lleva a una rama');
  }

  const pending = PHASE_0.filter((file) => read(join('docs', file)).includes(PENDING));
  if (pending.length > 0) {
    out.push(`Fase 0 · pendientes: ${pending.join(', ')}`);
    const discovering = pending.includes('product.md') || pending.includes('requirements.md');
    if (discovering && read('docs/discovery.md')) out.push('Descubrimiento en curso: docs/discovery.md');
    if (discovering) out.push('Siguiente: /sdd:discover');
    else out.push('Siguiente: /sdd:design');
  }

  const slices = tableRows(read('docs/roadmap.md'));
  if (slices.length > 0) {
    const done = slices.filter((row) => row.at(-1)?.startsWith('✅')).length;
    out.push(`Roadmap · ${done}/${slices.length} slices hechos`);
  }
  const current = slices.find((row) => !row.at(-1)?.startsWith('✅'));
  if (current) {
    out.push(`Slice actual · ${current[0]} ${current[1]} · ${current.at(-1)}`);
    const folder = existsSync('docs/specs')
      ? readdirSync('docs/specs').find((dir) => dir.startsWith(`${current[0]}-`))
      : undefined;
    const tasks = folder ? read(join('docs/specs', folder, 'tasks.md')) : '';
    const open = tableRows(tasks).filter((row) => !row.some((cell) => cell.startsWith('✅')));
    for (const row of open) out.push(`  ${row[0]} ${row[1]} · ${row[2]} · ${row[3]}`);
    const handoff = section(tasks, 'Dónde lo dejé');
    if (handoff) out.push(`Dónde lo dejé:\n${handoff}`);
    if (!folder) out.push(`Siguiente: /sdd:slice ${current[0]}`);
  }

  const defects = knownDefects();
  if (defects.fails + defects.todo > 0) {
    out.push(`Defectos conocidos: ${defects.fails} it.fails · ${defects.todo} it.todo (los // BUG: de los specs)`);
  }

  if (out.length > 0) process.stdout.write(`${out.join('\n')}\n`);
} catch {
  // Silent on purpose: see the header.
}
