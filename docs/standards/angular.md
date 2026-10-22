# Código: Angular

Angular 20, standalone y zoneless. Lo que vale para todo TypeScript está en [code.md](code.md); aquí, lo
propio de componentes, plantillas, signals y servicios. Las clases `re-*` y el aspecto los manda ReDesign
(`node_modules/re-design/AGENTS.md`).

## Piezas de la interfaz

**item → container → vista → shell.** Cada pieza conoce solo la de debajo:

| Pieza | Qué hace | Qué no hace |
|---|---|---|
| **Item** | Pinta un elemento y emite lo que el usuario hace con él | Llamar a un servicio o a un store |
| **Container** | Resuelve las operaciones de sus items (un store, el engine) | Decidir búsqueda, selección o plegado |
| **Vista** | Búsqueda, selección, plegado, acciones en lote | Pintar filas |
| **Shell** | Navegación entre vistas y capas globales | Saber qué hay dentro de una vista |

- **Las capas** (toast, confirmación, editor) se piden a su servicio, no se crean en cada pieza.
- **El host del componente es la raíz del bloque de ReDesign** (`host: { class: 're-tree__row' }`).
  ReDesign usa selectores entre hermanos: un `<div>` de más en medio los rompe.

## Componentes

- **Configuración:**
  - Standalone (por defecto en Angular 20).
  - `changeDetection: ChangeDetectionStrategy.OnPush`.
  - Selector `app-…`.
  - Plantilla en su propio `.html` (`templateUrl`).
- **Un componente por carpeta:** `tab-item/tab-item.ts`, `.html` y `.spec.ts`.
- **Inputs y outputs con funciones,** sin decoradores:
  - `input()`, `input.required()` y `output()`.
  - `model()` solo si el padre de verdad edita el valor en las dos direcciones.
- **Outputs:**
  - Se llaman por lo que pasó, sin el prefijo `on`: `toggleLock`, `closed`, `restore`.
  - Emiten lo mínimo que el padre necesita, normalmente el id. No el objeto entero.
- **Dependencias con `inject()`** en la declaración del campo, nunca en el constructor.
- **Visibilidad:**
  - `protected`: lo que solo usa la plantilla.
  - `private`: lo que solo usa el TS.
  - `readonly`: inputs, outputs, signals y dependencias.

## Signals

| Necesito | Uso |
|---|---|
| Estado que cambia | `signal()` |
| Algo que se deriva de otros signals | `computed()` |
| Algo derivado que el usuario puede cambiar, y que vuelve a su valor si cambia el origen | `linkedSignal()` |
| Llevar un valor **fuera** de Angular (storage, una API del DOM, Chrome) | `effect()` |

- **`effect()` nunca escribe en otro signal:** eso es un `computed` o un `linkedSignal`.
- **Un `computed` no tiene efectos:** ni escribe, ni llama a Chrome, ni lanza toasts.
- **RxJS, solo donde Angular lo da** (HttpClient, Transloco). Se pasa a signal con `toSignal`, o a promesa
  con `firstValueFrom`. Sin `subscribe` a mano.

## Plantillas

**La plantilla se lee sola; el TS guarda las decisiones.** Una condición simple se escribe en el HTML. Un
`computed` existe solo si su nombre explica algo que la expresión no dice: llamar `hasEntries` a
`entries().length > 0` no aclara nada y obliga a ir al TS para descubrir que era eso. El exceso contrario
tampoco vale: la lógica de verdad no se escribe en el HTML.

**Se queda en la plantilla** (no crees un `computed` para esto):

- Leer un input, un signal o un campo: `@if (rules().canLock)`, `@if (item().pinned)`.
- Una comparación o una negación sobre un solo valor: `entries().length === 0`, `!tag()`,
  `expiresAt() !== null`.
- Un ternario simple entre dos valores fijos que aparece una sola vez:
  `[name]="locked() ? 'lucideLock' : 'lucideLockOpen'"`.
- `@if (valor(); as v)` para nombrar un valor y reutilizarlo dentro del bloque.

**Va al TS, como `computed`**, si cumple al menos una:

