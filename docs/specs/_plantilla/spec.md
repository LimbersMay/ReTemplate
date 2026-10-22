# Sxx · Nombre

Estado:      ⬜ pendiente
Requisitos:  ABC-01…ABC-03 · invariantes I1
Depende de:  Sxx · spikes R-nn
Se prueba:   lo que el usuario hace en el navegador para ver que funciona, con valores concretos.

## Fuera de este slice

- Lo que se podría esperar aquí y llega en otro slice (y en cuál).

## Contrato

La forma pública: modelos, firmas del engine, inputs y outputs de componentes, y qué archivo es dueño de
cada regla. No el cómo.

```text
engine/archivo.ts   funcion(entrada) → salida          ABC-01
```

## Reglas que no se ven en las firmas

- Funciones puras, orden, qué pasa con los fallos, quién es el único que decide algo.

## Tests

Los escribe el agente a partir de esta lista, antes que el código. Cada uno cita su ID.

```text
ABC-01  caso feliz · caso límite · caso de fallo
```

## Hecho cuando

`npm run check` en verde · todos los tests de arriba · la prueba de «Se prueba».
