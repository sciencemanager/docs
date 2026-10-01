---
id: patents
title: Patentes
sidebar_label: Patentes
---

# Patentes

El módulo **Patentes** recoge los resultados de investigación del grupo protegidos mediante patente. Cada patente se vincula a uno o más **proyectos**, a sus **autores** (inventores) y guarda su número, país, fecha de registro y titular.

## Listado, búsqueda y filtros

Accede desde **Investigación → Patentes**. La tabla muestra el **título**, los **autores** (avatares con sus iniciales), el **número de patente**, el **país** y el **año** de registro. Si un dato no está informado aparece un guion (—).

![Listado de patentes con el panel de filtros abierto](/img/docs/02-core-features/24-patents-filters.png)
*Listado de patentes con el panel de filtros desplegado.*

- **Búsqueda rápida:** el cuadro superior filtra por **título** mientras escribes.
- **Paginación:** al pie de la tabla eliges cuántas filas ver por página (10, 25, 50 o 100).
- **Abrir una patente:** pulsa sobre la fila para ver su ficha, o usa el menú de tres puntos de la fila (**Editar** y **Eliminar**).

### Filtros avanzados

El botón de filtros (icono de controles) despliega un panel con dos criterios:

- **País:** texto que debe coincidir exactamente con el valor guardado en la patente (por ejemplo, `United States`).
- **Proyectos:** selección múltiple; se buscan por código o título.

Pulsa **Aplicar filtros** para confirmarlos, **Cancelar** para cerrar el panel o **Limpiar filtros** para eliminarlos. El botón de filtros muestra cuántos criterios hay activos.

![Listado de patentes](/img/docs/02-core-features/23-patents-list.png)
*Listado de patentes del grupo, sin filtros.*

## Consultar una patente

La ficha muestra el título, la descripción, los **autores** (los vinculados a personal del grupo aparecen resaltados), el **número de patente**, el **país**, la **fecha de registro**, el **titular** y los **proyectos asociados**, que enlazan con la ficha de cada proyecto. Al final, el **Historial de cambios** registra quién creó o modificó la patente y cuándo.

![Ficha de una patente](/img/docs/02-core-features/25-patent-detail.png)
*Ficha de una patente con sus autores, datos de registro y proyecto asociado.*

## Añadir una patente

:::info[Permisos requeridos]

| Acción | Quién puede |
|---|---|
| Consultar el listado y las fichas | Cualquier usuario del grupo |
| **Nueva Patente** | **Reviewer** y **Manager** |
| **Editar** una patente | **Reviewer** y **Manager** |
| **Eliminar** una patente | Solo **Manager** |

Además, el botón **Editar** del listado y de la ficha solo está activo para el **Manager**, para quien creó la patente y para quienes figuran como autores vinculados a su usuario. Si no tienes permiso, la opción aparece desactivada.

:::

Pulsa **Nueva Patente**. El formulario tiene estos campos:

| Campo | Obligatorio | Notas |
|---|---|---|
| **Título** | Sí | |
| **Proyectos asociados** | Sí | Se buscan por código, título o año; puedes añadir varios y quitarlos de la tabla de seleccionados. |
| **Autores** | No | Se añaden en orden escribiendo el nombre; pueden vincularse a personal del grupo. |
| **Número de patente** | No | |
| **Fecha de registro** | No | Su año es el que se muestra en el listado. |
| **País** | No | Es el valor que usa el filtro **País**. |
| **Titular** | No | Entidad titular de la patente. |
| **Descripción** | No | Texto libre. |

![Formulario de nueva patente](/img/docs/02-core-features/26-patent-new.png)
*Formulario de alta: el **Título** y los **Proyectos asociados** son obligatorios.*

Al pulsar **Crear Patente** se abre directamente la ficha de la patente creada. **Cancelar** vuelve al listado sin guardar.

:::warning[Antes de guardar]

- Hasta que no selecciones al menos un proyecto, el formulario no se envía y no aparece ningún mensaje: revisa que **Proyectos asociados** tenga contenido.
- Si el servidor rechaza el alta, se muestra el motivo en un aviso rojo sobre los botones.

:::

## Editar o eliminar

Desde el menú de tres puntos de la fila o de la ficha, **Editar** abre el mismo formulario con los datos cargados (el botón es **Guardar**). **Eliminar** solo está disponible para Managers y pide confirmación; la patente deja de aparecer en el listado.

:::tip[Localiza las patentes de un proyecto]

Usa el filtro **Proyectos** para ver las patentes derivadas de un proyecto concreto, por ejemplo al preparar una memoria de resultados.

:::
