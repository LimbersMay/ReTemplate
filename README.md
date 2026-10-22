# __PRODUCT__

__DESCRIPTION__

Extensión de Chrome (Manifest V3) de la suite Re, con Angular, WXT y [ReDesign](https://github.com/LimbersMay/ReDesign).

## Desarrollo

```bash
npm install
npm start               # popup en el navegador, con recarga
npm run dev             # extensión cargada en Chrome (WXT)
npm run build:extension # .output/chrome-mv3, para «Cargar descomprimida»
```

## Antes de cada commit

```bash
npm run check   # build · lint · lint:design · lint:i18n · tests
npm run trace   # requisitos sin test
npm run status  # dónde va el proyecto
```

## Documentación

| | |
|---|---|
| Qué es y para quién | [docs/product.md](docs/product.md) |
| Cómo se comporta | [docs/requirements.md](docs/requirements.md) |
| Palabras, estados e invariantes | [docs/domain.md](docs/domain.md) |
| Cómo está hecho | [docs/architecture.md](docs/architecture.md) |
| Pantallas | [docs/ux.md](docs/ux.md) |
| Qué falta | [docs/roadmap.md](docs/roadmap.md) |
| Cómo se escribe el código | [docs/standards/](docs/standards/) |
| Cómo trabajan los agentes | [AGENTS.md](AGENTS.md) |
