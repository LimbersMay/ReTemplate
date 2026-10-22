# Tests de componentes

Un componente se prueba **como lo usa una persona**: se renderiza, se interactúa con el DOM y se verifica
lo que queda en pantalla o lo que se emite.

> **Por qué el DOM y no el `computed`.** Un `@for` con un `track` equivocado reutiliza las filas: al quitar
> la primera de una lista, el estado de la tercera (un candado, una selección) puede quedarse en la fila
> que ahora ocupa su posición. El `computed` de las filas está bien, y solo un test que lee el DOM lo
> detecta.

## Herramientas

| Pieza | Uso |
|---|---|
| `render(Component, { bindings })` de `@testing/dom` | Crea el componente, espera el primer render y devuelve `fixture`, `view` (las queries de Testing Library acotadas al componente) y las interacciones `click`, `type`, `clear`, `keyboard` y `tab`. Cada interacción espera `fixture.whenStable()` antes de resolver |
| `inputBinding` / `outputBinding` de `@angular/core` | Enlazan inputs y outputs **por nombre**, como lo haría la plantilla del padre |
| `translocoTestingModule()` de `@testing/transloco` | Transloco con los JSON reales, cargados de forma síncrona, en inglés |
| `translate(key, params?)` de `@testing/transloco` | El texto en inglés de una clave. El DOM se consulta con `translate('tabs.restore')`, **nunca** con el texto escrito a mano. Lanza un error si la clave no existe |

- **Configuración:** `TestBed.configureTestingModule({ imports: [translocoTestingModule()] })` y después
  `render(Component)`. El componente no se declara ni se importa en TestBed.
- **No se crean componentes *host* para enlazar inputs y outputs:** para eso están los `bindings`.
- **La excepción es una directiva,** que no tiene plantilla propia. Se prueba con un host standalone
  mínimo que la usa como lo haría quien la consume.
- **Para cambiar un input después del render:**
  1. Se enlaza un `signal` (`inputBinding('tab', tabSignal)`).
  2. Se hace `tabSignal.set(…)`.
  3. Se espera `await fixture.whenStable()`.

  Igual después de cambiar el estado de un servicio real.

## Qué se verifica y qué no

| Se verifica | Prohibido verificar |
|---|---|
| Contenido visible: texto, `input.value`, `title`, número y orden de filas | Clases CSS de ReDesign o de Tailwind: cambian por estilo, no por comportamiento |
| Atributos semánticos: `disabled`, `checked`, `aria-*`, `role`, `tabindex` | Estilos computados (`getComputedStyle`) |
| Presencia y ausencia de elementos (`queryBy…` → `null`) | Estructura interna (`div > div:nth-child(2)`, `parentElement`, etiquetas) |
| El payload exacto de cada `output()` | Miembros del componente (`componentInstance`, `protected`, signals internos) |
| En un container o una vista: el DOM resultante | El estado del store: ya lo prueban sus specs |

Si un estado visual importa (un elemento protegido, una pestaña activa), DEBE expresarse de forma
semántica (`aria-pressed`, `aria-selected`, `aria-expanded`, un texto) y se verifica eso. Mientras solo
se exprese con clases, **no se testea**.

## Cómo encontrar elementos

En el orden de Testing Library:

1. `getByRole(role, { name })`: botones, checkboxes, `alertdialog`, `status`… También con
   `{ expanded }`, `{ pressed }` o `{ selected }`.
2. `getByLabelText`: necesita `<label for>` o `aria-label`.
3. `getByPlaceholderText`, `getByDisplayValue`.
4. `getByText`, `getByTitle`.
5. `getByTestId`, solo si nada de lo anterior sirve.

- **Prohibido `querySelector`** con clases, etiquetas o estructura. Sí se puede leer un elemento por un
  id que el propio componente referencia en un atributo ARIA (`aria-describedby`).
- **Si un elemento interactivo no se encuentra por rol y nombre** (un botón que solo tiene icono), se
  corrige la **plantilla** con un `aria-label` traducido. Es un defecto de accesibilidad, no del test.

## Cómo interactuar

- **Solo con `click`, `type`, `clear`, `keyboard` y `tab`** del resultado de `render()`. Disparan los
  eventos reales de un usuario. `keyboard` actúa sobre el elemento con el foco: se enfoca antes con
  `element.focus()`.
- **Prohibido:**
  - Llamar a métodos del componente.
  - `triggerEventHandler`.
  - Disparar eventos a mano con `dispatchEvent`.
  - `fixture.detectChanges()`: en zoneless se espera con `whenStable()`, y `render` ya lo hace.
