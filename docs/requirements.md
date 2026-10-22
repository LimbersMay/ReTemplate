# __PRODUCT__ · Requisitos

<!-- sdd:pendiente -->
> Lo redacta `/sdd:discover` y lo aprueba el usuario. Describe cómo se comporta el producto **hoy**: un
> slice que cambia un comportamiento cambia también este archivo.

## Formato

Cada requisito es un encabezado `### ID · título` (lo leen `npm run trace` y las skills), una frase EARS y
una línea de metadatos con `Prioridad`, `Origen` (la decisión P-nn o la sección del material) y `Slice`.

| Empieza por | Patrón EARS | Para |
|---|---|---|
| CUANDO … | event-driven | Algo que pasa |
| MIENTRAS … | state-driven | Mientras dura un estado |
| SI … ENTONCES … | unwanted behaviour | Un fallo o un caso no deseado |
| DONDE … | optional feature | Una opción activada |
| (nada) | ubiquitous | Siempre |

El sujeto es siempre el producto: «__PRODUCT__ DEBE…», «NO DEBE…», «NUNCA DEBE…». Un requisito dice qué
se observa, no cómo se programa. Los IDs no se reutilizan: un requisito retirado se queda tachado con su
motivo.

```text
### ABC-01 · Título corto
CUANDO <evento>, __PRODUCT__ DEBE <comportamiento observable>.
Prioridad: Must · Origen: P-02 · Slice: S01
```

## Áreas

| Prefijo | Área |
|---|---|
