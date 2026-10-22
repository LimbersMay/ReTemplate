# __PRODUCT__ — instrucciones para agentes

__DESCRIPTION__

## Diseño

Este producto sigue **ReDesign** (`node_modules/re-design`, versión fijada en `package.json`).

1. Antes de tocar interfaz, lee `node_modules/re-design/AGENTS.md` y
   `node_modules/re-design/docs/products/__SLUG__.md`.
2. Usa las clases `re-*` de `components.css` para los componentes y Tailwind solo para el layout.
3. No edites `node_modules/re-design` ni copies sus archivos aquí. Si falta algo, anótalo como
   Propuesta en el doc del producto y avisa.
4. Antes de terminar: `npm run lint:design` con 0 errores.

- Marca: `re-design/brands/__SLUG__.css`
- Excepciones de diseño: las de `docs/products/__SLUG__.md` en ReDesign. Ninguna más.

## Flujo de trabajo

Se trabaja con spec-driven development. El proceso vive en estos archivos; las skills de `re-sdd` son
atajos para seguirlo.

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

Reglas:

- **Nada de código sin tarea, y nada de tarea sin requisito.** Si algo no está en un requisito, se
  pregunta; no se inventa.
- **La spec va por delante del código.** Si a mitad de una tarea la spec resulta estar mal, se para, se
  propone el cambio y se sigue cuando el usuario lo aprueba.
- `requirements.md`, `domain.md` y `architecture.md` describen cómo es el producto **hoy**. Un slice
  cerrado queda como historia: no se reescribe.
- **Tests:** los escribe el agente, a partir de la spec y **antes** que el código, también cuando el
  código lo escribe el usuario. Cada test cita su requisito en el nombre (`docs/testing.md`).
- **Una tarea, un commit:** `tipo(ámbito): resumen [Sxx-Tn]`, con los tipos de Conventional Commits.
- **Estados de una tarea:** ⬜ pendiente · 🔨 en curso · 🔍 por revisar · ✅ hecha · ❌ con hallazgos.
  El agente **no cierra su propia tarea**: la cierra el OK del usuario. Las tareas del usuario las
  cierra la verificación (`review.md`).
- Al parar a mitad de un slice, se escribe «Dónde lo dejé» al final de su `tasks.md`.
- Lo que solo es una prueba (un spike) va en una rama `spike/…` que se tira. Lo único que se conserva
  es la respuesta, en `architecture.md`.

## Arquitectura

Estructura, capas y registro de decisiones: [docs/architecture.md](docs/architecture.md). Si una
decisión deja de servir, se cambia allí primero y después en el código.

- **`src/engine/`** es TypeScript puro y plano: sin Angular ni `chrome.*`, un archivo por
  responsabilidad, sin barrels. Recibe datos y devuelve datos (o acciones); el lint lo comprueba.
- **`src/entrypoints/background.ts`** conecta Chrome con el engine y ejecuta lo que el engine decide.
  No contiene reglas.
- **El estado de la UI** son signals de las vistas; lo que guarda el producto vive en stores.
- **Piezas de la UI:** item (solo pinta y emite) → container (resuelve las operaciones de sus items) →
  vista → shell. Las capas (toast, confirmación, editor) se piden a un servicio.
- **El host del componente es la raíz del bloque** (`re-tree__row`, `re-tree__group`…): ReDesign usa
  selectores entre hermanos.

## Código

- Nombres y comentarios en **inglés**. Modelos y campos no obvios, y métodos cuyo nombre no basta,
  documentados con JSDoc en inglés.
- **Ningún texto visible escrito en la plantilla:** todo sale de Transloco (`src/assets/i18n/es.json` y
  `en.json`, un espacio de nombres por componente; las dos con las mismas claves, `npm run lint:i18n`).
  El engine no traduce: devuelve datos (`kind`, `domain`) y la interfaz elige el texto.

## Código limpio

