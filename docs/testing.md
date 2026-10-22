# TESTING.md: estándar de tests de __PRODUCT__

Este documento es **normativo**. Todo test nuevo o modificado debe cumplirlo, lo escriba una persona o una IA. Si una regla deja de servir, se cambia aquí primero y luego en el código.

- Palabras clave: **DEBE** / **NO DEBE** son obligatorias; **DEBERÍA** admite excepciones justificadas en un comentario del propio test.
- Contexto de arquitectura: [docs/architecture.md](architecture.md) (§5 estado, §10 convenciones, D24).
- Infraestructura de tests: [`src/testing/`](../src/testing/) (alias `@testing/*`, solo para specs).
- Los ejemplos (`CookieContainer`, `trackerName()`, `ToastService`…) vienen de ReSession, donde nació este estándar. Las reglas valen tal cual; los ejemplos se sustituyen por los del producto cuando los haya. Los archivos que citan y aún no existen aquí (`fixtures.ts`, `chrome.fake.ts`) se crean con el primer spec que los necesite.

---

## 0. Instrucciones para agentes de IA

Si eres un agente generando o corrigiendo tests, sigue este procedimiento en orden:

1. Lee la spec del slice (`docs/specs/Sxx-*/spec.md`): su lista de tests es el mínimo, y cada test cita el ID del requisito que prueba (§3, Trazabilidad). Los tests se escriben **antes** que el código.
2. Lee el archivo bajo prueba **y su contrato**: las interfaces de [`engine/models.ts`](../src/engine/models.ts), los JSDoc de la clase y la arquitectura (§5). Se prueba el contrato, no la implementación.
3. Identifica la capa (`engine/`, servicio, store, componente dumb, componente smart) y abre su checklist de la [§8](#8-casos-de-borde-obligatorios). **Cada punto aplicable DEBE tener al menos un test.**
4. Reutiliza `src/testing/` (fixtures, `render()`, Transloco de pruebas). Si es un componente, sigue la [§7](#7-componentes-tests-de-dom). Si falta un doble, **créalo en `src/testing/`**, no inline en el spec.
5. Escribe los tests siguiendo la estructura de la [§3](#3-estructura-de-un-spec) y las plantillas de la [§11](#11-plantillas).
6. Si un caso obligatorio falla porque el **código de producción** no cumple el contrato, NO ajustes el assert al bug: aplica la [§10](#10-defectos-conocidos-itfails-e-ittodo).
7. Ejecuta y deja verde:
   ```bash
   npx ng test --watch=false
   npx tsc -p tsconfig.spec.json --noEmit
   ```
8. En tu respuesta, lista los `it.fails` y `it.todo` que añadiste y el defecto que documentan.

---

## 1. Stack y ejecución

| Pieza | Valor |
|---|---|
| Runner | Vitest 3 vía `@angular/build:unit-test` (`ng test`). En Angular 20 el builder es experimental; con Angular 21 pasa a estable sin cambiar los specs |
| Entorno | jsdom (sin navegador real) |
| Angular | 20, **zoneless** (sin `zone.js`), componentes **standalone** |
| Globals | `describe`, `it`, `expect`, `vi`, `beforeEach`, `onTestFinished`… son globales (`vitest/globals`). Solo se permite `import type { … } from 'vitest'`. |
| DOM | `@testing-library/dom` (queries) y `@testing-library/user-event` (interacciones), envueltos por `render()` de `@testing/dom` (§7) |
| Providers globales | [`src/testing/providers.ts`](../src/testing/providers.ts): zoneless y los iconos de [`app/icons.ts`](../src/app/icons.ts), los mismos que registra la app. `angular.json → test → options.providersFile` |
| Setup global | [`src/testing/setup.ts`](../src/testing/setup.ts), en `angular.json → test → options.setupFiles` |
| Ubicación | Cada `*.spec.ts` junto a su archivo (`cookie-item.ts` → `cookie-item.spec.ts`) |

```bash
npm test                                         # = ng test (watch en terminal interactiva)
npx ng test --watch=false                        # una pasada, como en CI
npx ng test --watch=false --include "src/app/cookies/**/*.spec.ts"
```

TestBed se inicializa y se resetea solo entre tests. **NO DEBE** llamarse a `TestBed.resetTestingModule()` ni a `initTestEnvironment()` a mano.

---

## 2. Principios

1. **Comportamiento, no implementación.** Se verifica lo que observa un consumidor: el valor de los signals públicos, lo que quedó guardado, lo que se emitió, lo que hay en pantalla. No se espían métodos privados ni se accede a miembros privados o `protected` (`component['rows']`, `as any`).
2. **Determinismo.** Mismo resultado en cualquier orden, máquina y hora. Prohibido depender de `Date.now()`, `Math.random()`, `crypto.randomUUID()` o temporizadores reales sin controlarlos (§5).
3. **Aislamiento.** Ningún test deja estado que otro pueda ver: globales, `localStorage`, constantes mutadas, spies sin restaurar, elementos añadidos a `document.body`.
4. **Un motivo de fallo por test.** Si un `it` necesita la palabra "y" en su nombre para dos comportamientos distintos, son dos tests.
5. **El happy path no basta.** Un spec que solo cubre el camino feliz está incompleto y no se acepta en revisión (§8).
6. **Asserts discriminantes.** Los datos de prueba DEBEN distinguir los resultados posibles. Por ejemplo, el grupo de rastreadores se prueba con una fila de un rastreador conocido, otra de otro conocido y una desconocida, para que "nombra el rastreador de cada fila" no pase con un nombre fijo.

---

## 3. Estructura de un spec

### Nombres

- `describe` de primer nivel: el nombre exacto de la clase o función (`'CookieContainer'`, `'trackerName()'`).
- `describe` anidado por método público con paréntesis (`'answer()'`) o por aspecto (`'head action'`, `'rows'`, `'collapse'`).
- `it` en **inglés**, en presente, describiendo comportamiento observable y la condición: `'drops exactly the middle row when the group loses that cookie'`. Nada de `'should …'` ni `'works'`.

### Trazabilidad

- Todo test que prueba un requisito de [`docs/requirements.md`](requirements.md) DEBE citar su ID al principio del nombre del `it` o de su `describe`: `it('PAU-03 pauses the tab after the idle limit')`, `describe('PAU-01 idle time')`. Una invariante se cita igual (`I1`).
- `npm run trace` cruza los IDs de los requisitos con los nombres de los tests y lista los que no tienen ninguno. Un slice no se cierra con un requisito suyo sin test.
- Los tests de infraestructura que no prueban un requisito (los de `src/testing/`, una directiva genérica) no llevan ID.

### Función `setup()` en lugar de `let` compartidos

Cada spec DEBE declarar una función `setup(options)` que construye el escenario y **devuelve** lo que el test necesita. NO DEBE usarse el patrón `let x; beforeEach(() => x = …)` para el sujeto bajo prueba.

Motivo: cada test declara su escenario explícitamente (`setup({ collapsed: true })`), y lo que hay que preparar antes de crear el sujeto (el reloj, los dobles, el storage) queda dentro de `setup()`.

```ts
async function setup({ group = buildCookieGroup(), collapsed = false } = {}) {
  const toggleCollapse = vi.fn<() => void>();
  TestBed.configureTestingModule({ imports: [translocoTestingModule()] });
  const rendered = await render(CookieContainer, {
    bindings: [
      inputBinding('group', () => group),
      inputBinding('collapsed', () => collapsed),
      outputBinding('toggleCollapse', toggleCollapse),
    ],
  });
  return { ...rendered, toggleCollapse };
}
```

### Arrange / Act / Assert

Tres bloques separados por una línea en blanco. Sin comentarios `// Arrange` (la línea en blanco basta). Un solo *Act* por test.

### Reglas de TestBed

- Los servicios `providedIn: 'root'` **no** se vuelven a declarar en `providers`; solo se sustituyen sus dependencias.
- Las dependencias se sustituyen por token (`{ provide: ToastService, useValue: toast }`), nunca parcheando la instancia real.

---

## 4. Dobles de prueba

Orden de preferencia. Usa el primero que sirva:

| # | Tipo | Cuándo | En ReSession |
|---|---|---|---|
| 1 | Implementación real | Funciones puras, `engine/`, servicios sin dependencias (`ConfirmService`, `ToastService`) | — |
| 2 | **Fake funcional** (en memoria) | Dependencias con estado: `chrome.*` cuando lleguen los stores (fase 2) | `installChromeFake()` (§5, pendiente) |
| 3 | Stub tipado con `vi.fn<T>()` | Colaboradores sin estado relevante (toast, editor) | `{ show: vi.fn<ToastService['show']>() }` |
| 4 | `vi.spyOn` sobre un objeto real | Observar o forzar un fallo puntual de algo real | `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(…)` |

Reglas:

- Los fakes de `src/testing` **implementan la API real** (los tipos de `@types/chrome`). Si el contrato cambia, el compilador rompe el fake: es intencionado.
- Todo `vi.fn` DEBE estar tipado con la firma real: `vi.fn<ToastService['show']>()`, `vi.fn<(id: string) => void>()`. **Prohibido** `ReturnType<typeof vi.fn>`, `any` y `as any`: ocultan errores.
- Los fallos se inyectan solo para la llamada que interesa: `mockRejectedValueOnce`, `mockReturnValueOnce`.
- Un doble que se necesite en más de un spec DEBE vivir en `src/testing` (`chrome.fake.ts`, `fixtures.ts`…). Los specs no importan de otros specs.
- `src/testing` está excluido del build de la app (`tsconfig.app.json`) y solo lo importan specs. Su alias `@testing/*` existe solo en `tsconfig.spec.json`.

### Fixtures

- Siempre con *builders* de [`@testing/fixtures`](../src/testing/fixtures.ts) que devuelven un objeto nuevo en cada llamada: `buildCookie(overrides)`, `buildCookies(n)`, `buildCookieGroup(overrides)`, `buildStorageEntry(overrides)`, `buildStorageEntries(n)`, `buildJwt(payload, header?)`.
- Prohibido declarar literales de dominio completos dentro de un spec. Si falta una variante, se pasa por `overrides` o se añade un builder. Un builder local del spec solo se permite para un tipo que solo usa ese spec (`buildRequest()` de `ConfirmRequest`).
- Para comparar contra el estado inicial se vuelve a llamar al builder (`expect(group).toEqual(buildCookieGroup())`), no se reutiliza una referencia que el código pudo mutar.

### Prohibido testear datos estáticos o de demostración

Los tests verifican **comportamiento del sistema**, nunca el contenido de datos.

- **Prohibido** crear un `describe()` o un `it()` cuyo único propósito sea validar el contenido, la forma o la presencia de constantes de ejemplo o de demostración (`src/app/mock-data.ts`): cuántos elementos tienen, qué variantes incluyen, qué campos traen.
- **Prohibido** que un test **dependa** de esas constantes: no se importan en un spec, ni para sembrar estado ni como valor esperado. El estado se siembra con los builders de `@testing/fixtures`.
- Las maquetas y lo que solo existe de forma temporal no se testean: se eliminan al terminar su fase.
- Si un comportamiento de demo contradice el contrato final, se escribe el test del **contrato final** como `it.fails` con un comentario `// PENDING:` (§10). Al quitar la demo, el test se pone rojo y se pasa a `it`.
- Sí se permite referenciar constantes que **son contrato** de producción (`TOAST_DURATION`, las claves de `engine/storage-keys.ts`) como valor esperado de un comportamiento. Sigue prohibido un test que solo valide su contenido.

---

## 5. Globales y APIs de Chrome

### Regla general

Un test **solo** puede alterar el entorno global con APIs de Vitest que se restauran automáticamente. El setup global ([`src/testing/setup.ts`](../src/testing/setup.ts)) ejecuta tras **cada** test `vi.unstubAllGlobals()`, `vi.restoreAllMocks()`, `vi.useRealTimers()`, `localStorage.clear()` y `sessionStorage.clear()`. Los specs no repiten esa limpieza.

| Permitido | Prohibido |
|---|---|
| `vi.stubGlobal('chrome', …)` | `globalThis.chrome = …` / `(window as any).chrome = …` |
| `vi.spyOn(obj, 'method')` | `Object.defineProperty(globalThis, …)` |
| `vi.useFakeTimers()` / `vi.setSystemTime()` | Reasignar `console.log`, `Date`, `crypto`… |
| Escribir en `localStorage` para preparar datos | Mutar constantes exportadas (`TOAST_DURATION`, `EXPIRY_WARNING_MS`) |
| Añadir un elemento a `document.body` y quitarlo con `onTestFinished(() => el.remove())` | Dejarlo en el documento |

### `chrome.*`: `installChromeFake()` (fase 2)

Hoy ningún código de la fase 1 llama a `chrome.*`. Cuando lleguen los stores (D2), que llaman a `chrome.*` directamente (§5 de la arquitectura), se crea `src/testing/chrome.fake.ts` con `installChromeFake()`:

- Instala un `chrome` en memoria con `vi.stubGlobal` y las áreas que use el código (`cookies`, `storage.local`, `tabs`…).
- Reproduce la semántica real: `storage.local.get(key)` **omite** las claves inexistentes; los valores se serializan como JSON al escribir y al leer; `set`, `remove` y `cookies.set/remove` emiten su `onChanged`.
- Ofrece `seed()` para preparar datos sin pasar por los espías y `snapshot()` para verificar el estado guardado.
- Cada método es un `vi.fn` para inyectar un fallo en la próxima llamada (`mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'))`).

Reglas desde entonces:

- Se usa **siempre** `installChromeFake()` para tener una API de Chrome presente. `vi.stubGlobal('chrome', …)` directo solo se permite para simular una API **ausente o parcial**.
- Las claves se referencian con las constantes de `engine/storage-keys.ts`, nunca con strings literales.
- Cuando se necesite otra API, se amplía el fake; no se crean mocks ad hoc en el spec.

### Portapapeles

`render()` llama a `userEvent.setup()`, que instala un portapapeles en memoria en `navigator.clipboard`. Lo copiado se lee con `await navigator.clipboard.readText()`, y un fallo se fuerza con `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(…)` **después** de `render()`.

### `localStorage`

- jsdom da un `localStorage` real; se prepara con `localStorage.setItem(key, raw)` y se limpia solo.
- Los fallos de cuota se simulan con `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('…', 'QuotaExceededError'); })`.

### Consola, tiempo y aleatoriedad

- Un test NO DEBE dejar salida en consola. Si el código loguea un error como parte del contrato, se espía y **se verifica**: `expect(consoleError).toHaveBeenCalledExactlyOnceWith(expect.any(String), error)`.
- **Tiempo en componentes:** `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(NOW)`. Solo `Date`: el planificador zoneless de Angular usa `setTimeout`, y con temporizadores falsos `whenStable()` no resolvería.
- **Tiempo en servicios y funciones puras:** `vi.useFakeTimers()` completo y `vi.advanceTimersByTime(ms)` (por ejemplo, la duración de un toast). Las funciones de `locale-format.ts` reciben `now` como parámetro: se le pasa, sin falsear el reloj.
- IDs: `vi.spyOn(crypto, 'randomUUID').mockReturnValue('…')`.

---

## 6. Asincronía, signals y zoneless

### Promises y Observables

| Caso | Forma obligatoria |
|---|---|
| Promise | `await promise` / `await expect(promise).resolves.toBe(…)` / `rejects.toThrow('…')` |
| Promise que se resuelve después del *Act* | Se guarda antes (`const answer = service.ask(…)`) y se espera en el *Assert* |
| Observable de un solo valor | `await firstValueFrom(obs$)` |
| Flujo de varios valores | `await firstValueFrom(obs$.pipe(take(n), toArray()))` |

Prohibido: callbacks `done`, `subscribe` dentro del test sin esperar el resultado, `setTimeout`/`sleep` para "dar tiempo".

> Los stores llaman a `chrome.*` con `async/await` (arquitectura §5), así que sus mutaciones devuelven Promises.

### Zoneless

- **Prohibidos** `fakeAsync`, `tick`, `flush` y `waitForAsync` de `@angular/core/testing`: requieren `zone.js`, que el proyecto no tiene.
- Efectos (`effect()`): se ejecutan con `TestBed.tick()` antes del assert.
- Componentes: se montan con `render()` de `@testing/dom`, que espera el render inicial y el de cada interacción (§7). Para cambiar un input después del render se enlaza un `signal` con `inputBinding('group', groupSignal)`, se hace `groupSignal.set(…)` y se espera `await fixture.whenStable()`. Lo mismo tras cambiar el estado de un servicio real (`toast.show(…)`).

### Servicios y stores de signals

- El estado se siembra **a través de la API pública o del fake de Chrome**, nunca escribiendo en un signal privado.
- El estado se observa leyendo los signals y `computed` públicos (`current()`).
- **Reactividad:** al menos un test por servicio o store crea un `computed` dependiente y comprueba que recalcula tras una mutación. Esto detecta mutaciones in situ que un `toEqual` no ve:
  ```ts
  const isOpen = computed(() => service.current() !== null);
  expect(isOpen()).toBe(false);

  void service.ask(buildRequest());

  expect(isOpen()).toBe(true);
  ```

---

## 7. Componentes: tests de DOM

Un componente se prueba **como lo usa una persona**: se renderiza, se interactúa con el DOM y se verifica lo que queda en pantalla o lo que se emite.

> **Por qué.** Un `@for` con un `track` equivocado reutiliza las filas del DOM: al quitar la primera cookie de un grupo, el candado de la tercera puede quedarse en la que ahora ocupa su posición. El `computed` de las filas está bien; solo un test que lee el DOM lo detecta. Los tests de `CookieContainer` y `StorageContainer` quitan la primera, la del medio y la última, y comprueban que el estado (candado, decodificado) sigue en su elemento.

### Herramientas

| Pieza | Uso |
|---|---|
| `render(Component, { bindings })` de `@testing/dom` | Crea el componente, espera el primer render y devuelve `fixture`, `view` (queries de [Testing Library](https://testing-library.com/docs/queries/about) acotadas al componente) y las interacciones `click`, `type`, `clear`, `keyboard` y `tab`. Cada interacción usa `user-event` y espera `fixture.whenStable()` antes de resolver. |
| `inputBinding` / `outputBinding` de `@angular/core` | Enlazan inputs y outputs **por nombre**, como lo haría la plantilla del padre. |
| `translocoTestingModule()` de `@testing/transloco` | Transloco con los JSON reales, cargados de forma síncrona, en inglés. |
| `translate(key, params?)` de `@testing/transloco` | Texto en inglés de una clave, con sus parámetros. El DOM se consulta con `translate('cookies.lock')`, **nunca** con el texto escrito a mano. Lanza un error si la clave no existe. |

Configuración de TestBed:

- Los componentes son standalone: `TestBed.configureTestingModule({ imports: [translocoTestingModule()] })` y `render(Component)`. El componente **no** se declara ni se importa en TestBed.
- **No** se crean componentes *host* en el spec para enlazar inputs y outputs: para eso está `bindings`. La única excepción es una **directiva**, que no tiene plantilla propia: se prueba con un host standalone mínimo que la usa como lo haría su consumidor ([tree-head-toggle.spec.ts](../src/app/shared/directives/tree-head-toggle.spec.ts)).

```ts
const toggleSelect = vi.fn<(id: string) => void>();
TestBed.configureTestingModule({ imports: [translocoTestingModule()] });

const rendered = await render(CookieContainer, {
  bindings: [inputBinding('group', () => group), outputBinding('toggleSelect', toggleSelect)],
});
```

### Qué se verifica y qué no

| Se verifica | Prohibido verificar |
|---|---|
| Contenido visible: texto, `input.value`, `title`, número y orden de filas | Clases CSS, de ReDesign o de Tailwind (`re-hint--warning`, `re-reveal`, `opacity-60`…): cambian por estilo, no por comportamiento |
| Atributos semánticos: `disabled`, `checked`, `aria-*`, `role`, `tabindex` | Estilos computados (`getComputedStyle`) |
| Presencia y ausencia de elementos (`queryBy…` → `null`) | Estructura interna (`div > div:nth-child(2)`, `parentElement`, nombres de etiqueta) |
| El payload exacto de cada `output()` | Miembros del componente (`componentInstance`, métodos `protected`, signals internos) |
| En componentes smart: el DOM resultante | El estado del store: ya lo prueban sus propios specs |

Si un estado visual importa (cookie protegida, pestaña activa), DEBE expresarse de forma semántica (`aria-pressed`, `aria-selected`, `aria-expanded`, un texto) y se verifica eso. Mientras solo se exprese con clases, **no se testea** (hoy: el tono de aviso de una caducidad cercana, el color de «Limpiar», el icono).

### Cómo encontrar elementos

Orden de preferencia (el de Testing Library):

1. `getByRole(role, { name })`: botones, checkboxes, `alertdialog`, `status`… También `{ expanded }` para la cabecera de un grupo.
2. `getByLabelText`: exige `<label for>` o `aria-label`.
3. `getByPlaceholderText` / `getByDisplayValue`.
4. `getByText` / `getByTitle` (las caducidades muestran el texto corto y la frase completa en `title`).
5. `getByTestId` (`data-testid`), solo si nada de lo anterior es posible.

- **Prohibido** `querySelector` con clases, etiquetas o estructura. Se permite leer un elemento por un id que el propio componente referencia en un atributo ARIA (`aria-describedby`).
- Si un elemento interactivo no se encuentra por rol y nombre (un botón que solo tiene un icono), se corrige la **plantilla** con un `aria-label` traducido. Es un defecto de accesibilidad, no un problema del test.

### Cómo interactuar

- Solo con `rendered.click / type / clear / keyboard / tab`: disparan los eventos reales de un usuario. `keyboard` actúa sobre el elemento con el foco; se enfoca antes con `element.focus()`.
- **Prohibido** llamar a métodos del componente, usar `triggerEventHandler`, disparar eventos a mano con `dispatchEvent` o llamar a `fixture.detectChanges()` (en zoneless se espera con `whenStable()`, que `render` ya hace).
- Después de cada acción se vuelve a leer el DOM: es la fuente de verdad del test.

### Listas renderizadas con `@for`

Toda lista DEBE cubrir lo que le aplique:

| ID | Escenario | Resultado esperado |
|---|---|---|
| L1 | Render inicial | Una fila por elemento, en orden, con sus valores |
| L2 | Añadir | La fila nueva aparece en su sitio; las demás no cambian |
| L3 ⚠️ | Quitar la **primera**, una **del medio** y la **última** (por input o por acción) | Desaparece **exactamente** esa fila; las demás conservan valores, orden y estado (candado, selección, decodificado) |
| L4 ⚠️ | Eliminaciones consecutivas hasta vaciar la lista | Cada clic quita la fila pulsada, no otra |
| L5 | Lista vacía | Se muestra el estado vacío |
| L6 | Re-render (plegar, cambio de vista, `@if`) | Se conservan las filas y su estado |
| L7 | Guardar | Lo que se envía coincide con lo que se ve, en el mismo orden |
| L8 | Output por fila | Emite el id de **esa** fila: primera, del medio y última |

L3 con las tres posiciones es obligatorio: un bug de `track` suele afectar siempre a la última fila, así que un test que solo quita la última **pasa con el bug**.

Si el estado inicial no es fiable por un defecto documentado, el resultado esperado se calcula a partir de lo que había en pantalla antes de actuar (`before.filter((_, i) => i !== index)`).

### Formularios

| ID | Escenario | Resultado esperado |
|---|---|---|
| F1 | Enviar tras editar campos | El output se emite **una vez** con los campos editados |
| F2 | Enviar sin editar (modo edición) | El payload es igual a la entrada (ida y vuelta) |
| F3 ⚠️ | Identidad del registro editado | Se conservan `id`, `domain`, `path`, `storeId`… |
| F4 | Formulario inválido | No emite y el error se ve en pantalla |
| F5 | Cancelar / guardar | Cancelar emite `closed` y no `save`; guardar no emite `closed` |

### Componentes smart (integración)

- Se montan con el **store real** sobre `installChromeFake()` y se verifica **solo el DOM**.
- Los servicios de capas (`ToastService`, `ConfirmService`) se usan reales cuando el componente los pinta (`Toast`, `ConfirmDialog`) y como stub tipado cuando solo los llama (`StorageContainer` → `toast.show`).

---

## 8. Casos de borde obligatorios

Cada punto aplicable DEBE tener al menos un test. Los marcados con ⚠️ son los que más se olvidan.

### 8.1 Stores (fase 2)

Los stores llaman a `chrome.*` directamente (sin repositorios, arquitectura §5), así que lo que en otra arquitectura serían casos de repositorio se prueban aquí, sobre `installChromeFake()`:

| ID | Escenario | Resultado esperado |
|---|---|---|
| S1 | Carga inicial con datos | El estado refleja lo guardado o lo que da Chrome |
| S2 | Carga inicial vacía (clave nunca escrita) | El contrato final: colección vacía o los valores por defecto. Nunca datos de demo (§4) |
| S3 ⚠️ | Datos guardados corruptos: tipo incorrecto (objeto, string, número), `null`, versión de esquema desconocida | Valor seguro, sin lanzar. Usar `it.each` |
| S4 ⚠️ | Carga inicial con error de Chrome | Estado seguro + error reportado; nunca un error no manejado |
| S5 | La carga no escribe | Ningún `set` al iniciar |
| S6 | Cada mutación pública, camino feliz | Estado correcto **y** guardado: `snapshot()` igual al estado, una sola escritura |
| S7 ⚠️ | ID inexistente (candado, lista…) | Estado y storage sin cambios, sin lanzar |
| S8 ⚠️ | Colección vacía | Las mutaciones no rompen; quitar el último deja `[]` |
| S9 ⚠️ | Inmutabilidad y reactividad | Nueva referencia en cada cambio; el valor anterior intacto; los `computed` recalculan (§6) |
| S10 ⚠️ | Mutación propia que falla al guardar (candado, lista, temporizador) | **Rollback** al estado previo + error reportado (mutación optimista, arquitectura §5) |
| S11 ⚠️ | Mutación de cookies que Chrome rechaza | El estado **no** cambia: las mutaciones de cookies no son optimistas (la vista solo cambia con `onChanged`) |
| S12 | Efectos laterales (Transloco, toast) | Ocurren cuando corresponde **y no ocurren** cuando no (test positivo y negativo) |
| S13 | Mutación no-op | Estado igual y ninguna escritura |
| S14 | Cambios desde otro contexto (`onChanged` de `cookies` y de `storage`) | El estado se actualiza; una ráfaga provoca una sola relectura |
| S15 | Dos mutaciones seguidas antes de que resuelva la primera | El estado final y lo guardado coinciden |
| S16 ⚠️ | Constantes de contrato compartidas | Los valores por defecto se devuelven como copia nueva (`not.toBe`) y no se mutan |

### 8.2 Servicios con estado (sin Chrome)

`ConfirmService`, `ToastService` y los que vengan (`EditorService`):

| ID | Escenario |
|---|---|
| V1 | Estado inicial |
| V2 | Cada método público, camino feliz, verificado en el signal público |
| V3 ⚠️ | Llamar cuando no hay nada abierto (`answer()`, `undo()`, `dismiss()` sin toast) no rompe ni cambia el estado |
| V4 ⚠️ | Reemplazo: una petición nueva mientras hay otra abierta (la anterior se responde o se descarta, según el contrato) |
| V5 ⚠️ | Orden de los efectos que el JSDoc promete ("limpia primero y resuelve después") |
| V6 | Temporizadores: vencen en su plazo exacto, se reinician al reemplazar y se cancelan al cerrar |
| V7 | Reactividad (§6) |

### 8.3 Componentes dumb

Además de las listas (L1–L8) y los formularios (F1–F5) de la §7:

| ID | Escenario |
|---|---|
| D1 | Render de cada variante relevante de los inputs (`it.each`), verificado por contenido y atributos semánticos |
| D2 ⚠️ | Inputs límite: lista vacía, string vacío o muy largo, opcionales ausentes |
| D3 | Cada `output()` emite **una vez** con el payload exacto, y los demás no emiten |
| D4 | No muta los objetos recibidos por `input()` |
| D5 | Los textos salen de Transloco: se buscan con `translate(key)` |
| D6 | Fechas relativas (caducidades) con el reloj fijo: futura, pasada y sin fecha |

### 8.4 Componentes smart

| ID | Escenario |
|---|---|
| M1 | Store real + `installChromeFake()`; los asserts solo miran el DOM (§7) |
| M2 | Estado vacío y estado de error del store reflejados en la vista |
| M3 ⚠️ | Cada acción del usuario (candado, eliminar, limpiar) se refleja en el DOM sobre **el elemento correcto**, sin tocar los demás |
| M4 ⚠️ | **La garantía:** una limpieza en lote nunca quita del DOM una cookie protegida (candado o lista blanca) |
| M5 | Orquestación de capas: confirmar, cancelar y deshacer dejan la vista como corresponde |

### 8.5 `engine/` (funciones puras)

| ID | Escenario |
|---|---|
| E1 | Sin TestBed ni Angular: se importa y se llama |
| E2 | Tablas `it.each` con entradas límite: cadenas vacías, mayúsculas, punto inicial, subdominios profundos, sufijos que se parecen sin serlo (`notdoubleclick.net`), unicode |
| E3 | Entradas inválidas devuelven el valor o el error tipado esperado (`null`), no lanzan (salvo que el contrato diga lo contrario) |
| E4 ⚠️ | `engine/protection.ts` y `engine/domains.ts` son la garantía (arquitectura §10): cada regla de protección con su caso positivo y negativo, venga la limpieza del popup o del service worker |
| E5 | Snapshots (`toMatchSnapshot`) prohibidos salvo para salidas grandes y estables que lo justifiquen en un comentario. Prohibidos en DOM |

---

## 9. Asserts

| Usar | En lugar de | Motivo |
|---|---|---|
| `toEqual(valorCompleto)` | `toBeDefined()`, `toBeTruthy()`, `length > 0` | Un valor incorrecto pero definido pasa |
| `queryBy…` + `.not.toBeNull()` / `.toBeNull()` | `getBy…` + `toBeTruthy()` | Dice qué se espera: presencia o ausencia |
| `toHaveBeenCalledExactlyOnceWith(args)` | `toHaveBeenCalled()` | Verifica argumentos y número de llamadas |
| `snapshot()` del fake | Contar llamadas a `set` | Se prueba qué quedó guardado, no cómo |
| `expect(x).not.toHaveBeenCalled()` | Omitir el caso negativo | S12, D3 |
| `toBe` | `toEqual` | Solo para primitivos o identidad de referencia (S9, S16) |
| `rejects.toThrow('mensaje')` | `try/catch` con `expect` dentro | Un `try` sin fallo pasa en silencio |

- `expect.objectContaining` solo cuando el objeto completo es irrelevante o no determinista; si se conoce entero, se compara entero.
- Varias comprobaciones del **mismo** comportamiento se agrupan en un array (`expect([a, b]).toEqual([x, y])`) para que el fallo muestre todo a la vez.
- Las llamadas a espías se verifican **solo** cuando la llamada misma es el contrato (avisar con un toast, emitir un output). En el resto, se verifica el estado resultante.

---

## 10. Defectos conocidos: `it.fails` e `it.todo`

Si un caso obligatorio de la §8 no se cumple por un defecto del **código de producción**:

- **NO DEBE** adaptarse el assert al comportamiento incorrecto ni omitirse el caso.
- `it.fails('<comportamiento correcto>', …)` cuando el test puede ejecutarse sin efectos colaterales. Pasa mientras el bug exista y **se pone rojo cuando se arregla**, obligando a cambiarlo a `it`. Va precedido de un comentario `// BUG: <qué falla y por qué>`, o `// PENDING: <qué comportamiento temporal lo impide>` si la causa es código de la fase 1 planificado para eliminarse.
- `it.todo('<comportamiento correcto>')` cuando ejecutarlo dejaría errores no manejados o el contrato aún no está implementado. Va precedido de un comentario con la causa.
- **Prohibido** hacer commit de `.only` o `.skip`.

Estado actual:

Ninguno.

Al corregir un defecto se actualiza esta tabla en el mismo commit.

---

## 11. Plantillas

### Función pura de `engine/`

```ts
import { trackerName } from './trackers';

describe('trackerName()', () => {
  it.each([
    ['a leading dot', '.doubleclick.net', 'Google Ads'],
    ['a subdomain', 'ad.doubleclick.net', 'Google Ads'],
  ])('names the tracker for %s (%s)', (_, domain, expected) => {
    expect(trackerName(domain)).toBe(expected);
  });

  it.each([
    ['an unknown domain', 'example.com'],
    ['a domain that only ends with a tracker name', 'notdoubleclick.net'],
  ])('returns null for %s (%s)', (_, domain) => {
    expect(trackerName(domain)).toBeNull();
  });
});
```

### Servicio con temporizador

```ts
import { TestBed } from '@angular/core/testing';

import { TOAST_DURATION, ToastService } from './toast.service';

describe('ToastService', () => {
  function setup() {
    vi.useFakeTimers();
    return { service: TestBed.inject(ToastService) };
  }

  it('restarts the timer: the previous toast timer does not dismiss the new one', () => {
    const { service } = setup();
    service.show('First');
    vi.advanceTimersByTime(TOAST_DURATION.plain - 100);
    service.show('Second');

    vi.advanceTimersByTime(100);

    expect(service.current()?.text).toBe('Second');
  });
});
```

### Componente con lista y output por fila

```ts
import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, Rendered } from '@testing/dom';
import { buildCookieGroup, buildCookies } from '@testing/fixtures';
import { translate, translocoTestingModule } from '@testing/transloco';

import { CookieContainer } from './cookie-container';

describe('CookieContainer', () => {
  async function setup({ group = buildCookieGroup(), lockedIds = new Set<string>() } = {}) {
    const groupInput = signal(group);
    const toggleSelect = vi.fn<(id: string) => void>();
    TestBed.configureTestingModule({ imports: [translocoTestingModule()] });
    const rendered = await render(CookieContainer, {
      bindings: [
        inputBinding('group', groupInput),
        inputBinding('lockedIds', () => lockedIds),
        outputBinding('toggleSelect', toggleSelect),
      ],
    });
    return { ...rendered, groupInput, toggleSelect };
  }

  function lockStates({ view }: Rendered<CookieContainer>): (string | null)[] {
    const name = new RegExp(`^(${translate('cookies.lock')}|${translate('cookies.unlock')})$`);
    return view.getAllByRole('button', { name }).map((button) => button.getAttribute('aria-pressed'));
  }

  it('keeps each lock on its cookie, not on its position, when a row above disappears', async () => {
    const cookies = buildCookies(3);
    const rendered = await setup({ group: buildCookieGroup({ cookies }), lockedIds: new Set([cookies[2].id]) });

    rendered.groupInput.set(buildCookieGroup({ cookies: cookies.slice(1) }));
    await rendered.fixture.whenStable();

    expect(lockStates(rendered)).toEqual(['false', 'true']);
  });
});
```

---

## 12. Checklist de revisión

Antes de dar por terminado un spec (persona o IA):

- [ ] Hay `setup()`; no hay `let` compartidos para el sujeto bajo prueba.
- [ ] Ningún `any`, `as any` ni `ReturnType<typeof vi.fn>`; todos los `vi.fn` están tipados.
- [ ] Ninguna asignación ni `delete` sobre `globalThis`/`window`; Chrome solo vía `installChromeFake()` o `vi.stubGlobal`.
- [ ] Fixtures con builders de `@testing/fixtures`; ningún literal de dominio duplicado.
- [ ] Ningún test valida ni importa datos de demo (`mock-data.ts`) ni prueba las maquetas.
- [ ] Cada punto aplicable de la §8 tiene su test; los defectos están como `it.fails`/`it.todo` con comentario y en la tabla de la §10.
- [ ] Asserts sobre valores completos y estado guardado; casos negativos incluidos.
- [ ] Sin `fakeAsync`, `done`, `setTimeout`, `.only` ni `.skip`. En componentes, solo `Date` falso.
- [ ] Componentes: montados con `render()`; elementos buscados por rol, label, texto o `title` traducidos con `translate()`; ninguna clase CSS, etiqueta ni selector estructural en queries o asserts.
- [ ] Componentes: interacción solo con `click/type/clear/keyboard/tab`; ninguna llamada a métodos del componente ni lectura de su estado interno.
- [ ] Listas: primera, del medio y última en tests separados (L3, L8).
- [ ] Sin salida en consola durante la ejecución.
- [ ] Cada test que prueba un requisito cita su ID; `npm run trace` no lista ninguno del slice sin test.
- [ ] `npx ng test --watch=false` y `npx tsc -p tsconfig.spec.json --noEmit` en verde.
- [ ] **El test detecta el fallo:** rompe a mano la línea que protege (invierte una condición, cambia el `track`) y comprueba que se pone rojo; después, deshaz el cambio.

---

## 13. Tests e2e (Playwright, cuando haga falta)

Los tests unitarios corren en jsdom, donde `chrome.*` no existe. Lo que dependa del comportamiento real de Chrome (que `chrome.cookies.remove` necesita la URL exacta, el almacén de incógnito, `onChanged` en ráfaga, el service worker del temporizador) se probará con Playwright en Chromium, con la extensión de `.output/` (WXT) cargada.

Reglas para cuando se añada:

- Archivos `*.e2e.ts` en `e2e/`, fuera de `src/` para que `ng test` no los recoja.
- Un servidor HTTP local que pone cookies conocidas; se verifica lo que queda en `chrome.cookies` y en la página, no lo que dice la UI.
- Esperar con `expect.poll()`; nunca con `setTimeout`.
- La garantía (§8.5, E4) DEBE tener su escenario e2e: con el temporizador, una cookie con candado sobrevive a la limpieza automática.
