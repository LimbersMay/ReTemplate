# Tests del engine

`src/engine/` es TypeScript puro: recibe datos y devuelve datos, o la lista de acciones que otro ejecuta.
Es la capa que más tests tiene y la más barata de probar, porque no hay nada que montar.

## Cómo se prueba

- **Sin TestBed ni Angular:** se importa la función y se llama.
- **El tiempo no se falsea:** la función recibe `now` y el test se lo pasa. Lo mismo con los IDs y el
  azar, si los necesita.
- **Tablas con `it.each`** para las variantes de una misma regla. Cada fila lleva una descripción que dice
  qué la distingue.
- **Una función que decide acciones se prueba por la lista completa:** dada una entrada, la lista de
  acciones, en orden, con `toEqual`. Así un efecto de más también falla.

## Casos obligatorios

| ID | Escenario |
|---|---|
| E1 | Cada regla de la función, con un caso que la cumple y otro que no |
| E2 ⚠️ | Los límites exactos: el valor justo en el umbral, uno por debajo y uno por encima (`now - pausedAt === PAUSE_AFTER_MS`) |
| E3 | Entradas límite: lista vacía, cadena vacía, mayúsculas, unicode, el valor más grande razonable |
| E4 ⚠️ | Entradas inválidas o datos a medias: el resultado que dice el contrato (`null`, `{ ok: false }`), sin lanzar |
| E5 ⚠️ | **Las invariantes de `docs/domain.md`:** cada una con el caso que la cumple y uno que intenta romperla. Se prueban en el archivo del engine que la hace cumplir, y nunca se dan por cubiertas en otra capa |
| E6 | Las acciones que **no** se devuelven: la entrada que no debe producir ninguna da `[]` |
| E7 | No muta la entrada: después de llamar, la entrada sigue siendo igual a un builder nuevo |
| E8 | Para las listas: el orden del resultado es el que dice el contrato, también con empates |

## Plantilla

```ts
import { buildTab } from '@testing/fixtures';

import { PAUSE_AFTER_MS } from './settings';
import { decideIdle } from './idle';

describe('decideIdle()', () => {
  const now = Date.UTC(2026, 0, 1, 12);

  it.each([
    ['exactly at the limit', PAUSE_AFTER_MS, [{ kind: 'pause', tabId: 't1' }]],
    ['one millisecond before', PAUSE_AFTER_MS - 1, []],
  ])('PAU-03 pauses an idle tab %s', (_, idleMs, expected) => {
    const tab = buildTab({ id: 't1', lastActiveAt: now - idleMs });

    expect(decideIdle([tab], { now })).toEqual(expected);
  });

  it('PAU-05 never pauses a pinned tab', () => {
    const tab = buildTab({ pinned: true, lastActiveAt: now - PAUSE_AFTER_MS * 10 });

    expect(decideIdle([tab], { now })).toEqual([]);
  });
});
```
