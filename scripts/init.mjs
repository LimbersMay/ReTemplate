#!/usr/bin/env node
// Turns the template into a product: fills the placeholders, renames the package and removes the
// template-only files (TEMPLATE.md and this script).
//
//   npm run init -- --name ReTame --description "Duerme y archiva las pestañas que no usas"
//
// Options: --slug <id> (default: the name in lower case). It must match ReDesign's brands/<slug>.css.
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.angular', '.wxt', '.output', 'dist', 'out-tsc', 'popup']);
const TEXT = /\.(ts|mjs|js|json|html|css|md|yml|yaml|txt)$/;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const name = arg('name');
const description = arg('description');
if (!name || !description) {
  process.stderr.write('Uso: npm run init -- --name ReTame --description "Qué hace, en una frase"\n');
  process.exit(1);
}
const slug = arg('slug') ?? name.toLowerCase();
const date = new Date().toISOString().slice(0, 10);
const values = { __PRODUCT__: name, __SLUG__: slug, __DESCRIPTION__: description, __DATE__: date };

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return SKIP_DIRS.has(entry) ? [] : walk(path);
    return TEXT.test(entry) ? [path] : [];
  });
}

const self = join(ROOT, 'scripts', 'init.mjs');
const changed = [];
for (const file of walk(ROOT)) {
  if (file === self) continue;
  const before = readFileSync(file, 'utf8');
  const after = Object.entries(values).reduce((text, [key, value]) => text.replaceAll(key, value), before);
  if (after !== before) {
    writeFileSync(file, after);
    changed.push(relative(ROOT, file));
  }
}

const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = slug;
delete pkg.scripts.init;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const lockPath = join(ROOT, 'package-lock.json');
if (existsSync(lockPath)) {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  lock.name = slug;
  if (lock.packages?.['']) lock.packages[''].name = slug;
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

rmSync(join(ROOT, 'TEMPLATE.md'), { force: true });
rmSync(self);

const designDir = join(ROOT, 'node_modules', 're-design');
const brandNote = !existsSync(designDir)
  ? 'Aún no hay node_modules: ejecuta npm install.'
  : existsSync(join(designDir, 'tokens', 'brands', `${slug}.css`))
    ? `Marca encontrada: re-design/brands/${slug}.css`
    : `AVISO: re-design no tiene brands/${slug}.css. Da de alta el producto en ReDesign antes de compilar.`;

process.stdout.write(
  [
    `${name} listo (${changed.length} archivos rellenados).`,
    brandNote,
    '',
    'Siguiente:',
    '  1. Copia el material de partida (requisitos, mocks) a docs/inbox/.',
    '  2. npm run check',
    '  3. En Claude Code: /re-sdd:sdd-discover',
    '',
  ].join('\n'),
);