- **Junta dos o más condiciones** y su nombre dice la regla: `isPartlySelected` (hay selección y no es
  total).
- **Es una regla del producto o llama al engine.**
- **Es una comparación o una combinación que también usan otros `computed` o métodos del TS.**
  - Si solo la usa el TS, es `private`.
  - Si además la lee la plantilla, la plantilla usa ese mismo `computed` en vez de repetir la expresión.
  - Leer un campo no cuenta: `config().isEnabled` se escribe tal cual también en el TS, sin `computed`
    intermedio.
- **Un ternario o una combinación que aparecería en más de un sitio de la plantilla** (en el texto y en el
  `title`). Leer el mismo campo o repetir la misma comparación simple no cuenta.
- **Elige una clave de traducción o lleva parámetros:** `translateSignal`, con la clave en un `computed`.
  Las claves fijas se quedan en la plantilla con `t()`.
- **Lo que depende de un `kind`** sale de un mapa tipado ([code.md](code.md#tipos)). Se expone el objeto
  entero como un `computed` (`rules = computed(() => RULES[this.scope()])`) y la plantilla lee sus campos
  (`rules().canLock`). No se crea un `computed` por campo.

**Nunca en la plantilla:** ternarios anidados, claves de traducción armadas concatenando, llamadas a
funciones del engine, ni cálculos de varios pasos (`filter`, `map`, `reduce`).

**Prueba rápida antes de crear un `computed`:** si es `computed(() => <una expresión que ya se lee sola>)`
y nadie más en el TS lo usa, no lo crees. Escribe la expresión en la plantilla.

**Además:**

- **Control de flujo nativo** (`@if`, `@for`, `@switch`), con `@empty` cuando una lista puede estar
  vacía.
- **`@for` con `track` por un id estable** (`track tab.id`). `$index` solo en listas fijas que nunca
  cambian: con una lista que cambia, el estado de una fila se queda en la posición y no en su elemento.
- **Textos:** ningún texto visible escrito en la plantilla. Todo sale de Transloco, con un espacio de
  nombres por componente en `src/assets/i18n/es.json` y `en.json`, que tienen las mismas claves
  (`npm run lint:i18n`). El engine no traduce: devuelve datos (`kind`, `domain`) y la interfaz elige el
  texto.
- **Accesibilidad:**
  - Lo que se pulsa es un `<button type="button">`.
  - Un botón que solo tiene icono lleva un `aria-label` traducido.
  - Un estado que importa se expresa también de forma semántica (`aria-pressed`, `aria-expanded`,
    `aria-selected`), no solo con una clase. Es lo que leen los tests.

## Servicios y stores

- **`providedIn: 'root'`,** salvo que el servicio sea de un solo componente.
- **Dueño de su estado:**
  - Un `signal` privado, expuesto con `asReadonly()` o con `computed`.
  - Nadie de fuera lo escribe: lo cambian los métodos del propio servicio.
- **Los métodos dicen la intención** (`pause(tabId)`, `restore(trailId)`), no la mecánica (`setState`,
  `update`).
- **Un store guarda lo que el producto recuerda.** Qué guarda cada uno y cómo (optimista o no, qué pasa si
  falla al escribir) lo dice `docs/architecture.md`. El store lo cumple; no lo decide.

## Lo que comprueba el lint

| Regla de este archivo | ESLint |
|---|---|
| `OnPush` | `@angular-eslint/prefer-on-push-component-change-detection` |
| `input()` y `output()` sin decoradores | `@angular-eslint/prefer-signals`, `@angular-eslint/prefer-output-emitter-ref` |
| `inject()`, no el constructor | `@angular-eslint/prefer-inject` |
| Leer un signal sin llamarlo | `@angular-eslint/no-uncalled-signals` |
| Control de flujo nativo | `@angular-eslint/template/prefer-control-flow` |
| `<button type>` | `@angular-eslint/template/button-has-type` |
| Nada de ternarios anidados ni condiciones largas | `@angular-eslint/template/conditional-complexity` |
| Accesibilidad básica | `angular.configs.templateAccessibility` |
