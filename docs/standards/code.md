# Código: TypeScript

Vale para todo lo que se escribe en `src/`, lo escriba una persona o un agente, y también para lo que se
copia de un mock (un mock es una referencia visual, no un modelo de código). Lo propio de Angular está en
[angular.md](angular.md).

- **El lint primero.** Lo que se puede comprobar a máquina está en `eslint.config.mjs` y no se discute
  en revisión (la tabla del final dice qué regla cubre qué).
- **La revisión, después.** Lo demás lo revisa la verificación de cada tarea, contra este archivo.
- **Si una regla estorba**, se cambia aquí primero, con el motivo, y después en el código. No se salta
  con un `eslint-disable`.

## Nombres

- **Inglés**, con las palabras del glosario de `docs/domain.md` (su columna «En el código») y solo esas.
  Si el glosario dice `vault`, no aparecen `archive`, `bin` ni `storage` para lo mismo.
- **Dicen qué es, no cómo está hecho:** `pausedTabs`, no `tabsArray`, `data` ni `list`.
- **Los booleanos se leen como pregunta:** `isPaused`, `hasSelection`, `canLock`.
- **Funciones:**
  - Si actúa, verbo y objeto (`pauseTab`, `restoreTrail`).
  - Si solo responde, lo que devuelve (`trackerName`, `isExpired`, `idleTime`).
  - Una función `get…`, `is…` o `has…` no cambia nada.
- **Las cantidades llevan su unidad:** `PAUSE_AFTER_MS`, `sizeBytes`, `pausedAt` (un instante en ms). Un
  `timeout` o un `size` a secas obliga a ir a buscar la unidad.
- **`UPPER_SNAKE_CASE` solo para constantes de módulo** que son contrato (`TOAST_DURATION_MS`, las claves
  de storage). Lo demás, `camelCase`.
- **Sin abreviaturas**, salvo `id`, `url`, `ms` y las del dominio que el glosario recoja.

## Tipos

- **Nunca `any` ni `!`.** Tampoco `as`, salvo `as const` o justo después de validar el dato. Para
  comprobar un literal sin perder su tipo, `satisfies`.
- **Lo que llega de fuera es `unknown`** hasta que una función lo valida: storage, mensajes entre
  contextos, respuestas de `chrome.*`, JSON. Esa función devuelve el tipo o `null`
  (`parseSettings(raw: unknown): Settings | null`). Dentro de la frontera, los tipos son fiables y no se
  vuelve a comprobar nada.
- **Uniones discriminadas, no banderas sueltas.** Si dos campos opcionales o dos booleanos se combinan,
  pueden quedar en un estado imposible:

  ```ts
  // ✗ Una pestaña con isPaused y isArchived a la vez, o en pausa sin pausedAt.
  interface Tab { isPaused?: boolean; isArchived?: boolean; pausedAt?: number }

  // ✓ Cada estado lleva solo sus datos.
  type TabState =
    | { kind: 'active' }
    | { kind: 'paused'; pausedAt: number }
    | { kind: 'archived'; archivedAt: number };
  ```

- **Lo que depende de un `kind`:**
  - Para datos, un mapa tipado (`Record<Kind, …>`), así un caso nuevo no compila hasta tener su valor.
  - Para lógica, un `switch` sin `default`, que el lint obliga a que sea exhaustivo.
  - Nunca una cadena de `if`.
- **Sin `enum`:** uniones de literales (`'active' | 'paused'`), y si hace falta la lista, un `as const`.
- **Modelos:** `interface` con campos `readonly`, y listas `readonly T[]`. `type` para uniones y alias.
- **Ausencia:**
  - Un valor que puede no estar es `null` en los modelos, y su JSDoc dice cuándo.
  - `undefined` solo para parámetros y campos opcionales.
- **Las funciones exportadas del engine declaran su tipo de retorno:** son el contrato de la spec.

## Funciones

- **Hacen una cosa, a un solo nivel de abstracción.** Si una parte necesita un comentario que la separe
  de la siguiente, es otra función con ese comentario como nombre.
- **Retorno temprano** para los casos que no aplican; sin `else` después de un `return`. Como mucho tres
  niveles de anidamiento.
- **Más de dos parámetros, un objeto con nombre.** Ningún parámetro booleano: `archive(tab, true)` no se
  lee. Son dos funciones o una opción con nombre (`archive(tab, { keepGroup: true })`).
- **Puras siempre que se pueda; en el engine, siempre.** El reloj, los IDs y el azar **entran como
  parámetros** (`now: number`) en vez de llamarse dentro (`Date.now()`, `crypto.randomUUID()`). Así se
  prueban sin falsear nada, y la misma entrada da siempre la misma salida.
- **Sin efectos escondidos:** si una función escribe en storage, toca Chrome o cambia estado, su nombre lo
  dice.
- **Tamaño:** una función que no cabe en la pantalla (unas 30 líneas) o que tiene que explicarse por
  partes casi siempre son varias.

