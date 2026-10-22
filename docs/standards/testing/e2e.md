# Tests e2e (Playwright, cuando hagan falta)

Los tests unitarios corren en jsdom, donde Chrome no existe y el fake solo reproduce lo que sabemos de él.
Lo que depende del comportamiento real de Chrome se prueba con Playwright en Chromium, con la extensión
de `.output/chrome-mv3` (WXT) cargada. Por ejemplo:

- El service worker muriendo y despertando.
- Las alarmas.
- Los grupos de pestañas nativos.
- El descarte de pestañas.
- Los límites de storage.

Se añaden con el primer slice que los necesite (lo dice su spec), no antes.

## Reglas

- **Dónde viven:** archivos `*.e2e.ts` en `e2e/`, fuera de `src/` para que `ng test` no los recoja.
- **Qué se verifica:** lo que queda en Chrome (pestañas, grupos, storage) y en la página, no lo que dice
  el popup.
- **Cómo se espera:** con `expect.poll()`; nunca con `setTimeout`.
- **El tiempo** se acorta con los ajustes del producto (un umbral de segundos), no falseando el reloj del
  navegador.
- **Cada invariante de `docs/domain.md` que dependa de Chrome DEBE tener su escenario e2e.**
