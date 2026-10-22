# ReTemplate

Plantilla de las extensiones de la suite Re: Angular 20 (standalone, zoneless) · WXT (MV3) · Vitest ·
Testing Library · Transloco (es/en) · Lucide · Tailwind v4 · ReDesign · ESLint · el esqueleto de docs de
spec-driven development. `npm run init` borra este archivo.

## Crear un producto

```bash
gh repo create LimbersMay/ReNombre --private --template LimbersMay/ReTemplate --clone
cd ReNombre
npm install
git switch -c docs/fase-0
npm run init -- --name ReNombre --description "Una frase: qué hace y para quién."
npm run check
git commit -am "chore: inicializa ReNombre desde ReTemplate"
git push -u origin docs/fase-0
```

`npm install` activa los hooks de `.githooks/`, que impiden commitear en `main`: por eso la
inicialización va ya en la rama de la fase 0. Esa rama sigue con el descubrimiento y el diseño, y se
fusiona con una PR (`/re-git:ship`) cuando el usuario aprueba los documentos.

`--slug` es opcional: por defecto, el nombre en minúsculas (`renombre`). Es el de la marca de ReDesign
(`re-design/brands/<slug>.css`) y el de su doc de producto. Si la marca aún no existe, `init` avisa:
hay que darla de alta en ReDesign antes de tocar interfaz.

## Qué hace `init`

1. Sustituye `__PRODUCT__`, `__SLUG__`, `__DESCRIPTION__` y `__DATE__` en todos los archivos de texto.
2. Pone el nombre en `package.json` y `package-lock.json`.
3. Quita el script `init` y borra `TEMPLATE.md` y `scripts/init.mjs`.

## Después

1. Copia el material de partida (requisitos, mocks) en `docs/inbox/`.
2. Instala las skills, una vez por máquina:
   ```text
   /plugin marketplace add LimbersMay/ReSkills
   /plugin install re-sdd@re-skills
   /plugin install re-git@re-skills
   ```
3. Ejecuta `/re-sdd:sdd-discover`.

## Qué trae

| Pieza | Para qué |
|---|---|
| `AGENTS.md` (+ `CLAUDE.md`, `GEMINI.md`) | Lo que no se negocia y qué leer antes de cada cosa; se carga en cada sesión |
| `docs/` | El esqueleto de SDD, con `<!-- sdd:pendiente -->` en lo que falta redactar |
| `docs/standards/` | Las normas: `code.md` (TypeScript), `angular.md` y `testing/` (un archivo por capa y la checklist) |
| `eslint.config.mjs` | Lo que se puede comprobar a máquina de `docs/standards/`, con información de tipos; el engine no puede importar Angular ni usar `chrome` |
| `.githooks/` + `scripts/commit-msg.mjs` | Nada de commits en `main` y títulos con la norma de git; `npm install` los activa |
| `scripts/lint-i18n.mjs` | `es.json` y `en.json` con las mismas claves |
| `scripts/trace.mjs` | Requisitos sin test (`--strict` falla si falta alguno Must) |
| `scripts/status.mjs` | Rama, fase, slice, tareas y defectos conocidos; es el hook `SessionStart` de `.claude/settings.json` |
| `src/testing/` | `render()`, Transloco de pruebas y setup global |
| `.github/workflows/check.yml` | `npm run check` en cada push y PR |

## CI

`re-design` se instala desde GitHub. Si el repo de ReDesign es privado, la CI necesita un token con
acceso de lectura: crea el secreto `REDESIGN_TOKEN` en el repo del producto y el workflow lo usa.
