# Escribir un spec

Reglas comunes a todas las capas. Los casos de borde de cada una están en su archivo
([README](README.md#qué-leer)).

Los ejemplos usan un producto imaginario de pestañas (`buildTab`, `TabItem`, `SettingsStore`). Se
sustituyen por los del producto en cuanto los haya.

## Estructura

### Nombres

- **`describe` de primer nivel:** el nombre exacto de la clase o función (`'TabItem'`, `'idleTime()'`).
- **`describe` anidado:** por método público, con paréntesis (`'restore()'`), o por aspecto (`'rows'`,
  `'collapse'`).
- **`it` en inglés y en presente.** Dice el comportamiento observable y su condición, y empieza por el ID
  del requisito si prueba uno: `'PAU-03 pauses the tab once the idle limit has passed'`. Nada de
  `'should …'` ni `'works'`.

### `setup()` en lugar de `let` compartidos

Cada spec DEBE declarar una función `setup(options)` que construye el escenario y **devuelve** lo que el
test necesita. NO DEBE usarse `let x; beforeEach(() => x = …)` para el sujeto bajo prueba.

Así cada test declara su escenario (`setup({ collapsed: true })`), y lo que hay que preparar antes de
crear el sujeto (el reloj, los dobles, el storage) queda dentro de `setup()`.

```ts
async function setup({ tab = buildTab(), collapsed = false } = {}) {
  const restore = vi.fn<(id: string) => void>();
  TestBed.configureTestingModule({ imports: [translocoTestingModule()] });
  const rendered = await render(TabItem, {
    bindings: [
      inputBinding('tab', () => tab),
      inputBinding('collapsed', () => collapsed),
      outputBinding('restore', restore),
    ],
  });
  return { ...rendered, restore };
}
```

### Arrange / Act / Assert

- Tres bloques separados por una línea en blanco, sin comentarios `// Arrange`.
- Un solo *Act* por test.

### TestBed

- **TestBed se inicializa y se resetea solo entre tests.** NO DEBE llamarse a mano a
  `TestBed.resetTestingModule()` ni a `initTestEnvironment()`.
- **Los servicios `providedIn: 'root'` no se vuelven a declarar** en `providers`: solo se sustituyen sus
  dependencias.
- **Las dependencias se sustituyen por token** (`{ provide: ToastService, useValue: toast }`), nunca
  parcheando la instancia real.

## Dobles de prueba

Usa el primero de la lista que sirva:

| # | Tipo | Cuándo | Ejemplo |
|---|---|---|---|
| 1 | Implementación real | El engine, servicios sin dependencias | — |
| 2 | **Fake funcional** en memoria | Dependencias con estado: `chrome.*` | `installChromeFake()` ([state.md](state.md#el-fake-de-chrome)) |
| 3 | Stub tipado con `vi.fn<T>()` | Colaboradores sin estado relevante | `{ show: vi.fn<ToastService['show']>() }` |
| 4 | `vi.spyOn` sobre algo real | Observar o forzar un fallo puntual | `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(…)` |

- **Los fakes de `src/testing/` implementan la API real** (los tipos de `@types/chrome`). Si el contrato
  cambia, el compilador rompe el fake, y es a propósito.
- **Todo `vi.fn` DEBE ir tipado** con la firma real: `vi.fn<ToastService['show']>()`,
  `vi.fn<(id: string) => void>()`. Prohibidos `ReturnType<typeof vi.fn>`, `any` y `as any`.
- **Los fallos se inyectan solo para la llamada que interesa:** `mockRejectedValueOnce`,
  `mockReturnValueOnce`.
- **Un doble que use más de un spec vive en `src/testing/`.** Un spec nunca importa de otro spec.

### Fixtures

- **Siempre con *builders*** de `@testing/fixtures`, que devuelven un objeto nuevo en cada llamada:
  `buildTab(overrides)`, `buildTabs(n)`. El archivo se crea con el primer spec que lo necesite.
- **Ningún literal de dominio completo dentro de un spec.**
  - Una variante se pasa por `overrides`, o se añade un builder.
  - Un builder local solo vale para un tipo que solo usa ese spec.
- **Para comparar con el estado inicial se vuelve a llamar al builder**
  (`expect(tab).toEqual(buildTab())`). No se reutiliza una referencia que el código pudo mutar.

### Datos de ejemplo y maquetas

Los tests verifican **comportamiento**, nunca el contenido de unos datos.

- **Prohibido un test que valide datos de ejemplo:** el contenido, la forma o la cantidad de los datos de
  ejemplo o de demostración.
- **Prohibido que un test dependa de ellos:** no se importan en un spec, ni para sembrar estado ni como
  valor esperado. El estado se siembra con builders.
- **Las maquetas y lo temporal no se testean.**
- **Sí se pueden usar las constantes que son contrato** (`TOAST_DURATION_MS`, las claves de storage) como
  valor esperado de un comportamiento. Un test que solo compruebe su valor sigue prohibido.

## Globales

Un test **solo** altera el entorno global con APIs de Vitest que se restauran solas. Después de cada test,
`src/testing/setup.ts` ejecuta:

- `vi.unstubAllGlobals()`
- `vi.restoreAllMocks()`
- `vi.useRealTimers()`
- `localStorage.clear()` y `sessionStorage.clear()`

Los specs no repiten esta limpieza.

| Permitido | Prohibido |
|---|---|
| `vi.stubGlobal('chrome', …)` | `globalThis.chrome = …`, `(window as any).chrome = …` |
| `vi.spyOn(obj, 'method')` | `Object.defineProperty(globalThis, …)` |
| `vi.useFakeTimers()`, `vi.setSystemTime()` | Reasignar `console.log`, `Date`, `crypto`… |
| Escribir en `localStorage` para preparar datos | Mutar constantes exportadas |
| Añadir un elemento a `document.body` y quitarlo con `onTestFinished(() => el.remove())` | Dejarlo en el documento |

- **Consola:** un test NO DEBE dejar salida en consola. Si registrar un error es parte del contrato, se
  espía y **se verifica**.
- **Tiempo:**
  - En el engine no se falsea: la función recibe `now` ([engine.md](engine.md)).
  - En servicios y en el service worker, `vi.useFakeTimers()` completo y `vi.advanceTimersByTime(ms)`.
  - En componentes, solo `Date` ([components.md](components.md#tiempo)).
- **IDs:** `vi.spyOn(crypto, 'randomUUID').mockReturnValue('…')`, si el código no los recibe como
  parámetro.
- **`localStorage`:** jsdom da uno real.
  - Se prepara con `setItem` y se limpia solo.
  - La cuota llena se simula con
    `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('…', 'QuotaExceededError'); })`.
- **Portapapeles:** `render()` instala uno en memoria.
  - Se lee con `await navigator.clipboard.readText()`.
  - Un fallo se fuerza con `vi.spyOn(navigator.clipboard, 'writeText')`, **después** de `render()`.

## Asincronía y zoneless

| Caso | Forma obligatoria |
|---|---|
| Promise | `await promise`, `await expect(promise).resolves.toBe(…)`, `.rejects.toThrow('…')` |
| Promise que se resuelve después del *Act* | Se guarda antes (`const answer = service.ask(…)`) y se espera en el *Assert* |
| Observable de un valor | `await firstValueFrom(obs$)` |
| Observable de varios | `await firstValueFrom(obs$.pipe(take(n), toArray()))` |

- **Prohibido:** callbacks `done`, `subscribe` sin esperar el resultado, y `setTimeout` o `sleep` para
  «dar tiempo».
- **Prohibidos `fakeAsync`, `tick`, `flush` y `waitForAsync`:** necesitan `zone.js`, que el proyecto no
  tiene.
- **`effect()`:** se ejecuta con `TestBed.tick()` antes del assert.
- **Ninguna promesa sin esperar,** tampoco en los tests: una interacción sin `await` hace que el assert
  lea el DOM de antes. Lo comprueba el lint.

## Asserts

| Usar | En lugar de | Por qué |
|---|---|---|
| `toEqual(valorCompleto)` | `toBeDefined()`, `toBeTruthy()`, `length > 0` | Un valor incorrecto pero definido pasa |
| `queryBy…` + `.toBeNull()` / `.not.toBeNull()` | `getBy…` + `toBeTruthy()` | Dice qué se espera: presencia o ausencia |
| `toHaveBeenCalledExactlyOnceWith(args)` | `toHaveBeenCalled()` | Verifica los argumentos y el número de llamadas |
| `snapshot()` del fake | Contar llamadas a `set` | Se prueba qué quedó guardado, no cómo |
| `expect(x).not.toHaveBeenCalled()` | Omitir el caso negativo | Lo que no debe pasar también es contrato |
| `toBe` | `toEqual` | Solo para primitivos o identidad de referencia |
| `await expect(p).rejects.toThrow('…')` | `try/catch` con `expect` dentro | Un `try` que no falla pasa en silencio |

- **`expect.objectContaining`** solo cuando el resto del objeto es irrelevante o no determinista. Si se
  conoce entero, se compara entero.
- **Varias comprobaciones del mismo comportamiento** se agrupan en un array
  (`expect([a, b]).toEqual([x, y])`), para que el fallo muestre todo a la vez.
- **Las llamadas a un espía se verifican solo cuando la llamada es el contrato** (avisar con un toast,
  emitir un output). En lo demás, se verifica el estado resultante.
- **Snapshots** (`toMatchSnapshot`):
  - Prohibidos en el DOM.
  - En lo demás, solo para salidas grandes y estables, y con un comentario que lo justifique.

## Defectos conocidos

Si un caso obligatorio no se cumple por un defecto del **código de producción**:

- **NO DEBE** cambiarse el assert para que pase con el comportamiento incorrecto, ni omitirse el caso.
- **`it.fails('<comportamiento correcto>', …)`** si el test se puede ejecutar sin efectos colaterales:
  - Pasa mientras el defecto exista y se pone rojo cuando se arregla, lo que obliga a pasarlo a `it`.
  - Lleva encima un comentario `// BUG: <qué falla y por qué>`.
- **`it.todo('<comportamiento correcto>')`** si ejecutarlo dejaría errores sin manejar o el contrato aún no
  está implementado. Lleva encima un comentario con la causa.
- **`npm run status` los cuenta.** La lista de verdad son los propios comentarios `// BUG:`; no se copia a
  ningún documento.
- **Prohibido commitear `.only` o `.skip`.**
