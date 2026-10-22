# Changelog

Un producto nuevo parte de la última versión. Un producto que ya existe no se actualiza solo: lo que le
interese de una versión se copia a mano, con su propia PR.

## Sin publicar

- `AGENTS.md` corto: lo que no se negocia, una tabla «Antes de…» con qué leer, y la norma de git en
  resumen. Las normas completas pasan a `docs/standards/`.
- `docs/standards/code.md` (TypeScript: nombres, tipos, funciones, inmutabilidad, errores, asincronía,
  MV3) y `docs/standards/angular.md` (piezas, componentes, signals, la regla de plantilla y `computed`,
  servicios).
- El estándar de tests se parte en `docs/standards/testing/`: un índice, las reglas comunes, un archivo
  por capa (engine, servicios y stores, service worker, componentes, e2e) y una sola checklist. Sale lo
  que era propio de ReSession y entra el service worker.
- Lint con información de tipos: promesas sin esperar, `switch` exhaustivo, `throw` sin `Error`,
  `readonly`, `OnPush`, `input()`/`output()`, `inject()`, signals sin llamar, `@if`/`@for`,
  `<button type>`, sin `enum`, y retorno declarado en el engine.
- Hooks de git (`.githooks/`, activados por `npm install`): nada de commits en `main` y títulos con la
  norma de git. `TEMPLATE.md` inicializa ya en la rama `docs/fase-0`.
- `npm run status` muestra la rama, los archivos sin commitear y los defectos conocidos (`it.fails`,
  `it.todo`).
- El glosario de `domain.md` tiene la columna «En el código».
- `lib` ES2023 (`toSorted`, `toSpliced`, `with`). `.claude.json` y `.env*` en `.gitignore`.

## 0.0.0 · 2026-10-21

La plantilla inicial (sin tag): Angular 20 zoneless, WXT, Vitest con Testing Library, Transloco, ReDesign,
ESLint, el esqueleto de docs de SDD, `init`, `trace`, `status` y `lint:i18n`.
