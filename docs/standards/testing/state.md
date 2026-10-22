# Tests de servicios y stores

- **Servicio:** guarda estado de la interfaz (toast, confirmación, editor).
- **Store:** guarda lo que el producto recuerda y habla con `chrome.*`. Qué guarda cada uno, y si sus
  mutaciones son optimistas, lo dice `docs/architecture.md`; los tests prueban eso.

## Cómo se prueba

- **El sujeto se obtiene con `TestBed.inject(…)`** dentro de `setup()`.
- **El estado se siembra por la API pública o por el fake de Chrome,** nunca escribiendo en un signal
  privado.
- **El estado se observa** leyendo los signals y `computed` públicos y, en un store, lo que quedó guardado
  (`snapshot()` del fake).
- **Reactividad:** al menos un test por servicio o store crea un `computed` que depende de él y comprueba
  que recalcula después de una mutación. Así se detectan las mutaciones in situ, que un `toEqual` no ve:

  ```ts
  const isOpen = computed(() => service.current() !== null);
  expect(isOpen()).toBe(false);

  void service.ask(buildRequest());

  expect(isOpen()).toBe(true);
  ```

## El fake de Chrome

En jsdom no existe `chrome`. El primer spec que lo necesita crea `src/testing/chrome.fake.ts` con
`installChromeFake()`:

- **Instala un `chrome` en memoria** con `vi.stubGlobal`, con las áreas que use el código (`storage.local`,
  `tabs`, `tabGroups`, `alarms`…).
- **Reproduce la semántica real:**
  - `storage.local.get(key)` **omite** las claves que no existen.
  - Los valores se serializan como JSON al escribir y al leer.
  - `set` y `remove` emiten su `onChanged`.
- **Ofrece `seed()` y `snapshot()`:** `seed()` prepara datos sin pasar por los espías, y `snapshot()` sirve
  para verificar lo guardado.
- **Cada método es un `vi.fn`,** para poder inyectar un fallo en la próxima llamada
  (`mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'))`).

Reglas:

- **Siempre `installChromeFake()`** para tener un Chrome presente. `vi.stubGlobal('chrome', …)` directo
  solo vale para simular una API **ausente o parcial**.
- **Las claves de storage se referencian con sus constantes,** nunca con strings escritos en el spec.
- **Si hace falta otra API, se amplía el fake.** No se crean mocks a medida dentro de un spec.

## Casos obligatorios: servicios

| ID | Escenario |
|---|---|
| V1 | Estado inicial |
| V2 | Cada método público, camino feliz, verificado en el signal público |
| V3 ⚠️ | Llamar cuando no hay nada abierto (`answer()`, `dismiss()` sin nada) no rompe ni cambia el estado |
| V4 ⚠️ | Una petición nueva mientras hay otra abierta: la anterior se responde o se descarta, según el contrato |
| V5 ⚠️ | El orden de los efectos que promete el JSDoc («limpia primero y resuelve después») |
| V6 | Temporizadores: vencen en su plazo exacto, se reinician al reemplazar y se cancelan al cerrar |
| V7 | Reactividad (arriba) |

## Casos obligatorios: stores

| ID | Escenario | Resultado esperado |
|---|---|---|
| S1 | Carga con datos | El estado refleja lo guardado o lo que da Chrome |
| S2 | Carga sin datos (clave nunca escrita) | Colección vacía o los valores por defecto del contrato |
| S3 ⚠️ | Datos guardados corruptos: tipo incorrecto, `null`, versión de esquema desconocida | Un valor seguro, sin lanzar (`it.each`) |
| S4 ⚠️ | La carga falla en Chrome | Estado seguro y error informado; nunca un error sin manejar |
| S5 | Cargar no escribe | Ningún `set` al iniciar |
| S6 | Cada mutación pública, camino feliz | El estado es correcto **y** está guardado: `snapshot()` igual al estado, con una sola escritura |
| S7 ⚠️ | Un ID que no existe | Estado y storage sin cambios, sin lanzar |
| S8 ⚠️ | Colección vacía | Las mutaciones no rompen; quitar el último deja `[]` |
| S9 ⚠️ | Inmutabilidad | Una referencia nueva en cada cambio, el valor anterior intacto y los `computed` recalculan |
| S10 ⚠️ | Una mutación que falla al guardar | Lo que diga la arquitectura: si es optimista, **rollback** al estado previo y error informado; si no, el estado no cambia |
| S11 | Efectos laterales (toast, traducción) | Ocurren cuando toca **y no ocurren** cuando no (un test positivo y uno negativo) |
| S12 | Una mutación que no cambia nada | Estado igual y ninguna escritura |
| S13 | Cambios desde otro contexto (`onChanged`) | El estado se actualiza; una ráfaga provoca una sola relectura |
| S14 | Dos mutaciones seguidas antes de que resuelva la primera | El estado final y lo guardado coinciden |
| S15 ⚠️ | Valores por defecto compartidos | Se devuelven como copia nueva (`not.toBe`) y no se mutan |

## Plantilla

```ts
import { TestBed } from '@angular/core/testing';
import { installChromeFake } from '@testing/chrome.fake';

import { SETTINGS_KEY } from '../engine/storage-keys';
import { DEFAULT_SETTINGS, SettingsStore } from './settings.store';

describe('SettingsStore', () => {
  async function setup({ saved }: { saved?: unknown } = {}) {
    const chrome = installChromeFake();
    if (saved !== undefined) chrome.storage.local.seed({ [SETTINGS_KEY]: saved });
    const store = TestBed.inject(SettingsStore);
    await store.load();
    return { chrome, store };
  }

  it.each([
    ['a string', 'paused'],
    ['null', null],
    ['an unknown schema version', { version: 99 }],
  ])('AJU-02 falls back to the defaults when the saved value is %s', async (_, saved) => {
    const { store } = await setup({ saved });

    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
  });
});
```
