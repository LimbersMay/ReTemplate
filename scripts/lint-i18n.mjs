#!/usr/bin/env node
// Every dictionary has exactly the keys of the default one, and no value is empty (docs/standards/angular.md › Plantillas).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('src', 'assets', 'i18n');
const DEFAULT_LANG = 'es';

function flatten(node, prefix = '') {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' ? flatten(value, path) : [[path, value]];
  });
}

const dictionaries = Object.fromEntries(
  readdirSync(DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => [
      file.replace('.json', ''),
      new Map(flatten(JSON.parse(readFileSync(join(DIR, file), 'utf8')))),
    ]),
);

const reference = dictionaries[DEFAULT_LANG];
if (!reference) {
  process.stderr.write(`Falta ${DEFAULT_LANG}.json en ${DIR}\n`);
  process.exit(1);
}

const problems = [];
for (const [lang, keys] of Object.entries(dictionaries)) {
  for (const key of reference.keys()) if (!keys.has(key)) problems.push(`${lang}: falta ${key}`);
  for (const [key, value] of keys) {
    if (!reference.has(key)) problems.push(`${lang}: sobra ${key} (no está en ${DEFAULT_LANG})`);
    if (typeof value === 'string' && value.trim() === '') problems.push(`${lang}: ${key} está vacía`);
  }
}

if (problems.length > 0) {
  process.stderr.write(
    `lint:i18n · ${problems.length} problema(s)\n${problems.map((p) => `  ${p}`).join('\n')}\n`,
  );
  process.exit(1);
}
process.stdout.write(
  `lint:i18n · ${Object.keys(dictionaries).join(', ')} · ${reference.size} claves, sin diferencias\n`,
);
