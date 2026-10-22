# Specs de slice

Una carpeta por slice, `Sxx-nombre-corto/`, con:

| Archivo | Qué es | Lo escribe |
|---|---|---|
| `spec.md` | Qué hace el slice, su contrato y sus tests | `sdd-slice`; lo aprueba el usuario |
| `tasks.md` | Tareas, modo, estado, notas de estudio y «Dónde lo dejé» | `sdd-slice`, y lo actualizan el agente y el usuario |
| `review.md` | El resultado de cada verificación | `sdd-verify` |
| `guide-Tn.md` | La guía de una tarea que programa el usuario | `sdd-guide`, solo si se pide |

Las plantillas están en [`_plantilla/`](_plantilla/). Un slice cerrado no se reescribe: si una regla cambia
después, cambia `requirements.md` y se abre otro slice.
