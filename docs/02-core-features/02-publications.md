---
id: publications
title: Publicaciones y Bibliometría
sidebar_label: Publicaciones y Bibliometría
---

# Publicaciones y Bibliometría

El módulo **Publicaciones** reúne todos los artículos científicos del grupo. Cada publicación se vincula a una o más **revistas**, a sus **autores** y a los **proyectos** que la financiaron, y muestra los indicadores bibliométricos de la revista (factor de impacto, cuartil y categoría).

## Listado, búsqueda y filtros

Accede desde **Investigación → Publicaciones**. La tabla muestra el **DOI**, el **título**, el **año**, la **revista** (abreviada) y la **fecha de creación**. Se ordena por año descendente y, dentro de cada año, de la más reciente a la más antigua. Un candado verde junto al título indica que la publicación tiene **acceso abierto**.

![Listado de publicaciones](/img/docs/02-core-features/06-publications-list.png)
*Listado de publicaciones del grupo.*

- **Búsqueda rápida:** el cuadro superior filtra por **título** mientras escribes.
- **Paginación:** al pie de la tabla eliges cuántas filas ver por página (10, 25, 50 o 100).
- **Abrir una publicación:** pulsa sobre la fila para ver su detalle, o usa el menú de tres puntos de la fila (**Ver**, **Editar** y **Enlace externo** al DOI).

### Filtros avanzados

El botón de filtros (icono de controles) despliega un panel con cuatro selectores de selección múltiple:

- **Autores** y **Revistas**: se buscan escribiendo el nombre.
- **Años**: lista de años desde la publicación más antigua hasta el año actual.
- **Proyectos**: se buscan por código o título.

Pulsa **Aplicar filtros** para confirmarlos; **Limpiar filtros** los elimina. El botón de filtros muestra el número de filtros activos.

![Listado de publicaciones con el panel de filtros desplegado](/img/docs/02-core-features/07-publications-filters.png)
*Panel de filtros abierto sobre el listado.*

## Consultar una publicación

La ficha de detalle muestra el título, el año, los autores en su orden de firma, el DOI (con botón para copiarlo), la revista, volumen, número y páginas, los datos de citación de la revista (**JIF**, cuartil y posición en su categoría) y los **proyectos asociados**. La pestaña **Documentos** contiene los ficheros adjuntos.

Los autores vinculados a personal del grupo aparecen resaltados; el resto son autores externos.

![Detalle de una publicación](/img/docs/02-core-features/09-publication-detail.png)
*Ficha de una publicación con sus autores, revista, indicadores y proyectos asociados.*

## Añadir una publicación

:::info[Permisos requeridos]

| Acción | Quién puede |
|---|---|
| Consultar el listado y las fichas | Cualquier usuario del grupo |
| **Nueva Publicación** (por DOI) | **Contributor**, **Reviewer** y **Manager** |
| **Creación manual (sin DOI)** | Solo **Manager** |
| **Editar** una publicación | Quien la creó, y **Reviewer** y **Manager** |
| **Eliminar** una publicación | Solo **Manager** |

Si no tienes permiso, el botón correspondiente no aparece.

:::

### Importar desde un DOI (recomendado)

Pulsa **Nueva Publicación**. El formulario empieza con la sección **Importación desde DOI**.

![Formulario de nueva publicación con un DOI escrito](/img/docs/02-core-features/08-publication-new-doi.png)
*Escribe el DOI y pulsa «Obtener información de Crossref».*

1. Escribe el DOI (por ejemplo `10.1038/s41586-020-2649-2`) y pulsa **Obtener información de Crossref**.
2. Science Manager comprueba primero que el DOI no exista ya en el grupo y, si es nuevo, consulta Crossref.
3. Con los datos importados aparecen el resto de secciones: **Proyectos Asociados**, **Autores**, **Información Básica** (título, año, volumen, número y páginas, no editables) y **Acceso y Enlaces**.
4. Selecciona al menos un proyecto, revisa los autores y pulsa **Guardar Publicación**.

:::warning[Reglas del alta por DOI]

- **No se admiten duplicados:** si ya existe una publicación con ese DOI, se muestra un aviso con su título y no se puede crear otra.
- **El DOI queda bloqueado** tras importar los datos. Para empezar con otro DOI, pulsa **Borrar DOI**, lo que reinicia el formulario.
- **Proyectos Asociados es obligatorio:** hasta que no elijas al menos un proyecto, el botón **Guardar Publicación** permanece desactivado.
- Si Crossref no encuentra el DOI, se te indica que lo rellenes manualmente (opción solo disponible para Managers).

:::

### Autores y revista

- **Autores:** se precargan desde Crossref en su orden original y puedes arrastrarlos para reordenarlos. Si un autor coincide con personal del grupo (por apellido), se asocia automáticamente; en caso contrario puedes **Asociar usuario** manualmente. Los autores no vinculados se crean como autores externos al guardar.
- **Revista:** si ya existe en la base de datos se vincula y se muestran sus indicadores. Si no existe, se avisa de que se añadirá como revista nueva y se notificará a los gestores para que completen sus datos.
- **Acceso y Enlaces:** puedes indicar una **URL de Acceso Abierto** (la publicación aparecerá con el candado en el listado) y **Enlaces adicionales** con nombre y URL.

### Creación manual (solo Managers)

Los **Managers** ven en la sección de DOI el enlace **Creación manual (sin DOI)**, pensado para publicaciones que no tienen DOI o que Crossref no encuentra.

![Formulario de creación manual de publicación](/img/docs/02-core-features/10-publication-new-manual.png)
*Formulario manual: solo el **Título** y al menos un **Proyecto asociado** son obligatorios.*

Además de los campos de importación, aquí se rellenan a mano el volumen, número, páginas, año, URL, la revista (elegida del catálogo o escribiendo el nombre de una nueva), los autores y los enlaces.

## Editar o eliminar

Desde el menú de la fila o desde la ficha (menú de tres puntos) puedes **Editar** si eres quien creó la publicación o tienes rol Reviewer o superior. El DOI no puede modificarse, y los datos de factor de impacto se gestionan automáticamente. Mientras editas puedes pulsar **Actualizar desde Crossref** para refrescar los metadatos y revisarlos antes de guardar. **Eliminar** solo está disponible para Managers y pide confirmación.

:::tip[Aprovecha los filtros para tus informes]

Combina **Años** y **Proyectos** para localizar rápidamente las publicaciones vinculadas a un proyecto en un periodo, por ejemplo al preparar una memoria de justificación.

:::