- **Después de cada acción se vuelve a leer el DOM:** es la fuente de verdad del test.

## Tiempo

Solo se falsea `Date`, con `vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime(NOW)`. El
planificador zoneless de Angular usa `setTimeout`: con temporizadores falsos completos, `whenStable()` no
resuelve nunca.

## Casos obligatorios

### Listas (`@for`)

| ID | Escenario | Resultado esperado |
|---|---|---|
| L1 | Render inicial | Una fila por elemento, en orden, con sus valores |
| L2 | Añadir | La fila nueva aparece en su sitio y las demás no cambian |
| L3 ⚠️ | Quitar la **primera**, una **del medio** y la **última** | Desaparece **exactamente** esa fila; las demás conservan valores, orden y estado |
| L4 ⚠️ | Quitar seguidas hasta vaciar | Cada clic quita la fila pulsada, no otra |
| L5 | Lista vacía | Se ve el estado vacío |
| L6 | Volver a renderizar (plegar, cambiar de vista, un `@if`) | Se conservan las filas y su estado |
| L7 | Guardar | Lo que se envía coincide con lo que se ve, en el mismo orden |
| L8 | Output por fila | Emite el id de **esa** fila: la primera, una del medio y la última |

L3 con las tres posiciones es obligatorio: un bug de `track` suele afectar a la última fila, así que un
test que solo quita la última **pasa con el bug**.

### Formularios

| ID | Escenario | Resultado esperado |
|---|---|---|
| F1 | Enviar después de editar | El output se emite **una vez** con los campos editados |
| F2 | Enviar sin editar (modo edición) | El payload es igual a la entrada |
| F3 ⚠️ | Identidad del registro editado | Se conservan el id y los campos que no se editan |
| F4 | Formulario inválido | No emite, y el error se ve en pantalla |
| F5 | Cancelar y guardar | Cancelar emite `closed` y no `save`; guardar no emite `closed` |

### Items (solo pintan y emiten)

| ID | Escenario |
|---|---|
| D1 | Cada variante de los inputs que importa (`it.each`), verificada por contenido y atributos semánticos |
| D2 ⚠️ | Inputs límite: lista vacía, texto vacío o muy largo, opcionales ausentes |
| D3 | Cada `output()` emite **una vez** con el payload exacto, y los demás no emiten |
| D4 | No muta los objetos que recibe por `input()` |
| D5 | Los textos salen de Transloco: se buscan con `translate(key)` |
| D6 | Fechas relativas con el reloj fijo: en el futuro, en el pasado y sin fecha |

### Containers y vistas (integración)

- **Se montan con el store real** sobre `installChromeFake()`, y se verifica **solo el DOM**.
- **Los servicios de capas** (toast, confirmación) se usan reales si el componente los pinta, y como stub
  tipado si solo los llama.

| ID | Escenario |
|---|---|
| M1 | Store real con el fake de Chrome; los asserts solo miran el DOM |
| M2 | El estado vacío y el estado de error del store se ven en la vista |
| M3 ⚠️ | Cada acción del usuario se refleja en el DOM sobre **el elemento correcto**, sin tocar los demás |
| M4 ⚠️ | Las invariantes de `docs/domain.md` que se pueden romper desde esta vista se cumplen: una acción en lote nunca toca lo que la invariante protege |
| M5 | Capas: confirmar, cancelar y deshacer dejan la vista como corresponde |

## Plantilla

```ts
import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing/dom';
import { buildTabs } from '@testing/fixtures';
import { translate, translocoTestingModule } from '@testing/transloco';

import { TabList } from './tab-list';

describe('TabList', () => {
  async function setup({ tabs = buildTabs(3) } = {}) {
    const tabsInput = signal(tabs);
    const restore = vi.fn<(id: string) => void>();
    TestBed.configureTestingModule({ imports: [translocoTestingModule()] });
    const rendered = await render(TabList, {
      bindings: [inputBinding('tabs', tabsInput), outputBinding('restore', restore)],
    });
    return { ...rendered, tabs, tabsInput, restore };
  }

  it.each([0, 1, 2])('BAU-04 restores the tab of row %i, not another one', async (index) => {
    const { view, click, tabs, restore } = await setup();
    const buttons = view.getAllByRole('button', { name: translate('tabs.restore') });

    await click(buttons[index]);

    expect(restore).toHaveBeenCalledExactlyOnceWith(tabs[index].id);
  });
});
```