## Datos e inmutabilidad

- **Lo recibido no se muta:** argumentos, inputs, el valor de un signal, lo que devuelve un store. Se
  crea otro: `{ ...tab, pausedAt: now }`, `toSorted`, `toSpliced`, `with`, `filter`.
- **`const` siempre;** `let` solo si de verdad se reasigna.
- **Una fuente de verdad:** lo derivado se calcula, no se guarda aparte ni se copia a otro estado.
- **Sin números mágicos:**
  - Un valor con significado es una constante con nombre y unidad.
  - Si es un ajuste del usuario, sale de los ajustes. No se escribe a mano en dos sitios.

## Errores

- **Lo esperado es un valor; lo inesperado, una excepción.**
  - Esperado: un dato guardado que no se puede leer, una pestaña que ya no existe, la cuota llena. Está
    en el contrato: lo cubre un requisito «SI … ENTONCES» y se devuelve como valor (`null`, o
    `{ ok: false, reason }`).
  - Inesperado: un fallo de programación. Se lanza y lo recoge el manejador global.
- **Ningún `catch` vacío, ni uno que solo registre el error.** Un `catch` hace una de tres cosas:
  - Recupera, y el requisito que lo pide se cita en un comentario.
  - Informa al usuario (un toast).
  - Relanza con contexto.
- **El engine nunca ve una excepción de Chrome.** El adaptador que llama a `chrome.*` captura sus fallos
  y los convierte en un resultado.
- **`throw` solo con `Error`** o una subclase, nunca con un string.

## Asincronía

- **`async`/`await`.** Nada de `.then()` encadenados ni de callbacks de `chrome.*`: en MV3 todas sus
  APIs devuelven promesas.
- **Ninguna promesa sin esperar.** O se hace `await`, o se marca con `void` y un comentario que diga por
  qué no se espera.
- **En paralelo lo independiente** (`Promise.all`); **en orden lo que depende**, con un `for…of` y
  `await` dentro. Nunca `forEach(async …)`: no espera a nadie.

## Extensión (MV3)

- **El service worker puede morir entre dos eventos.** Ningún estado que deba sobrevivir vive en una
  variable de módulo: se guarda en storage y se lee al despertar.
- **Los listeners se registran al cargar, de forma síncrona**, en el nivel superior de
  `defineBackground`. Uno que se registra tras un `await` se pierde los eventos que despertaron al
  worker.
- **Los plazos largos van con `chrome.alarms`, no con `setTimeout`:** el worker no espera vivo a que
  venza un temporizador.
- **`background.ts` solo conecta.** Registra los listeners y llama a manejadores exportados desde sus
  propios archivos (`handleAlarm(alarm)`). Esos manejadores se prueban con el fake de Chrome; las reglas
  siguen en el engine.

## Archivos y módulos

- **Un archivo, una responsabilidad.** El nombre va en `kebab-case` y dice qué contiene
  (`pause-rules.ts`, no `utils.ts`).
- **Sin barrels:** cada `import` apunta al archivo que define lo que usa.
- **Las dependencias van en una sola dirección:** `app/` y `entrypoints/` usan el engine, y el engine no
  usa nada de ellos (lo comprueba el lint).
- **Sin código muerto:** ni imports, miembros, parámetros ni exports sin usar, ni código comentado.
- **Sin andamios:**
  - Nada de `console.*`, ni de copias locales que imiten una pieza que aún no existe, ni de reglas
    provisionales. Lo que no tiene su pieza real no se conecta.
  - Un `TODO` cita su tarea (`// TODO S04-T2: …`); sin tarea, no se deja.

## Comentarios

- **En inglés, y dicen el porqué:** la restricción, la decisión (`// A-03: …`) o el caso raro. Un
  comentario que repite el código se borra.
- **JSDoc:**
  - En los modelos.
  - En los campos que no se explican solos: la unidad, el rango, cuándo son `null`.
  - En lo exportado cuyo nombre no basta.

## Lo que comprueba el lint

| Regla de este archivo | ESLint |
|---|---|
| Sin `any` ni `!` | `no-explicit-any`, `no-non-null-assertion` |
| `switch` exhaustivo | `switch-exhaustiveness-check` |
| Sin `enum` | `no-restricted-syntax` (TSEnumDeclaration) |
| Retorno declarado en el engine | `explicit-module-boundary-types` (solo `src/engine/`) |
| Retorno temprano, tres niveles | `no-else-return`, `max-depth` |
| `const` | `prefer-const` |
| `throw` solo con `Error` | `only-throw-error` |
| Ninguna promesa sin esperar | `no-floating-promises`, `no-misused-promises` |
| Miembros privados que no se reasignan | `prefer-readonly` |
| Sin código muerto | `no-unused-vars` y el compilador (`noUnusedLocals`, `noUnusedParameters`) |
| Sin `console.*` | `no-console` |
| El engine sin Angular ni Chrome | `no-restricted-imports`, `no-restricted-globals` (solo `src/engine/`) |
