# __PRODUCT__ · Arquitectura

<!-- sdd:pendiente -->
> Lo redacta `/sdd:design` a partir de los requisitos. Si una decisión deja de servir, se cambia aquí
> primero y después en el código.

## Contextos de ejecución

| Contexto | Qué hace | Vive en |
|---|---|---|
| Popup | La interfaz | `src/app/` |
| Service worker | Escucha a Chrome y ejecuta lo que decide el engine | `src/entrypoints/background.ts` |

## Estructura

```text
src/
  engine/        TypeScript puro: las reglas del producto (sin Angular ni chrome.*)
  entrypoints/   service worker
  app/           popup Angular
  assets/i18n/   es.json · en.json
  testing/       ayudas de test (alias @testing/*)
```

## Permisos

Cada permiso de `wxt.config.ts`, con su motivo. Ninguno sin fila aquí.

| Permiso | Para qué | Requisitos |
|---|---|---|
| `storage` | Guardar los ajustes y los datos del producto | |

## Decisiones

| ID | Decisión | Por qué |
|---|---|---|

## Riesgos y spikes

Un spike es código de usar y tirar en una rama `spike/R-nn`. Lo que se conserva es la respuesta.

| ID | Pregunta | Resultado | Estado |
|---|---|---|---|
