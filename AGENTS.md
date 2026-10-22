# __PRODUCT__ — instrucciones para agentes

__DESCRIPTION__

Este archivo se carga en cada sesión. Por eso solo tiene lo que no se negocia y dónde está lo demás: las
normas completas viven en `docs/standards/` y se leen cuando tocan.

## Lo que no se negocia

1. **Nada de código sin tarea, y nada de tarea sin requisito.** Lo que no está en `docs/requirements.md`
   se pregunta; no se inventa.
2. **La spec va por delante del código.** Si a mitad de una tarea la spec resulta estar mal, se para, se
   propone el cambio y se sigue cuando el usuario lo aprueba.
3. **Los tests van antes que el código.** Los escribe el agente, también cuando el código lo escribe el
   usuario, y cada uno cita su requisito.
4. **Las invariantes de `docs/domain.md` no se rompen nunca.** Cada una la hace cumplir un solo archivo
   del engine, y nadie más la reimplementa.
5. **El agente no cierra su propia tarea:** la cierra el OK del usuario.
6. **Nunca se commitea en `main`.** Todo va en una rama y entra por una PR (sección Git).
7. **La interfaz es ReDesign:** clases `re-*` para los componentes, Tailwind solo para el layout, y
   `node_modules/re-design` no se edita ni se copia. Si falta algo, se anota como Propuesta en el doc del
   producto en ReDesign y se avisa.
8. **Ningún texto visible escrito en el código:** todo sale de Transloco.

## Antes de…

| Antes de… | Lee |
|---|---|
| Empezar o retomar | La salida de `npm run status` (sale sola al abrir la sesión) |
| Tocar interfaz | `node_modules/re-design/AGENTS.md` y `node_modules/re-design/docs/products/__SLUG__.md` |
| Escribir TypeScript | [docs/standards/code.md](docs/standards/code.md) |
| Escribir un componente, una plantilla o un servicio | [docs/standards/angular.md](docs/standards/angular.md) |
| Escribir o revisar un test | [docs/standards/testing/README.md](docs/standards/testing/README.md) y el archivo de su capa |
| Commitear, abrir una PR o publicar | La sección Git de abajo |
| Dar algo por terminado | `npm run check` en verde (build, lint, lint:design, lint:i18n y tests) |

- Marca: `re-design/brands/__SLUG__.css`.
- Excepciones de diseño: las de `docs/products/__SLUG__.md` en ReDesign. Ninguna más.

## Flujo de trabajo

Se trabaja con spec-driven development. El proceso vive en estos archivos; las skills del plugin `re-sdd`
(repo ReSkills) son atajos para seguirlo.

| Qué | Dónde |
|---|---|
| Material de partida, sin editar | `docs/inbox/` |
| Por qué existe, alcance, decisiones de producto (P-nn) | `docs/product.md` |
| Cada comportamiento, en EARS y con ID | `docs/requirements.md` |
| Glosario, estados, invariantes, entidades | `docs/domain.md` |
| Estructura, permisos, decisiones (A-nn), riesgos | `docs/architecture.md` |
| Pantallas, estados y mapa a ReDesign | `docs/ux.md` |
| Slices y su estado | `docs/roadmap.md` |
| Spec, tareas y verificación de cada slice | `docs/specs/Sxx-nombre/` |

- **Cómo es el producto hoy:** lo describen `requirements.md`, `domain.md` y `architecture.md`. Un slice
  cerrado queda como historia y no se reescribe. Un requisito no se borra: se retira, conservando su ID.
- **Estados de una tarea:** ⬜ pendiente · 🔨 en curso · 🔍 por revisar · ✅ hecha · ❌ con hallazgos.
  - Las tareas del agente las cierra el OK del usuario.
  - Las del usuario, la verificación (`review.md`).
- **Al parar a mitad de un slice,** se escribe «Dónde lo dejé» al final de su `tasks.md`.

## Arquitectura

El detalle y las decisiones están en [docs/architecture.md](docs/architecture.md). Si una decisión deja de
servir, se cambia allí primero y después en el código.

- **`src/engine/`:** TypeScript puro, sin Angular ni `chrome.*`, un archivo por responsabilidad y sin
  barrels. Recibe datos y devuelve datos (o acciones). El lint lo comprueba.
- **`src/entrypoints/background.ts`:** conecta Chrome con el engine y ejecuta lo que el engine decide.
  No contiene reglas.
- **`src/app/`:** el popup.
  - Piezas: item → container → vista → shell.
  - El estado de la interfaz son signals de las vistas; lo que el producto guarda vive en stores.

## Git

La norma completa está en el plugin `re-git` de ReSkills
([norma.md](https://github.com/LimbersMay/ReSkills/blob/main/plugins/re-git/skills/commit/references/norma.md)),
y la aplican sus skills: `/re-git:commit` para commitear y `/re-git:ship` para cerrar la rama. En corto:

- **Ramas:** `slice/S03-nombre` por slice, `docs/…`, `fix/…`, `chore/…` y `spike/…` (estas no se
  fusionan nunca). Los hooks de `.githooks/` impiden commitear en `main` y comprueban el título.
- **Commit:** `tipo(ámbito): resumen [Sxx-Tn]`, en español y en presente. El cuerpo dice el porqué. El pie
  lleva `Requisitos: PAU-03` y `Decisiones: P-12` cuando aplican. Un commit por tarea, con sus tests.
- **PR:** con título `S03 · Nombre del slice`, se fusiona con *merge commit* cuando el CI está en verde y
  el usuario da el OK.
- **Versión:** tag `vX.Y.Z` al cerrar un hito del roadmap, con su entrada en `CHANGELOG.md`.
