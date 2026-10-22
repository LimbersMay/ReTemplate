# Tests

Estándar **normativo** para todo test nuevo o modificado, lo escriba una persona o un agente. Si una regla
deja de servir, se cambia aquí primero y después en los tests.

- **DEBE** y **NO DEBE** son obligatorios.
- **DEBERÍA** admite excepciones, justificadas en un comentario del propio test.

## Qué leer

Este archivo siempre, más el de la capa del archivo bajo prueba:

| Si pruebas… | Lee |
|---|---|
| Cualquier cosa | [writing.md](writing.md): estructura, dobles, globales, asincronía, asserts |
| Una función de `src/engine/` | [engine.md](engine.md) |
| Un servicio o un store | [state.md](state.md) |
| El service worker (`src/entrypoints/`) | [background.md](background.md) |
| Un componente o una directiva | [components.md](components.md) |
| Algo que solo pasa en Chrome de verdad | [e2e.md](e2e.md) |
| Antes de dar un spec por terminado | [checklist.md](checklist.md) |

## Principios

1. **Comportamiento, no implementación.** Se verifica lo que observa quien usa la pieza: el valor de los
   signals públicos, lo que quedó guardado, lo que se emitió, lo que hay en pantalla. No se leen miembros
   privados ni `protected`, ni se espían métodos privados.
2. **Determinismo.** El mismo resultado en cualquier orden, máquina y hora. Ni `Date.now()`, ni
   `Math.random()`, ni `crypto.randomUUID()`, ni temporizadores reales sin controlar.
3. **Aislamiento.** Ningún test deja estado que otro pueda ver: globales, storage, constantes mutadas,
   spies sin restaurar, elementos en `document.body`.
4. **Un motivo de fallo por test.** Si el nombre de un `it` necesita una «y» entre dos comportamientos,
   son dos tests.
5. **El camino feliz no basta.** Cada capa tiene sus casos de borde obligatorios (los de su archivo). Un
   spec que solo cubre el camino feliz no se acepta.
6. **Asserts que discriminan.** Los datos de prueba distinguen los resultados posibles. Si se prueba que
   cada fila muestra su nombre, las filas tienen nombres distintos; con uno fijo, el test pasa aunque
   todas muestren el de la primera.
7. **El test detecta el fallo.** Antes de darlo por bueno, se rompe a mano la línea que protege (se
   invierte una condición, se cambia un `track`) y se comprueba que se pone rojo.

## Test-first

Los tests salen de la spec del slice y se escriben **antes** que el código, lo escriba quien lo escriba:

1. La sección «Tests» de `docs/specs/Sxx-*/spec.md` es la lista mínima. El agente escribe esos tests y
   los de borde de la capa, y comprueba que **fallan por el motivo correcto**: falta el código, no hay un
   error de compilación ni un import roto.
2. El código se escribe hasta que pasan:
   - Si lo escribe el usuario, el agente le entrega los tests en rojo y la guía de la tarea.
   - Para que pasen, no se cambia un test: se cambia el código.
3. **Si un test resulta estar mal,** porque la spec dice otra cosa o la spec está mal, se para. Primero se
   corrige la spec, con el OK del usuario, y después el test.
4. Test y código van en el mismo commit, el de la tarea (`[Sxx-Tn]`).

## Trazabilidad

- **El ID del requisito va en el nombre.** Todo test que prueba un requisito de `docs/requirements.md`
  DEBE citar su ID al principio del nombre del `it` o de su `describe`:
  `it('PAU-03 pauses the tab after the idle limit')`, `describe('PAU-01 idle time', …)`.
- **Las invariantes de `docs/domain.md` se citan igual** (`I1`), y cada una tiene al menos un caso que la
  cumple y otro que intenta romperla.
- **`npm run trace`** cruza los requisitos con los nombres de los tests:
  - Lista los requisitos que no tienen ningún test.
  - Lista los IDs citados que no existen o están retirados.

  Un slice no se cierra con un requisito suyo sin test.
- **Sin ID:** los tests de infraestructura (`src/testing/`, una directiva genérica) no prueban un
  requisito y no lo llevan.

## Procedimiento para agentes

1. Lee la spec del slice y el contrato del archivo bajo prueba: sus tipos, su JSDoc y lo que dice
   `docs/architecture.md`. Se prueba el contrato, no la implementación.
2. Lee [writing.md](writing.md) y el archivo de la capa. **Cada caso de borde que aplique DEBE tener al
   menos un test.**
3. Reutiliza `src/testing/`. Si falta un doble o un builder que valga para más de un spec, créalo ahí, no
   dentro del spec.
4. Si un caso obligatorio falla porque el **código de producción** no cumple el contrato, no cambies el
   assert para que pase: es un defecto conocido ([writing.md](writing.md#defectos-conocidos)).
5. Deja `npm run check` en verde y repasa la [checklist](checklist.md).
6. En tu respuesta, lista los `it.fails` y `it.todo` que añadiste y el defecto que documenta cada uno.

## Stack

| Pieza | Valor |
|---|---|
| Runner | Vitest vía `@angular/build:unit-test` (`ng test`), en jsdom |
| Angular | 20, zoneless y standalone |
| Globals | `describe`, `it`, `expect`, `vi`, `beforeEach`, `onTestFinished`… sin importar. De `vitest`, solo `import type` |
| DOM | Testing Library (`@testing-library/dom` y `user-event`), envuelto por `render()` de `@testing/dom` |
| Ayudas | `src/testing/` con el alias `@testing/*`. Solo lo importan specs y no entra en el build |
| Setup global | `src/testing/setup.ts`: limpia globales, mocks, temporizadores y storage después de **cada** test |
| Providers globales | `src/testing/providers.ts`: zoneless y los iconos de `app/icons.ts` |
| Ubicación | Cada `*.spec.ts` junto a su archivo |

```bash
npm test                                          # watch
npm run test:once                                 # una pasada, como en CI
npx ng test --watch=false --include "src/engine/**/*.spec.ts"
```
