#!/usr/bin/env node
// Where are we? Printed at the start of every Claude Code session (.claude/settings.json › SessionStart)
// and by `npm run status`. Reads only docs/: the phase 0 markers, docs/roadmap.md and the current
// tasks.md. It never fails: a broken status must not block a session.
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

try {
  if (!existsSync('docs')) process.exit(0);
  const out = [];

  const pending = PHASE_0.filter((file) => read(join('docs', file)).includes(PENDING));
  if (pending.length > 0) {
    out.push(`Fase 0 · pendientes: ${pending.join(', ')}`);
    const discovery = read('docs/discovery.md');
    if (discovery) out.push(`Descubrimiento en curso: docs/discovery.md`);
    if (pending.includes('product.md') || pending.includes('requirements.md')) {
      out.push('Siguiente: /re-sdd:sdd-discover');
    }
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
    if (!folder) out.push(`Siguiente: /re-sdd:sdd-slice ${current[0]}`);
  }

  if (out.length > 0) process.stdout.write(`${out.join('\n')}\n`);
} catch {
  // Silent on purpose: see the header.
}
