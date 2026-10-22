# Tests del service worker

`src/entrypoints/background.ts` solo conecta: registra los listeners de Chrome y llama a manejadores
exportados desde sus propios archivos ([code.md](../code.md#extensión-mv3)). Las reglas están en el engine
y se prueban allí. Aquí se prueba el cableado:

- Un evento de Chrome llega al engine con la entrada correcta.
- Las acciones que devuelve el engine acaban hechas en Chrome.

## Cómo se prueba

- **Se llama al manejador directamente** (`await handleAlarm(alarm)`), con `installChromeFake()`
  ([state.md](state.md#el-fake-de-chrome)) sembrado con el estado de partida.
- **Se verifica el resultado en el fake** (`snapshot()`, las pestañas y los grupos que quedaron), no qué
  métodos se llamaron. Una llamada se verifica solo cuando ella misma es el contrato: crear una alarma, un
  aviso.
- **Sin Angular:** el service worker no lo usa. Se pueden usar temporizadores falsos completos.
- **El engine es real.** No se sustituye por un doble: si el manejador le pasa una entrada mal construida,
  el test tiene que notarlo.

## Casos obligatorios

| ID | Escenario | Resultado esperado |
|---|---|---|
| B1 | Registro | Cargar el worker registra cada listener una vez, sin esperar a nada |
| B2 | Cada evento, camino feliz | Las acciones del engine quedan hechas en Chrome |
| B3 ⚠️ | Una acción falla en Chrome (la pestaña se cerró entre medias) | Las demás acciones se hacen igual; el fallo se trata como dice el contrato; nunca un error sin manejar |
| B4 ⚠️ | El worker se reinicia | El estado se reconstruye desde storage (se reimporta el módulo con `vi.resetModules()`); nada depende de variables de módulo |
| B5 | Alarmas | Se crean con su nombre y su periodo; instalar o arrancar dos veces no las duplica |
| B6 ⚠️ | Ráfaga de eventos (diez `tabs.onUpdated` seguidos) | El resultado es el mismo que con uno solo, o el que diga el contrato, sin escrituras de más |
| B7 | Mensajes desde el popup | Cada tipo de mensaje tiene su respuesta; uno desconocido se ignora sin romper |
| B8 ⚠️ | Las invariantes que dependen de un evento | Se cumplen también por este camino, no solo cuando la acción viene del popup |

Lo que solo se ve en Chrome de verdad (el worker muriendo de verdad, una alarma que vence con el equipo
suspendido) va a [e2e.md](e2e.md).
