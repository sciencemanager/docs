# Cómo añadir y organizar contenido

Convención de este repo para estructurar documentos y el sidebar. Léelo antes de añadir una sección o página nueva.

## Estructura de carpetas

```
docs/
├── index.md                  # "Inicio" — página raíz del sitio (slug: /)
├── 01-getting-started/
│   ├── _category_.json       # metadata del grupo del sidebar (NO una página)
│   ├── 01-introduction.md
│   └── 02-roles-and-access.md
├── 02-core-features/
│   ├── _category_.json
│   └── ...
```

- El prefijo numérico (`01-`, `02-`...) solo controla el **orden** de archivos/carpetas en disco y en el sidebar autogenerado. Docusaurus lo retira automáticamente de la URL (`01-introduction.md` → `/docs/getting-started/introduction`).
- Los nombres de fichero y carpeta van en **inglés**. El contenido (frontmatter `title`/`sidebar_label` y el texto) va en **español** (o en `i18n/en/...` para la traducción).

## Regla: una carpeta de sección = `_category_.json`, NUNCA `index.md`

**No crees un `index.md` dentro de una carpeta de sección** para darle nombre o controlar su orden en el sidebar. Eso crea una página de contenido real con su propio `id`, y es la causa de dos errores que ya nos pasaron:

1. **`Document id "<carpeta>/index" cannot include slash`** — si el `index.md` no lleva un `id` explícito de un solo segmento, Docusaurus lo deriva de la ruta de carpeta y revienta.
2. **ID duplicado / ruta duplicada** — si le pones a mano un `id` que coincide con el de otra página de la misma carpeta (p. ej. `id: introduction` en el `index.md` Y en `01-introduction.md`), Docusaurus registra dos documentos con el mismo id.

### Qué usar en su lugar

Cada carpeta de sección lleva un `_category_.json` — es solo metadata, no genera ninguna página ni id:

```json
{
  "label": "Introducción",
  "position": 1,
  "collapsible": true,
  "collapsed": false
}
```

- **`label`** — lo que se ve en el sidebar. Totalmente independiente del nombre de la carpeta: puedes llamar a la carpeta `01-getting-started` y que el sidebar muestre "Introducción", "Primeros pasos" o lo que haga falta, sin tocar rutas ni ids.
- **`position`** — orden dentro de su nivel del sidebar. Alternativa (o complemento) al prefijo numérico de la carpeta.
- **Sin `link`** → la carpeta es un **agrupador puro**: al hacer clic solo se expande/colapsa, no navega a ninguna página. Es el comportamiento que queremos para todas las secciones de esta documentación.
- Si en algún momento SÍ quieres que la categoría sea clicable, las dos opciones válidas son:
  - `"link": {"type": "generated-index"}` → página autogenerada con el listado de las páginas de la carpeta.
  - `"link": {"type": "doc", "id": "algun-doc-de-la-carpeta"}` → al hacer clic en la categoría, abre esa página concreta.
  - `"link": {"type": "none"}` **no existe** — es un valor válido en `sidebars.ts` pero no en `_category_.json`; ahí se consigue omitiendo `link` directamente (como arriba).

## La página "Inicio" (raíz)

`docs/index.md` es la única página fuera de las carpetas de sección. Lleva `slug: /` y necesita `sidebar_position: 0` explícito — si no, al no tener prefijo numérico de carpeta, el orden alfabético por defecto la puede colocar después de `04-administration` en vez de la primera.

## Checklist para añadir una sección nueva

1. Crea la carpeta con prefijo numérico: `05-mi-seccion/`.
2. Añade `_category_.json` con `label` y `position` (sin `link`, salvo que quieras que sea clicable — ver arriba).
3. Añade las páginas `.md` dentro, con `id`, `title` y `sidebar_label` en el frontmatter.
4. Si vas a traducir, replica la misma ruta bajo `i18n/en/docusaurus-plugin-content-docs/current/05-mi-seccion/`.
5. Verifica con `npx docusaurus build` antes de dar la sección por cerrada — cualquier id duplicado o inválido rompe el build inmediatamente (`onBrokenLinks`/id checks están en modo estricto).
