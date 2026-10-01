---
id: team
title: Equipo
sidebar_label: Equipo
---

# Equipo

El módulo **Equipo** es el directorio del personal del grupo. Desde él consultas quién forma parte del grupo, su situación contractual actual y la ficha de cada persona, con sus estudios, estancias, publicaciones, proyectos y eventos.

## Listado y búsqueda

Accede desde **Equipo → Equipo**. La tabla muestra, por cada persona, su **Miembro** (avatar, nombre y correo), la **Categoría** vigente, el **ORCID** y el **Estado**.

![Listado del equipo](/img/docs/02-core-features/35-team-list.png)
*Directorio del personal del grupo, con las personas activas primero.*

- **Orden:** primero las personas activas y, dentro de cada bloque, por apellidos. Puedes reordenar pulsando en la cabecera de una columna.
- **Estado:** una persona es **Activa** si tiene una vinculación en vigor y **Inactiva** si no. Por eso la columna **Categoría** queda en blanco para el personal inactivo.
- **Búsqueda rápida:** el cuadro superior filtra por nombre, apellidos, correo u ORCID mientras escribes.
- **Paginación:** al pie eliges 10, 25, 50 o 100 filas por página.
- **Abrir una ficha:** pulsa sobre el nombre, o usa el menú de tres puntos de la fila (**Ver** y **Editar**).

### Filtros avanzados

El botón de filtros despliega seis selectores. Todos se aplican al instante y se combinan entre sí:

| Filtro | Qué hace |
|---|---|
| **Estado** | Activo o inactivo, según tenga o no una vinculación vigente. |
| **Tipo de estudio** | Doctorado, Máster o Grado. |
| **Estado del estudio** | En curso o Completado. |
| **Tipo de vinculación** | Régimen contractual (selección múltiple). |
| **Categoría de la vinculación** | Categoría profesional (selección múltiple). |
| **Estado de la vinculación** | Activa o Vencida. |

![Listado del equipo con el panel de filtros desplegado](/img/docs/02-core-features/36-team-filters.png)
*Panel de filtros abierto sobre el listado.*

:::note[Los filtros se evalúan sobre el mismo registro]

**Tipo de estudio** y **Estado del estudio** se comprueban sobre una misma titulación: «Doctorado» + «En curso» devuelve a quien tiene un doctorado en curso, no a quien tiene un doctorado terminado y, aparte, un máster en curso. Lo mismo ocurre con los tres filtros de vinculación.

:::

El botón de filtros muestra cuántos hay activos, y **Limpiar filtros** los elimina junto con la búsqueda.

## Ficha de una persona

La ficha se organiza en pestañas. Cada una tiene su propia dirección, así que puedes enlazarla o recargarla sin perder el sitio.

![Ficha de una persona, pestaña Detalles](/img/docs/02-core-features/37-team-member-detail.png)
*Pestaña **Detalles** de la ficha.*

| Pestaña | Contenido |
|---|---|
| **Detalles** | Datos personales e identificadores: ORCID, ResearcherID (WOS), director/supervisor y sexenios (de investigación y de transferencia). |
| **Perfil académico** | Titulaciones de la persona (título, institución, fechas y estado). Al abrir una se mantiene la cabecera de la persona. |
| **Estancias** | Estancias de investigación (ver [Movilidad](./04-mobility.md)). |
| **Publicaciones** | El mismo explorador de [Publicaciones](./02-publications.md), limitado a esta persona. |
| **Proyectos** | Proyectos en los que participa como IP, equipo de investigación o equipo de trabajo (ver [Proyectos](./01-projects.md)). |
| **Eventos** | Sus contribuciones a congresos y actividades de divulgación. |
| **Vinculaciones** | Sus contratos y vinculaciones con el grupo. |

![Pestaña Perfil académico](/img/docs/02-core-features/38-team-member-academic.png)
*Pestaña **Perfil académico** con la titulación en curso de la persona.*

:::info[Permisos requeridos]

| Acción | Quién puede |
|---|---|
| Ver el listado y las fichas | Cualquier usuario del grupo |
| Ver **Nacionalidad**, **DNI / Identificación** y **Fecha de nacimiento** | **Reviewer** y **Manager**, y cada persona en su propia ficha |
| **Editar perfil** de otra persona | Solo **Manager** |
| **Editar perfil** propio | La propia persona |
| Añadir una titulación o una estancia propias | La propia persona |
| Añadir una estancia a otra persona | Solo **Manager** |
| Cambiar la foto de avatar | Solo la propia persona, pulsando sobre su avatar |

Si no tienes permiso, la opción no aparece o aparece desactivada. En una ficha ajena sin acciones disponibles no se muestra el menú de tres puntos.

:::

:::warning[Datos personales protegidos]

Si no eres Reviewer, Manager ni la propia persona, la ficha **no muestra** nacionalidad, DNI ni fecha de nacimiento, y no se indica si están rellenos o no.

:::

## Editar el perfil de una persona

Desde el menú de tres puntos del listado (**Editar**) o de la ficha (**Editar perfil**) se abre una página propia, con **Volver al perfil** para salir sin guardar.

![Formulario de edición de perfil](/img/docs/02-core-features/40-team-member-edit.png)
*Formulario de edición visto por un Manager: los datos personales aparecen bloqueados.*

El formulario tiene dos bloques:

1. **Datos personales:** **Nombre**, **Apellidos**, **Segundo apellido**, **Nacionalidad** y **DNI / Identificación**. El **Correo electrónico** es siempre de solo lectura.
2. **Perfil académico:** **ORCID**, **ResearcherID (WOS)**, **Sexenios**, **Sexenios de transferencia** y **Director / supervisor**.

Además, un Manager ve la casilla **Líder del grupo**.

Pulsa **Guardar Cambios** para confirmar o **Cancelar** para descartar.

:::warning[Reglas del formulario]

- **Los datos personales solo los edita un administrador.** Para el resto de roles esos campos aparecen desactivados, con el aviso «Los datos personales solo pueden ser editados por un administrador».
- **El ORCID** debe tener el formato `0000-0000-0000-000X`.
- **Los sexenios** deben estar entre 0 y 12.
- **No existe una categoría «doctorando»:** quien tiene **Director / supervisor** se considera doctorando.
- Si la persona aún no tiene perfil académico, se crea al guardar cualquiera de esos campos.

:::

## Vinculaciones (contratos)

La categoría y el estado de cada persona salen de sus **vinculaciones**. El menú **Equipo → Vinculación con el Equipo** lista todas las de grupo, con su categoría, fechas y estado (**Activo** o **Finalizado**), y permite buscar por nombre.

![Listado de vinculaciones con el equipo](/img/docs/02-core-features/39-employment-records-list.png)
*Listado de vinculaciones: una persona puede tener varias, una por cada periodo.*

Con el botón **Nueva Vinculación**, o desde el menú de tres puntos de la pestaña **Vinculaciones** de una ficha, se registra una nueva. Este listado solo está disponible para **Reviewer** y **Manager**.

:::tip[Cómo dar de baja a alguien del directorio]

No hay un botón de «baja»: una persona pasa a **Inactiva** cuando no le queda ninguna vinculación en vigor. Para cerrar su paso por el grupo, pon fecha de fin a su última vinculación.

:::