Vale para todo lo que se escribe en `src/`. Revisa tu propio código con esta lista antes de entregarlo,
también lo que copies de un mock (el mock es una referencia visual, no un modelo de código). Lo que se
puede comprobar a máquina lo comprueba `npm run lint`; el resto, la verificación.

- **La plantilla se lee sola; el TS guarda las decisiones.** Una condición simple se escribe en el HTML.
  Un `computed` existe solo si su nombre explica algo que la expresión no dice: llamar `hasEntries` a
  `entries().length > 0` no aclara nada y obliga a ir al TS para descubrir que era eso. El exceso
  contrario tampoco vale: la lógica de verdad no se escribe en el HTML.

  **Se queda en la plantilla** (no crees un `computed` para esto):
  - Leer un input, un signal o un campo: `@if (rules().canLock)`, `@if (item().pinned)`.
  - Una comparación o una negación sobre un solo valor: `entries().length === 0`, `total() === 0`,
    `!tag()`, `expiresAt() !== null`.
  - Un ternario simple entre dos valores fijos que aparece una sola vez:
    `[name]="locked() ? 'lucideLock' : 'lucideLockOpen'"`.
  - `@if (valor(); as v)` para nombrar un valor y reutilizarlo dentro del bloque.

  **Va al TS, como `computed`**, si cumple al menos una:
  - Junta dos o más condiciones y su nombre dice la regla: `isPartlySelected` (hay selección y no es
    total), `needsSelectionToLock`.
  - Es una regla del producto o llama al engine.
  - Es una comparación o una combinación que también usan otros `computed` o métodos del TS. Si solo la
    usa el TS, es `private`; si además la lee la plantilla, la plantilla usa ese mismo `computed` en vez
    de repetir la expresión. Leer un campo no cuenta: `config().isEnabled` se escribe tal cual también
    en el TS, sin `computed` intermedio.
  - Un ternario o una combinación aparecería en más de un sitio de la plantilla (en el texto y en el
    `title`). Leer el mismo campo o hacer la misma comparación simple varias veces no cuenta.
  - Elige una clave de traducción o lleva parámetros: `translateSignal`, con la clave en un `computed`.
    Las claves fijas se quedan en la plantilla con `t()`.
  - Lo que depende de un `kind` sale de un mapa tipado (regla siguiente). Se expone **el objeto entero**
    como un `computed` (`rules = computed(() => RULES[this.scope()])`) y la plantilla lee sus campos
    (`rules().canLock`). No se crea un `computed` por campo.

  **Nunca en la plantilla:** ternarios anidados, claves de traducción armadas concatenando, llamadas a
  funciones del engine, y cálculos de varios pasos (`filter`, `map`, `reduce`).

  **Prueba rápida antes de crear un `computed`:** si es `computed(() => <una expresión que ya se lee
  sola>)` y nadie más en el TS lo usa, no lo crees: escribe la expresión en la plantilla.
- **Mapas tipados, no cadenas de `if`:** lo que depende de un `kind` va en un `Record<Kind, …>`, así un
  caso nuevo no compila hasta tener su valor.
- **Cada regla en su sitio:** cada regla del producto vive en un solo archivo del engine
  (`architecture.md` dice cuál); un componente no reimplementa reglas de negocio.
- **Sin andamios:** nada de copias locales que imiten un store, reglas provisionales ni `console.*`. Lo
  que aún no tiene su pieza real no se conecta.
- **Una fuente de verdad:** lo derivado se calcula, no se guarda en otro signal ni se copia: un
  `computed`, o la expresión en la plantilla si es simple.
- **Sin código muerto:** ni imports, miembros, inputs u outputs sin usar.
- **Nombres que dicen qué es** (booleanos que se leen como pregunta: `isNested`); comentarios con el
  porqué, no el qué. Sin `any` ni `!`.
- Antes de terminar: `npm run check` en verde (build, lint, lint:design, lint:i18n y tests).

## Testing

OBLIGATORIO ANTES DE ESCRIBIR CUALQUIER TEST: leer [docs/testing.md](docs/testing.md).
