# Checklist de un spec

Antes de dar un spec por terminado, lo escriba quien lo escriba. La verificación de la tarea la repasa
entera. Cada punto enlaza con su regla.

## Todos

- [ ] Cada requisito de la tarea tiene su test y lo cita en el nombre; `npm run trace` no lista ninguno
      del slice ([README](README.md#trazabilidad)).
- [ ] Los tests se vieron fallar por el motivo correcto antes del código, y se vieron fallar al romper a
      mano la línea que protegen ([README](README.md#principios)).
- [ ] Hay `setup()` y no hay `let` compartidos para el sujeto ([writing](writing.md#setup-en-lugar-de-let-compartidos)).
- [ ] Sin `any`, `as any` ni `ReturnType<typeof vi.fn>`; todos los `vi.fn` tipados ([writing](writing.md#dobles-de-prueba)).
- [ ] Fixtures con builders; ningún literal de dominio completo; nada importado de datos de ejemplo ([writing](writing.md#fixtures)).
- [ ] Ninguna asignación a `globalThis` o `window`; Chrome solo con `installChromeFake()` o `vi.stubGlobal` ([writing](writing.md#globales)).
- [ ] Sin `fakeAsync`, `done`, `setTimeout`, `.only` ni `.skip`; ninguna promesa sin esperar ([writing](writing.md#asincronía-y-zoneless)).
- [ ] Asserts sobre valores completos y lo guardado; con los casos negativos ([writing](writing.md#asserts)).
- [ ] Los defectos están como `it.fails` o `it.todo` con su comentario ([writing](writing.md#defectos-conocidos)).
- [ ] Sin salida en consola.
- [ ] `npm run check` en verde.

## Según la capa

- [ ] **Engine:** E1–E8 los que apliquen; las invariantes con su caso que intenta romperlas ([engine](engine.md#casos-obligatorios)).
- [ ] **Servicio:** V1–V7; al menos un test de reactividad ([state](state.md#casos-obligatorios-servicios)).
- [ ] **Store:** S1–S15 los que apliquen, sobre el fake de Chrome ([state](state.md#casos-obligatorios-stores)).
- [ ] **Service worker:** B1–B8 los que apliquen; el engine real ([background](background.md#casos-obligatorios)).
- [ ] **Componente:**
  - [ ] Montado con `render()`; buscado por rol, label, texto o `title` con `translate()`; ninguna clase ni
        selector estructural ([components](components.md#cómo-encontrar-elementos)).
  - [ ] Interacción solo con `click/type/clear/keyboard/tab`; ningún método ni estado interno del
        componente ([components](components.md#cómo-interactuar)).
  - [ ] Listas: primera, del medio y última (L3, L8); el resto de L, F, D y M que apliquen
        ([components](components.md#casos-obligatorios)).
